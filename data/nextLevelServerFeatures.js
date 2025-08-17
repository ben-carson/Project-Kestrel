// ===== NEXT-LEVEL ENTERPRISE SERVER EVOLUTION FEATURES =====

// ===== 1. APPLICATION TOPOLOGY AWARENESS =====
export const getServerPersonality = (type) => {
  return personalityProfiles[type] || personalityProfiles['stable'];
};

class ApplicationTopologyManager {
  constructor(applications = [], servers = []) { // ✅ Added default empty arrays
    this.applications = new Map();
    this.dependencyGraph = new Map();
    this.applicationHealth = new Map();
    this.serviceDiscoveryRules = this.initializeServiceDiscovery();
    
    this.initializeApplications(applications, servers);
  }

  initializeServiceDiscovery() {
    // Dynamic service discovery rules - can be updated at runtime
    return {
      'user-db': {
        matcher: (server) => server.type === 'db' && 
          (server.name.includes('user') || server.tags?.includes('user-service')),
        fallback: (servers) => servers.filter(s => s.type === 'db').slice(0, 1)
      },
      'order-db': {
        matcher: (server) => server.type === 'db' && 
          (server.name.includes('order') || server.tags?.includes('order-service')),
        fallback: (servers) => servers.filter(s => s.type === 'db').slice(1, 2)
      },
      'payment-db': {
        matcher: (server) => server.type === 'db' && 
          (server.name.includes('payment') || server.tags?.includes('payment-service')),
        fallback: (servers) => servers.filter(s => s.type === 'db').slice(2, 3)
      },
      'inventory-db': {
        matcher: (server) => server.type === 'db' && 
          (server.name.includes('inventory') || server.tags?.includes('inventory-service')),
        fallback: (servers) => servers.filter(s => s.type === 'db').slice(3, 4)
      },
      'cache': {
        matcher: (server) => server.type === 'cache',
        fallback: (servers) => servers.filter(s => s.type === 'cache')
      },
      'api-gateway': {
        matcher: (server) => server.type === 'api' && 
          (server.name.includes('gateway') || server.name.includes('api-01')),
        fallback: (servers) => servers.filter(s => s.type === 'api').slice(0, 1)
      },
      'user-service': {
        matcher: (server) => server.type === 'api' && 
          (server.name.includes('user') || server.tags?.includes('user-service')),
        fallback: (servers) => servers.filter(s => s.type === 'api').slice(1, 3)
      },
      'order-service': {
        matcher: (server) => server.type === 'api' && 
          (server.name.includes('order') || server.tags?.includes('order-service')),
        fallback: (servers) => servers.filter(s => s.type === 'api').slice(3, 5)
      },
      'payment-service': {
        matcher: (server) => server.type === 'api' && 
          (server.name.includes('payment') || server.tags?.includes('payment-service')),
        fallback: (servers) => servers.filter(s => s.type === 'api').slice(5, 7)
      },
      'inventory-service': {
        matcher: (server) => server.type === 'api' && 
          (server.name.includes('inventory') || server.tags?.includes('inventory-service')),
        fallback: (servers) => servers.filter(s => s.type === 'api').slice(7, 9)
      },
      'queue': {
        matcher: (server) => server.type === 'queue',
        fallback: (servers) => servers.filter(s => s.type === 'queue')
      },
      'data-warehouse': {
        matcher: (server) => server.type === 'db' && 
          (server.name.includes('warehouse') || server.name.includes('analytics')),
        fallback: (servers) => servers.filter(s => s.type === 'db' && s.name.includes('db-')).slice(-1)
      },
      'email-service': {
        matcher: (server) => server.type === 'worker' && 
          (server.name.includes('email') || server.name.includes('notification')),
        fallback: (servers) => servers.filter(s => s.type === 'worker').slice(0, 2)
      },
      'external-gateway': {
        matcher: (server) => server.type === 'api' && 
          (server.name.includes('external') || server.name.includes('gateway')),
        fallback: (servers) => servers.filter(s => s.type === 'lb').slice(0, 1)
      },
      'cdn': {
        matcher: (server) => server.type === 'web' && 
          (server.name.includes('cdn') || server.region !== server.datacenter),
        fallback: (servers) => servers.filter(s => s.type === 'web').slice(0, 2)
      }
    };
  }

