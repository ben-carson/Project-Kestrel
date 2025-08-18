// src/components/widgets/NetworkTopology/lib/constants.js

/**
 * Canvas configuration constants
 */
export const CANVAS_CONFIG = {
  WIDTH: 1400,
  HEIGHT: 900,
  NODE_RADIUS: 32,
  MIN_ZOOM: 0.25,
  MAX_ZOOM: 4
};

/**
 * Status color mapping
 */
export const STATUS_COLORS = {
  online: '#10b981',
  healthy: '#10b981',
  warning: '#f59e0b',
  critical: '#ef4444',
  offline: '#6b7280',
  maintenance: '#8b5cf6'
};

/**
 * Node icon mapping
 */
export const NODE_ICONS = {
  firewall: 'Shield',
  'reverse-proxy': 'Globe',
  web: 'Server',
  lb: 'Router',
  api: 'Cpu',
  cache: 'Zap',
  db: 'Database',
  'db-replica': 'Database',
  'container-host': 'Layers'
};

/**
 * Network tier configuration
 */
export const NETWORK_TIERS = {
  dmz: { name: 'DMZ', color: '#dc2626', radius: 60 },
  lb: { name: 'Load Balancer', color: '#7c3aed', radius: 80 },
  web: { name: 'Web Tier', color: '#059669', radius: 100 },
  app: { name: 'App Tier', color: '#0891b2', radius: 120 },
  cache: { name: 'Cache Tier', color: '#db2777', radius: 90 },
  data: { name: 'Data Tier', color: '#d97706', radius: 140 },
  monitoring: { name: 'Monitoring', color: '#6b7280', radius: 70 }
};

/**
 * Connection type styling
 */
export const CONNECTION_STYLES = {
  security: { color: '#dc2626', pattern: [] },
  'load-balancing': { color: '#7c3aed', pattern: [] },
  http: { color: '#059669', pattern: [] },
  api: { color: '#0891b2', pattern: [] },
  cache: { color: '#db2777', pattern: [3, 3] },
  database: { color: '#d97706', pattern: [] },
  replication: { color: '#6b7280', pattern: [8, 4] }
};

/**
 * Mock server data for simulation
 */
