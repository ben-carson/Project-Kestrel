// src/components/os/apps/AppRegistry.ts
// Unified app registry compatible with useUIStore.launchApp (component | loader | import)

import { lazy, type ComponentType } from 'react';
import { Terminal, Shield, Activity, Folder, BellRing, Globe, Bell, Plug } from 'lucide-react';
import type { AppManifest } from '../../../types/os.types';

// Extend your manifest with fields our launcher understands
export type KestrelApp = AppManifest & {
  // One of these must be present for the launcher:
  component?: ComponentType<any>;
  loader?: () => Promise<any>;
  import?: () => Promise<any>;
  // Optional window sizing hints
  w?: number;
  h?: number;
};

// Helper: keep dynamic import errors from crashing the launcher
const safe = <T,>(p: Promise<T>): Promise<T> =>
  p.catch((_e) => ({ default: () => null } as unknown as T));

// NOTE: keep 'mount' for any legacy code that still uses it, but the launcher will
// use 'component' / 'loader' / 'import'. We include both where useful.

export const AppRegistry: Record<string, KestrelApp> = {
  // === KESTREL CORE APPS ===
  'kestrel-core': {
    id: 'kestrel-core',
    title: 'Kestrel Core (bg)',
    icon: Activity,
    permissions: ['events:publish', 'events:subscribe'],
    // Background app: no visible UI
    component: () => null,
    mount: async () => ({ default: () => null }),
    w: 860, h: 520,
  },

  'kestrel-terminal': {
    id: 'kestrel-terminal',
    title: 'Terminal',
    icon: Terminal,
    permissions: ['ui:window', 'events:publish', 'events:subscribe'],
    component: lazy(() => safe(import('./TerminalApp.jsx'))),
    loader: () => safe(import('./TerminalApp.jsx')),
    import: () => safe(import('./TerminalApp.jsx')),
    mount: async () => ({ default: () => null }),
    w: 900, h: 540,
  },

  'kestrel-files': {
    id: 'kestrel-files',
    title: 'Files',
    icon: Folder,
    permissions: ['ui:window'],
    component: lazy(() => safe(import('./FilesApp.jsx'))),
    loader: () => safe(import('./FilesApp.jsx')),
    import: () => safe(import('./FilesApp.jsx')),
    mount: async () => ({ default: () => null }),
    w: 980, h: 640,
  },

  'kestrel-breach-monitor': {
    id: 'kestrel-breach-monitor',
    title: 'Breach Monitor',
    icon: BellRing,
    permissions: ['ui:window', 'events:subscribe'],
    component: lazy(() => safe(import('./BreachMonitorApp.jsx'))),
    loader: () => safe(import('./BreachMonitorApp.jsx')),
    import: () => safe(import('./BreachMonitorApp.jsx')),
    mount: () => import('./BreachMonitorApp.jsx'),
    w: 920, h: 600,
  },

  // === MIGRATED WIDGET APPS ===
  'performance-metrics': {
    id: 'performance-metrics',
    title: 'Performance Metrics',
    icon: Activity,
    permissions: [
      'ui:window',
      'events:subscribe',
      'data:metrics.read',
      'events:publish',
      'aida:agent.access',
      'maia:memory.read',
      'maia:memory.write',
    ],
    component: lazy(() => safe(import('./PerformanceMetricsApp.jsx'))),
    loader: () => safe(import('./PerformanceMetricsApp.jsx')),
    import: () => safe(import('./PerformanceMetricsApp.jsx')),
    mount: () => import('./PerformanceMetricsApp.jsx'),
    w: 1100, h: 700,
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
      'aida:agent.access',
    ],
    component: lazy(() => safe(import('./AlertCenterApp.jsx'))),
    loader: () => safe(import('./AlertCenterApp.jsx')),
    import: () => safe(import('./AlertCenterApp.jsx')),
    mount: () => import('./AlertCenterApp.jsx'),
    w: 560, h: 640,
  },

  'network-topology': {
    id: 'network-topology',
    title: 'Network Topology',
    icon: Globe,
    permissions: ['ui:window', 'events:subscribe', 'data:topology.read', 'data:metrics.read'],
    // Use the app wrapper you already have; it renders the new widget internally
    component: lazy(() => safe(import('./NetworkTopologyApp.jsx'))),
    loader: () => safe(import('./NetworkTopologyApp.jsx')),
    import: () => safe(import('./NetworkTopologyApp.jsx')),
    mount: () => import('./NetworkTopologyApp.jsx'),
    w: 1100, h: 700,
  },

  // === LEGACY COMPATIBILITY ===
  'security-events': {
    id: 'security-events',
    title: 'Security Events',
    icon: Shield,
    permissions: ['ui:window', 'events:subscribe', 'data:alerts.read'],
    // maps to alert-center implementation
    component: lazy(() => safe(import('./AlertCenterApp.jsx'))),
    loader: () => safe(import('./AlertCenterApp.jsx')),
    import: () => safe(import('./AlertCenterApp.jsx')),
    mount: () => import('./AlertCenterApp.jsx'),
    w: 1000, h: 680,
  },

  'system-health': {
    id: 'system-health',
    title: 'System Health',
    icon: Activity,
    permissions: ['ui:window', 'events:subscribe', 'data:metrics.read'],
    component: lazy(() => safe(import('./SystemHealthApp.jsx'))),
    loader: () => safe(import('./SystemHealthApp.jsx')),
    import: () => safe(import('./SystemHealthApp.jsx')),
    mount: () => import('./SystemHealthApp.jsx'),
    w: 1100, h: 700,
  },

  'plugin-diagnostics': {
    id: 'plugin-diagnostics',
    title: 'Plugin Diagnostics',
    icon: Plug,
    permissions: ['ui:window'],
    component: lazy(() => safe(import('../admin/PluginPanel'))),
    loader: () => safe(import('../admin/PluginPanel')),
    import: () => safe(import('../admin/PluginPanel')),
    mount: () => import('../admin/PluginPanel'),
    w: 900, h: 560,
  },
};