  initializeApplications(applications = [], servers = []) { // ✅ Added default parameters
    // ✅ Added safety check
    if (!Array.isArray(applications)) {
      console.warn('ApplicationTopologyManager: applications is not an array, using defaults');
      applications = this.getDefaultApplications();
    }
    
    if (!Array.isArray(servers)) {
      console.warn('ApplicationTopologyManager: servers is not an array, using empty array');
      servers = [];
    }

    applications.forEach(app => {
      this.applications.set(app.name, {
        ...app,
        nodes: [], // Will be resolved dynamically
        healthThresholds: this.getHealthThresholds(app.criticality),
        lastHealthCheck: Date.now(),
        healthHistory: []
      });
      
      // Build dependency graph
      this.dependencyGraph.set(app.name, {
        dependencies: app.dependencies || [],
        dependents: applications.filter(a => 
          (a.dependencies || []).includes(app.name)
        ).map(a => a.name)
      });
    });
  }

  // ✅ Added method to provide default applications if none provided
  getDefaultApplications() {
    return [
      {
        name: 'user-service',
        criticality: 'high',
        dependencies: ['user-db', 'cache', 'api-gateway']
      },
      {
        name: 'order-service', 
        criticality: 'critical',
        dependencies: ['order-db', 'payment-service', 'inventory-service', 'queue']
      },
      {
        name: 'payment-service',
        criticality: 'critical', 
        dependencies: ['payment-db', 'external-gateway', 'queue']
      },
      {
        name: 'inventory-service',
        criticality: 'medium',
        dependencies: ['inventory-db', 'cache']
      },
      {
        name: 'notification-service',
        criticality: 'low',
        dependencies: ['email-service', 'queue']
      }
    ];
  }

  // ✅ Added safe initialization method
  initialize() {
    if (this.applications.size === 0) {
      console.log('ApplicationTopologyManager: Initializing with default applications');
      this.initializeApplications(this.getDefaultApplications(), []);
    }
    this.isInitialized = true;
  }

  // NEW: Live dependency resolution
  resolveApplicationNodes(app, currentServers) {
    const resolvedNodes = [];
    
    (app.dependencies || []).forEach(serviceName => {
      const rule = this.serviceDiscoveryRules[serviceName];
      if (!rule) {
        console.warn(`No service discovery rule for: ${serviceName}`);
        return;
      }
      
      // Try primary matcher first
      let matchingNodes = currentServers.filter(rule.matcher);
      
      // Fall back to fallback strategy if no matches
      if (matchingNodes.length === 0 && rule.fallback) {
        matchingNodes = rule.fallback(currentServers);
        if (matchingNodes.length > 0) {
          console.info(`Using fallback resolution for ${serviceName}: ${matchingNodes.map(n => n.name).join(', ')}`);
        }
      }
      
      resolvedNodes.push(...matchingNodes);
    });
    
    // Update application's node list
    const appData = this.applications.get(app.name);
    if (appData) {
      appData.nodes = resolvedNodes;
      appData.lastNodeResolution = Date.now();
    }
    
    return resolvedNodes;
  }

  // NEW: Update service discovery rules at runtime
  updateServiceDiscoveryRule(serviceName, matcher, fallback) {
    this.serviceDiscoveryRules[serviceName] = {
      matcher,
      fallback: fallback || this.serviceDiscoveryRules[serviceName]?.fallback
    };
  }

  // NEW: Add new service discovery rule
  addServiceDiscoveryRule(serviceName, matcher, fallback) {
    this.serviceDiscoveryRules[serviceName] = { matcher, fallback };
  }