export const MOCK_SERVER_DATA = {
  serverOverview: [
    {
      id: 'fw-dmz-01',
      name: 'Firewall DMZ 01',
      type: 'firewall',
      datacenter: 'dc-dallas-primary',
      tier: 'dmz',
      status: 'online',
      environment: 'production',
      metrics: { cpuUsage: 35, memoryUsage: 45, networkLatency: 5, storageIO: 1200 },
      specs: { cpu: 8, memory: 32, storage: 500 },
      networkConfig: {
        interfaces: [
          { name: 'eth0', ip: '10.1.1.10', mask: '255.255.255.0', status: 'up', speed: '1Gbps' },
          { name: 'eth1', ip: '192.168.1.10', mask: '255.255.255.0', status: 'up', speed: '1Gbps' }
        ],
        ports: [
          { port: 22, protocol: 'TCP', service: 'SSH', status: 'open' },
          { port: 443, protocol: 'TCP', service: 'HTTPS', status: 'open' },
          { port: 80, protocol: 'TCP', service: 'HTTP', status: 'open' }
        ],
        routes: [
          { destination: '0.0.0.0/0', gateway: '10.1.1.1', interface: 'eth0' },
          { destination: '192.168.1.0/24', gateway: '0.0.0.0', interface: 'eth1' }
        ]
      }
    },
    {
      id: 'rp-dmz-01',
      name: 'Reverse Proxy 01',
      type: 'reverse-proxy',
      datacenter: 'dc-dallas-primary',
      tier: 'dmz',
      status: 'online',
      environment: 'production',
      metrics: { cpuUsage: 42, memoryUsage: 55, networkLatency: 8, storageIO: 1800 },
      specs: { cpu: 16, memory: 64, storage: 200 },
      networkConfig: {
        interfaces: [
          { name: 'eth0', ip: '10.1.1.11', mask: '255.255.255.0', status: 'up', speed: '10Gbps' },
          { name: 'eth1', ip: '10.1.2.11', mask: '255.255.255.0', status: 'up', speed: '10Gbps' }
        ],
        ports: [
          { port: 80, protocol: 'TCP', service: 'HTTP', status: 'open' },
          { port: 443, protocol: 'TCP', service: 'HTTPS', status: 'open' },
          { port: 8080, protocol: 'TCP', service: 'Proxy', status: 'open' }
        ]
      }
    },
    {
      id: 'web-01',
      name: 'Web Server 01',
      type: 'web',
      datacenter: 'dc-dallas-primary',
      tier: 'web-tier',
      status: 'online',
      environment: 'production',
      metrics: { cpuUsage: 52, memoryUsage: 67, networkLatency: 18, storageIO: 2200 },
      specs: { cpu: 8, memory: 32, storage: 100 },
      networkConfig: {
        interfaces: [
          { name: 'eth0', ip: '10.1.2.20', mask: '255.255.255.0', status: 'up', speed: '1Gbps' }
        ],
        ports: [
          { port: 80, protocol: 'TCP', service: 'HTTP', status: 'open' },
          { port: 443, protocol: 'TCP', service: 'HTTPS', status: 'open' },
          { port: 22, protocol: 'TCP', service: 'SSH', status: 'open' }
        ]
      }
    },
    {
      id: 'web-02',
      name: 'Web Server 02',
      type: 'web',
      datacenter: 'dc-dallas-primary',
      tier: 'web-tier',
      status: 'warning',
      environment: 'production',
      metrics: { cpuUsage: 78, memoryUsage: 85, networkLatency: 35, storageIO: 3500 },
      specs: { cpu: 8, memory: 32, storage: 100 },
      networkConfig: {
        interfaces: [
          { name: 'eth0', ip: '10.1.2.21', mask: '255.255.255.0', status: 'up', speed: '1Gbps' }
        ],
        ports: [
          { port: 80, protocol: 'TCP', service: 'HTTP', status: 'open' },
          { port: 443, protocol: 'TCP', service: 'HTTPS', status: 'open' },
          { port: 22, protocol: 'TCP', service: 'SSH', status: 'open' }
        ]
      }
    },
    {
      id: 'user-db-primary',
      name: 'User DB Primary',
      type: 'db',
      datacenter: 'dc-dallas-primary',
      tier: 'data-tier',
      status: 'online',
      environment: 'production',
      metrics: { cpuUsage: 48, memoryUsage: 72, networkLatency: 8, storageIO: 2800 },
      specs: { cpu: 24, memory: 128, storage: 2000 },
      networkConfig: {
        interfaces: [
          { name: 'eth0', ip: '10.1.3.10', mask: '255.255.255.0', status: 'up', speed: '10Gbps' }
        ],
        ports: [
          { port: 5432, protocol: 'TCP', service: 'PostgreSQL', status: 'open' },
          { port: 22, protocol: 'TCP', service: 'SSH', status: 'open' }
        ]
      }
    },
    {
      id: 'api-server-01',
      name: 'API Server 01',
      type: 'api',
      datacenter: 'dc-dallas-primary',
      tier: 'app-tier',
      status: 'online',
      environment: 'production',
      metrics: { cpuUsage: 35, memoryUsage: 48, networkLatency: 15, storageIO: 1500 },
      specs: { cpu: 16, memory: 64, storage: 200 },
      networkConfig: {
        interfaces: [
          { name: 'eth0', ip: '10.1.2.30', mask: '255.255.255.0', status: 'up', speed: '1Gbps' }
        ],
        ports: [
          { port: 8080, protocol: 'TCP', service: 'HTTP API', status: 'open' },
          { port: 8443, protocol: 'TCP', service: 'HTTPS API', status: 'open' },
          { port: 22, protocol: 'TCP', service: 'SSH', status: 'open' }
        ]
      }
    },
    {
      id: 'cache-redis-01',
      name: 'Redis Cache 01',
      type: 'cache',
      datacenter: 'dc-dallas-primary',
      tier: 'cache',
      status: 'online',
      environment: 'production',
      metrics: { cpuUsage: 25, memoryUsage: 65, networkLatency: 3, storageIO: 800 },
      specs: { cpu: 4, memory: 32, storage: 100 },
      networkConfig: {
        interfaces: [
          { name: 'eth0', ip: '10.1.2.40', mask: '255.255.255.0', status: 'up', speed: '1Gbps' }
        ],
        ports: [
          { port: 6379, protocol: 'TCP', service: 'Redis', status: 'open' },
          { port: 22, protocol: 'TCP', service: 'SSH', status: 'open' }
        ]
      }
    },
    {
      id: 'lb-web-01',
      name: 'Load Balancer 01',
      type: 'lb',
      datacenter: 'dc-dallas-primary',
      tier: 'lb',
      status: 'online',
      environment: 'production',
      metrics: { cpuUsage: 28, memoryUsage: 38, networkLatency: 12, storageIO: 600 },
      specs: { cpu: 8, memory: 16, storage: 50 },
      networkConfig: {
        interfaces: [
          { name: 'eth0', ip: '10.1.1.20', mask: '255.255.255.0', status: 'up', speed: '10Gbps' },
          { name: 'eth1', ip: '10.1.2.1', mask: '255.255.255.0', status: 'up', speed: '10Gbps' }
        ],
        ports: [
          { port: 80, protocol: 'TCP', service: 'HTTP', status: 'open' },
          { port: 443, protocol: 'TCP', service: 'HTTPS', status: 'open' },
          { port: 8080, protocol: 'TCP', service: 'Admin', status: 'open' }
        ]
      }
    }
  ],
  datacenters: [
    { id: 'dc-dallas-primary', name: 'Dallas Primary DC', region: 'US-South', x: 350, y: 250 },
    { id: 'dc-denver-dr', name: 'Denver DR Site', region: 'US-West', x: 150, y: 180 },
    { id: 'dc-aws-east', name: 'AWS US-East-1', region: 'US-East', x: 550, y: 150 },
    { id: 'dc-austin-dev', name: 'Austin Dev Center', region: 'US-South', x: 320, y: 420 }
  ]
};

