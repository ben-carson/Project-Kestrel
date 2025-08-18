// src/components/widgets/NetworkTopology/lib/simulators/NetworkSimulator.js

/**
 * Enterprise-grade network topology simulator with realistic behaviors
 * Features: Multi-tier architecture, traffic simulation, incident cascading, auto-scaling, SLA monitoring
 */

import { EventEmitter } from 'events';

/**
 * Seeded random number generator for deterministic simulations
 */
class SeededRNG {
  constructor(seed = 1) {
    this.seed = seed >>> 0;
  }
  
  next() {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 0xFFFFFFFF;
  }
  
  range(min, max) {
    return min + this.next() * (max - min);
  }
  
  choice(array) {
    return array[Math.floor(this.next() * array.length)];
  }
  
  gaussian(mean = 0, std = 1) {
    // Box-Muller transform for normal distribution
    if (this.spare !== undefined) {
      const val = this.spare;
      this.spare = undefined;
      return val * std + mean;
    }
    
    const u = this.next();
    const v = this.next();
    const mag = std * Math.sqrt(-2 * Math.log(u));
    this.spare = mag * Math.cos(2 * Math.PI * v);
    return mag * Math.sin(2 * Math.PI * v) + mean;
  }
}

/**
 * @typedef {'healthy' | 'warning' | 'critical' | 'offline' | 'maintenance'} NodeStatus
 * @typedef {'dmz' | 'web' | 'app' | 'data' | 'cache' | 'lb' | 'monitoring'} NodeTier
 * @typedef {'production' | 'staging' | 'development' | 'dr'} Environment
 */

/**
 * @typedef {Object} NetworkMetrics
 * @property {number} cpuUsage - 0-100%
 * @property {number} memoryUsage - 0-100%
 * @property {number} diskUsage - 0-100%
 * @property {number} networkLatency - milliseconds
 * @property {number} throughput - requests/second
 * @property {number} errorRate - 0-1 (percentage as decimal)
 * @property {number} connectionCount - active connections
 * @property {number} queueDepth - pending requests
 */

/**
 * @typedef {Object} EnterpriseNode
 * @property {string} id
 * @property {string} name
 * @property {NodeTier} tier
 * @property {string} type - firewall, lb, web, api, db, cache, etc.
 * @property {Environment} environment
 * @property {string} datacenter
 * @property {number} x
 * @property {number} y
 * @property {number} vx
 * @property {number} vy
 * @property {NodeStatus} status
 * @property {NetworkMetrics} metrics
 * @property {Object} config - Node-specific configuration
 * @property {number} capacity - Maximum load this node can handle
 * @property {number} currentLoad - Current load 0-1
 * @property {Array} dependencies - Array of node IDs this depends on
 * @property {number} mtbf - Mean Time Between Failures (hours)
 * @property {number} mttr - Mean Time To Recovery (minutes)
 * @property {number} lastFailure - Timestamp of last failure
 * @property {boolean} autoScaling - Can this node auto-scale?
 * @property {Array} scalingGroup - Related nodes for scaling
 */

/**
 * @typedef {Object} TrafficFlow
 * @property {string} id
 * @property {string} sourceId
 * @property {string} targetId
 * @property {number} bandwidth - Mbps
 * @property {number} utilization - 0-1
 * @property {string} protocol - HTTP, HTTPS, TCP, UDP, etc.
 * @property {number} latency - milliseconds
 * @property {number} packetLoss - 0-1
 */

