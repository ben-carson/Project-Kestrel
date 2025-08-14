// ===== CONUS ENTERPRISE MOCK SERVER DATA (Refactored) =====
// Comprehensive US-based enterprise infrastructure with hybrid cloud architecture

// --- Static Configurations ---

const ENTERPRISE_CONFIG = {
  company: {
    name: "MidCorp Solutions",
    industry: "Financial Services & E-commerce",
    scale: "Medium-Large Enterprise",
    employees: 5000,
    locations: ["Corporate HQ - Dallas", "Operations - Denver", "Dev Center - Austin"]
  },
  architecture: {
    hybrid: true,
    multiTier: true,
    dmzSegmented: true,
    cloudBurst: true
  }
};

const DATACENTERS = [
  { id: 'dc-dallas-primary', name: 'Dallas Primary DC', region: 'US-South', location: 'Dallas, TX', provider: 'On-Premise', coordinates: { lat: 32.7767, lng: -96.7970 }, tier: 'Tier-3', capacity: { cpu: 8000, memory: 32000, storage: 800000 }, role: 'production-primary', complianceZone: 'PCI-DSS-SOC2', coolingEfficiency: 0.87, powerRedundancy: 'N+1' },
  { id: 'dc-denver-dr', name: 'Denver DR Site', region: 'US-West', location: 'Denver, CO', provider: 'Colocation', coordinates: { lat: 39.7392, lng: -104.9903 }, tier: 'Tier-2', capacity: { cpu: 4000, memory: 16000, storage: 400000 }, role: 'disaster-recovery', complianceZone: 'SOC2', coolingEfficiency: 0.82, powerRedundancy: 'N+1' },
  { id: 'dc-aws-east', name: 'AWS US-East-1', region: 'US-East', location: 'N. Virginia', provider: 'AWS', coordinates: { lat: 38.9072, lng: -77.0369 }, tier: 'Cloud-Tier-4', capacity: { cpu: 'elastic', memory: 'elastic', storage: 'elastic' }, role: 'cloud-burst-dev', complianceZone: 'SOC2-HIPAA', coolingEfficiency: 0.95, powerRedundancy: 'N+2' },
  { id: 'dc-austin-dev', name: 'Austin Dev Center', region: 'US-South', location: 'Austin, TX', provider: 'On-Premise', coordinates: { lat: 30.2672, lng: -97.7431 }, tier: 'Tier-2', capacity: { cpu: 2000, memory: 8000, storage: 200000 }, role: 'development-staging', complianceZone: 'Internal', coolingEfficiency: 0.79, powerRedundancy: 'N+0' }
];

