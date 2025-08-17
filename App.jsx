// src/App.jsx
import React from "react";
import ToastProvider from "./components/ui/ToastProvider.jsx";
import WindowManager from "./components/os/WindowManager";
import { PluginProvider } from "./components/os/PluginProvider";
import ToastHost from "./components/ui/ToastHost";

export default function App() {
  const [DesktopShell, setDesktopShell] = React.useState(null);

  React.useEffect(() => {
    // start SSE bridge
    import("./lib/sseBridge")
	  .then((m) => m.startSSE && m.startSSE())
	  .catch((err) => {
	  console.error("Failed to start SSE:", err);
	});

    // lazy-load the desktop shell
    import("./components/os/DesktopShell.jsx")
      .then((m) => setDesktopShell(() => m.default))
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

      {/* Render toasts once, at app root */}
      <ToastHost />
    </ToastProvider>
  );
}