  findApplicationNodes(app, servers) {
    // Map application services to actual server nodes
    const serviceToNodeMap = {
      'user-db': servers.filter(s => s.type === 'db' && s.name.includes('user')),
      'order-db': servers.filter(s => s.type === 'db' && s.name.includes('order')),
      'payment-db': servers.filter(s => s.type === 'db' && s.name.includes('payment')),
      'inventory-db': servers.filter(s => s.type === 'db' && s.name.includes('inventory')),
      'cache': servers.filter(s => s.type === 'cache'),
      'api-gateway': servers.filter(s => s.type === 'api' && s.name.includes('gateway')),
      'user-service': servers.filter(s => s.type === 'api' && s.name.includes('user')),
      'order-service': servers.filter(s => s.type === 'api' && s.name.includes('order')),
      'payment-service': servers.filter(s => s.type === 'api' && s.name.includes('payment')),
      'inventory-service': servers.filter(s => s.type === 'api' && s.name.includes('inventory')),
      'queue': servers.filter(s => s.type === 'queue'),
      'data-warehouse': servers.filter(s => s.type === 'db' && s.name.includes('warehouse')),
      'email-service': servers.filter(s => s.type === 'worker' && s.name.includes('email')),
      'external-gateway': servers.filter(s => s.type === 'api' && s.name.includes('external')),
      'cdn': servers.filter(s => s.type === 'web' && s.name.includes('cdn'))
    };

    // Find nodes for this application's dependencies
    const nodes = [];
    (app.dependencies || []).forEach(dep => {
      const matchingNodes = serviceToNodeMap[dep] || [];
      nodes.push(...matchingNodes);
    });

    return nodes;
  }

  getHealthThresholds(criticality) {
    const thresholds = {
      'critical': { warning: 90, critical: 70, failure: 50 },
      'high': { warning: 80, critical: 60, failure: 40 },
      'medium': { warning: 70, critical: 50, failure: 30 },
      'low': { warning: 60, critical: 40, failure: 20 }
    };
    return thresholds[criticality] || thresholds.medium;
  }

  calculateApplicationHealth(appName, currentServers) {
    const app = this.applications.get(appName);
    if (!app) return null;

    // NEW: Resolve nodes dynamically each time
    const currentNodes = this.resolveApplicationNodes(app, currentServers);

    if (currentNodes.length === 0) {
      return { 
        health: 0, 
        status: 'unknown', 
        reason: 'No nodes found for dependencies',
        nodeDetails: { total: 0, healthy: 0, warning: 0, critical: 0, offline: 0 },
        dependencies: app.dependencies || [],
        lastNodeResolution: app.lastNodeResolution
      };
    }

    // Calculate node health scores
    const nodeHealthScores = currentNodes.map(node => {
      let score = 100;
      
      // Status penalties
      if (node.status === 'offline') score = 0;
      else if (node.status === 'critical') score = 20;
      else if (node.status === 'warning') score = 60;
      else if (node.status === 'maintenance') score = 80;
      
      // Metric penalties
      if (node.metrics) {
        score -= Math.max(0, node.metrics.cpuUsage - 80) * 0.5;
        score -= Math.max(0, node.metrics.memoryUsage - 80) * 0.5;
        score -= Math.max(0, node.metrics.networkLatency - 200) * 0.1;
      }
      
      return Math.max(0, Math.min(100, score));
    });

    // Application health is weighted average with dependency criticality
    const avgHealth = nodeHealthScores.reduce((sum, score) => sum + score, 0) / nodeHealthScores.length;
    
    // Check dependency health
    const dependencyHealthPenalty = this.calculateDependencyHealthPenalty(appName, currentServers);
    const finalHealth = Math.max(0, avgHealth - dependencyHealthPenalty);
    
    // Determine status
    const thresholds = app.healthThresholds;
    let status = 'healthy';
    let reason = 'All systems operational';
    
    if (finalHealth < thresholds.failure) {
      status = 'failure';
      reason = 'Critical system failure';
    } else if (finalHealth < thresholds.critical) {
      status = 'critical';
      reason = 'Multiple system issues detected';
    } else if (finalHealth < thresholds.warning) {
      status = 'warning';
      reason = 'Performance degradation detected';
    }

    // Store health history
    const healthRecord = {
      timestamp: Date.now(),
      health: finalHealth,
      status,
      nodeCount: currentNodes.length,
      avgNodeHealth: avgHealth,
      dependencyPenalty: dependencyHealthPenalty
    };
    
    app.healthHistory.push(healthRecord);
    if (app.healthHistory.length > 100) {
      app.healthHistory.shift(); // Keep last 100 records
    }

    return {
      health: finalHealth,
      status,
      reason,
      nodeDetails: {
        total: currentNodes.length,
        healthy: currentNodes.filter(n => ['online', 'maintenance'].includes(n.status)).length,
        warning: currentNodes.filter(n => n.status === 'warning').length,
        critical: currentNodes.filter(n => n.status === 'critical').length,
        offline: currentNodes.filter(n => n.status === 'offline').length
      },
      dependencies: app.dependencies || [],
      resolvedNodes: currentNodes.map(n => ({ id: n.id, name: n.name, status: n.status })),
      lastNodeResolution: app.lastNodeResolution,
      history: app.healthHistory.slice(-10) // Last 10 records
    };
  }

