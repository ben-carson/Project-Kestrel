// src/components/os/Taskbar.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useUIStore } from '../../store/useUIStore.ts';
import { PluginHostContext } from '../../core/PluginHostProvider';
import PluginsTrayButton from './plugins/PluginsTrayButton.jsx';

export default function Taskbar() {
  const { osWindows, osFocusedId, focusWindow, activeWorkspace } = useUIStore(s => s);
  const { systemItems } = useContext(PluginHostContext);

  const visible = osWindows
    .filter(w => w.workspace === activeWorkspace && !w.minimized)
    .sort((a, b) => a.z - b.z);

  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Filter system items for different tray positions
  const systemBarRightItems = systemItems
    .filter(i => i.placement === "systemBar.right" && i.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const systemBarLeftItems = systemItems
    .filter(i => i.placement === "systemBar.left" && i.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const systemBarCenterItems = systemItems
    .filter(i => i.placement === "systemBar.center" && i.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Safe render function with error boundary
  const renderSystemItem = (item) => {
    try {
      if (typeof item.render === 'function') {
        return <item.render key={item.id} />;
      } else if (item.component) {
        const Component = item.component;
        return <Component key={item.id} />;
      } else {
        console.warn(`System item ${item.id} has no render function or component`);
        return null;
      }
    } catch (error) {
      console.error(`Error rendering system item ${item.id}:`, error);
      return (
        <div key={item.id} className="text-red-400 text-xs px-1" title={`Error: ${error.message}`}>
          ⚠️
        </div>
      );
    }
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-[900] pointer-events-none">
      <div className="h-12 bg-neutral-800/80 backdrop-blur border-t border-neutral-700 flex items-center px-3 gap-3 pointer-events-auto">
        
        {/* Left system bar items */}
        {systemBarLeftItems.length > 0 && (
          <div className="flex items-center gap-2">
            {systemBarLeftItems.map(renderSystemItem)}
          </div>
        )}

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

        {/* Center system bar items */}
        {systemBarCenterItems.length > 0 && (
          <div className="flex items-center gap-2">
            {systemBarCenterItems.map(renderSystemItem)}
          </div>
        )}

        {/* Right side tray area */}
        <div className="flex items-center gap-2">
          {/* Plugin-contributed tray icons */}
          {systemBarRightItems.map(renderSystemItem)}
          
          {/* Plugins tray button (host-owned) */}
          <PluginsTrayButton />
          
          {/* Clock */}
          <div className="text-sm opacity-75 tabular-nums">
            {clock.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}