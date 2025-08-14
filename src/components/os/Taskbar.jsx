import React from 'react';
import { useUIStore } from '../../store/useUIStore.ts';

export default function Taskbar(){
  const { osWindows, osFocusedId, openLauncher, focusWindow, activeWorkspace } = useUIStore(s => s);
  const visible = osWindows.filter(w => w.workspace === activeWorkspace);

  return (
    <div className="h-12 bg-neutral-800/80 backdrop-blur border-t border-neutral-700 flex items-center px-3 gap-3">
      <button className="px-3 py-1 rounded bg-neutral-700" onClick={openLauncher}>☰</button>
      <div className="flex-1 flex gap-2 overflow-x-auto">
        {visible.map(w => (
          <button key={w.id}
            className={`px-3 py-1 rounded ${w.id===osFocusedId?'bg-sky-700':'bg-neutral-700'}`}
            onClick={() => focusWindow(w.id)}>
            {w.title}
          </button>
        ))}
      </div>
      <div className="text-sm opacity-75">{new Date().toLocaleTimeString()}</div>
    </div>
  );
}
