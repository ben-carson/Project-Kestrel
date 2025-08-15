// src/window/UniversalWindowSystem.jsx
// Drop-in universal window manager for your dashboard
// - Maximize / Minimize / Close (X)
// - Linux/Windows-like keyboard shortcuts
// - Adjustable opacity per window
// - z-index focus management + Alt+Tab
//
// Usage:
// 1) Wrap your app with <WindowManagerProvider>.
// 2) Replace any widget container with <WindowFrame windowId="performance" title="Performance Metrics"> ... </WindowFrame>
// 3) (Optional) Add <WindowTaskbar/> for minimized windows.
//
// Shortcuts (focused window):
//   Alt+Tab              → Cycle windows (forward)
//   Shift+Alt+Tab        → Cycle windows (back)
//   Ctrl+M               → Minimize/Restore
//   Ctrl+W               → Close
//   Ctrl+Shift+Up        → Maximize/Restore
//   Ctrl+[ / Ctrl+]      → Opacity − / +
//   Esc                  → Unmaximize (if maximized)
//
// Dependencies (if not already present):
//   npm i react-rnd react-hotkeys-hook

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import { useHotkeys } from 'react-hotkeys-hook';
import { Square, Minimize2, Maximize2, X, Layers, Circle } from 'lucide-react';

/** ---------------------------------------------
 * Window Manager Context
 * ----------------------------------------------*/
const WindowManagerCtx = createContext(null);