  calculateDependencyHealthPenalty(appName, currentServers) {
    const dependencies = this.dependencyGraph.get(appName)?.dependencies || [];
    let totalPenalty = 0;

    dependencies.forEach(depName => {
      const depHealth = this.calculateApplicationHealth(depName, currentServers);
      if (depHealth && depHealth.health < 80) {
        // Dependency issues cause cascading penalties
        totalPenalty += (80 - depHealth.health) * 0.3;
      }
    });

    return Math.min(50, totalPenalty); // Cap penalty at 50%
  }

  getAllApplicationHealth(currentServers) {
    const healthMap = new Map();
    
    this.applications.forEach((app, name) => {
      healthMap.set(name, this.calculateApplicationHealth(name, currentServers));
    });
    
    return healthMap;
  }
}

// ===== 2. BEHAVIORAL FINGERPRINTS =====

const SERVER_PERSONALITIES = {
  'stable': {
    name: 'Stable Server',
    description: 'Reliable, predictable performance',
    traits: {
      volatility: 0.1,
      degradationRate: 1.0,
      recoveryRate: 1.0,
      incidentProneness: 0.5,
      loadSensitivity: 1.0
    }
  },
  'noisy-neighbor': {
    name: 'Noisy Neighbor',
    description: 'High resource usage affects nearby servers',
    traits: {
      volatility: 0.3,
      degradationRate: 1.5,
      recoveryRate: 0.8,
      incidentProneness: 1.2,
      loadSensitivity: 1.4,
      heatGeneration: 2.0
    }
  },
  'leaky-buffer': {
    name: 'Leaky Buffer',
    description: 'Gradual memory leaks over time',
    traits: {
      volatility: 0.15,
      degradationRate: 1.2,
      recoveryRate: 0.9,
      incidentProneness: 0.8,
      loadSensitivity: 1.1,
      memoryLeakRate: 3.0
    }
  },
  'spike-and-crash': {
    name: 'Spike and Crash',
    description: 'Sudden performance spikes followed by crashes',
    traits: {
      volatility: 0.8,
      degradationRate: 0.8,
      recoveryRate: 1.5,
      incidentProneness: 2.0,
      loadSensitivity: 2.0,
      spikeFrequency: 5.0
    }
  },
  'slow-burn': {
    name: 'Slow Burn',
    description: 'Gradually degrades but rarely crashes',
    traits: {
      volatility: 0.05,
      degradationRate: 2.0,
      recoveryRate: 0.3,
      incidentProneness: 0.3,
      loadSensitivity: 0.8,
      diskCreepRate: 2.5
    }
  },
  'resource-hog': {
    name: 'Resource Hog',
    description: 'Consumes excessive CPU and memory',
    traits: {
      volatility: 0.2,
      degradationRate: 1.3,
      recoveryRate: 0.7,
      incidentProneness: 1.1,
      loadSensitivity: 1.6,
      baseResourceUsage: 1.5
    }
  }
};

