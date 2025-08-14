//src/components/os/apps/LegacyStoreProvider.jsx

import React, { createContext, useContext } from 'react';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { useWidgetMemoryStore } from '../../../store/useWidgetMemoryStore';

// Create contexts for legacy stores
const LegacyDashboardContext = createContext(null);
const LegacyMemoryContext = createContext(null);

/**
 * Provider that makes legacy stores available to wrapped widgets
 * This ensures widgets can access their required data without modification
 */
export const LegacyStoreProvider = ({ children }) => {
  const dashboardStore = useDashboardStore();
  const memoryStore = useWidgetMemoryStore();
  
  return (
    <LegacyDashboardContext.Provider value={dashboardStore}>
      <LegacyMemoryContext.Provider value={memoryStore}>
        {children}
      </LegacyMemoryContext.Provider>
    </LegacyDashboardContext.Provider>
  );
};

// Export hooks for legacy widget compatibility (if needed for debugging)
export const useLegacyDashboardStore = () => {
  const context = useContext(LegacyDashboardContext);
  if (!context) {
    throw new Error('useLegacyDashboardStore must be used within LegacyStoreProvider');
  }
  return context;
};

export const useLegacyMemoryStore = () => {
  const context = useContext(LegacyMemoryContext);
  if (!context) {
    throw new Error('useLegacyMemoryStore must be used within LegacyStoreProvider');
  }
  return context;
};