import { useEffect } from 'react';
import { useUIStore } from '../store/useUIStore';

export default function useGlobalShortcuts(){
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const api = useUIStore.getState();

      // Ctrl+K or Cmd+K -> Launcher
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        api.openLauncher();
        return;
      }
      // Alt+F4 / Cmd+W -> Close focused
      if ((e.altKey && e.key === 'F4') || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'w')) {
        e.preventDefault();
        if (api.osFocusedId) api.closeWindow(api.osFocusedId);
        return;
      }
      // Alt+Tab -> cycle focus
      if (e.altKey && e.key.toLowerCase() === 'tab') {
        e.preventDefault();
        const wins = api.osWindows.filter(w => !w.minimized && w.workspace === api.activeWorkspace);
        if (!wins.length) return;
        const idx = wins.findIndex(w => w.id === api.osFocusedId);
        const next = wins[(idx + 1) % wins.length];
        api.focusWindow(next.id);
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
