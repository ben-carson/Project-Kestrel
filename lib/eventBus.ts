// Temporary shim if you haven't merged the OS eventBus yet.
// Replace with your real '../lib/eventBus.ts' from the Kestrel OS patch.
type Handler = (p: any) => void;
const listeners = new Map<string, Set<Handler>>();

export const eventBus = {
  subscribe: (_appId: string, type: string, h: Handler) => {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type)!.add(h);
    return () => listeners.get(type)?.delete(h);
  },
  emit: (_appId: string, type: string, payload: any) => {
    const set = listeners.get(type);
    if (!set) return;
    for (const h of set) try { h(payload); } catch {}
  }
};
