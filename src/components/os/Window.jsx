// src/components/os/Window.jsx
import React from 'react';
import { useUIStore } from '../../store/useUIStore.ts';

const WINDOWS_BASE_Z = 200;

export default function Window({ win, focused, children }) {
  const {
    focusWindow, commitMove, commitResize,
    minimizeWindow, closeWindow, toggleMaximize, setOpacity
  } = useUIStore(s => s);

  const [dragging, setDragging] = React.useState(false);
  const [resizing, setResizing] = React.useState(false);
  const [tx, setTx] = React.useState(0);
  const [ty, setTy] = React.useState(0);
  const [tw, setTw] = React.useState(win.w);
  const [th, setTh] = React.useState(win.h);
  const offRef = React.useRef({ x: 0, y: 0 });

  const onDragStart = (e) => {
    if (win.isMaximized) return;
    e.preventDefault();
    focusWindow(win.id);
    offRef.current = { x: e.clientX - win.x, y: e.clientY - win.y };
    setDragging(true);
  };

  const onResizeStart = (e) => {
    if (win.isMaximized) return;
    e.preventDefault();
    e.stopPropagation();
    focusWindow(win.id);
    setResizing(true);
  };

  React.useEffect(() => {
    const mm = (e) => {
      if (dragging) {
        setTx(e.clientX - offRef.current.x - win.x);
        setTy(e.clientY - offRef.current.y - win.y);
      } else if (resizing) {
        const nx = Math.max(380, e.clientX - win.x);
        const ny = Math.max(240, e.clientY - win.y);
        setTw(nx); setTh(ny);
      }
    };
    const mu = () => {
      if (dragging) { commitMove(win.id, win.x + tx, win.y + ty); setTx(0); setTy(0); }
      if (resizing) { commitResize(win.id, tw, th); }
      setDragging(false); setResizing(false);
    };
    if (dragging || resizing) {
      window.addEventListener('mousemove', mm);
      window.addEventListener('mouseup', mu, { once: true });
    }
    return () => {
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', mu);
    };
  }, [dragging, resizing, tx, ty, tw, th, win.id, win.x, win.y, commitMove, commitResize]);

  const style = {
    left:   win.isMaximized ? 0 : win.x,
    top:    win.isMaximized ? 0 : win.y,
    width:  win.isMaximized ? '100%' : win.w,
    height: win.isMaximized ? '100%' : win.h,
    zIndex: WINDOWS_BASE_Z + (win.z ?? 0),
    transform: win.isMaximized ? 'none' : `translate(${tx}px, ${ty}px)`,
    opacity: win.opacity ?? 1,
    backgroundColor: 'rgba(23,23,23,0.9)',
    backdropFilter: 'blur(6px)',
  };

  return (
    <div
      className={`absolute rounded-xl shadow-2xl border border-neutral-700 bg-neutral-900/80
                  ${focused ? 'ring-2 ring-sky-500' : ''}`}
      style={style}
      onMouseDown={() => focusWindow(win.id)}
    >
      {/* Titlebar */}
      <div
        className={`h-9 px-3 flex items-center justify-between select-none rounded-t-xl
                    ${win.isMaximized ? 'cursor-default' : 'cursor-move'} bg-neutral-800`}
        onMouseDown={onDragStart}
      >
        <div className="font-medium truncate">{win.title ?? ''}</div>
        <div className="flex items-center gap-2">
          {/* Opacity quick controls */}
          <button
            className="text-xs px-2 py-0.5 rounded hover:bg-neutral-700"
            title={`Opacity ${Math.round((win.opacity ?? 1) * 100)}% (Ctrl+[ / Ctrl+])`}
            onClick={(e) => { e.stopPropagation(); setOpacity(win.id, Math.max(0.2, (win.opacity ?? 1) - 0.1)); }}
          >−opacity</button>
          <button
            className="text-xs px-2 py-0.5 rounded hover:bg-neutral-700"
            onClick={(e) => { e.stopPropagation(); setOpacity(win.id, Math.min(1, (win.opacity ?? 1) + 0.1)); }}
          >+opacity</button>

          {/* Minimize / Maximize / Close */}
          <button className="hover:text-blue-300" title="Minimize (Ctrl+M)"
                  onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}>—</button>
          <button className="hover:text-blue-300" title="Maximize/Restore (Ctrl+Shift+↑)"
                  onClick={(e) => { e.stopPropagation(); toggleMaximize(win.id); }}>
            {win.isMaximized ? '▢' : '⬜'}
          </button>
          <button className="hover:text-red-400" title="Close (Ctrl+W)"
                  onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}>×</button>
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100%-2.25rem)] p-2 overflow-auto">{children}</div>

      {/* Resize handle */}
      {!win.isMaximized && (
        <div className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize" onMouseDown={onResizeStart} />
      )}
    </div>
  );
}