const SERVER_TYPES = [
  { type: 'firewall', category: 'security', description: 'Next-gen firewall appliances', tier: 'dmz', criticalityLevel: 'critical', baseSpecs: { cpu: 8, memory: 32, storage: 500 } },
  { type: 'reverse-proxy', category: 'infrastructure', description: 'Reverse proxy and SSL termination', tier: 'dmz', criticalityLevel: 'critical', baseSpecs: { cpu: 16, memory: 64, storage: 200 } },
  { type: 'waf', category: 'security', description: 'Web Application Firewall', tier: 'dmz', criticalityLevel: 'high', baseSpecs: { cpu: 8, memory: 32, storage: 100 } },
  { type: 'web', category: 'application', description: 'Web servers (Apache/Nginx)', tier: 'web-tier', criticalityLevel: 'high', baseSpecs: { cpu: 8, memory: 32, storage: 100 } },
  { type: 'lb', category: 'infrastructure', description: 'Load balancers', tier: 'web-tier', criticalityLevel: 'critical', baseSpecs: { cpu: 4, memory: 16, storage: 50 } },
  { type: 'api', category: 'application', description: 'API gateway and microservices', tier: 'app-tier', criticalityLevel: 'high', baseSpecs: { cpu: 16, memory: 64, storage: 200 } },
  { type: 'app-server', category: 'application', description: 'Application servers (Java/.NET)', tier: 'app-tier', criticalityLevel: 'high', baseSpecs: { cpu: 12, memory: 48, storage: 150 } },
  { type: 'worker', category: 'compute', description: 'Background job processors', tier: 'app-tier', criticalityLevel: 'medium', baseSpecs: { cpu: 8, memory: 32, storage: 100 } },
  { type: 'queue', category: 'infrastructure', description: 'Message queue servers', tier: 'app-tier', criticalityLevel: 'high', baseSpecs: { cpu: 4, memory: 16, storage: 200 } },
  { type: 'cache', category: 'infrastructure', description: 'In-memory cache (Redis/Memcached)', tier: 'app-tier', criticalityLevel: 'high', baseSpecs: { cpu: 8, memory: 128, storage: 50 } },
  { type: 'db', category: 'database', description: 'Primary databases (PostgreSQL/SQL Server)', tier: 'data-tier', criticalityLevel: 'critical', baseSpecs: { cpu: 24, memory: 128, storage: 2000 } },
  { type: 'db-replica', category: 'database', description: 'Read-only database replicas', tier: 'data-tier', criticalityLevel: 'high', baseSpecs: { cpu: 16, memory: 96, storage: 2000 } },
  { type: 'nosql', category: 'database', description: 'NoSQL databases (MongoDB/Cassandra)', tier: 'data-tier', criticalityLevel: 'high', baseSpecs: { cpu: 12, memory: 64, storage: 1500 } },
  { type: 'data-warehouse', category: 'analytics', description: 'Data warehouse systems', tier: 'data-tier', criticalityLevel: 'medium', baseSpecs: { cpu: 32, memory: 256, storage: 8000 } },
  { type: 'monitor', category: 'management', description: 'Monitoring and observability', tier: 'management', criticalityLevel: 'high', baseSpecs: { cpu: 8, memory: 32, storage: 500 } },
  { type: 'backup', category: 'infrastructure', description: 'Backup and archival systems', tier: 'management', criticalityLevel: 'medium', baseSpecs: { cpu: 4, memory: 16, storage: 10000 } },
  { type: 'jump-host', category: 'security', description: 'Secure administrative access', tier: 'management', criticalityLevel: 'high', baseSpecs: { cpu: 4, memory: 8, storage: 50 } },
  { type: 'cloud-gateway', category: 'hybrid', description: 'Cloud connectivity gateway', tier: 'cloud-hybrid', criticalityLevel: 'high', baseSpecs: { cpu: 8, memory: 32, storage: 100 } },
  { type: 'container-host', category: 'compute', description: 'Docker/Kubernetes hosts', tier: 'cloud-hybrid', criticalityLevel: 'medium', baseSpecs: { cpu: 32, memory: 128, storage: 500 } }
];

const APPLICATIONS = [
  { name: 'customer-portal', displayName: 'Customer Portal', criticality: 'critical', businessFunction: 'customer-facing', dependencies: ['reverse-proxy', 'waf', 'web-01', 'web-02', 'customer-api', 'user-db', 'session-cache'], sla: { uptime: 99.9, responseTime: 200 }, businessImpact: { revenuePerMinute: 25000, customerCount: 150000, peakConcurrency: 5000 } },
  { name: 'payment-processor', displayName: 'Payment Processing System', criticality: 'critical', businessFunction: 'financial', dependencies: ['payment-api-01', 'payment-api-02', 'payment-db-primary', 'payment-db-replica', 'external-gateway', 'audit-queue'], sla: { uptime: 99.99, responseTime: 100 }, businessImpact: { revenuePerMinute: 75000, transactionVolume: 10000, complianceRequired: ['PCI-DSS', 'SOX'] } },
  { name: 'order-management', displayName: 'Order Management System', criticality: 'high', businessFunction: 'operations', dependencies: ['order-api-01', 'order-api-02', 'order-db', 'inventory-service', 'notification-queue'], sla: { uptime: 99.5, responseTime: 500 }, businessImpact: { orderVolume: 5000, fulfillmentImpact: 'high' } },
  { name: 'analytics-platform', displayName: 'Business Intelligence Platform', criticality: 'medium', businessFunction: 'analytics', dependencies: ['analytics-app-01', 'data-warehouse-01', 'etl-worker-01', 'etl-worker-02', 'reporting-cache'], sla: { uptime: 99.0, responseTime: 2000 }, businessImpact: { reportingCritical: false, batchProcessing: true } },
  { name: 'admin-portal', displayName: 'Administrative Portal', criticality: 'medium', businessFunction: 'internal', dependencies: ['admin-web-01', 'admin-api-01', 'user-db', 'audit-db', 'admin-cache'], sla: { uptime: 99.0, responseTime: 1000 }, businessImpact: { internalUsers: 500, businessHoursOnly: true } }
];

