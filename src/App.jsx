import React from 'react';
import ToastProvider from './components/ui/ToastProvider.jsx';

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
        <div className="h-screen w-screen grid place-items-center">
          <div className="max-w-xl text-center">
            <h1 className="text-3xl font-semibold mb-3">Project Kestrel</h1>
            <p className="opacity-80">
              OS shell not found. Merge the OS <code>src/components/os</code> folder and restart.
            </p>
            <p className="mt-2 text-sm opacity-60">
              Frontend & API are up. Try hitting <code>/api/health</code>.
            </p>
          </div>
        </div>
      )}
    </ToastProvider>
  );
}
