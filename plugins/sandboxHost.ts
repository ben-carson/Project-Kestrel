// src/plugins/sandboxHost.ts
import { usePluginStore } from "../store/usePluginStore";
import { attachBridge } from "./core/bridge";
import { invokeCapability } from "./capabilities";

const SANDBOX_ORIGIN = "https://plugins.kestrel.local";

export async function launchSandbox(manifest:{ id:string; version:string; bundleUrl:string }) {
  const iframe = document.createElement("iframe");
  iframe.src = `${SANDBOX_ORIGIN}/sandbox.html`;
  iframe.sandbox.add("allow-scripts");
  iframe.style.display = "none";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const { port1: hostPort, port2: sandPort } = new MessageChannel();

  const ready = new Promise<{ widgetIds: string[] }>((resolve, reject) => {
    const to = setTimeout(()=>{ cleanup(); reject(new Error(`Sandbox timeout: ${manifest.id}`)); }, 8000);
    const onMsg = (ev: MessageEvent) => {
      if (ev.source !== iframe.contentWindow || ev.origin !== SANDBOX_ORIGIN) return;
      if (ev.data?.type === "sandbox:ready") {
        iframe.contentWindow!.postMessage({ type:"plugin:load", manifest }, SANDBOX_ORIGIN, [sandPort]);
      }
      if (ev.data?.type === "widget:registered" && ev.data.pluginId === manifest.id) {
        clearTimeout(to); window.removeEventListener("message", onMsg);
        resolve({ widgetIds: ev.data.widgetIds || [] });
      }
    };
    const cleanup = () => { clearTimeout(to); window.removeEventListener("message", onMsg); };
    window.addEventListener("message", onMsg);
  });

  // Make the iframe available to the renderer & bind the port
  const { attachRuntimeFrame, attachRuntimePort } = usePluginStore.getState();
  attachRuntimeFrame(manifest.id, iframe);
  attachRuntimePort(manifest.id, hostPort);

  // Route batched calls into capability invoker
  attachBridge(manifest.id, hostPort, (m,a)=>invokeCapability(manifest.id, m, a));

  await ready; // wait until at least one widget is registered
  return { iframe, port: hostPort };
}