// --- Helper Functions ---

const getIncidentDescription = (incidentType) => {
  const descriptions = {
    'memory_exhaustion': 'Memory usage has exceeded safe thresholds, causing performance degradation.',
    'cpu_overload': 'CPU utilization consistently above 90%, affecting response times.',
    'cache_miss_storm': 'Cache hit rate dropped significantly, increasing backend load.',
    'slow_query': 'Database queries experiencing significant performance issues.',
    'network_slow': 'Network latency increased beyond acceptable limits.',
    'disk_full': 'Disk usage approaching critical levels.',
  };
  return descriptions[incidentType] || `${incidentType} incident detected`;
};

// --- Server Generation ---

let serverIdCounter = 1000;

const createServer = (config) => {
    const serverTypeInfo = SERVER_TYPES.find(st => st.type === config.type);
    const datacenterInfo = DATACENTERS.find(dc => dc.id === config.datacenter);

    // FIX: Incident is now created as part of the server config for reliability
    let currentIncident = null;
    if (config.incidentType) {
        currentIncident = {
            id: `inc-${Date.now()}-${serverIdCounter}`,
            type: config.incidentType,
            startTime: Date.now() - Math.random() * 3600000, // Within the last hour
            description: getIncidentDescription(config.incidentType),
            severity: config.status || 'warning'
        };
    }

    return {
        id: (serverIdCounter++).toString(),
        name: config.name,
        type: config.type,
        datacenter: config.datacenter,
        region: datacenterInfo?.region || 'US-South',
        tier: serverTypeInfo?.tier || 'app-tier',
        specs: config.specs || serverTypeInfo?.baseSpecs || { cpu: 8, memory: 32, storage: 200 },
        status: config.status || (Math.random() > 0.1 ? 'online' : (Math.random() > 0.5 ? 'warning' : 'critical')),
        metrics: {
            cpuUsage: Math.max(5, Math.min(95, 20 + Math.random() * 60 + (config.loadBias || 0))),
            memoryUsage: Math.max(10, Math.min(95, 35 + Math.random() * 45 + (config.memoryBias || 0))),
            diskUsage: Math.max(5, Math.min(90, 15 + Math.random() * 40)),
            networkLatency: Math.max(1, Math.round(5 + Math.random() * 80 + (config.networkBias || 0))),
            storageIO: Math.round(500 + Math.random() * 3000),
            connections: Math.round(10 + Math.random() * 500)
        },
        environment: config.environment || 'production',
        owner: config.owner || 'ops-team',
        costCenter: config.costCenter || 'IT-Infrastructure',
        maintenanceWindow: config.maintenanceWindow || 'Sunday 02:00-06:00 CST',
        complianceZone: datacenterInfo?.complianceZone || 'SOC2',
        tags: [
            `env:${config.environment || 'production'}`,
            `tier:${serverTypeInfo?.tier || 'app-tier'}`,
            `datacenter:${config.datacenter}`,
            ...(config.additionalTags || [])
        ],
        uptime: Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000, // Up to 180 days
        lastReboot: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        currentIncident: currentIncident
    };
};