function assignServerPersonalities(servers = []) { // ✅ Added default parameter
  if (!Array.isArray(servers)) {
    console.warn('assignServerPersonalities: servers is not an array, returning empty array');
    return [];
  }

  const personalityKeys = Object.keys(SERVER_PERSONALITIES);
  
  return servers.map(server => {
    // Assign personality based on server type and random factors
    let personalityKey = 'stable'; // Default
    
    // Some server types are more prone to certain personalities
    const typePersonalityMap = {
      'db': ['slow-burn', 'leaky-buffer', 'stable'],
      'cache': ['spike-and-crash', 'noisy-neighbor', 'stable'],
      'api': ['noisy-neighbor', 'resource-hog', 'leaky-buffer'],
      'worker': ['resource-hog', 'slow-burn', 'stable'],
      'web': ['spike-and-crash', 'stable', 'noisy-neighbor']
    };
    
    const possiblePersonalities = typePersonalityMap[server.type] || ['stable'];
    
    // 70% chance of stable, 30% chance of problematic personality
    if (Math.random() < 0.3) {
      personalityKey = possiblePersonalities[Math.floor(Math.random() * possiblePersonalities.length)];
    }
    
    return {
      ...server,
      personality: {
        type: personalityKey,
        ...SERVER_PERSONALITIES[personalityKey],
        assignedAt: Date.now()
      }
    };
  });
}

// ===== 3. SYNTHETIC INCIDENT INJECTION API =====

class IncidentInjectionAPI {
  constructor(evolutionEngine) {
    this.engine = evolutionEngine;
    this.injectedIncidents = new Map();
  }

  injectIncident(serverId, scenarioName, options = {}) {
    if (!this.engine || !this.engine.servers) {
      throw new Error('Evolution engine not properly initialized');
    }

    const server = this.engine.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    const predefinedScenarios = {
      'memory_exhaustion': {
        name: 'memory_exhaustion',
        phases: [
          { status: 'warning', duration: 10000, description: 'Memory usage climbing rapidly' },
          { status: 'critical', duration: 5000, description: 'Memory exhaustion imminent' },
          { status: 'offline', duration: 30000, description: 'Out of memory, process killed' },
          { status: 'online', duration: 0, description: 'Process restarted with fresh memory' }
        ]
      },
      'disk_full': {
        name: 'disk_full',
        phases: [
          { status: 'warning', duration: 15000, description: 'Disk space running low' },
          { status: 'critical', duration: 10000, description: 'Disk nearly full, writes failing' },
          { status: 'maintenance', duration: 45000, description: 'Cleaning up disk space' },
          { status: 'online', duration: 0, description: 'Disk space restored' }
        ]
      },
      'network_storm': {
        name: 'network_storm',
        phases: [
          { status: 'warning', duration: 5000, description: 'Network traffic spike detected' },
          { status: 'critical', duration: 20000, description: 'Network interface overwhelmed' },
          { status: 'warning', duration: 15000, description: 'Traffic shaping activated' },
          { status: 'online', duration: 0, description: 'Network traffic normalized' }
        ]
      },
      'cpu_thermal': {
        name: 'cpu_thermal',
        phases: [
          { status: 'warning', duration: 8000, description: 'CPU temperature rising' },
          { status: 'critical', duration: 12000, description: 'Thermal throttling activated' },
          { status: 'maintenance', duration: 60000, description: 'Cooling system intervention' },
          { status: 'online', duration: 0, description: 'Normal operating temperature restored' }
        ]
      },
      'dependency_cascade': {
        name: 'dependency_cascade',
        phases: [
          { status: 'warning', duration: 3000, description: 'Upstream dependency issues detected' },
          { status: 'critical', duration: 25000, description: 'Cascade failure in progress' },
          { status: 'warning', duration: 10000, description: 'Partial service restoration' },
          { status: 'online', duration: 0, description: 'Full service restored' }
        ]
      }
    };

    const scenario = predefinedScenarios[scenarioName];
    if (!scenario) {
      throw new Error(`Unknown scenario: ${scenarioName}. Available: ${Object.keys(predefinedScenarios).join(', ')}`);
    }

    // Apply options to modify scenario
    const modifiedScenario = this.applyIncidentOptions(scenario, options);
    
    const incidentId = `inj-${Date.now()}-${serverId}`;
    
    // Track injection
    this.injectedIncidents.set(incidentId, {
      serverId,
      scenario: scenarioName,
      options,
      injectedAt: Date.now(),
      status: 'active'
    });

    // Start the incident if engine supports it
    if (this.engine.startIncidentResolutionArc) {
      this.engine.startIncidentResolutionArc(serverId, modifiedScenario, incidentId);
    }
    
    // Update server immediately
    const updatedServer = this.engine.servers.get(serverId);
    updatedServer.status = modifiedScenario.phases[0].status;
    updatedServer.currentIncident = {
      id: incidentId,
      scenario: scenarioName,
      phase: 0,
      startTime: Date.now(),
      description: modifiedScenario.phases[0].description,
      injected: true
    };

    return {
      incidentId,
      message: `Injected ${scenarioName} incident into server ${server.name}`,
      estimatedDuration: modifiedScenario.phases.reduce((sum, phase) => sum + phase.duration, 0)
    };
  }

