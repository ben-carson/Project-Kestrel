export type KestrelPermission =
  | 'ui:window'
  | 'events:publish'
  | 'events:subscribe'
  | 'data:metrics.read'
  | 'data:recommendations.read' 
  | 'data:alerts.read'
  | 'data:topology.read'        // For network topology
  | 'data:incidents.read'       // For incident data
  | 'aida:agent.access'         // For AIDA intelligence features
  | 'maia:memory.read'          // For MAIA memory access
  | 'maia:memory.write';        // For MAIA memory storage

export interface AppManifest {
  id: string;
  title: string;
  icon?: React.ComponentType<any>;
  permissions: KestrelPermission[];
  mount: () => Promise<{ default: React.FC }>;
}

// OS Window type - ensure it supports our widget apps
export interface OSWindow {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  w: number; 
  h: number;
  z: number;
  workspace: number;
  minimized: boolean;
  Component?: React.FC;
}