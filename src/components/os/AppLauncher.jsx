import React from 'react';
import { AppRegistry } from './apps/AppRegistry';
import { useUIStore } from '../../store/useUIStore.ts';

export default function AppLauncher(){
  const { launcherOpen, closeLauncher, launchApp } = useUIStore(s => s);
  if (!launcherOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/40" onClick={closeLauncher}>
      <div className="absolute bottom-14 left-3 w-[560px] max-h-[60vh] overflow-auto
                      bg-neutral-850 border border-neutral-700 rounded-xl p-3 grid grid-cols-3 gap-3"
           onClick={e=>e.stopPropagation()}>
        {Object.values(AppRegistry).map(m => {
          const Icon = m.icon;
          return (
            <button key={m.id} onClick={() => launchApp(m.id)}
                    className="p-3 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-left">
              <div className="flex items-center gap-2">
                {Icon ? <Icon size={16}/> : null}
                <div className="font-medium">{m.title}</div>
              </div>
              <div className="text-xs opacity-60 mt-1">{m.id}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
