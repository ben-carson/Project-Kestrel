// src/components/os/apps/AppRegistry.ts
// Merged Kestrel OS apps with migrated widget apps
import { Terminal, Shield, Activity, Folder, BellRing, Globe, Bell, Plug } from 'lucide-react';
import type { AppManifest } from '../../../types/os.types';

export const AppRegistry: Record<string, AppManifest> = {
  // === KESTREL CORE APPS ===
  'kestrel-core': {
    id: 'kestrel-core',
    title: 'Kestrel Core (bg)',
    icon: Activity,
    permissions: ['events:publish', 'events:subscribe'],
    mount: async () => ({ default: () => null })
  },

  'kestrel-terminal': {
    id: 'kestrel-terminal',
    title: 'Terminal',
    icon: Terminal,
    permissions: ['ui:window', 'events:publish', 'events:subscribe'],
    mount: async () => ({ default: () => null }) // Replace with real TerminalApp when ready
  },

  'kestrel-files': {
    id: 'kestrel-files',
    title: 'Files',
    icon: Folder,
    permissions: ['ui:window'],
    mount: async () => ({ default: () => null })
  },

  'kestrel-breach-monitor': {
    id: 'kestrel-breach-monitor',
    title: 'Breach Monitor',
    icon: BellRing,
    permissions: ['ui:window', 'events:subscribe'],
    mount: () => import('./BreachMonitorApp.jsx'),
  },

  // === MIGRATED WIDGET APPS (Your sophisticated dashboard widgets) ===
  'performance-metrics': {
    id: 'performance-metrics',
    title: 'Performance Metrics',
    icon: Activity,
    permissions: [
      'ui:window',
      'events:subscribe',
      'data:metrics.read',
      'events:publish', // For AIDA agent communication
      'aida:agent.access', // For AIDA intelligence features
      'maia:memory.read',  // For MAIA memory access
      'maia:memory.write'  // For MAIA memory storage
    ],
    mount: () => import('./PerformanceMetricsApp.jsx'),
  },

  'alert-center': {
    id: 'alert-center',
    title: 'Alert Center',
    icon: Bell,
    permissions: [
      'ui:window',
      'events:subscribe',
      'data:alerts.read',
      'events:publish',
      'aida:agent.access'
    ],
    mount: () => import('./AlertCenterApp.jsx'),
  },

  'network-topology': {
    id: 'network-topology',
    title: 'Network Topology',
    icon: Globe,
    permissions: [
      'ui:window',
      'events:subscribe',
      'data:topology.read',
      'data:metrics.read'
    ],
    mount: () => import('./NetworkTopologyApp.jsx'),
  },

  // === LEGACY COMPATIBILITY (keeping original names for backward compatibility) ===
  'security-events': {
    id: 'security-events',
    title: 'Security Events',
    icon: Shield,
    permissions: ['ui:window', 'events:subscribe', 'data:alerts.read'],
    mount: () => import('./AlertCenterApp.jsx'), // Maps to alert-center implementation
  },

  'system-health': {
    id: 'system-health',
    title: 'System Health',
    icon: Activity,
    permissions: ['ui:window', 'events:subscribe', 'data:metrics.read'],
    mount: () => import('./PerformanceMetricsApp.jsx'), // Maps to performance-metrics implementation
  },
  'plugin-diagnostics': {
    id: 'plugin-diagnostics',
    title: 'Plugin Diagnostics',
    icon: Plug,
    permissions: ['ui:window'],
    mount: () => import('../admin/PluginPanel'), // path above
  },
};