  applyIncidentOptions(scenario, options) {
    const modified = JSON.parse(JSON.stringify(scenario)); // Deep clone
    
    if (options.duration) {
      // Scale all phase durations
      const scale = options.duration / modified.phases.reduce((sum, p) => sum + p.duration, 0);
      modified.phases.forEach(phase => {
        phase.duration *= scale;
      });
    }
    
    if (options.severity) {
      // Modify severity by changing status progression
      if (options.severity === 'high') {
        modified.phases = modified.phases.map(phase => ({
          ...phase,
          duration: phase.duration * 1.5 // Longer incidents
        }));
      } else if (options.severity === 'low') {
        modified.phases = modified.phases.filter(phase => phase.status !== 'offline');
      }
    }
    
    return modified;
  }

  getInjectedIncidents() {
    return Array.from(this.injectedIncidents.entries()).map(([id, incident]) => ({
      id,
      ...incident
    }));
  }

  cancelIncident(incidentId) {
    const incident = this.injectedIncidents.get(incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    if (this.engine && this.engine.servers) {
      const server = this.engine.servers.get(incident.serverId);
      if (server && server.currentIncident && server.currentIncident.id === incidentId) {
        server.status = 'online';
        if (this.engine.improveMetrics) {
          server.metrics = this.engine.improveMetrics(server.metrics, 0.8);
        }
        delete server.currentIncident;
      }
    }

    incident.status = 'cancelled';
    return { message: `Incident ${incidentId} cancelled` };
  }
}

// ===== 4. HISTORICAL REPLAY SYSTEM =====

class HistoricalReplayManager {
  constructor(maxHistorySize = 1000) {
    this.maxHistorySize = maxHistorySize;
    this.evolutionHistory = [];
    this.metricSnapshots = [];
    this.eventHistory = [];
    this.applicationHealthHistory = [];
  }