export function WindowManagerProvider({ children }) {
  const [windows, setWindows] = useState({}); // id -> window state
  const [zOrder, setZOrder] = useState([]);   // array of ids from back→front
  const [activeId, setActiveId] = useState(null);
  const zCounter = useRef(10);

  const register = useCallback((id, init) => {
    setWindows(prev => {
      if (prev[id]) return prev;
      return {
        ...prev,
        [id]: {
          id,
          title: init?.title || id,
          x: init?.x ?? 120,
          y: init?.y ?? 120,
          width: init?.width ?? 640,
          height: init?.height ?? 420,
          isMinimized: false,
          isMaximized: false,
          opacity: init?.opacity ?? 1,
          visible: true,
        },
      };
    });
    setZOrder(prev => (prev.includes(id) ? prev : [...prev, id]));
    setActiveId(id);
  }, []);

  const unregister = useCallback((id) => {
    setWindows(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setZOrder(prev => prev.filter(x => x !== id));
    setActiveId(prev => (prev === id ? null : prev));
  }, []);

  const focus = useCallback((id) => {
    setActiveId(id);
    setZOrder(prev => {
      const filtered = prev.filter(x => x !== id);
      return [...filtered, id];
    });
  }, []);

  const patch = useCallback((id, updater) => {
    setWindows(prev => ({
      ...prev,
      [id]: { ...prev[id], ...(typeof updater === 'function' ? updater(prev[id]) : updater) },
    }));
  }, []);

  const minimize = useCallback((id) => patch(id, s => ({ isMinimized: !s.isMinimized, isMaximized: false })), [patch]);
  const maximize = useCallback((id) => patch(id, s => ({ isMaximized: !s.isMaximized, isMinimized: false })), [patch]);
  const close = useCallback((id) => unregister(id), [unregister]);
  const setOpacity = useCallback((id, opacity) => patch(id, { opacity }), [patch]);

  // Alt+Tab global cycling
  const cycle = useCallback((dir = 1) => {
    setZOrder(prev => {
      if (prev.length <= 1) return prev;
      const next = [...prev];
      if (dir > 0) {
        const top = next.pop();
        next.unshift(top);
      } else {
        const first = next.shift();
        next.push(first);
      }
      setActiveId(next[next.length - 1]);
      return next;
    });
  }, []);

  useHotkeys('alt+tab', (e) => { e.preventDefault(); cycle(1); }, { enableOnFormTags: true }, [cycle]);
  useHotkeys('shift+alt+tab', (e) => { e.preventDefault(); cycle(-1); }, { enableOnFormTags: true }, [cycle]);

  const api = useMemo(() => ({
    windows, zOrder, activeId,
    register, unregister, focus, patch,
    minimize, maximize, close, setOpacity,
  }), [windows, zOrder, activeId, register, unregister, focus, patch, minimize, maximize, close, setOpacity]);

  return (
    <WindowManagerCtx.Provider value={api}>
      <div className="relative w-full h-full">{children}</div>
    </WindowManagerCtx.Provider>
  );
}

export function useWindowManager() {
  const ctx = useContext(WindowManagerCtx);
  if (!ctx) throw new Error('useWindowManager must be used within WindowManagerProvider');
  return ctx;
}

/** ---------------------------------------------
 * WindowFrame Component
 * ----------------------------------------------*/
export function WindowFrame({ windowId, title, children, defaultSize, defaultPos, className = '' }) {
  const { register, focus, patch, minimize, maximize, close, setOpacity, windows, activeId } = useWindowManager();
  const state = windows[windowId];

  // register on mount
  useEffect(() => {
    register(windowId, {
      title,
      width: defaultSize?.width,
      height: defaultSize?.height,
      x: defaultPos?.x,
      y: defaultPos?.y,
    });
  }, [register, windowId]);

  const isActive = activeId === windowId;

  // Per-window shortcuts (only act when focused)
  useHotkeys('ctrl+w', (e) => { if (isActive) { e.preventDefault(); close(windowId); } });
  useHotkeys('ctrl+m', (e) => { if (isActive) { e.preventDefault(); minimize(windowId); } });
  useHotkeys('ctrl+shift+up', (e) => { if (isActive) { e.preventDefault(); maximize(windowId); } });
  useHotkeys('escape', (e) => { if (isActive && state?.isMaximized) { e.preventDefault(); maximize(windowId); } });
  useHotkeys('ctrl+[', (e) => { if (isActive) { e.preventDefault(); setOpacity(windowId, Math.max(0.2, (state?.opacity ?? 1) - 0.1)); } });
  useHotkeys('ctrl+]', (e) => { if (isActive) { e.preventDefault(); setOpacity(windowId, Math.min(1, (state?.opacity ?? 1) + 0.1)); } });

  if (!state || state.visible === false) return null;

  const headerClasses = `flex items-center justify-between px-3 py-1 select-none ${isActive ? 'bg-slate-700 text-white' : 'bg-slate-800/80 text-slate-200'}`;

  const frameStyle = {
    opacity: state.opacity,
    background: 'rgba(17, 24, 39, 0.9)', // slate-900 with alpha
    backdropFilter: 'blur(6px)',
    border: isActive ? '1px solid rgba(148,163,184,0.8)' : '1px solid rgba(71,85,105,0.8)',
    boxShadow: isActive ? '0 10px 25px rgba(0,0,0,0.45)' : '0 6px 18px rgba(0,0,0,0.3)'
  };

  const content = (
    <div className={`flex flex-col w-full h-full ${className}`} onMouseDown={() => focus(windowId)} style={frameStyle}>
      {/* Header */}
      <div className={headerClasses}>
        <div className="flex items-center gap-2">
          <Layers size={14} className={isActive ? 'opacity-100' : 'opacity-70'} />
          <span className="text-sm font-medium truncate max-w-[22rem]">{state.title || title}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Opacity dot (click cycles) */}
          <button
            title={`Opacity: ${Math.round((state.opacity ?? 1) * 100)}% (Ctrl+[ / Ctrl+])`}
            onClick={() => setOpacity(windowId, state.opacity <= 0.4 ? 1 : Math.max(0.3, (state.opacity ?? 1) - 0.2))}
            className="p-1 rounded hover:bg-slate-700/70"
          >
            <Circle size={14} className="opacity-80" />
          </button>
          {/* Minimize */}
          <button title="Minimize (Ctrl+M)" onClick={() => minimize(windowId)} className="p-1 rounded hover:bg-slate-700/70">
            <Minimize2 size={14} />
          </button>
          {/* Maximize / Restore */}
          <button title="Maximize/Restore (Ctrl+Shift+Up)" onClick={() => maximize(windowId)} className="p-1 rounded hover:bg-slate-700/70">
            {state.isMaximized ? <Square size={14} /> : <Maximize2 size={14} />}
          </button>
          {/* Close */}
          <button title="Close (Ctrl+W)" onClick={() => close(windowId)} className="p-1 rounded hover:bg-red-600/70 hover:text-white">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Body */}
      {!state.isMinimized && (
        <div className="flex-1 overflow-hidden">
          <div className="w-full h-full">{children}</div>
        </div>
      )}
    </div>
  );

  const rndProps = {
    size: state.isMaximized ? { width: '100%', height: '100%' } : { width: state.width, height: state.height },
    position: state.isMaximized ? { x: 0, y: 0 } : { x: state.x, y: state.y },
    minWidth: 360,
    minHeight: 220,
    bounds: 'parent',
    onDragStop: (_e, d) => patch(windowId, { x: d.x, y: d.y }),
    onResizeStop: (_e, _dir, ref, _delta, pos) => patch(windowId, { width: ref.offsetWidth, height: ref.offsetHeight, x: pos.x, y: pos.y }),
    enableResizing: !state.isMaximized,
    disableDragging: state.isMaximized,
    style: { zIndex: 100 + Object.keys(windows).indexOf(windowId) },
  };

  return state.isMaximized ? (
    <div className="fixed inset-0" onMouseDown={() => focus(windowId)}>
      {content}
    </div>
  ) : (
    <Rnd {...rndProps} onMouseDown={() => focus(windowId)}>
      {content}
    </Rnd>
  );
}

/** ---------------------------------------------
 * Taskbar (optional): shows minimized windows + quick controls
 * ----------------------------------------------*/
export function WindowTaskbar() {
  const { windows, minimize, focus } = useWindowManager();
  const minimized = Object.values(windows).filter(w => w.isMinimized);
  if (!minimized.length) return null;
  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 bg-slate-800/90 text-slate-200 rounded-2xl shadow-xl px-3 py-1 flex gap-2 border border-slate-700">
      {minimized.map(w => (
        <button key={w.id} onClick={() => { minimize(w.id); focus(w.id); }} className="px-3 py-1 rounded-xl hover:bg-slate-700/70 text-sm">
          {w.title}
        </button>
      ))}
    </div>
  );
}

/** ---------------------------------------------
 * Example Integration (remove in production):
 * ----------------------------------------------*/
export function DemoDesktop({ widgets }) {
  // `widgets` is an array: [{ id, title, element, x, y, width, height }]
  return (
    <WindowManagerProvider>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />
      {widgets.map(w => (
        <WindowFrame key={w.id} windowId={w.id} title={w.title} defaultSize={{ width: w.width, height: w.height }} defaultPos={{ x: w.x, y: w.y }}>
          {w.element}
        </WindowFrame>
      ))}
      <WindowTaskbar />
    </WindowManagerProvider>
  );
}