const generateRealisticServers = () => {
    const servers = [];

    // --- Dallas Primary DC ---
    // DMZ
    servers.push(
        createServer({ name: 'fw-dmz-01', type: 'firewall', datacenter: 'dc-dallas-primary', status: 'online' }),
        createServer({ name: 'fw-dmz-02', type: 'firewall', datacenter: 'dc-dallas-primary', status: 'online' }),
        createServer({ name: 'rp-dmz-01', type: 'reverse-proxy', datacenter: 'dc-dallas-primary', loadBias: 15, additionalTags: ['ssl-termination'] }),
        createServer({ name: 'waf-dmz-01', type: 'waf', datacenter: 'dc-dallas-primary', status: 'warning', additionalTags: ['security-critical'] })
    );
    // Web Tier
    servers.push(
        createServer({ name: 'lb-web-01', type: 'lb', datacenter: 'dc-dallas-primary' }),
        createServer({ name: 'web-01', type: 'web', datacenter: 'dc-dallas-primary', loadBias: 25, additionalTags: ['customer-portal'] }),
        createServer({ name: 'web-02', type: 'web', datacenter: 'dc-dallas-primary', loadBias: 20, additionalTags: ['customer-portal'] }),
        createServer({ name: 'admin-web-01', type: 'web', datacenter: 'dc-dallas-primary', loadBias: 5, additionalTags: ['admin-only'] })
    );
    // App Tier
    servers.push(
        createServer({ name: 'customer-api-01', type: 'api', datacenter: 'dc-dallas-primary', loadBias: 30, memoryBias: 20 }),
        createServer({ name: 'payment-api-01', type: 'api', datacenter: 'dc-dallas-primary', loadBias: 15, additionalTags: ['pci-compliant'] }),
        createServer({ name: 'order-api-01', type: 'api', datacenter: 'dc-dallas-primary', loadBias: 22 }),
        createServer({ name: 'order-api-02', type: 'api', datacenter: 'dc-dallas-primary', status: 'warning', loadBias: 40, networkBias: 30, incidentType: 'cpu_overload' }),
        createServer({ name: 'app-dotnet-01', type: 'app-server', datacenter: 'dc-dallas-primary', status: 'critical', loadBias: 80, memoryBias: 60, incidentType: 'memory_exhaustion' }),
        createServer({ name: 'worker-report-01', type: 'worker', datacenter: 'dc-dallas-primary', loadBias: 45, memoryBias: 40, additionalTags: ['reporting'] }),
        createServer({ name: 'session-cache-01', type: 'cache', datacenter: 'dc-dallas-primary', status: 'warning', memoryBias: 70, incidentType: 'cache_miss_storm' })
    );
    // Data Tier
    servers.push(
        createServer({ name: 'user-db-primary', type: 'db', datacenter: 'dc-dallas-primary', loadBias: 25, memoryBias: 30, additionalTags: ['postgresql', 'user-data'] }),
        createServer({ name: 'payment-db-primary', type: 'db', datacenter: 'dc-dallas-primary', loadBias: 20, memoryBias: 35, additionalTags: ['pci-compliant'] }),
        createServer({ name: 'inventory-db-01', type: 'db', datacenter: 'dc-dallas-primary', status: 'warning', loadBias: 50, memoryBias: 55, incidentType: 'slow_query' }),
        createServer({ name: 'data-warehouse-01', type: 'data-warehouse', datacenter: 'dc-dallas-primary', loadBias: 45, memoryBias: 60, additionalTags: ['analytics'] })
    );
    // Management & Cloud
    servers.push(
        createServer({ name: 'monitor-prometheus-01', type: 'monitor', datacenter: 'dc-dallas-primary', loadBias: 20, memoryBias: 35 }),
        createServer({ name: 'jump-host-01', type: 'jump-host', datacenter: 'dc-dallas-primary' }),
        createServer({ name: 'k8s-master-01', type: 'container-host', datacenter: 'dc-dallas-primary', loadBias: 35, memoryBias: 40, additionalTags: ['kubernetes'] }),
        createServer({ name: 'k8s-worker-01', type: 'container-host', datacenter: 'dc-dallas-primary', loadBias: 45, memoryBias: 50, additionalTags: ['kubernetes'] })
    );

    // --- Denver DR Site ---
    servers.push(
        createServer({ name: 'fw-dr-01', type: 'firewall', datacenter: 'dc-denver-dr', environment: 'disaster-recovery' }),
        createServer({ name: 'web-dr-01', type: 'web', datacenter: 'dc-denver-dr', loadBias: 5, environment: 'disaster-recovery' }),
        createServer({ name: 'db-dr-replica-01', type: 'db-replica', datacenter: 'dc-denver-dr', loadBias: 8, environment: 'disaster-recovery' })
    );

    // --- AWS Cloud ---
    servers.push(
        createServer({ name: 'aws-ecs-cluster-01', type: 'container-host', datacenter: 'dc-aws-east', loadBias: 25, memoryBias: 30, environment: 'development' }),
        createServer({ name: 'aws-rds-staging-01', type: 'db', datacenter: 'dc-aws-east', loadBias: 20, environment: 'staging', additionalTags: ['rds', 'managed'] }),
        createServer({ name: 'burst-web-01', type: 'web', datacenter: 'dc-aws-east', loadBias: 30, status: 'maintenance', additionalTags: ['auto-scaling'] })
    );
    
    // --- Austin Dev Center ---
    servers.push(
        createServer({ name: 'dev-api-01', type: 'api', datacenter: 'dc-austin-dev', loadBias: 18, environment: 'development', owner: 'dev-team' }),
        createServer({ name: 'staging-db-01', type: 'db', datacenter: 'dc-austin-dev', loadBias: 22, environment: 'staging', owner: 'qa-team' }),
        createServer({ name: 'ci-cd-01', type: 'app-server', datacenter: 'dc-austin-dev', loadBias: 35, memoryBias: 40, environment: 'development', owner: 'devops-team' })
    );

    return servers;
};

