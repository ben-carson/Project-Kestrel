// src/components/framework/WidgetRenderer.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePluginStore } from "../../store/usePluginStore";
import { getLocalComponent } from "./localRegistry";

function LocalWidget({ shell, ...props }) {
  const Cmp = getLocalComponent(shell.id);
  if (!Cmp) {
    return (
      <div className="text-gray-400 p-3">
        Unknown local widget: <code>{shell.id}</code>
      </div>
    );
  }
  return <Cmp {...props} />;
}

function IframeWidgetShell({ shell }) {
  const { getRuntimeFrame } = usePluginStore();
  const mountRef = useRef(null);
  const [attached, setAttached] = useState(false);

  // Expect the runtime loader to have already launched the plugin sandbox
  // and called usePluginStore.attachRuntimeFrame(pluginId, iframe).
  const iframe = useMemo(
    () => (shell.pluginId ? getRuntimeFrame(shell.pluginId) : undefined),
    [shell.pluginId, getRuntimeFrame]
  );

  useEffect(() => {
    if (!mountRef.current) return;
    if (!iframe) return;

    // Reparent iframe into our widget container and size it
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "0";
    iframe.style.display = "block";

    // If the iframe already has a parent, move it here.
    if (iframe.parentElement !== mountRef.current) {
      mountRef.current.appendChild(iframe);
    }
    setAttached(true);

    // On unmount, detach the iframe so the plugin can persist if needed,
    // or remove it completely if you prefer teardown.
    return () => {
      // Comment out removal if you want the sandbox to persist off-screen:
      try {
        iframe.remove();
      } catch {}
    };
  }, [iframe]);

  if (!iframe) {
    return (
      <div className="text-gray-400 p-3">
        Plugin <code>{shell.pluginId}</code> not ready.
      </div>
    );
  }

  return (
    <div className="w-full h-full" ref={mountRef}>
      {!attached && <div className="text-gray-400 p-3">Mounting…</div>}
    </div>
  );
}

/**
 * WidgetRenderer
 * Renders either a trusted first-party widget (local) or a sandboxed plugin widget (iframe),
 * based on the WidgetShell registered in usePluginStore.
 *
 * Props:
 *   - widgetId: string (required)
 *   - any other props handed to local widgets if applicable
 */
export default function WidgetRenderer({ widgetId, ...props }) {
  const shell = usePluginStore((s) => s.widgetsById[widgetId]);

  if (!shell) {
    return (
      <div className="text-gray-400 p-3">
        Unknown widget: <code>{widgetId}</code>
      </div>
    );
  }

  if (shell.mountKind === "local") {
    return <LocalWidget shell={shell} {...props} />;
  }

  if (shell.mountKind === "iframe") {
    return <IframeWidgetShell shell={shell} />;
  }

  return (
    <div className="text-gray-400 p-3">
      Unsupported mount kind: <code>{shell.mountKind}</code>
    </div>
  );
}
