// src/components/os/Window.jsx
import React from 'react';
import { useUIStore } from '../../store/useUIStore.ts';

const WINDOWS_BASE_Z = 200;

export default function Window({ win, focused, children }) {
  const {
    focusWindow,
    commitMove,
    commitResize,
    minimizeWindow,
    closeWindow,
    toggleMaximize,
    setOpacity,
  } = useUIStore((s) => s);

  const [dragging, setDragging] = React.useState(false);
  const [resizing, setResizing] = React.useState(false);
  const [tx, setTx] = React.useState(0);
  const [ty, setTy] = React.useState(0);
  const [rx, setRx] = React.useState(0);
  const [ry, setRy] = React.useState(0);
  const startRef = React.useRef({ x: 0, y: 0, w: 0, h: 0, left: 0, top: 0 });

  const onTitleDown = (e) => {
    if (win?.maximized) return;
    setDragging(true);
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      left: win?.x ?? 80,
      top: win?.y ?? 60,
      w: win?.w ?? 900,
      h: win?.h ?? 600,
    };
    setTx(0);
    setTy(0);
    // slight transparency while dragging (optional)
    setOpacity?.(win.id, 0.96);
    focusWindow?.(win.id);
    e.stopPropagation();
    e.preventDefault();
  };

  const onResizeStart = (e) => {
    if (win?.maximized) return;
    setResizing(true);
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      left: win?.x ?? 80,
      top: win?.y ?? 60,
      w: win?.w ?? 900,
      h: win?.h ?? 600,
    };
    setRx(0);
    setRy(0);
    setOpacity?.(win.id, 0.96);
    focusWindow?.(win.id);
    e.stopPropagation();
    e.preventDefault();
  };

  const onMove = React.useCallback(
    (e) => {
      if (!dragging && !resizing) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      if (dragging) {
        setTx(dx);
        setTy(dy);
      } else if (resizing) {
        setRx(dx);
        setRy(dy);
      }
    },
    [dragging, resizing]
  );

  const onUp = React.useCallback(
    (e) => {
      if (dragging) {
        const nx = Math.round(startRef.current.left + tx);
        const ny = Math.round(startRef.current.top + ty);
        commitMove?.(win.id, { x: nx, y: ny });
        setDragging(false);
      }
      if (resizing) {
        const nw = Math.max(360, Math.round(startRef.current.w + rx));
        const nh = Math.max(240, Math.round(startRef.current.h + ry));
        commitResize?.(win.id, { w: nw, h: nh });
        setResizing(false);
      }
      setOpacity?.(win.id, 1);
    },
    [dragging, resizing, tx, ty, rx, ry, commitMove, commitResize, setOpacity, win?.id]
  );

  React.useEffect(() => {
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [onMove, onUp]);

  const z = WINDOWS_BASE_Z + (win?.z ?? 0);
  const style = {
    position: 'absolute',
    left: (win?.x ?? 80) + (dragging ? tx : 0),
    top: (win?.y ?? 60) + (dragging ? ty : 0),
    width: (win?.w ?? 900) + (resizing ? rx : 0),
    height: (win?.h ?? 600) + (resizing ? ry : 0),
    zIndex: focused ? z + 100 : z,
    opacity: win?.opacity ?? 1,
  };

  const title = win?.title ?? 'Window';

  return (
    <div
      className={`rounded-lg border border-neutral-700 shadow-xl bg-neutral-900/95 select-none ${
        win?.minimized ? 'hidden' : ''
      }`}
      style={style}
      onMouseDown={() => focusWindow?.(win.id)}
      data-win-id={win?.id}
    >
      {/* Title bar */}
      <div
        className="h-9 px-2 flex items-center justify-between bg-neutral-850 border-b border-neutral-700 rounded-t-lg"
        onMouseDown={onTitleDown}
      >
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          <div className="text-sm font-medium">{title}</div>
        </div>
        <div className="flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
          <button
            className="px-2 py-0.5 rounded hover:bg-neutral-800 text-xs"
            onClick={() => minimizeWindow?.(win.id)}
            title="Minimize"
          >
            ▃
          </button>
          <button
            className="px-2 py-0.5 rounded hover:bg-neutral-800 text-xs"
            onClick={() => toggleMaximize?.(win.id)}
            title="Maximize"
          >
            ☐
          </button>
          <button
            className="px-2 py-0.5 rounded hover:bg-red-700/30 text-xs"
            onClick={() => closeWindow?.(win.id)}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content (now Suspense-wrapped) */}
      <div className="h-[calc(100%-2.25rem)] p-2 overflow-auto">
        <React.Suspense fallback={<div className="p-4 text-sm opacity-70">Loading…</div>}>
          {children}
        </React.Suspense>
      </div>

      {/* Resize handle (bottom-right) */}
      {!win?.maximized && (
        <div
          className="absolute right-0 bottom-0 w-4 h-4 cursor-se-resize"
          onMouseDown={onResizeStart}
          title="Resize"
        />
      )}
    </div>
  );
}
