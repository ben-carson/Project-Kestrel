// src/components/os/AppLauncher.jsx
import React, { useEffect, useState, startTransition } from 'react';
import { AppRegistry } from './apps/AppRegistry';
import { useUIStore } from '../../store/useUIStore.ts';

export default function AppLauncher() {
  const { launcherOpen, launchApp, closeLauncher } = useUIStore((s) => s);
  const [panelIn, setPanelIn] = useState(false); // slide-in state

  // Prefetch the app module so clicking doesn't suspend
  const prefetch = (id) => {
    const app = AppRegistry?.[id];
    if (app?.loader) app.loader();
    else if (app?.import) app.import();
  };

  useEffect(() => {
    if (!launcherOpen) return;
    setPanelIn(false); // start off-screen
    const t = setTimeout(() => setPanelIn(true), 10);
    return () => clearTimeout(t);
  }, [launcherOpen]);

  if (!launcherOpen) return null;

  const apps = Object.values(AppRegistry);

  const beginClose = () => {
    setPanelIn(false);
    setTimeout(() => closeLauncher(), 180);
  };

  return (
    <div
      className="fixed inset-0 z-[2147483600] bg-black/40"
      onClick={beginClose}
      role="dialog"
      aria-modal="true"
    >
      <aside
        className={`absolute right-0 top-0 h-full w-[520px] bg-neutral-900 border-l border-neutral-700 transition-transform duration-200 ${
          panelIn ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-neutral-700 flex items-center justify-between">
          <div className="text-sm font-semibold">Launch App</div>
          <button className="text-xs opacity-70 hover:opacity-100" onClick={beginClose}>
            Close
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 p-3">
          {apps.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onMouseEnter={() => prefetch(m.id)}
                onFocus={() => prefetch(m.id)}
                onClick={() => {
                  beginClose();
                  startTransition(() => {
                    launchApp(m.id);
                  });
                }}
                className="p-3 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-left border border-neutral-700"
              >
                <div className="flex items-center gap-2">
                  {Icon ? <Icon size={16} /> : <div className="w-4 h-4 rounded bg-neutral-600" />}
                  <div className="font-medium">{m.title}</div>
                </div>
                <div className="text-xs opacity-60 mt-1">{m.id}</div>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
