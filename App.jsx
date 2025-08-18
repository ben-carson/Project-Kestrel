// src/App.jsx
import React from "react";
import ToastProvider from "./components/ui/ToastProvider.jsx";
import WindowManager from "./components/os/WindowManager";
import { PluginProvider } from "./components/os/PluginProvider";
import ToastHost from "./components/ui/ToastHost";

export default function App() {
  const [DesktopShell, setDesktopShell] = React.useState(null);

  // NEW: topology overlay state + lazy component holder
  const [showTopology, setShowTopology] = React.useState(false);
  const [Topology, setTopology] = React.useState(null);

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

  // NEW: enable overlay via URL hash (#topology) or env flag (VITE_DEV_TOPOLOGY=true)
  React.useEffect(() => {
    const ensureLoaded = () => {
      if (!Topology) {
        import("./components/widgets/NetworkTopology")
          .then((m) => setTopology(() => m.NetworkTopology))
          .catch((e) => console.error("Failed to load NetworkTopology:", e));
      }
    };

    const check = () => {
      const enabled =
        window.location.hash === "#topology" ||
        (import.meta.env && import.meta.env.VITE_DEV_TOPOLOGY === "true");
      setShowTopology(enabled);
      if (enabled) ensureLoaded();
    };

    check();
    const onHash = () => check();
    window.addEventListener("hashchange", onHash);

    // Optional: quick toggle with Alt+T (dev convenience)
    const onKey = (e) => {
      if (e.altKey && (e.key === "t" || e.key === "T")) {
        if (window.location.hash === "#topology") {
          history.replaceState(null, "", window.location.pathname + window.location.search);
        } else {
          location.hash = "#topology";
        }
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("keydown", onKey);
    };
  }, [Topology]);

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

      {/* NEW: Full-screen topology overlay. Non-destructive to the rest of the app. */}
      {showTopology && Topology && (
        <div className="topology-root">
          <Topology />
        </div>
      )}
    </ToastProvider>
  );
}
