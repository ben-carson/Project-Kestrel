// src/store/pluginSlice.ts - Serializable plugin state for Zustand
import { StateCreator } from 'zustand';

// Serializable plugin data (no React components)
export interface PluginTabData {
  id: string;
  label: string;
  pluginId: string;
  order?: number;
}

export interface PluginWidgetData {
  id: string;
  title: string;
  pluginId: string;
  category?: string;
  sizeHints?: {
    defaultWidth?: number;
    defaultHeight?: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  };
}

export interface PluginStatusData {
  status: 'loading' | 'active' | 'error' | 'disabled';
  name?: string;
  version?: string;
  loadTime?: number;
  errorMessage?: string;
}

export interface PluginState {
  // Core plugin system state
  enabled: boolean;
  tabs: PluginTabData[];
  widgets: PluginWidgetData[];
  statuses: Record<string, PluginStatusData>;
  
  // UI state
  activePluginTab: string | null;
  visibleWidgets: string[];
  pluginPanelOpen: boolean;
  
  // Migration state (persisted)
  flags: Record<string, boolean>; // component ID -> use plugin flag
  migrationInProgress: boolean;
  
  // Actions
  setEnabled: (enabled: boolean) => void;
  setTabs: (tabs: PluginTabData[]) => void;
  setWidgets: (widgets: PluginWidgetData[]) => void;
  setStatuses: (statuses: Record<string, PluginStatusData>) => void;
  setActivePluginTab: (tabId: string | null) => void;
  toggleWidget: (widgetId: string) => void;
  setPluginPanelOpen: (open: boolean) => void;
  setFlag: (componentId: string, usePlugin: boolean) => void;
  setMigrationInProgress: (inProgress: boolean) => void;
  resetPluginState: () => void;
  
  // Batch updates for efficiency
  updatePluginStore: (updates: Partial<Pick<PluginState, 'enabled' | 'tabs' | 'widgets' | 'statuses'>>) => void;
}

export const createPluginSlice: StateCreator<PluginState> = (set, get) => ({
  // Initial state
  enabled: false,
  tabs: [],
  widgets: [],
  statuses: {},
  activePluginTab: null,
  visibleWidgets: [],
  pluginPanelOpen: false,
  flags: {},
  migrationInProgress: false,
  
  // Actions
  setEnabled: (enabled) => set({ enabled }),
  
  setTabs: (tabs) => set({ tabs }),
  
  setWidgets: (widgets) => set({ widgets }),
  
  setStatuses: (statuses) => set({ statuses }),
  
  setActivePluginTab: (tabId) => set({ activePluginTab: tabId }),
  
  toggleWidget: (widgetId) => set((state) => ({
    visibleWidgets: state.visibleWidgets.includes(widgetId)
      ? state.visibleWidgets.filter(id => id !== widgetId)
      : [...state.visibleWidgets, widgetId]
  })),
  
  setPluginPanelOpen: (open) => set({ pluginPanelOpen: open }),
  
  setFlag: (componentId, usePlugin) => set((state) => ({
    flags: { ...state.flags, [componentId]: usePlugin }
  })),
  
  setMigrationInProgress: (inProgress) => set({ migrationInProgress: inProgress }),
  
  updatePluginStore: (updates) => set((state) => ({ ...state, ...updates })),
  
  resetPluginState: () => set({
    enabled: false,
    tabs: [],
    widgets: [],
    statuses: {},
    activePluginTab: null,
    visibleWidgets: [],
    pluginPanelOpen: false,
    flags: {},
    migrationInProgress: false
  })
});

