// src/components/os/WindowManager.jsx
import React, { useEffect, useMemo } from 'react';
import Window from './Window.jsx';
import { useUIStore } from '../../store/useUIStore.ts';
import { AppErrorBoundary } from './AppErrorBoundary';
import PluginsWindowBody from './plugins/PluginsWindowBody.jsx';

// Enhanced component registry with metadata
const WINDOW_COMPONENTS = {
  'PluginsWindowBody': {
    component: PluginsWindowBody,
    defaultProps: {},
    defaultSize: { width: 720, height: 520 },
    category: 'system'
  },
  // Example of how other components could be registered
  'NotesApp': {
    component: () => <div>Notes App Placeholder</div>,
    defaultProps: { mode: 'editor' },
    defaultSize: { width: 680, height: 520 },
    category: 'productivity'
  },
  'SystemMonitor': {
    component: () => <div>System Monitor Placeholder</div>,
    defaultProps: {},
    defaultSize: { width: 800, height: 600 },
    category: 'system'
  }
};

export default function WindowManager() {
  const { osWindows, osFocusedId, activeWorkspace, createWindow } = useUIStore(s => s);

  // Enhanced global window open handler
  useEffect(() => {
    const onOpenWindow = (e) => {
      try {
        const { id, title, width, height, component, props, ...otherProps } = e.detail || {};
        
        // Validate required fields
        if (!id || !title) {
          console.warn('kestrel:openWindow missing required fields (id, title)');
          return;
        }

        // Get component from registry
        let WindowComponent = null;
        let componentConfig = null;
        
        if (component && WINDOW_COMPONENTS[component]) {
          componentConfig = WINDOW_COMPONENTS[component];
          WindowComponent = componentConfig.component;
        } else if (component) {
          console.warn(`Unknown window component: ${component}`);
          return;
        }

        // Check if window already exists
        const existingWindow = useUIStore.getState().osWindows.find(w => w.id === id);
        if (existingWindow) {
          // Focus existing window instead of creating duplicate
          useUIStore.getState().focusWindow(id);
          console.log(`Window ${id} already exists, focusing instead`);
          return;
        }

        // Merge props with defaults
        const finalProps = {
          ...(componentConfig?.defaultProps || {}),
          ...(props || {})
        };

        // Use component's default size if not specified
        const defaultSize = componentConfig?.defaultSize || { width: 720, height: 520 };
        const finalWidth = width ?? defaultSize.width;
        const finalHeight = height ?? defaultSize.height;

        // Create the window
        const windowConfig = {
          id,
          title,
          w: finalWidth,
          h: finalHeight,
          x: Math.max(50, Math.random() * (window.innerWidth - finalWidth - 100)),
          y: Math.max(50, Math.random() * (window.innerHeight - finalHeight - 100)),
          Component: WindowComponent ? () => <WindowComponent {...finalProps} /> : null,
          appId: `dynamic-${component || 'unknown'}`,
          // Additional window properties
          isResizable: true,
          isClosable: true,
          isMaximizable: true,
          isMinimizable: true,
          workspace: useUIStore.getState().activeWorkspace,
          opacity: 1,
          z: Date.now(), // Ensure new window comes to front
          // Pass through any additional props
          ...otherProps
        };

        // Create window through store
        if (typeof createWindow === 'function') {
          createWindow(windowConfig);
          console.log(`Created window: ${id} (${component})`);
        } else {
          // Fallback if createWindow isn't available
          console.warn('createWindow method not available in store');
        }

      } catch (error) {
        console.error('Failed to handle kestrel:openWindow event:', error);
      }
    };

    // Listen for global window open events
    window.addEventListener('kestrel:openWindow', onOpenWindow);
    
    return () => {
      window.removeEventListener('kestrel:openWindow', onOpenWindow);
    };
  }, [createWindow]);

  // Global keyboard shortcuts (unchanged)
  useEffect(() => {
    const onKey = (e) => {
      const S = useUIStore.getState();
      const focusedId = S.osFocusedId;

      // Launcher
      if (e.ctrlKey && !e.shiftKey && !e.altKey && e.code === 'Space') {
        e.preventDefault();
        S.openLauncher();
        return;
      }

      // Alt+Tab / Shift+Alt+Tab – cycle focus
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        S.cycleFocus(e.shiftKey ? -1 : 1);
        return;
      }
      
      if (!focusedId) return;

      // Ctrl+W – close
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        S.closeWindow(focusedId);
        return;
      }
      // Ctrl+M – minimize
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        S.minimizeWindow(focusedId);
        return;
      }
      // Ctrl+Shift+ArrowUp – maximize/restore
      if (e.ctrlKey && e.shiftKey && e.key === 'ArrowUp') {
        e.preventDefault();
        S.toggleMaximize(focusedId);
        return;
      }
      // Ctrl+[ / Ctrl+] – opacity down/up
      if (e.ctrlKey && !e.shiftKey && e.key === '[') {
        e.preventDefault();
        const w = S.osWindows.find(w => w.id === focusedId);
        S.setOpacity(focusedId, Math.max(0.2, (w?.opacity ?? 1) - 0.1));
        return;
      }
      if (e.ctrlKey && !e.shiftKey && e.key === ']') {
        e.preventDefault();
        const w = S.osWindows.find(w => w.id === focusedId);
        S.setOpacity(focusedId, Math.min(1, (w?.opacity ?? 1) + 0.1));
        return;
      }
      // Esc – unmaximize if maximized
      if (!e.ctrlKey && !e.altKey && !e.shiftKey && e.key === 'Escape') {
        const w = S.osWindows.find(w => w.id === focusedId);
        if (w?.isMaximized) {
          e.preventDefault();
          S.toggleMaximize(focusedId);
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Enhanced debugging and development helpers
  useEffect(() => {
    // Development helper: global window management functions
    if (process.env.NODE_ENV === 'development') {
      window._kestrel = {
        ...window._kestrel,
        openPluginsWindow: () => {
          window.dispatchEvent(new CustomEvent('kestrel:openWindow', {
            detail: {
              id: `plugins-dev-${Date.now()}`,
              title: 'Plugin Manager (Dev)',
              component: 'PluginsWindowBody'
            }
          }));
        },
        openWindow: (component, props = {}) => {
          window.dispatchEvent(new CustomEvent('kestrel:openWindow', {
            detail: {
              id: `${component}-${Date.now()}`,
              title: component,
              component,
              props
            }
          }));
        },
        listWindows: () => {
          console.table(useUIStore.getState().osWindows.map(w => ({
            id: w.id,
            title: w.title,
            workspace: w.workspace,
            minimized: w.minimized,
            maximized: w.isMaximized,
            focused: w.id === useUIStore.getState().osFocusedId
          })));
        },
        listComponents: () => {
          console.table(Object.entries(WINDOW_COMPONENTS).map(([name, config]) => ({
            name,
            category: config.category,
            defaultWidth: config.defaultSize.width,
            defaultHeight: config.defaultSize.height
          })));
        },
        closeAllWindows: () => {
          const state = useUIStore.getState();
          state.osWindows.forEach(w => state.closeWindow(w.id));
        }
      };
    }
  }, []);

  const visibleWindows = useMemo(() => {
    return osWindows
      .filter(w => w.workspace === activeWorkspace && !w.minimized && w.Component)
      .sort((a, b) => a.z - b.z);
  }, [osWindows, activeWorkspace]);

  return (
    <>
      {visibleWindows.map(w => (
        <Window key={w.id} win={w} focused={w.id === osFocusedId}>
          <AppErrorBoundary appId={w.appId}>
            {w.Component ? <w.Component /> : null}
          </AppErrorBoundary>
        </Window>
      ))}
    </>
  );
}

// Export component registry for external access
export { WINDOW_COMPONENTS };