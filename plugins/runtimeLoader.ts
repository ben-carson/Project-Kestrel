// src/plugins/runtimeLoader.ts
import { usePluginStore } from "../store/usePluginStore";
import { verifyPlugin } from "./runtimeVerify";
import { fetchBundle, modulePreload } from "./cache";
import { launchSandbox } from "./sandboxHost";

const PUBLIC_KEY_DER_B64 = "<YOUR_P256_SPKI_BASE64>";
// Constants are kept, but the origin is now dynamic
const PLUGINS_INDEX_PATH = "/plugins/index.json";
const CRL_URL_PATH = "/plugins/revoked.json";

function isRevoked(crl:any[], id:string, version:string) {
  return !!crl.find(e=>e.id===id && (!e.version || e.version===version));
}

export async function loadRuntimePlugins() {
  // ✅ NEW: Dynamically determine the origin for plugin assets
  const origin =
    (import.meta as any).env?.VITE_PLUGINS_ORIGIN ?? window.location.origin;

  const manifestUrl = `${origin.replace(/\/$/, "")}${PLUGINS_INDEX_PATH}`;
  const crlUrl = `${origin.replace(/\/$/, "")}${CRL_URL_PATH}`;

  // ✅ NEW: Robust fetch logic for the main plugin index
  const idxRes = await fetch(manifestUrl, { credentials: "omit", cache: "no-store" });
  if (!idxRes.ok) {
    throw new Error(`[plugins] manifest ${idxRes.status} @ ${manifestUrl}`);
  }

  const idxText = await idxRes.text();
  // Before trying to parse, check if we accidentally got an HTML page
  if (/^\s*<!doctype/i.test(idxText)) {
    throw new Error(`[plugins] misrouted: got HTML instead of JSON from ${manifestUrl}`);
  }

  let idx;
  try {
    idx = JSON.parse(idxText);
  } catch (e) {
    throw new Error(`[plugins] bad JSON in ${manifestUrl}: ${String(e)}`);
  }

  // Fetch the revocation list (CRL)
  const crlRes = await fetch(crlUrl, { cache: "no-store" });
  const crl = crlRes.ok ? await crlRes.json() : [];

  // The rest of your logic remains the same
  for (const p of idx.plugins || []) {
    if (isRevoked(crl, p.id, p.version)) continue;

    // Fetch manifest
    const mRes = await fetch(p.manifestUrl, { cache:"no-store" });
    const manifest = await mRes.json();

    // Consent
    const { hasConsent, requestConsentUI } = await import("./consent");
    if (!hasConsent(manifest.id, manifest.version, manifest.scopes)) {
      const ok = await requestConsentUI(manifest); // Assuming this can be async
      if (!ok) continue;
    }

    // Preload bundle and verify
    const bundleUrl = p.bundleUrl || `${new URL(p.manifestUrl, location.origin).origin}/plugins/${manifest.id}/${manifest.entry}`;
    modulePreload(bundleUrl);
    const buf = await fetchBundle(bundleUrl);
    const ok = await verifyPlugin(PUBLIC_KEY_DER_B64, manifest.id, manifest.version, buf, manifest.integrity);
    if (!ok) continue;

    // Register meta & launch sandbox
    const { registerPluginMeta } = usePluginStore.getState();
    registerPluginMeta({ id: manifest.id, name: manifest.name, version: manifest.version, scopes: manifest.scopes, bundleUrl });

    await launchSandbox({ id: manifest.id, version: manifest.version, bundleUrl });
  }
}