// Selectors for efficient subscriptions
export const pluginSelectors = {
  // Basic state selectors
  isEnabled: (state: PluginState) => state.enabled,
  getTabs: (state: PluginState) => state.tabs,
  getWidgets: (state: PluginState) => state.widgets,
  getStatuses: (state: PluginState) => state.statuses,
  
  // UI state selectors
  getActiveTab: (state: PluginState) => state.activePluginTab,
  getVisibleWidgets: (state: PluginState) => state.visibleWidgets,
  isPanelOpen: (state: PluginState) => state.pluginPanelOpen,
  
  // Migration selectors
  getFlags: (state: PluginState) => state.flags,
  isMigrationInProgress: (state: PluginState) => state.migrationInProgress,
  
  // Parameterized selectors
  isComponentMigrated: (componentId: string) => (state: PluginState) => 
    state.flags[componentId] ?? false,
    
  getTabsByPlugin: (pluginId: string) => (state: PluginState) =>
    state.tabs.filter(tab => tab.pluginId === pluginId),
    
  getWidgetsByPlugin: (pluginId: string) => (state: PluginState) =>
    state.widgets.filter(widget => widget.pluginId === pluginId),
    
  getPluginStatus: (pluginId: string) => (state: PluginState) =>
    state.statuses[pluginId] || { status: 'disabled' as const },
  
  // Computed selectors
  getActiveTabData: (state: PluginState) => {
    if (!state.activePluginTab) return null;
    return state.tabs.find(tab => tab.id === state.activePluginTab) || null;
  },
  
  getVisibleWidgetData: (state: PluginState) => 
    state.widgets.filter(widget => state.visibleWidgets.includes(widget.id)),
  
  getPluginHealth: (state: PluginState) => {
    const statuses = Object.values(state.statuses);
    const total = statuses.length;
    const active = statuses.filter(s => s.status === 'active').length;
    const errors = statuses.filter(s => s.status === 'error').length;
    const loading = statuses.filter(s => s.status === 'loading').length;
    
    return {
      total,
      active,
      errors,
      loading,
      disabled: total - active - errors - loading,
      healthScore: total > 0 ? Math.round((active / total) * 100) : 100,
      hasErrors: errors > 0,
      allLoaded: loading === 0
    };
  },
  
  getMigrationProgress: (state: PluginState) => {
    const flags = Object.values(state.flags);
    const total = flags.length;
    const migrated = flags.filter(Boolean).length;
    
    return {
      total,
      migrated,
      remaining: total - migrated,
      percentage: total > 0 ? Math.round((migrated / total) * 100) : 0,
      isComplete: migrated === total && total > 0
    };
  },
  
  getPluginSummary: (state: PluginState) => {
    const pluginIds = new Set([
      ...state.tabs.map(t => t.pluginId),
      ...state.widgets.map(w => w.pluginId)
    ]);
    
    return Array.from(pluginIds).map(pluginId => {
      const status = state.statuses[pluginId];
      const tabs = state.tabs.filter(t => t.pluginId === pluginId);
      const widgets = state.widgets.filter(w => w.pluginId === pluginId);
      
      return {
        pluginId,
        status: status?.status || 'unknown',
        name: status?.name || pluginId,
        tabCount: tabs.length,
        widgetCount: widgets.length,
        totalComponents: tabs.length + widgets.length,
        isHealthy: status?.status === 'active'
      };
    });
  }
};

// React hooks for component integration
export const usePluginSystem = () => {
  // This would be imported from your main store
  // const store = useDashboardStore();
  
  return {
    enabled: useDashboardStore(pluginSelectors.isEnabled),
    toggleEnabled: useDashboardStore(state => state.setEnabled),
    health: useDashboardStore(pluginSelectors.getPluginHealth),
    summary: useDashboardStore(pluginSelectors.getPluginSummary)
  };
};

export const usePluginTabs = () => {
  return {
    tabs: useDashboardStore(pluginSelectors.getTabs),
    activeTab: useDashboardStore(pluginSelectors.getActiveTab),
    activeTabData: useDashboardStore(pluginSelectors.getActiveTabData),
    setActiveTab: useDashboardStore(state => state.setActivePluginTab)
  };
};

export const usePluginWidgets = () => {
  return {
    widgets: useDashboardStore(pluginSelectors.getWidgets),
    visibleWidgets: useDashboardStore(pluginSelectors.getVisibleWidgets),
    visibleWidgetData: useDashboardStore(pluginSelectors.getVisibleWidgetData),
    toggleWidget: useDashboardStore(state => state.toggleWidget)
  };
};

export const usePluginMigration = () => {
  return {
    flags: useDashboardStore(pluginSelectors.getFlags),
    progress: useDashboardStore(pluginSelectors.getMigrationProgress),
    inProgress: useDashboardStore(pluginSelectors.isMigrationInProgress),
    setFlag: useDashboardStore(state => state.setFlag),
    setInProgress: useDashboardStore(state => state.setMigrationInProgress),
    isComponentMigrated: (componentId: string) => 
      useDashboardStore(pluginSelectors.isComponentMigrated(componentId))
  };
};

export const usePluginPanel = () => {
  return {
    isOpen: useDashboardStore(pluginSelectors.isPanelOpen),
    toggle: useDashboardStore(state => state.setPluginPanelOpen),
    open: () => useDashboardStore.getState().setPluginPanelOpen(true),
    close: () => useDashboardStore.getState().setPluginPanelOpen(false)
  };
};

// Persistence configuration
export const pluginPersistConfig = {
  name: 'kestrel-plugin-state',
  partialize: (state: any) => ({
    // Only persist these fields
    flags: state.flags,
    visibleWidgets: state.visibleWidgets,
    activePluginTab: state.activePluginTab,
    enabled: state.enabled
  }),
  version: 1,
  migrate: (persistedState: any, version: number) => {
    if (version < 1) {
      return {
        ...persistedState,
        flags: persistedState.migrationFlags || persistedState.flags || {}
      };
    }
    return persistedState;
  }
};

// Integration helper for existing useDashboardStore
export const integratePluginSlice = (existingStoreCreator: any) => {
  return (set: any, get: any, api: any) => ({
    ...existingStoreCreator(set, get, api),
    ...createPluginSlice(set, get, api)
  });
};