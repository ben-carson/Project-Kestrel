import React from 'react';
import { useUIStore } from '../../store/useUIStore.ts';

export default function Window({ win, focused, children }){
  const { focusWindow, commitMove, commitResize, minimizeWindow, closeWindow } = useUIStore(s => s);

  const [dragging, setDragging] = React.useState(false);
  const [resizing, setResizing] = React.useState(false);
  const [tx, setTx] = React.useState(0);
  const [ty, setTy] = React.useState(0);
  const [tw, setTw] = React.useState(win.w);
  const [th, setTh] = React.useState(win.h);
  const offRef = React.useRef({ x:0, y:0 });

  const onDragStart = (e) => {
    e.preventDefault();
    focusWindow(win.id);
    offRef.current = { x: e.clientX - win.x, y: e.clientY - win.y };
    setDragging(true);
  };

  const onResizeStart = (e) => {
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
        setTw(nx);
        setTh(ny);
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
    left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z,
    transform: `translate(${tx}px, ${ty}px)`,
  };

  return (
    <div className={`absolute rounded-xl shadow-2xl border border-neutral-700 bg-neutral-850
                    ${focused ? 'ring-2 ring-sky-500' : ''}`}
         style={style}
         onMouseDown={() => focusWindow(win.id)}>
      <div className="h-9 px-3 flex items-center justify-between cursor-move select-none bg-neutral-800 rounded-t-xl"
           onMouseDown={onDragStart}>
        <div className="font-medium truncate">{win.title}</div>
        <div className="flex gap-2">
          <button className="hover:text-red-300" onClick={() => minimizeWindow(win.id)}>—</button>
          <button className="hover:text-red-400" onClick={() => closeWindow(win.id)}>×</button>
        </div>
      </div>
      <div className="h-[calc(100%-2.25rem)] p-2 overflow-auto">{children}</div>
      <div className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize"
           onMouseDown={onResizeStart}/>
    </div>
  );
}
