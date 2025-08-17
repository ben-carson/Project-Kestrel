// src/core/PluginLoader.ts
import type { Plugin, PluginContext } from "../types/plugin";
import { HostRegistrar } from "./registrar";

export class PluginLoader {
  private plugins: Plugin[] = [];
  private registrar?: HostRegistrar;

  constructor(
    private ctx: PluginContext,
    private hasPermission: (id: string) => boolean,
    private isEnabled: (flag?: string) => boolean
  ) {}

  async discover() {
    // Discover “index.ts/tsx” under plugins
    const modules = import.meta.glob("../plugins/**/index.{ts,tsx}", { eager: true });
    for (const mod of Object.values(modules)) {
      const plugin = (mod as any).default;
      if (plugin && typeof plugin === "object" && "register" in plugin && "initialize" in plugin) {
        this.plugins.push(plugin as Plugin);
      }
    }
    // Also accept explicitly-named plugin files (e.g., InfrastructurePlugin.ts)
    const modules2 = import.meta.glob("../plugins/**/**Plugin.{ts,tsx}", { eager: true });
    for (const mod of Object.values(modules2)) {
      const plugin = (mod as any).default;
      if (plugin && typeof plugin === "object" && "register" in plugin && "initialize" in plugin) {
        this.plugins.push(plugin as Plugin);
      }
    }
  }

  async initializeAll() {
    this.registrar = new HostRegistrar(this.ctx, this.hasPermission, this.isEnabled);
    for (const p of this.plugins) {
      await p.initialize?.(this.ctx);
      p.register(this.registrar);
    }
  }

  get tabs()    { return this.registrar?.tabs    ?? []; }
  get widgets() { return this.registrar?.widgets ?? []; }
  get services(){ return this.registrar?.services?? []; }

  async startServices() { for (const s of this.services) await s.start?.(); }
  async stopServices()  { for (const s of this.services) await s.stop?.(); }
}
