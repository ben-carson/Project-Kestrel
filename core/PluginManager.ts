// src/core/PluginManager.ts - Refactored for type safety, error handling, and simple dependency checks
import type { EventBusImpl } from "./EventBus";
import type { PermissionManager } from "./PermissionManager";
import type { ThemeTokens } from "./ThemeManager";

export interface GatewayLike {
  request: (input: RequestInfo | URL, init?: RequestInit) => Promise<any>;
  setAuthToken?: (token: string) => void;
  setRateLimit?: (rpm: number) => void;
  [k: string]: any;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  permissions?: string[];
  dependsOn?: string[]; // Simple dependency presence check
  tabs?: RegisteredTab[];
  widgets?: RegisteredWidget[];
  dispose?: () => void | Promise<void>; // Optional cleanup hook
}

export interface RegisteredTab {
  id: string;
  label: string;
  pluginId: string;
  order?: number;
  component: React.ComponentType<any>;
  isLegacy?: boolean;
}

export interface RegisteredWidget {
  id: string;
  title: string;
  pluginId: string;
  sizeHints?: { defaultWidth: number; defaultHeight: number };
  category?: string;
  component: React.ComponentType<any>;
  isLegacy?: boolean;
}

export type PluginStatus = "loaded" | "unloaded" | "error";

export class PluginManager {
  private plugins = new Map<string, PluginManifest>();
  private registeredTabs: RegisteredTab[] = [];
  private registeredWidgets: RegisteredWidget[] = [];
  private pluginStatuses = new Map<string, { status: PluginStatus; name: string; error?: string }>();

  constructor(private eventBus: EventBusImpl,
    private gateway: GatewayLike,
    private permissionManager: PermissionManager,
    private theme: ThemeTokens
  ) {}

  getRegisteredTabs(): RegisteredTab[] {
    return [...this.registeredTabs];
  }

  getRegisteredWidgets(): RegisteredWidget[] {
    return [...this.registeredWidgets];
  }

  getAllPluginStatuses() {
    return Array.from(this.pluginStatuses.entries()).map(([id, data]) => ({ id, ...data }));
  }

  async loadPlugin(manifest: PluginManifest, hostContext: any): Promise<void> {
    if (!manifest?.id) {
      throw new Error("Invalid plugin manifest: missing id");
    }

    // Simple dependency check
    if (manifest.dependsOn?.length) {
      const missing = manifest.dependsOn.filter(dep => !this.plugins.has(dep));
      if (missing.length) {
        this.pluginStatuses.set(manifest.id, {
          status: "error",
          name: manifest.name,
          error: `Missing dependencies: ${missing.join(", ")}`
        });
        this.eventBus.emit("plugin.error", { pluginId: manifest.id, missing });
        return;
      }
    }

    try {
      // Register permissions if present
      if (manifest.permissions?.length) {
        this.permissionManager.registerPlugin(manifest.id, manifest.permissions);
      }

      // Register tabs & widgets
      manifest.tabs?.forEach(tab => {
        this.registeredTabs.push({ ...tab, pluginId: manifest.id });
      });
      manifest.widgets?.forEach(widget => {
        this.registeredWidgets.push({ ...widget, pluginId: manifest.id });
      });

      this.plugins.set(manifest.id, manifest);
      this.pluginStatuses.set(manifest.id, { status: "loaded", name: manifest.name });
      this.eventBus.emit("plugin.loaded", { pluginId: manifest.id });
    } catch (err: any) {
      console.error(`Error loading plugin ${manifest.id}:`, err);
      this.pluginStatuses.set(manifest.id, {
        status: "error",
        name: manifest.name,
        error: err?.message || String(err)
      });
      this.eventBus.emit("plugin.error", { pluginId: manifest.id, error: err });
    }
  }

  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    // Optional cleanup hook
    try {
      await plugin.dispose?.();
    } catch (cleanupErr) {
      console.warn(`Plugin ${pluginId} dispose() threw:`, cleanupErr);
    }

    this.registeredTabs = this.registeredTabs.filter(t => t.pluginId !== pluginId);
    this.registeredWidgets = this.registeredWidgets.filter(w => w.pluginId !== pluginId);
    this.plugins.delete(pluginId);
    this.pluginStatuses.set(pluginId, { status: "unloaded", name: plugin.name });
    this.eventBus.emit("plugin.unloaded", { pluginId });
  }

  async killSwitch(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    // Forceful unload without graceful cleanup
    this.registeredTabs = this.registeredTabs.filter(t => t.pluginId !== pluginId);
    this.registeredWidgets = this.registeredWidgets.filter(w => w.pluginId !== pluginId);
    this.plugins.delete(pluginId);
    this.pluginStatuses.set(pluginId, { status: "unloaded", name: plugin.name });
    this.eventBus.emit("plugin.killed", { pluginId });
  }
}
