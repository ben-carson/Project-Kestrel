// src/App.jsx
import React from 'react';
import ToastProvider from './components/ui/ToastProvider.jsx';
import WindowManager from './components/os/WindowManager';
import { PluginProvider } from './components/os/PluginProvider';

export default function App() {
  const [DesktopShell, setDesktopShell] = React.useState(null);

  React.useEffect(() => {
    // start SSE bridge
    import('./lib/sseBridge')
      .then(m => m.startSSE && m.startSSE())
      .catch(() => { /* ignore bridge load errors */ });

    // lazy-load the desktop shell
    import('./components/os/DesktopShell.jsx')
      .then(m => setDesktopShell(() => m.default))
      .catch(() => setDesktopShell(null));
  }, []);

  return (
    <ToastProvider>
      {DesktopShell ? (
        <DesktopShell />
      ) : (
        // fallback shell so system still works without DesktopShell.jsx
        <PluginProvider>
          <WindowManager />
        </PluginProvider>
      )}
    </ToastProvider>
  );
}