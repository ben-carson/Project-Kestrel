// src/components/os/Taskbar.jsx
import React, { useEffect, useState } from 'react';
import { useUIStore } from '../../store/useUIStore.ts';

export default function Taskbar() {
  const { osWindows, osFocusedId, focusWindow, activeWorkspace } = useUIStore(s => s);

  const visible = osWindows
    .filter(w => w.workspace === activeWorkspace && !w.minimized)
    .sort((a, b) => a.z - b.z);

  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed bottom-0 inset-x-0 z-[900] pointer-events-none">
      <div className="h-12 bg-neutral-800/80 backdrop-blur border-t border-neutral-700 flex items-center px-3 gap-3 pointer-events-auto">
        {/* (launcher button removed) */}

        {/* Window buttons */}
        <div className="flex-1 flex gap-2 overflow-x-auto">
          {visible.map(w => (
            <button
              key={w.id}
              onClick={() => focusWindow(w.id)}
              onAuxClick={(e) => { if (e.button === 1) useUIStore.getState().closeWindow(w.id); }}
              title={w.title}
              className={`px-3 py-1 rounded-lg border truncate max-w-[16rem] ${
                w.id === osFocusedId
                  ? 'bg-sky-700 border-sky-500 text-white'
                  : 'bg-neutral-700 border-neutral-600 text-neutral-100 hover:bg-neutral-650'
              }`}
            >
              {w.title}
            </button>
          ))}
        </div>

        {/* Clock */}
        <div className="text-sm opacity-75 tabular-nums">{clock.toLocaleTimeString()}</div>
      </div>
    </div>
  );
}