export class EnterpriseNetworkSimulator extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      seed: 42,
      tickInterval: 1000, // 1 second
      businessHours: { start: 9, end: 17 }, // 9 AM to 5 PM
      timeAcceleration: 1, // 1x real time
      enableAutoHealing: true,
      enableAutoScaling: true,
      slaThresholds: {
        availability: 0.999, // 99.9% uptime
        responseTime: 200, // 200ms max
        errorRate: 0.01 // 1% max error rate
      },
      ...options
    };

    this.rng = new SeededRNG(this.options.seed);
    this.clock = new Date();
    this.tickCount = 0;
    this.isRunning = false;
    this.intervalId = null;

    /** @type {EnterpriseNode[]} */
    this.nodes = [];
    /** @type {TrafficFlow[]} */
    this.trafficFlows = [];
    /** @type {Map<string, EnterpriseNode[]>} */
    this.topology = new Map();
    
    // Incident tracking
    this.incidents = [];
    this.slaMetrics = new Map();
    this.performanceHistory = [];
    
    // Auto-scaling state
    this.scalingCooldowns = new Map();
    
    this._initializeTopology();
  }

  _initializeTopology() {
    this._createEnterpriseNodes();
    this._establishConnections();
    this._initializeTrafficPatterns();
    this._setupSLAMonitoring();
  }

  _createEnterpriseNodes() {
    const datacenters = [
      { id: 'dc-primary', name: 'Primary DC', region: 'us-east-1', x: 400, y: 300 },
      { id: 'dc-dr', name: 'DR Site', region: 'us-west-2', x: 200, y: 200 },
      { id: 'dc-cloud', name: 'Cloud', region: 'aws-us-east-1', x: 600, y: 150 }
    ];

    const nodeTemplates = [
      // DMZ Tier
      { tier: 'dmz', type: 'firewall', count: 2, mtbf: 8760, capacity: 10000 },
      { tier: 'dmz', type: 'waf', count: 2, mtbf: 4380, capacity: 5000 },
      { tier: 'dmz', type: 'reverse-proxy', count: 3, mtbf: 2190, capacity: 8000 },
      
      // Load Balancer Tier
      { tier: 'lb', type: 'load-balancer', count: 2, mtbf: 4380, capacity: 15000 },
      
      // Web Tier
      { tier: 'web', type: 'web-server', count: 6, mtbf: 1460, capacity: 1000, autoScaling: true },
      { tier: 'web', type: 'cdn-edge', count: 4, mtbf: 2920, capacity: 5000 },
      
      // Application Tier
      { tier: 'app', type: 'api-server', count: 8, mtbf: 1095, capacity: 500, autoScaling: true },
      { tier: 'app', type: 'microservice', count: 12, mtbf: 730, capacity: 200, autoScaling: true },
      { tier: 'app', type: 'message-queue', count: 3, mtbf: 2190, capacity: 10000 },
      
      // Cache Tier
      { tier: 'cache', type: 'redis', count: 4, mtbf: 1460, capacity: 2000 },
      { tier: 'cache', type: 'memcached', count: 2, mtbf: 1095, capacity: 1500 },
      
      // Data Tier
      { tier: 'data', type: 'database-primary', count: 3, mtbf: 4380, capacity: 1000 },
      { tier: 'data', type: 'database-replica', count: 6, mtbf: 4380, capacity: 800 },
      { tier: 'data', type: 'data-warehouse', count: 2, mtbf: 8760, capacity: 500 },
      
      // Monitoring
      { tier: 'monitoring', type: 'metrics-collector', count: 2, mtbf: 2190, capacity: 5000 },
      { tier: 'monitoring', type: 'log-aggregator', count: 2, mtbf: 1460, capacity: 8000 }
    ];

    let nodeId = 0;
    
    datacenters.forEach((dc, dcIndex) => {
      nodeTemplates.forEach(template => {
        const dcNodeCount = Math.ceil(template.count / datacenters.length);
        
        for (let i = 0; i < dcNodeCount && nodeId < 100; i++) {
          const angle = (i / dcNodeCount) * 2 * Math.PI;
          const tierRadius = this._getTierRadius(template.tier);
          
          const node = {
            id: `node-${nodeId}`,
            name: `${template.type}-${dc.id}-${i + 1}`,
            tier: template.tier,
            type: template.type,
            environment: dcIndex === 0 ? 'production' : dcIndex === 1 ? 'dr' : 'staging',
            datacenter: dc.id,
            x: dc.x + Math.cos(angle) * tierRadius + this.rng.range(-20, 20),
            y: dc.y + Math.sin(angle) * tierRadius + this.rng.range(-20, 20),
            vx: 0,
            vy: 0,
            status: 'healthy',
            metrics: this._initializeMetrics(),
            config: this._generateNodeConfig(template.type),
            capacity: template.capacity,
            currentLoad: this.rng.range(0.1, 0.3),
            dependencies: [],
            mtbf: template.mtbf,
            mttr: this.rng.range(5, 30),
            lastFailure: 0,
            autoScaling: template.autoScaling || false,
            scalingGroup: []
          };

          this.nodes.push(node);
          nodeId++;
        }
      });
    });

    this._establishDependencies();
  }

  _getTierRadius(tier) {
    const radii = {
      dmz: 60,
      lb: 80,
      web: 100,
      app: 120,
      cache: 90,
      data: 140,
      monitoring: 70
    };
    return radii[tier] || 100;
  }

  _initializeMetrics() {
    return {
      cpuUsage: this.rng.range(5, 25),
      memoryUsage: this.rng.range(10, 40),
      diskUsage: this.rng.range(15, 60),
      networkLatency: this.rng.range(1, 10),
      throughput: this.rng.range(10, 100),
      errorRate: this.rng.range(0.001, 0.01),
      connectionCount: Math.floor(this.rng.range(50, 500)),
      queueDepth: Math.floor(this.rng.range(0, 10))
    };
  }

  _generateNodeConfig(type) {
    const configs = {
      firewall: {
        rules: Math.floor(this.rng.range(100, 1000)),
        connections: Math.floor(this.rng.range(10000, 100000)),
        throughput: `${this.rng.range(1, 10)}Gbps`
      },
      'web-server': {
        maxConnections: Math.floor(this.rng.range(1000, 10000)),
        workers: Math.floor(this.rng.range(4, 32)),
        keepAliveTimeout: this.rng.range(30, 120)
      },
      database: {
        connections: Math.floor(this.rng.range(100, 1000)),
        bufferSize: `${Math.floor(this.rng.range(512, 8192))}MB`,
        replicationLag: this.rng.range(0.1, 5)
      }
    };
    return configs[type] || {};
  }

  _establishDependencies() {
    // Create realistic dependency chains
    const tiers = ['dmz', 'lb', 'web', 'app', 'cache', 'data'];
    
    this.nodes.forEach(node => {
      const tierIndex = tiers.indexOf(node.tier);
      
      // Each tier depends on the previous tier
      if (tierIndex > 0) {
        const previousTier = tiers[tierIndex - 1];
        const dependencies = this.nodes
          .filter(n => n.tier === previousTier && n.datacenter === node.datacenter)
          .slice(0, 2) // Limit dependencies
          .map(n => n.id);
        node.dependencies = dependencies;
      }

      // Data tier also depends on cache
      if (node.tier === 'data') {
        const cacheNodes = this.nodes
          .filter(n => n.tier === 'cache' && n.datacenter === node.datacenter)
          .slice(0, 1)
          .map(n => n.id);
        node.dependencies.push(...cacheNodes);
      }
    });
  }

  _establishConnections() {
    this.trafficFlows = [];
    
    this.nodes.forEach(node => {
      node.dependencies.forEach(depId => {
        const dependency = this.nodes.find(n => n.id === depId);
        if (dependency) {
          this.trafficFlows.push({
            id: `flow-${node.id}-${depId}`,
            sourceId: node.id,
            targetId: depId,
            bandwidth: this.rng.range(100, 1000),
            utilization: this.rng.range(0.1, 0.8),
            protocol: this._getProtocolForConnection(node.type, dependency.type),
            latency: this._calculateLatency(node, dependency),
            packetLoss: this.rng.range(0.0001, 0.001)
          });
        }
      });
    });
  }

  _getProtocolForConnection(sourceType, targetType) {
    if (targetType === 'database') return 'TCP';
    if (targetType === 'redis' || targetType === 'memcached') return 'TCP';
    if (sourceType === 'web-server') return 'HTTPS';
    return 'HTTP';
  }

  _calculateLatency(node1, node2) {
    const sameDatacenter = node1.datacenter === node2.datacenter;
    return sameDatacenter ? this.rng.range(1, 5) : this.rng.range(20, 100);
  }

  _initializeTrafficPatterns() {
    // Business hours traffic multiplier
    this.baseTrafficMultiplier = 1.0;
  }

  _setupSLAMonitoring() {
    this.nodes.forEach(node => {
      this.slaMetrics.set(node.id, {
        uptime: 1.0,
        avgResponseTime: 0,
        errorRate: 0,
        availability: 1.0,
        violations: []
      });
    });
  }

  // Business logic methods
  _isBusinessHours() {
    const hour = this.clock.getHours();
    return hour >= this.options.businessHours.start && hour < this.options.businessHours.end;
  }

  _getTrafficMultiplier() {
    const isBusinessHours = this._isBusinessHours();
    const dayOfWeek = this.clock.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    let multiplier = 1.0;
    
    if (isBusinessHours && !isWeekend) {
      multiplier = 2.5; // Peak traffic
    } else if (!isBusinessHours && !isWeekend) {
      multiplier = 0.4; // Off-hours
    } else {
      multiplier = 0.6; // Weekend
    }
    
    // Add some realistic variance
    multiplier *= this.rng.range(0.8, 1.2);
    
    return multiplier;
  }

  _simulateNodeMetrics(node) {
    const trafficMultiplier = this._getTrafficMultiplier();
    const baseLoad = node.currentLoad * trafficMultiplier;
    
    // CPU scales with load
    node.metrics.cpuUsage = Math.min(95, baseLoad * 100 + this.rng.gaussian(0, 5));
    
    // Memory grows more slowly
    node.metrics.memoryUsage = Math.min(90, 
      node.metrics.memoryUsage + this.rng.gaussian(0, 2));
    
    // Network latency increases with load
    const latencyBase = node.tier === 'data' ? 5 : 2;
    node.metrics.networkLatency = latencyBase * (1 + baseLoad) + this.rng.gaussian(0, 1);
    
    // Throughput scales with traffic
    node.metrics.throughput = Math.max(0, 
      baseLoad * node.capacity + this.rng.gaussian(0, node.capacity * 0.1));
    
    // Error rate increases with high load
    if (baseLoad > 0.8) {
      node.metrics.errorRate = Math.min(0.1, 
        node.metrics.errorRate + this.rng.range(0.001, 0.01));
    } else {
      node.metrics.errorRate = Math.max(0.0001, 
        node.metrics.errorRate - this.rng.range(0.0001, 0.001));
    }
    
    // Connection count varies with throughput
    node.metrics.connectionCount = Math.floor(
      node.metrics.throughput * this.rng.range(0.5, 2.0));
    
    // Queue depth indicates overload
    if (baseLoad > 0.9) {
      node.metrics.queueDepth = Math.min(1000, 
        node.metrics.queueDepth + this.rng.range(1, 10));
    } else {
      node.metrics.queueDepth = Math.max(0, 
        node.metrics.queueDepth - this.rng.range(0, 2));
    }
  }

  _checkNodeHealth(node) {
    const { cpuUsage, memoryUsage, errorRate, queueDepth } = node.metrics;
    
    // Critical conditions
    if (cpuUsage > 90 || memoryUsage > 85 || errorRate > 0.05 || queueDepth > 100) {
      if (node.status !== 'critical') {
        this._createIncident(node, 'critical', 'Resource exhaustion detected');
      }
      node.status = 'critical';
      return;
    }
    
    // Warning conditions
    if (cpuUsage > 75 || memoryUsage > 70 || errorRate > 0.02 || queueDepth > 20) {
      node.status = 'warning';
      return;
    }
    
    // Random failures based on MTBF
    const failureProbability = 1 / (node.mtbf * 3600); // Convert hours to seconds
    if (this.rng.next() < failureProbability) {
      this._createIncident(node, 'critical', 'Hardware failure');
      node.status = 'offline';
      node.lastFailure = Date.now();
      return;
    }
    
    // Recovery from offline state
    if (node.status === 'offline' && this.options.enableAutoHealing) {
      const timeSinceFailure = (Date.now() - node.lastFailure) / (1000 * 60); // minutes
      if (timeSinceFailure > node.mttr) {
        node.status = 'healthy';
        this._resolveIncidents(node, 'Auto-healing successful');
        this.emit('nodeRecovered', { node });
      }
    } else {
      node.status = 'healthy';
    }
  }

  _createIncident(node, severity, description) {
    const incident = {
      id: `inc-${Date.now()}-${node.id}`,
      nodeId: node.id,
      nodeName: node.name,
      severity,
      description,
      startTime: Date.now(),
      status: 'active',
      impactedServices: this._getImpactedServices(node)
    };
    
    this.incidents.push(incident);
    this.emit('incidentCreated', { incident, node });
  }

  _resolveIncidents(node, resolution) {
    const activeIncidents = this.incidents.filter(
      inc => inc.nodeId === node.id && inc.status === 'active'
    );
    
    activeIncidents.forEach(incident => {
      incident.status = 'resolved';
      incident.endTime = Date.now();
      incident.resolution = resolution;
      this.emit('incidentResolved', { incident, node });
    });
  }

  _getImpactedServices(node) {
    // Find all nodes that depend on this node
    const dependents = this.nodes.filter(n => 
      n.dependencies.includes(node.id)
    );
    
    return dependents.map(n => ({
      id: n.id,
      name: n.name,
      tier: n.tier
    }));
  }

  _simulateAutoScaling() {
    if (!this.options.enableAutoScaling) return;
    
    this.nodes
      .filter(node => node.autoScaling && node.status === 'healthy')
      .forEach(node => {
        const scaleKey = `${node.type}-${node.datacenter}`;
        const lastScaling = this.scalingCooldowns.get(scaleKey) || 0;
        const cooldownPeriod = 300000; // 5 minutes
        
        if (Date.now() - lastScaling < cooldownPeriod) return;
        
        const avgLoad = node.currentLoad;
        
        // Scale up if consistently high load
        if (avgLoad > 0.8 && this.rng.next() < 0.1) {
          this._scaleUp(node);
          this.scalingCooldowns.set(scaleKey, Date.now());
        }
        
        // Scale down if consistently low load
        if (avgLoad < 0.3 && this.rng.next() < 0.05) {
          this._scaleDown(node);
          this.scalingCooldowns.set(scaleKey, Date.now());
        }
      });
  }

  _scaleUp(node) {
    // Add a new node to the scaling group
    const newNodeId = `node-${this.nodes.length}`;
    const newNode = {
      ...node,
      id: newNodeId,
      name: `${node.type}-scaled-${Date.now()}`,
      currentLoad: 0.1,
      metrics: this._initializeMetrics()
    };
    
    this.nodes.push(newNode);
    this.emit('nodeScaled', { action: 'up', originalNode: node, newNode });
  }

  _scaleDown(node) {
    // Remove a node from the scaling group (if there are multiple)
    const sameTypeNodes = this.nodes.filter(n => 
      n.type === node.type && 
      n.datacenter === node.datacenter && 
      n.currentLoad < 0.4
    );
    
    if (sameTypeNodes.length > 1) {
      const nodeToRemove = sameTypeNodes[sameTypeNodes.length - 1];
      this.nodes = this.nodes.filter(n => n.id !== nodeToRemove.id);
      this.emit('nodeScaled', { action: 'down', removedNode: nodeToRemove });
    }
  }

  _updateSLAMetrics() {
    this.nodes.forEach(node => {
      const sla = this.slaMetrics.get(node.id);
      if (!sla) return;
      
      // Update availability
      const isAvailable = node.status === 'healthy' || node.status === 'warning';
      sla.availability = (sla.availability * 0.99) + (isAvailable ? 0.01 : 0);
      
      // Update response time
      sla.avgResponseTime = (sla.avgResponseTime * 0.9) + (node.metrics.networkLatency * 0.1);
      
      // Update error rate
      sla.errorRate = (sla.errorRate * 0.9) + (node.metrics.errorRate * 0.1);
      
      // Check for SLA violations
      const thresholds = this.options.slaThresholds;
      if (sla.availability < thresholds.availability ||
          sla.avgResponseTime > thresholds.responseTime ||
          sla.errorRate > thresholds.errorRate) {
        
        sla.violations.push({
          timestamp: Date.now(),
          type: sla.availability < thresholds.availability ? 'availability' : 
                sla.avgResponseTime > thresholds.responseTime ? 'responseTime' : 'errorRate',
          value: sla.availability < thresholds.availability ? sla.availability : 
                 sla.avgResponseTime > thresholds.responseTime ? sla.avgResponseTime : sla.errorRate
        });
        
        this.emit('slaViolation', { node, sla, violation: sla.violations[sla.violations.length - 1] });
      }
    });
  }

  // Public API
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.tick();
    }, this.options.tickInterval);
    
    this.emit('simulationStarted');
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.emit('simulationStopped');
  }

  tick() {
    this.tickCount++;
    this.clock = new Date(this.clock.getTime() + (this.options.tickInterval * this.options.timeAcceleration));
    
    // Update all nodes
    this.nodes.forEach(node => {
      this._simulateNodeMetrics(node);
      this._checkNodeHealth(node);
    });
    
    // Run enterprise features
    this._simulateAutoScaling();
    this._updateSLAMetrics();
    
    // Store performance snapshot
    if (this.tickCount % 60 === 0) { // Every minute
      this.performanceHistory.push({
        timestamp: Date.now(),
        totalNodes: this.nodes.length,
        healthyNodes: this.nodes.filter(n => n.status === 'healthy').length,
        avgCpuUsage: this.nodes.reduce((sum, n) => sum + n.metrics.cpuUsage, 0) / this.nodes.length,
        avgLatency: this.nodes.reduce((sum, n) => sum + n.metrics.networkLatency, 0) / this.nodes.length,
        totalThroughput: this.nodes.reduce((sum, n) => sum + n.metrics.throughput, 0),
        activeIncidents: this.incidents.filter(i => i.status === 'active').length
      });
      
      // Keep only last 24 hours of history
      if (this.performanceHistory.length > 1440) {
        this.performanceHistory = this.performanceHistory.slice(-1440);
      }
    }
    
    this.emit('tick', {
      tickCount: this.tickCount,
      clock: this.clock,
      nodes: this.nodes,
      trafficFlows: this.trafficFlows,
      incidents: this.incidents.filter(i => i.status === 'active'),
      slaMetrics: Object.fromEntries(this.slaMetrics),
      performanceHistory: this.performanceHistory.slice(-60) // Last hour
    });
  }

  // Getter methods
  getNodes() { return this.nodes; }
  getActiveIncidents() { return this.incidents.filter(i => i.status === 'active'); }
  getPerformanceHistory() { return this.performanceHistory; }
  getSLAMetrics() { return Object.fromEntries(this.slaMetrics); }
  getTopologyStats() {
    return {
      totalNodes: this.nodes.length,
      healthyNodes: this.nodes.filter(n => n.status === 'healthy').length,
      warningNodes: this.nodes.filter(n => n.status === 'warning').length,
      criticalNodes: this.nodes.filter(n => n.status === 'critical').length,
      offlineNodes: this.nodes.filter(n => n.status === 'offline').length,
      trafficFlows: this.trafficFlows.length,
      activeIncidents: this.getActiveIncidents().length,
      isBusinessHours: this._isBusinessHours()
    };
  }

  // Incident injection for testing
  injectIncident(nodeId, incidentType = 'critical') {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return false;
    
    switch (incidentType) {
      case 'cpu_spike':
        node.metrics.cpuUsage = 95;
        break;
      case 'memory_leak':
        node.metrics.memoryUsage = 90;
        break;
      case 'network_congestion':
        node.metrics.networkLatency = 500;
        break;
      case 'hardware_failure':
        node.status = 'offline';
        node.lastFailure = Date.now();
        break;
    }
    
    this._createIncident(node, 'critical', `Injected incident: ${incidentType}`);
    return true;
  }
}