  captureSnapshot(servers, globalTrends, systemHealth, applicationHealth) {
    const timestamp = Date.now();
    
    // ✅ Added safety checks
    if (!Array.isArray(servers)) {
      console.warn('HistoricalReplayManager: servers is not an array');
      servers = [];
    }
    
    // Capture server state changes (delta compression)
    const serverDelta = this.calculateServerDelta(servers);
    if (serverDelta.changes.length > 0) {
      this.evolutionHistory.push({
        timestamp,
        type: 'server_evolution',
        delta: serverDelta
      });
    }

    // Capture key metrics for trending
    const metricsSnapshot = {
      timestamp,
      systemHealth: systemHealth || { healthy: 100, warning: 0, critical: 0, offline: 0 },
      globalTrends: {
        businessLoad: globalTrends?.businessLoad?.value || 0,
        networkCongestion: globalTrends?.networkCongestion?.value || 0,
        regionalLoads: globalTrends?.regionalLoads || {}
      },
      serverMetrics: this.aggregateServerMetrics(servers)
    };
    this.metricSnapshots.push(metricsSnapshot);

    // Capture application health
    if (applicationHealth) {
      const appHealthSnapshot = {
        timestamp,
        applications: Array.from(applicationHealth.entries()).map(([name, health]) => ({
          name,
          health: health?.health || 0,
          status: health?.status || 'unknown'
        }))
      };
      this.applicationHealthHistory.push(appHealthSnapshot);
    }

    // Trim history to max size
    this.trimHistory();
  }

  calculateServerDelta(currentServers) {
    const changes = [];
    
    if (this.lastServerState) {
      currentServers.forEach(server => {
        const lastState = this.lastServerState.get(server.id);
        if (!lastState) {
          changes.push({
            serverId: server.id,
            type: 'new_server',
            data: server
          });
        } else {
          // Check for significant changes
          if (lastState.status !== server.status) {
            changes.push({
              serverId: server.id,
              type: 'status_change',
              data: { from: lastState.status, to: server.status }
            });
          }
          
          if (this.hasSignificantMetricChange(lastState.metrics, server.metrics)) {
            changes.push({
              serverId: server.id,
              type: 'metrics_change',
              data: {
                from: lastState.metrics,
                to: server.metrics
              }
            });
          }
        }
      });
    }

    // Update last state
    this.lastServerState = new Map(currentServers.map(s => [s.id, { ...s }]));
    
    return { changes, serverCount: currentServers.length };
  }

  hasSignificantMetricChange(oldMetrics, newMetrics) {
    if (!oldMetrics || !newMetrics) return true;
    
    const threshold = 10; // 10% change threshold
    return (
      Math.abs((oldMetrics.cpuUsage || 0) - (newMetrics.cpuUsage || 0)) > threshold ||
      Math.abs((oldMetrics.memoryUsage || 0) - (newMetrics.memoryUsage || 0)) > threshold ||
      Math.abs((oldMetrics.networkLatency || 0) - (newMetrics.networkLatency || 0)) > threshold * 5
    );
  }

  aggregateServerMetrics(servers) {
    const metrics = {
      avgCpuUsage: 0,
      avgMemoryUsage: 0,
      avgNetworkLatency: 0,
      totalServers: servers.length,
      byType: {},
      byDatacenter: {}
    };

    if (servers.length === 0) {
      return metrics;
    }

    servers.forEach(server => {
      if (server.metrics) {
        metrics.avgCpuUsage += server.metrics.cpuUsage || 0;
        metrics.avgMemoryUsage += server.metrics.memoryUsage || 0;
        metrics.avgNetworkLatency += server.metrics.networkLatency || 0;
        
        // By type aggregation
        if (!metrics.byType[server.type]) {
          metrics.byType[server.type] = { count: 0, avgCpu: 0, avgMemory: 0 };
        }
        metrics.byType[server.type].count++;
        metrics.byType[server.type].avgCpu += server.metrics.cpuUsage || 0;
        metrics.byType[server.type].avgMemory += server.metrics.memoryUsage || 0;
        
        // By datacenter aggregation
        const datacenter = server.datacenter || 'unknown';
        if (!metrics.byDatacenter[datacenter]) {
          metrics.byDatacenter[datacenter] = { count: 0, avgCpu: 0, avgMemory: 0 };
        }
        metrics.byDatacenter[datacenter].count++;
        metrics.byDatacenter[datacenter].avgCpu += server.metrics.cpuUsage || 0;
        metrics.byDatacenter[datacenter].avgMemory += server.metrics.memoryUsage || 0;
      }
    });

    // Calculate averages
    if (servers.length > 0) {
      metrics.avgCpuUsage /= servers.length;
      metrics.avgMemoryUsage /= servers.length;
      metrics.avgNetworkLatency /= servers.length;
      
      Object.values(metrics.byType).forEach(typeMetrics => {
        if (typeMetrics.count > 0) {
          typeMetrics.avgCpu /= typeMetrics.count;
          typeMetrics.avgMemory /= typeMetrics.count;
        }
      });
      
      Object.values(metrics.byDatacenter).forEach(dcMetrics => {
        if (dcMetrics.count > 0) {
          dcMetrics.avgCpu /= dcMetrics.count;
          dcMetrics.avgMemory /= dcMetrics.count;
        }
      });
    }

    return metrics;
  }