// --- Dynamic Data Generation ---

const SERVER_OVERVIEW = generateRealisticServers();

// FIX: System health is now calculated dynamically for an accurate snapshot
const calculateSystemHealth = (servers) => {
    const statusCounts = servers.reduce((acc, server) => {
        acc[server.status] = (acc[server.status] || 0) + 1;
        return acc;
    }, {});
    const total = servers.length || 1;
    return {
        healthy: parseFloat(((statusCounts.online || 0) / total * 100).toFixed(1)),
        warning: parseFloat(((statusCounts.warning || 0) / total * 100).toFixed(1)),
        critical: parseFloat(((statusCounts.critical || 0) / total * 100).toFixed(1)),
        offline: parseFloat(((statusCounts.offline || 0) / total * 100).toFixed(1)),
        maintenance: parseFloat(((statusCounts.maintenance || 0) / total * 100).toFixed(1)),
        totalServers: total,
        timestamp: Date.now()
    };
};

const SYSTEM_HEALTH = calculateSystemHealth(SERVER_OVERVIEW);

// --- Exports ---

export const mockServerData = {
  serverOverview: SERVER_OVERVIEW,
  datacenters: DATACENTERS,
  serverTypes: SERVER_TYPES,
  applications: APPLICATIONS,
  systemHealth: SYSTEM_HEALTH,
  enterpriseConfig: ENTERPRISE_CONFIG
};

export const getServersByFilter = (filterFn) => {
    return mockServerData.serverOverview.filter(filterFn);
};

export const getProductionServers = () => getServersByFilter(s => s.environment === 'production');
export const getCriticalServers = () => getServersByFilter(s => ['critical', 'offline'].includes(s.status));
export const getServersByDatacenter = (datacenterId) => getServersByFilter(s => s.datacenter === datacenterId);

export default mockServerData;