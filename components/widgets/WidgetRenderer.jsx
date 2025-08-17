import React from 'react';
import { AlertTriangle } from 'lucide-react';

// Widget registry - add your widgets here
const WIDGET_REGISTRY = {
  'system-health': React.lazy(() => import('./SystemHealthTrend')),
  'network-topology': React.lazy(() => import('./NetworkTopologyWidget')),
  'alert-center': React.lazy(() => import('./AlertCenterWidget')),
};

export default function WidgetRenderer({ widgetType, props = {}, className = "" }) {
  const WidgetComponent = WIDGET_REGISTRY[widgetType];

  if (!WidgetComponent) {
    return (
      <div className={`p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800 ${className}`}>
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Unknown Widget: {widgetType}</span>
        </div>
        <p className="text-sm text-red-500 dark:text-red-300 mt-1">
          Widget type "{widgetType}" is not registered in the widget registry.
        </p>
      </div>
    );
  }

  return (
    <React.Suspense fallback={
      <div className={`p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3 mb-2"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
    }>
      <div className={className}>
        <WidgetComponent {...props} />
      </div>
    </React.Suspense>
  );
}

export { WIDGET_REGISTRY };