  trimHistory() {
    if (this.evolutionHistory.length > this.maxHistorySize) {
      this.evolutionHistory = this.evolutionHistory.slice(-this.maxHistorySize);
    }
    if (this.metricSnapshots.length > this.maxHistorySize) {
      this.metricSnapshots = this.metricSnapshots.slice(-this.maxHistorySize);
    }
    if (this.applicationHealthHistory.length > this.maxHistorySize) {
      this.applicationHealthHistory = this.applicationHealthHistory.slice(-this.maxHistorySize);
    }
  }

  getHistoricalTrend(metric, timeRange = 3600000) { // 1 hour default
    const cutoff = Date.now() - timeRange;
    const relevantSnapshots = this.metricSnapshots.filter(s => s.timestamp >= cutoff);
    
    return relevantSnapshots.map(snapshot => ({
      timestamp: snapshot.timestamp,
      time: new Date(snapshot.timestamp).toLocaleTimeString(),
      value: this.extractMetricValue(snapshot, metric)
    }));
  }

  extractMetricValue(snapshot, metric) {
    switch (metric) {
      case 'cpu': return snapshot.serverMetrics?.avgCpuUsage || 0;
      case 'memory': return snapshot.serverMetrics?.avgMemoryUsage || 0;
      case 'network': return snapshot.serverMetrics?.avgNetworkLatency || 0;
      case 'health': return snapshot.systemHealth?.healthy || 0;
      case 'businessLoad': return snapshot.globalTrends?.businessLoad || 0;
      default: return 0;
    }
  }

  getEventTimeline(timeRange = 3600000) {
    const cutoff = Date.now() - timeRange;
    return this.evolutionHistory
      .filter(event => event.timestamp >= cutoff)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  exportHistoricalData(format = 'json') {
    const data = {
      evolutionHistory: this.evolutionHistory,
      metricSnapshots: this.metricSnapshots,
      applicationHealthHistory: this.applicationHealthHistory,
      exportedAt: Date.now()
    };

    if (format === 'csv') {
      return this.convertToCSV(data);
    }
    
    return JSON.stringify(data, null, 2);
  }

  convertToCSV(data) {
    // Convert metrics snapshots to CSV format
    const headers = ['timestamp', 'avgCpuUsage', 'avgMemoryUsage', 'avgNetworkLatency', 'systemHealthy', 'businessLoad'];
    const rows = data.metricSnapshots.map(snapshot => [
      snapshot.timestamp,
      (snapshot.serverMetrics?.avgCpuUsage || 0).toFixed(2),
      (snapshot.serverMetrics?.avgMemoryUsage || 0).toFixed(2),
      (snapshot.serverMetrics?.avgNetworkLatency || 0).toFixed(2),
      (snapshot.systemHealth?.healthy || 0).toFixed(2),
      (snapshot.globalTrends?.businessLoad || 0).toFixed(2)
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}

// ===== INTEGRATION MODULE =====

export {
  ApplicationTopologyManager,
  SERVER_PERSONALITIES,
  assignServerPersonalities,
  IncidentInjectionAPI,
  HistoricalReplayManager
};