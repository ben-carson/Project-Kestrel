// === File: useDashboardStore.js ===
// Enhanced Dashboard Store with proper system integration

import { create } from 'zustand';
// FIX: Import the created instance from the central system file
import { systemWrapper } from '../api/system';

export const useDashboardStore = create((set, get) => ({
  // Core dashboard state
  servers: [],
  systemHealth: null,
  applicationHealth: new Map(),
  globalTrends: null,
  heatMapData: [],
  activeIncidents: [],
  anomalies: {},
  isLoading: false,
  lastUpdate: null,
  evolutionEnabled: true,
  
  // Centralized initialization function
  initialize: () => {
    console.log('Initializing Dashboard Store...');
    get().setupEvolutionCallback();
    get().fetchAllData();
  },

  // Enhanced fetch methods
  fetchAllData: async () => {
    set({ isLoading: true });
    try {
      const store = get();
      
      // Fetch all data in parallel
      await Promise.all([
        store.fetchServerData(),
        store.fetchSystemHealth(),
        store.fetchApplicationHealth(),
        store.fetchGlobalTrends(),
        store.fetchHeatMapData(),
        store.fetchActiveIncidents(),
        store.fetchAnomalies()
      ]);
      
      set({ 
        lastUpdate: Date.now(),
        isLoading: false 
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      set({ isLoading: false });
    }
  },

  fetchServerData: () => {
    try {
      const servers = systemWrapper?.serverOverview || [];
      const safeServers = Array.isArray(servers) ? servers : [];
      set({ servers: safeServers });
      return safeServers;
    } catch (err) {
      console.error("Error fetching server data:", err);
      set({ servers: [] });
      return [];
    }
  },

  fetchSystemHealth: () => {
    try {
      const systemHealth = systemWrapper?.getSystemHealth?.() || null;
      set({ systemHealth });
      return systemHealth;
    } catch (err) {
      console.error("Error fetching system health:", err);
      set({ systemHealth: null });
      return null;
    }
  },

  fetchApplicationHealth: () => {
    try {
      const applicationHealth = systemWrapper?.getApplicationHealth?.() || new Map();
      // ✅ ENSURE IT'S A MAP:
      const safeApplicationHealth = applicationHealth instanceof Map 
         ? applicationHealth 
         : new Map(Object.entries(applicationHealth || {}));
      set({ applicationHealth: safeApplicationHealth });
      return safeApplicationHealth;
    } catch (err) {
      console.error("Error fetching application health:", err);
      const fallbackMap = new Map();
      set({ applicationHealth: fallbackMap });
      return fallbackMap;
    }
  },

  fetchGlobalTrends: () => {
    try {
      const globalTrends = systemWrapper?.getGlobalTrends?.() || null;
      set({ globalTrends });
      return globalTrends;
    } catch (err) {
      console.error("Error fetching global trends:", err);
      set({ globalTrends: null });
      return null;
    }
  },

  fetchHeatMapData: () => {
    try {
      const rawData = systemWrapper?.getHeatMaps?.() || {};
      let formatted = [];
      
      if (Array.isArray(rawData)) {
        formatted = rawData;
      } else if (typeof rawData === 'object' && rawData !== null) {
        formatted = Object.entries(rawData).map(([node, stats]) => ({
          node,
          ...stats,
        }));
      }

      set({ heatMapData: formatted });
      return formatted;
    } catch (err) {
      console.error("Error fetching heat map data:", err);
      set({ heatMapData: [] });
      return [];
    }
  },

  fetchActiveIncidents: () => {
    try {
      const incidents = systemWrapper?.getActiveIncidents?.() || [];
      set({ activeIncidents: incidents });
      return incidents;
    } catch (err) {
      console.error("Error fetching active incidents:", err);
      set({ activeIncidents: [] });
      return [];
    }
  },

  fetchAnomalies: () => {
    try {
      const anomalies = systemWrapper?.getDatacenterAnomalies?.() || {};
      set({ anomalies });
      return anomalies;
    } catch (err) {
      console.error("Error fetching anomalies:", err);
      set({ anomalies: {} });
      return {};
    }
  },

  // System control methods
  toggleEvolution: () => {
    const { evolutionEnabled } = get();
    if (evolutionEnabled) {
      systemWrapper?.stopEvolution?.();
    } else {
      systemWrapper?.startEvolution?.(3000);
    }
    set({ evolutionEnabled: !evolutionEnabled });
  },

  setEvolutionInterval: (intervalMs) => {
    systemWrapper?.stopEvolution?.();
    systemWrapper?.startEvolution?.(intervalMs);
  },

  // Incident management
  injectIncident: (serverId, scenarioName, options = {}) => {
    try {
      const result = systemWrapper?.injectIncident?.(serverId, scenarioName, options);
      // Refresh incidents after injection
      get().fetchActiveIncidents();
      return result;
    } catch (error) {
      console.error('Error injecting incident:', error);
      throw error;
    }
  },

  cancelIncident: (incidentId) => {
    try {
      const result = systemWrapper?.cancelIncident?.(incidentId);
      // Refresh incidents after cancellation
      get().fetchActiveIncidents();
      return result;
    } catch (error) {
      console.error('Error cancelling incident:', error);
      throw error;
    }
  },

  // Evolution callback setup
  setupEvolutionCallback: () => {
    systemWrapper?.setEvolutionCallback?.((servers, systemHealth, applicationHealth, metadata) => {
      set({
        servers,
        systemHealth,
        applicationHealth,
        globalTrends: metadata?.trends || null,
        activeIncidents: metadata?.incidents || [],
        anomalies: metadata?.anomalies || {},
        lastUpdate: Date.now()
      });
    });
  },

   // Utility methods
  getServerById: (serverId) => {
    const { servers } = get();
    return servers.find(server => server.id === serverId);
  },

  getServersByType: (type) => {
    const { servers } = get();
    return servers.filter(server => server.type === type);
  },

  getServersByStatus: (status) => {
    const { servers } = get();
    return servers.filter(server => server.status === status);
  },

  getServersByDatacenter: (datacenter) => {
    const { servers } = get();
    return servers.filter(server => server.datacenter === datacenter);
  },

  // ✅ NEW: Widget Settings Accessor
  getWidgetSettings: (widgetId) => {
    // Placeholder logic — can be expanded with per-widget customization
    return {
      refreshRate: 5000,
      autoRefresh: true,
      showDetails: true,
      theme: 'auto',
      // You could later load widget-specific settings by ID here
      // e.g. ...(get().widgetSettings[widgetId] || {})
    };
  },
}));
