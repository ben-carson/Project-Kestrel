// src/components/framework/localRegistry.js
// Registry for trusted first-party (local) widgets that render in-process (no iframe).

// Import your local widgets here so Vite bundles them.
import AlertCenterWidget from "../widgets/AlertCenterWidget";
import NetworkTopologyWidget from "../widgets/NetworkTopologyWidget";
import PerformanceMetricsWidget from "../widgets/PerformanceMetricsWidget";
import SystemHealthTrend from "../widgets/SystemHealthTrend";
import RootCauseCanvas from "../widgets/RootCauseCanvas";
//import SecurityEventFeed from "../widgets/SecurityEventFeed";

const _registry = new Map([
  ["alertCenter", AlertCenterWidget],
  ["networkTopology", NetworkTopologyWidget],
  ["performanceMetrics", PerformanceMetricsWidget],
  ["systemHealth", SystemHealthTrend],
  ["rootCause", RootCauseCanvas],
  //["securityEvents", SecurityEventFeed],
]);

/**
 * Get a local widget component by id.
 * @param {string} id
 * @returns {React.ComponentType|undefined}
 */
export function getLocalComponent(id) {
  return _registry.get(id);
}

/**
 * List all registered local widget ids.
 * @returns {string[]}
 */
export function listLocalWidgetIds() {
  return Array.from(_registry.keys());
}

/**
 * Register a new local widget at runtime.
 * Note: The component must be imported somewhere to be bundled.
 * @param {string} id
 * @param {React.ComponentType} Component
 */
export function registerLocalWidget(id, Component) {
  _registry.set(id, Component);
  _registry.set("rootCause", RootCauseCanvas);
}

/**
 * Unregister a local widget.
 * @param {string} id
 */
export function unregisterLocalWidget(id) {
  _registry.delete(id);
}

export default _registry;
