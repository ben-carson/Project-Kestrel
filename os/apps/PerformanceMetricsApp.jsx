//src/components/os/apps/PerformanceMetricsApp.jsx

import React from 'react';
import PerformanceMetricsWidget from '../../widgets/PerformanceMetricsWidget';
import { LegacyStoreProvider } from './LegacyStoreProvider';

/**
 * Performance Metrics App - Kestrel OS Window Wrapper
 * 
 * Wraps the existing PerformanceMetricsWidget with LegacyStoreProvider
 * to ensure all AIDA intelligence and data access works unchanged.
 */
const PerformanceMetricsApp = () => {
  return (
    <LegacyStoreProvider>
      <div className="h-full w-full overflow-hidden">
        <PerformanceMetricsWidget />
      </div>
    </LegacyStoreProvider>
  );
};

export default PerformanceMetricsApp;