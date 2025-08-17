// src/store/usePluginStore.ts
import { create } from "zustand";

export type MountKind = "local" | "iframe";

export interface WidgetShell {
  id: string;                 // unique widget id
  name: string;               // display name
  mountKind: MountKind;       // 'local' (first-party) or 'iframe' (sandboxed plugin)
  pluginId?: string;          // owning plugin if mountKind === 'iframe'
  size?: { w: number; h: number };
  category?: string;
  tags?: string[];
}

export interface PluginMeta {
  id: string;
  name: string;
  version: string;
  scopes: string[];
  bundleUrl?: string; // for runtime plugins
  status?: "installed" | "active" | "suspended" | "revoked";
}

// ⚠️ Non-serializable runtime handles live OUTSIDE Zustand state.
const sandboxPorts = new Map<string, MessagePort>();
const sandboxFrames = new Map<string, HTMLIFrameElement>();

type PluginState = {
  // Metadata / registry (serializable):
  plugins: Record<string, PluginMeta>;
  widgetsById: Record<string, WidgetShell>;

  // Registry API:
  registerPluginMeta: (meta: PluginMeta) => void;
  unregisterPlugin: (pluginId: string) => void;

  registerWidgetShell: (shell: WidgetShell) => void;
  unregisterWidget: (widgetId: string) => void;

  // Selectors/util:
  getWidgetShell: (widgetId: string) => WidgetShell | undefined;
  listWidgets: () => WidgetShell[];

  // Runtime: attach handles for sandboxed plugins
  attachRuntimePort: (pluginId: string, port: MessagePort) => void;
  getRuntimePort: (pluginId: string) => MessagePort | undefined;

  attachRuntimeFrame: (pluginId: string, iframe: HTMLIFrameElement) => void;
  getRuntimeFrame: (pluginId: string) => HTMLIFrameElement | undefined;
};

export const usePluginStore = create<PluginState>((set, get) => ({
  plugins: {},
  widgetsById: {},

  registerPluginMeta: (meta) =>
    set((s) => ({
      plugins: { ...s.plugins, [meta.id]: { ...s.plugins[meta.id], ...meta } },
    })),

  unregisterPlugin: (pluginId) =>
    set((s) => {
      const plugins = { ...s.plugins };
      delete plugins[pluginId];

      // Remove any widgets owned by this plugin
      const widgetsById = { ...s.widgetsById };
      for (const wid of Object.keys(widgetsById)) {
        if (widgetsById[wid]?.pluginId === pluginId) delete widgetsById[wid];
      }

      // Clean up runtime handles
      try {
        sandboxPorts.get(pluginId)?.close();
      } catch {}
      sandboxPorts.delete(pluginId);

      const frame = sandboxFrames.get(pluginId);
      if (frame) {
        try {
          frame.remove();
        } catch {}
      }
      sandboxFrames.delete(pluginId);

      return { plugins, widgetsById };
    }),

  registerWidgetShell: (shell) =>
    set((s) => ({
      widgetsById: { ...s.widgetsById, [shell.id]: shell },
    })),

  unregisterWidget: (widgetId) =>
    set((s) => {
      const widgetsById = { ...s.widgetsById };
      delete widgetsById[widgetId];
      return { widgetsById };
    }),

  getWidgetShell: (widgetId) => get().widgetsById[widgetId],
  listWidgets: () => Object.values(get().widgetsById),

  attachRuntimePort: (pluginId, port) => {
    // Replace any existing port
    try {
      sandboxPorts.get(pluginId)?.close();
    } catch {}
    sandboxPorts.set(pluginId, port);
  },
  getRuntimePort: (pluginId) => sandboxPorts.get(pluginId),

  attachRuntimeFrame: (pluginId, iframe) => {
    const old = sandboxFrames.get(pluginId);
    if (old && old !== iframe) {
      try { old.remove(); } catch {}
    }
    sandboxFrames.set(pluginId, iframe);
  },
  getRuntimeFrame: (pluginId) => sandboxFrames.get(pluginId),
}));
