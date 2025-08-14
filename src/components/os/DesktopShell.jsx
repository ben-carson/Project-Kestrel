import React from 'react';
import WindowManager from './WindowManager.jsx';
import Taskbar from './Taskbar.jsx';
import AppLauncher from './AppLauncher.jsx';
import ContextMenu from './ContextMenu.jsx';
import useGlobalShortcuts from '../../hooks/useGlobalShortcuts';
import { useUIStore } from '../../store/useUIStore.ts';
import useBreachToasts from '../../hooks/useBreachToasts.jsx';
import { PluginProvider } from './PluginProvider';

export default function DesktopShell() {
  // Start global listeners - this is good practice for top-level components
  useBreachToasts();
  useGlobalShortcuts();

  // State for the context menu
  const [ctx, setCtx] = React.useState(null);
  
  // Get the launchApp action from the Zustand store
  const launch = useUIStore(s => s.launchApp);

  // Handler for the desktop right-click context menu
  const onDesktopContext = (e) => {
    e.preventDefault(); // Prevent default browser menu
    setCtx({
      x: e.clientX, y: e.clientY,
      items: [
        { label: 'Open Terminal', action: () => launch('kestrel-terminal') },
        { label: 'System Monitor', action: () => launch('system-health') },
        { label: 'Files', action: () => launch('kestrel-files') },
        { separator: true },
        { label: 'Settings', action: () => {} } // Placeholder action
      ]
    });
  };

  // A React component must return a single element tree.
  // The PluginProvider now wraps the entire shell.
  return (
    <PluginProvider enabledByDefault={import.meta.env.VITE_PLUGINS_ENABLED === 'true'}>
      <div 
        className="w-screen h-screen bg-neutral-900 text-neutral-100 overflow-hidden" 
        onContextMenu={onDesktopContext}
      >
        {/* The desktop UI layers */}
        <div className="absolute inset-0"><WindowManager /></div>
        <div className="absolute bottom-0 inset-x-0"><Taskbar /></div>
        <AppLauncher />

        {/* Conditionally render the context menu when its state is set */}
        {ctx && <ContextMenu {...ctx} onClose={() => setCtx(null)} />}
      </div>
    </PluginProvider>
  );
}