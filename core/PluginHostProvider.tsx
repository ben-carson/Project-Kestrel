// src/core/PluginHostProvider.tsx
import React from "react";
import type {
  PluginContext,
  TabRegistration,
  WidgetRegistration,
  ServiceRegistration,
  SystemItemRegistration,
} from "../types/plugin";
import { PluginLoader } from "./PluginLoader";

type ApiService = {
  name: string;
  url: string;
  meta?: Record<string, any>;
  ts?: number;
};

type PluginHostState = {
  tabs: TabRegistration[];
  widgets: WidgetRegistration[];
  services: ServiceRegistration[];
  systemItems: SystemItemRegistration[];
  ready: boolean;

  // From backend registry
  apiServices: ApiService[];
  apiLoading: boolean;
  apiError: string | null;
  lastFetchTs: number | null;

  // Actions
  refreshApiServices: () => Promise<void>;
  refreshSystemItems: () => Promise<void>;
  enableSystemItem: (itemId: string) => Promise<void>;
  disableSystemItem: (itemId: string) => Promise<void>;
};

export const PluginHostContext = React.createContext<PluginHostState>({
  tabs: [],
  widgets: [],
  services: [],
  systemItems: [],
  ready: false,
  apiServices: [],
  apiLoading: false,
  apiError: null,
  lastFetchTs: null,
  refreshApiServices: async () => {},
  refreshSystemItems: async () => {},
  enableSystemItem: async () => {},
  disableSystemItem: async () => {},
});

export function PluginHostProvider({ children }: { children: React.ReactNode }) {
  const [tabs, setTabs] = React.useState<TabRegistration[]>([]);
  const [widgets, setWidgets] = React.useState<WidgetRegistration[]>([]);
  const [services, setServices] = React.useState<ServiceRegistration[]>([]);
  const [systemItems, setSystemItems] = React.useState<SystemItemRegistration[]>([]);
  const [ready, setReady] = React.useState(false);

  const [apiServices, setApiServices] = React.useState<ApiService[]>([]);
  const [apiLoading, setApiLoading] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [lastFetchTs, setLastFetchTs] = React.useState<number | null>(null);

  // Store reference to loader for system items management
  const loaderRef = React.useRef<PluginLoader | null>(null);

  const refreshApiServices = React.useCallback(async () => {
    setApiLoading(true);
    setApiError(null);
    try {
      const resp = await fetch("/api/plugin-services", { cache: "no-store" });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = (await resp.json()) as { services: ApiService[] };
      setApiServices(Array.isArray(data.services) ? data.services : []);
      setLastFetchTs(Date.now());
    } catch (e: any) {
      setApiError(e?.message ?? "Failed to load plugin services");
    } finally {
      setApiLoading(false);
    }
  }, []);

  const refreshSystemItems = React.useCallback(async () => {
    if (loaderRef.current) {
      try {
        // Refresh system items from the loader
        const freshSystemItems = (loaderRef.current as any).registrar?.systemItems ?? [];
        setSystemItems(freshSystemItems);
      } catch (e: any) {
        console.error("Failed to refresh system items:", e);
      }
    }
  }, []);

  const enableSystemItem = React.useCallback(async (itemId: string) => {
    if (loaderRef.current) {
      try {
        // Enable the system item through the loader
        const registrar = (loaderRef.current as any).registrar;
        if (registrar?.enableSystemItem) {
          await registrar.enableSystemItem(itemId);
          await refreshSystemItems();
        }
      } catch (e: any) {
        console.error(`Failed to enable system item ${itemId}:`, e);
      }
    }
  }, [refreshSystemItems]);

  const disableSystemItem = React.useCallback(async (itemId: string) => {
    if (loaderRef.current) {
      try {
        // Disable the system item through the loader
        const registrar = (loaderRef.current as any).registrar;
        if (registrar?.disableSystemItem) {
          await registrar.disableSystemItem(itemId);
          await refreshSystemItems();
        }
      } catch (e: any) {
        console.error(`Failed to disable system item ${itemId}:`, e);
      }
    }
  }, [refreshSystemItems]);

  React.useEffect(() => {
    const ctx: PluginContext = {
      env: import.meta.env,
      logger: console,
      hasPermission: () => true,
      getService: () => undefined,
    };

    const loader = new PluginLoader(
      ctx,
      (perm) => ctx.hasPermission?.(perm) ?? true,
      (flag) =>
        flag ? Boolean((import.meta.env as any)[flag]) : true
    );

    // Store loader reference for system items management
    loaderRef.current = loader;

    (async () => {
      await loader.discover();
      await loader.initializeAll();
      await loader.startServices();
      
      setTabs(loader.tabs);
      setWidgets(loader.widgets);
      setServices(loader.services);

      // ADD: Extract systemItems from the loader's registrar
      const systemItems = (loader as any).registrar?.systemItems ?? [];
      setSystemItems(systemItems);
      
      setReady(true);

      // Initial fetch of backend-visible services
      refreshApiServices();
    })();

    return () => {
      loader.stopServices();
      loaderRef.current = null;
    };
  }, [refreshApiServices]);

  const value: PluginHostState = {
    tabs,
    widgets,
    services,
    systemItems, // ADD: Include systemItems in the context value
    ready,
    apiServices,
    apiLoading,
    apiError,
    lastFetchTs,
    refreshApiServices,
    refreshSystemItems,
    enableSystemItem,
    disableSystemItem,
  };

  return (
    <PluginHostContext.Provider value={value}>
      {children}
    </PluginHostContext.Provider>
  );
}

// Convenience hook
export function usePluginHost() {
  const ctx = React.useContext(PluginHostContext);
  if (!ctx) throw new Error("usePluginHost must be used within PluginHostProvider");
  return ctx;
}

// Additional convenience hooks for specific use cases
export function useSystemItems() {
  const { systemItems, refreshSystemItems, enableSystemItem, disableSystemItem } = usePluginHost();
  return {
    systemItems,
    refreshSystemItems,
    enableSystemItem,
    disableSystemItem,
  };
}

export function usePluginRegistry() {
  const { tabs, widgets, services, ready } = usePluginHost();
  return {
    tabs,
    widgets,
    services,
    ready,
  };
}

export function useApiServices() {
  const { apiServices, apiLoading, apiError, lastFetchTs, refreshApiServices } = usePluginHost();
  return {
    apiServices,
    apiLoading,
    apiError,
    lastFetchTs,
    refreshApiServices,
  };
}