/**
 * Animation and physics constants
 */
export const PHYSICS_CONFIG = {
  REPULSION_FORCE: 3000,
  ATTRACTION_FORCE: 0.05,
  DAMPING: 0.88,
  BOUNDARY_MARGIN: 60,
  UPDATE_INTERVAL: 16 // ~60fps
};

/**
 * Simulation timing constants
 */
export const SIMULATION_CONFIG = {
  EVOLUTION_INTERVAL: 3000, // 3 seconds
  BUSINESS_HOURS: { start: 9, end: 17 },
  HEALING_COOLDOWN: 30000, // 30 seconds
  INCIDENT_DURATION: 300000 // 5 minutes
};

/**
 * Default application health data
 */
export const DEFAULT_APPLICATION_HEALTH = new Map([
  ['customer-portal', {
    health: 85,
    status: 'healthy',
    nodeDetails: { total: 3, healthy: 3, warning: 0, critical: 0, offline: 0 }
  }],
  ['payment-processor', {
    health: 92,
    status: 'healthy',
    nodeDetails: { total: 2, healthy: 2, warning: 0, critical: 0, offline: 0 }
  }],
  ['order-management', {
    health: 78,
    status: 'healthy',
    nodeDetails: { total: 2, healthy: 1, warning: 1, critical: 0, offline: 0 }
  }],
  ['user-authentication', {
    health: 96,
    status: 'healthy',
    nodeDetails: { total: 2, healthy: 2, warning: 0, critical: 0, offline: 0 }
  }]
]);

/**
 * Network tier hierarchy for dependency mapping
 */
export const TIER_HIERARCHY = [
  'dmz',
  'lb', 
  'web-tier',
  'app-tier',
  'cache',
  'data-tier',
  'monitoring'
];

/**
 * Default evolution system options
 */
export const DEFAULT_EVOLUTION_OPTIONS = {
  autoHealing: true,
  evolutionInterval: 3000,
  businessHours: { start: 9, end: 17 },
  enabled: true,
  incidentProbability: 0.001,
  healingProbability: 0.15
};