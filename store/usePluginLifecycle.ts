// src/store/usePluginLifecycle.ts
import { create } from "zustand";
type Status = "installed"|"active"|"suspended"|"revoked";

export const usePluginLifecycle = create((set, get) => ({
  registry: {} as Record<string,{ id:string; version:string; scopes:string[]; status:Status; sandbox?:any }>,
  install: async (meta: { id:string; version:string; scopes:string[]; bundleUrl:string }) => {
    // CRL & consent checks happen outside
    set(s => ({ registry: { ...s.registry, [meta.id]: { ...meta, status:"installed" }}}));
  },
  activate: async (id: string, sandbox: any) => {
    set(s => ({ registry: { ...s.registry, [id]: { ...s.registry[id], status:"active", sandbox }}}));
  },
  suspend: async (id: string, reason?: string) => {
    const r = get().registry[id]; if (!r?.sandbox) return;
    try { r.sandbox.shutdown?.(); } catch {}
    set(s => ({ registry: { ...s.registry, [id]: { ...r, status:"suspended", sandbox: undefined }}}));
  },
  uninstall: async (id: string) => {
    const r = get().registry[id]; if (r?.sandbox) { try { r.sandbox.shutdown?.(); } catch {} }
    set(s => { const reg = { ...s.registry }; delete reg[id]; return { registry: reg }; });
  },
}));
