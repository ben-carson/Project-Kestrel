// Enhanced Dynamic Server Evolution System
// Adds predictive analytics, smart auto-healing, and contextual intelligence
// Updated with interval cleanup and module-level controls

export const evolveServerState = (server, deltaTime = 1000, globalCtx = {}) => {
  const engine = new ServerEvolutionEngine([], {});
  return engine.evolveServer(server, deltaTime, globalCtx);
};

// Simple predictive analytics engine
class PredictiveHealthEngine {
  constructor() {
    this.serverHistories = new Map();
    this.predictionModels = new Map();
  }

  updateServerHistory(serverId, metrics) {
    if (!this.serverHistories.has(serverId)) {
      this.serverHistories.set(serverId, []);
    }
    
    const history = this.serverHistories.get(serverId);
    history.push({
      timestamp: Date.now(),
      ...metrics
    });
    
    // Keep only last 50 data points
    if (history.length > 50) {
      history.shift();
    }
  }

  predictFailureRisk(serverId, lookaheadMinutes = 30) {
    const history = this.serverHistories.get(serverId);
    if (!history || history.length < 5) {
      return { risk: 0, confidence: 0, timeToFailure: null };
    }

    // Simple trend analysis
    const recentData = history.slice(-10);
    const cpuTrend = this.calculateTrend(recentData, 'cpuUsage');
    const memoryTrend = this.calculateTrend(recentData, 'memoryUsage');
    const latencyTrend = this.calculateTrend(recentData, 'networkLatency');

    // Risk calculation based on trends
    let risk = 0;
    if (cpuTrend > 2) risk += 0.3; // CPU increasing rapidly
    if (memoryTrend > 1.5) risk += 0.4; // Memory leak detection
    if (latencyTrend > 5) risk += 0.2; // Network degradation
    
    // Current state influence
    const current = recentData[recentData.length - 1];
    if (current.cpuUsage > 85) risk += 0.3;
    if (current.memoryUsage > 90) risk += 0.4;
    if (current.networkLatency > 300) risk += 0.2;

    const confidence = Math.min(1, history.length / 20);
    const timeToFailure = risk > 0.7 ? this.estimateTimeToFailure(recentData) : null;

    return { 
      risk: Math.min(1, risk), 
      confidence,
      timeToFailure,
      trends: { cpu: cpuTrend, memory: memoryTrend, latency: latencyTrend }
    };
  }

  calculateTrend(data, metric) {
    if (data.length < 3) return 0;
    
    const values = data.map(d => d[metric] || 0);
    const n = values.length;
    const sumX = n * (n - 1) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
    const sumX2 = n * (n - 1) * (2 * n - 1) / 6;
    
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  estimateTimeToFailure(data) {
    // Simple linear projection to failure thresholds
    const current = data[data.length - 1];
    const trends = {
      cpu: this.calculateTrend(data, 'cpuUsage'),
      memory: this.calculateTrend(data, 'memoryUsage')
    };

    const timeToFailureEstimates = [];
    
    if (trends.cpu > 0) {
      const timeToHighCpu = (95 - current.cpuUsage) / trends.cpu;
      if (timeToHighCpu > 0) timeToFailureEstimates.push(timeToHighCpu);
    }
    
    if (trends.memory > 0) {
      const timeToHighMemory = (95 - current.memoryUsage) / trends.memory;
      if (timeToHighMemory > 0) timeToFailureEstimates.push(timeToHighMemory);
    }

    return timeToFailureEstimates.length > 0 
      ? Math.min(...timeToFailureEstimates) * 60000 // Convert to milliseconds
      : null;
  }
}

// Smart auto-healing engine
class IntelligentAutoHealer {
  constructor() {
    this.healingStrategies = new Map();
    this.healingHistory = new Map();
    this.learningEngine = {
      strategies: new Map(),
      successRates: new Map(),
      // ✅ ADD THE MISSING METHOD:
      updateStrategy: (strategy, success, metrics) => {
        const strategyKey = strategy?.name || 'default';
        const currentRate = this.learningEngine.successRates.get(strategyKey) || 0.5;
        const newRate = success ?
           Math.min(1.0, currentRate + 0.1) :
           Math.max(0.1, currentRate - 0.05);
        this.learningEngine.successRates.set(strategyKey, newRate);
        if (import.meta?.env?.VITE_INFRA_DEBUG === 'true') {
          console.log(`Learning engine updated strategy ${strategyKey}: ${newRate}`);
        }
      }
    };
  }

  autoHeal(server, incident) {
    const strategy = this.selectOptimalStrategy(server, incident);
    const healingPlan = this.generateHealingPlan(server, incident, strategy);
    
    return this.executeHealing(server, healingPlan).then(result => {
      this.learningEngine.updateStrategy(strategy, result.success, result.metrics);
      return result;
    });
  }

  selectOptimalStrategy(server, incident) {
    const serverType = server.type;
    const incidentType = incident?.type || 'unknown';
    const strategyKey = `${serverType}-${incidentType}`;
    
    // Get strategy with highest success rate, or default
    const strategies = this.learningEngine.strategies.get(strategyKey) || this.getDefaultStrategies(serverType);
    const successRates = this.learningEngine.successRates.get(strategyKey) || new Map();
    
    let bestStrategy = strategies[0];
    let bestSuccessRate = successRates.get(bestStrategy?.name) || 0.5;
    
    for (const strategy of strategies) {
      const rate = successRates.get(strategy.name) || 0.5;
      if (rate > bestSuccessRate) {
        bestStrategy = strategy;
        bestSuccessRate = rate;
      }
    }
    
    return bestStrategy;
  }

  generateHealingPlan(server, incident, strategy) {
    const basePlan = {
      serverId: server.id,
      strategy: strategy.name,
      immediate: [],
      preventive: [],
      monitoring: []
    };

    // Incident-specific healing actions
    switch (incident?.type) {
      case 'memory_spike':
      case 'memory_exhaustion':
        basePlan.immediate = ['restart_service', 'clear_cache'];
        basePlan.preventive = ['increase_memory_allocation'];
        break;
      case 'cpu_overload':
      case 'cpu_thermal':
        basePlan.immediate = ['reduce_worker_threads', 'enable_cpu_throttling'];
        basePlan.preventive = ['scale_horizontally'];
        break;
      case 'network_storm':
      case 'network_slow':
        basePlan.immediate = ['enable_rate_limiting', 'reroute_traffic'];
        basePlan.preventive = ['optimize_network_config'];
        break;
      case 'disk_full':
        basePlan.immediate = ['cleanup_temp_files', 'compress_logs'];
        basePlan.preventive = ['expand_storage'];
        break;
      default:
        basePlan.immediate = ['health_check', 'restart_if_needed'];
        basePlan.preventive = ['monitor_closely'];
    }

    basePlan.monitoring = ['track_metrics', 'alert_on_regression'];
    return basePlan;
  }

  async executeHealing(server, healingPlan) {
    const startTime = Date.now();
    let success = false;
    const executionLog = [];

    try {
      // Simulate healing actions
      for (const action of healingPlan.immediate) {
        const actionResult = await this.executeAction(server, action);
        executionLog.push(actionResult);
        
        if (actionResult.success) {
          success = true;
          break; // If one action succeeds, we're good
        }
      }

      // If immediate actions didn't work, try preventive
      if (!success) {
        for (const action of healingPlan.preventive) {
          const actionResult = await this.executeAction(server, action);
          executionLog.push(actionResult);
          
          if (actionResult.success) {
            success = true;
            break;
          }
        }
      }

      return {
        success,
        executionTime: Date.now() - startTime,
        executionLog,
        healedServer: success ? this.generateHealedServerState(server) : server
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
        executionLog
      };
    }
  }

  async executeAction(server, action) {
    // Simulate action execution with realistic success rates
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    const actionSuccessRates = {
      'restart_service': 0.85,
      'clear_cache': 0.75,
      'increase_memory_allocation': 0.90,
      'reduce_worker_threads': 0.70,
      'enable_cpu_throttling': 0.60,
      'scale_horizontally': 0.95,
      'enable_rate_limiting': 0.80,
      'reroute_traffic': 0.85,
      'optimize_network_config': 0.70,
      'cleanup_temp_files': 0.90,
      'compress_logs': 0.85,
      'expand_storage': 0.95,
      'health_check': 0.95,
      'restart_if_needed': 0.80
    };

    const successRate = actionSuccessRates[action] || 0.60;
    const success = Math.random() < successRate;

    return {
      action,
      success,
      timestamp: Date.now(),
      impact: success ? this.calculateActionImpact(action) : null
    };
  }

  calculateActionImpact(action) {
    const impacts = {
      'restart_service': { cpu: -20, memory: -30, latency: -15 },
      'clear_cache': { memory: -25, latency: 5 },
      'increase_memory_allocation': { memory: -40 },
      'reduce_worker_threads': { cpu: -15, memory: -10 },
      'enable_cpu_throttling': { cpu: -25 },
      'scale_horizontally': { cpu: -30, memory: -20, latency: -10 },
      'enable_rate_limiting': { cpu: -10, latency: 10 },
      'reroute_traffic': { latency: -20 },
      'optimize_network_config': { latency: -25 },
      'cleanup_temp_files': { disk: -30 },
      'compress_logs': { disk: -20 },
      'expand_storage': { disk: -50 }
    };

    return impacts[action] || {};
  }

  generateHealedServerState(server) {
    return {
      ...server,
      status: 'online',
      metrics: {
        ...server.metrics,
        cpuUsage: Math.max(5, (server.metrics?.cpuUsage || 30) * 0.7),
        memoryUsage: Math.max(10, (server.metrics?.memoryUsage || 50) * 0.8),
        networkLatency: Math.max(1, (server.metrics?.networkLatency || 25) * 0.85)
      },
      lastHealed: Date.now(),
      currentIncident: null
    };
  }

  getDefaultStrategies(serverType) {
    const strategies = {
      'db': [
        { name: 'conservative_restart', priority: 'low', riskLevel: 'low' },
        { name: 'memory_optimization', priority: 'medium', riskLevel: 'low' },
        { name: 'query_optimization', priority: 'high', riskLevel: 'medium' }
      ],
      'cache': [
        { name: 'cache_flush', priority: 'high', riskLevel: 'low' },
        { name: 'memory_reallocation', priority: 'medium', riskLevel: 'low' }
      ],
      'api': [
        { name: 'load_balancing', priority: 'high', riskLevel: 'low' },
        { name: 'service_restart', priority: 'medium', riskLevel: 'medium' },
        { name: 'horizontal_scaling', priority: 'high', riskLevel: 'low' }
      ]
    };

    return strategies[serverType] || [
      { name: 'generic_restart', priority: 'medium', riskLevel: 'medium' }
    ];
  }
}

// Enhanced Server Evolution Engine
class ServerEvolutionEngine {
  constructor(initialServers, topology) {
    this.servers = new Map(initialServers.map(s => [s.id, { ...s }]));
    this.topology = topology || {};
    this.timeScale = 1000;
    this.lastUpdate = Date.now();
    this.globalTrends = this.initializeGlobalTrends();
    this.cascadeEffects = new Map();
    this.maintenanceWindows = new Map();
    
    // Enhanced intelligence components
    this.predictiveEngine = new PredictiveHealthEngine();
    this.autoHealer = new IntelligentAutoHealer();
    this.contextualIntelligence = {
      businessHours: this.isBusinessHours.bind(this),
      criticalPeriod: this.isCriticalPeriod.bind(this),
      getBusinessImpact: this.calculateBusinessImpact.bind(this)
    };
  }

  initializeGlobalTrends() {
    return {
      businessLoad: {
        value: 1.0,
        cycle: 24 * 60 * 60 * 1000,
        amplitude: 0.3,
        phase: 0,
        timeZoneOffsets: {
          'US-East': 0,
          'US-West': 3,
          'EU-West': -5
        }
      },
      seasonalTrend: {
        value: 1.0,
        cycle: 7 * 24 * 60 * 60 * 1000,
        amplitude: 0.15,
        phase: 0
      },
      networkCongestion: {
        value: 1.0,
        volatility: 0.1,
        momentum: 0.8
      },
      datacenterAnomalies: new Map(),
      heatSources: new Map(),
      memoryLeaks: new Map(),
      diskCreep: new Map()
    };
  }

  evolveServer(server, deltaTime, globalFactors) {
    const timeFactor = deltaTime / this.timeScale;
    let newServer = { ...server };

    // Update predictive history
    this.predictiveEngine.updateServerHistory(server.id, server.metrics);

    // Get failure prediction
    const prediction = this.predictiveEngine.predictFailureRisk(server.id);
    
    // Store prediction in server state
    newServer.prediction = prediction;

    const regionalLoad = this.calculateRegionalBusinessLoad(server.region || 'US-East');

    if (server.status === 'online') {
      const degradationRate = this.getServerDegradationRate(server);
      const healthDecay = degradationRate * timeFactor;
      
      newServer.metrics = this.degradeMetrics(server.metrics, healthDecay);
      newServer.status = this.calculateStatusFromMetrics(newServer.metrics, server.status);

      // Predictive intervention
      if (prediction.risk > 0.8 && prediction.confidence > 0.7) {
        if (import.meta?.env?.VITE_INFRA_DEBUG === 'true') {
          console.log(`Predictive intervention triggered for ${server.name}`);
        }
        newServer = this.triggerPredictiveIntervention(newServer, prediction);
      }
    }

    // Enhanced recovery with auto-healing
    if (['warning', 'critical'].includes(server.status)) {
      const recoveryRate = this.getRecoveryRate(server);
      
      // Try auto-healing for critical servers
      if (server.status === 'critical' && Math.random() < 0.1) {
        this.autoHealer.autoHeal(server, server.currentIncident).then(result => {
          if (result.success) {
            if (import.meta?.env?.VITE_INFRA_DEBUG === 'true') {
              console.log(`Auto-healed server ${server.name}`);
            }
            // Update server state would happen in real implementation
          }
        });
      }
      
      if (Math.random() < recoveryRate * timeFactor) {
        newServer.metrics = this.improveMetrics(server.metrics, 0.1 + Math.random() * 0.2);
        newServer.status = this.calculateStatusFromMetrics(newServer.metrics, server.status);
      }
    }

    newServer.metrics = this.applyRegionalLoadBalancing(newServer, regionalLoad);

    // Contextual incident probability
    const contextualIncidentRate = this.getContextualIncidentRate(server);
    if (Math.random() < contextualIncidentRate * timeFactor) {
      newServer = this.triggerIntelligentIncident(newServer);
    }

    return newServer;
  }

  triggerPredictiveIntervention(server, prediction) {
    const interventions = [];
    
    if (prediction.trends.cpu > 2) {
      interventions.push('CPU scaling recommended');
      server.metrics.cpuUsage *= 0.9; // Simulated load reduction
    }
    
    if (prediction.trends.memory > 1) {
      interventions.push('Memory optimization applied');
      server.metrics.memoryUsage *= 0.85; // Simulated cleanup
    }
    
    if (prediction.trends.latency > 5) {
      interventions.push('Network optimization applied');
      server.metrics.networkLatency *= 0.8; // Simulated optimization
    }

    return {
      ...server,
      predictiveInterventions: interventions,
      lastIntervention: Date.now()
    };
  }

  getContextualIncidentRate(server) {
    let baseRate = 0.0001;
    
    // Higher incident rate during business hours
    if (this.contextualIntelligence.businessHours()) {
      baseRate *= 1.5;
    }
    
    // Higher rate during critical periods (like deployments)
    if (this.contextualIntelligence.criticalPeriod()) {
      baseRate *= 2.0;
    }
    
    // Server type specific rates
    const typeMultipliers = {
      'db': 0.8,
      'cache': 1.2,
      'api': 1.0,
      'worker': 1.3,
      'web': 1.1
    };
    
    baseRate *= typeMultipliers[server.type] || 1.0;
    
    return baseRate;
  }

  triggerIntelligentIncident(server) {
    const contextualIncidents = this.getContextualIncidents(server);
    const incidentType = contextualIncidents[Math.floor(Math.random() * contextualIncidents.length)];
    
    return {
      ...server,
      status: this.getIncidentSeverity(incidentType, server),
      currentIncident: {
        id: `inc-${Date.now()}-${server.id}`,
        type: incidentType,
        startTime: Date.now(),
        description: this.getIncidentDescription(incidentType),
        contextual: true,
        businessImpact: this.contextualIntelligence.getBusinessImpact(server, incidentType)
      }
    };
  }

  getContextualIncidents(server) {
    const businessHours = this.contextualIntelligence.businessHours();
    const criticalPeriod = this.contextualIntelligence.criticalPeriod();
    
    let incidents = ['memory_spike', 'cpu_overload', 'network_slow'];
    
    if (businessHours) {
      incidents.push('high_traffic_load', 'user_session_spike');
    }
    
    if (criticalPeriod) {
      incidents.push('deployment_conflict', 'configuration_drift');
    }
    
    // Server type specific incidents
    const typeSpecificIncidents = {
      'db': ['slow_query', 'lock_contention', 'replication_lag'],
      'cache': ['cache_miss_storm', 'eviction_pressure'],
      'api': ['rate_limit_exceeded', 'authentication_overload'],
      'worker': ['job_queue_backup', 'processing_timeout']
    };
    
    if (typeSpecificIncidents[server.type]) {
      incidents.push(...typeSpecificIncidents[server.type]);
    }
    
    return incidents;
  }

  getIncidentSeverity(incidentType, server) {
    const criticalIncidents = ['deployment_conflict', 'lock_contention', 'authentication_overload'];
    const warningIncidents = ['cache_miss_storm', 'high_traffic_load', 'slow_query'];
    
    if (criticalIncidents.includes(incidentType)) return 'critical';
    if (warningIncidents.includes(incidentType)) return 'warning';
    
    // Context-based severity
    const businessImpact = this.contextualIntelligence.getBusinessImpact(server, incidentType);
    
    if (businessImpact > 0.8) return 'critical';
    if (businessImpact > 0.5) return 'warning';
    return 'warning';
  }

  getIncidentDescription(incidentType) {
    const descriptions = {
      'memory_spike': 'Sudden memory usage increase detected',
      'cpu_overload': 'CPU utilization exceeding normal thresholds',
      'network_slow': 'Network latency degradation observed',
      'high_traffic_load': 'Increased user traffic causing performance impact',
      'user_session_spike': 'Unusual spike in concurrent user sessions',
      'deployment_conflict': 'Resource conflict detected during deployment',
      'configuration_drift': 'Server configuration deviation from baseline',
      'slow_query': 'Database queries experiencing performance degradation',
      'lock_contention': 'Database lock contention affecting performance',
      'replication_lag': 'Database replication experiencing delays',
      'cache_miss_storm': 'High cache miss rate causing backend pressure',
      'eviction_pressure': 'Cache eviction rate higher than normal',
      'rate_limit_exceeded': 'API rate limits being exceeded',
      'authentication_overload': 'Authentication service under heavy load',
      'job_queue_backup': 'Background job queue experiencing backlog',
      'processing_timeout': 'Job processing timeouts increasing'
    };
    
    return descriptions[incidentType] || `${incidentType} incident detected`;
  }

  // Business context methods
  isBusinessHours() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    // Monday-Friday, 9 AM - 5 PM
    return day >= 1 && day <= 5 && hour >= 9 && hour <= 17;
  }

  isCriticalPeriod() {
    const now = new Date();
    const hour = now.getHours();
    
    // Critical periods: early morning deployments, lunch hour, end of day
    return hour === 6 || hour === 12 || hour === 17;
  }

  calculateBusinessImpact(server, incidentType) {
    let impact = 0.3; // Base impact
    
    // Server criticality
    const criticalTypes = ['db', 'api', 'lb'];
    if (criticalTypes.includes(server.type)) {
      impact += 0.3;
    }
    
    // Time-based impact
    if (this.isBusinessHours()) {
      impact += 0.2;
    }
    
    if (this.isCriticalPeriod()) {
      impact += 0.3;
    }
    
    // Incident type impact
    const highImpactIncidents = ['deployment_conflict', 'lock_contention', 'authentication_overload'];
    if (highImpactIncidents.includes(incidentType)) {
      impact += 0.4;
    }
    
    return Math.min(1.0, impact);
  }

  // Enhanced heat map generation
  getHeatMaps() {
    const heatData = [];
    
    this.servers.forEach((server) => {
      const prediction = server.prediction || { risk: 0, confidence: 0 };
      
      heatData.push({
        node: server.name,
        id: server.id,
        type: server.type,
        datacenter: server.datacenter,
        region: server.region,
        status: server.status,
        
        // Performance metrics
        cpuUsage: server.metrics?.cpuUsage || 0,
        memoryUsage: server.metrics?.memoryUsage || 0,
        diskUsage: server.metrics?.diskUsage || 0,
        networkLatency: server.metrics?.networkLatency || 0,
        
        // Intelligence metrics
        failureRisk: prediction.risk,
        predictionConfidence: prediction.confidence,
        timeToFailure: prediction.timeToFailure,
        
        // Heat calculation
        heat: this.calculateServerHeat(server),
        
        // Business context
        businessImpact: this.calculateBusinessImpact(server, 'general'),
        lastHealed: server.lastHealed,
        predictiveInterventions: server.predictiveInterventions || [],
        
        // Trend indicators
        trends: prediction.trends || { cpu: 0, memory: 0, latency: 0 }
      });
    });
    
    return heatData;
  }

  calculateServerHeat(server) {
    let heat = 0;
    
    // Status heat
    const statusHeat = {
      'online': 0.2,
      'warning': 0.6,
      'critical': 0.9,
      'offline': 1.0,
      'maintenance': 0.3
    };
    heat += statusHeat[server.status] || 0.2;
    
    // Metrics heat
    if (server.metrics) {
      heat += (server.metrics.cpuUsage || 0) / 100 * 0.3;
      heat += (server.metrics.memoryUsage || 0) / 100 * 0.3;
      heat += Math.min(1, (server.metrics.networkLatency || 0) / 500) * 0.2;
    }
    
    // Prediction heat
    if (server.prediction) {
      heat += server.prediction.risk * 0.4;
    }
    
    // Incident heat
    if (server.currentIncident) {
      heat += 0.3;
      if (server.currentIncident.businessImpact > 0.7) {
        heat += 0.2;
      }
    }
    
    return Math.min(1.0, heat);
  }

  // Enhanced anomaly detection
  getDatacenterAnomalies() {
    const anomalies = {};
    const datacenterMetrics = new Map();
    
    // Group servers by datacenter
    this.servers.forEach((server) => {
      const dc = server.datacenter || 'unknown';
      if (!datacenterMetrics.has(dc)) {
        datacenterMetrics.set(dc, {
          servers: [],
          avgCpu: 0,
          avgMemory: 0,
          avgLatency: 0,
          incidentCount: 0,
          highRiskServers: 0
        });
      }
      
      const dcData = datacenterMetrics.get(dc);
      dcData.servers.push(server);
      
      if (server.metrics) {
        dcData.avgCpu += server.metrics.cpuUsage || 0;
        dcData.avgMemory += server.metrics.memoryUsage || 0;
        dcData.avgLatency += server.metrics.networkLatency || 0;
      }
      
      if (server.currentIncident) {
        dcData.incidentCount++;
      }
      
      if (server.prediction && server.prediction.risk > 0.7) {
        dcData.highRiskServers++;
      }
    });
    
    // Calculate averages and detect anomalies
    datacenterMetrics.forEach((data, datacenter) => {
      const serverCount = data.servers.length;
      if (serverCount === 0) return;
      
      data.avgCpu /= serverCount;
      data.avgMemory /= serverCount;
      data.avgLatency /= serverCount;
      
      const anomalyIndicators = [];
      
      // High resource usage anomaly
      if (data.avgCpu > 80) {
        anomalyIndicators.push({
          type: 'high_cpu_usage',
          severity: 'high',
          value: data.avgCpu,
          description: `Datacenter ${datacenter} showing high CPU usage across servers`
        });
      }
      
      if (data.avgMemory > 85) {
        anomalyIndicators.push({
          type: 'high_memory_usage',
          severity: 'high',
          value: data.avgMemory,
          description: `Datacenter ${datacenter} showing high memory usage across servers`
        });
      }
      
      // Network latency anomaly
      if (data.avgLatency > 200) {
        anomalyIndicators.push({
          type: 'network_degradation',
          severity: 'medium',
          value: data.avgLatency,
          description: `Datacenter ${datacenter} experiencing network performance issues`
        });
      }
      
      // Incident clustering anomaly
      if (data.incidentCount > serverCount * 0.3) {
        anomalyIndicators.push({
          type: 'incident_clustering',
          severity: 'critical',
          value: data.incidentCount,
          description: `Datacenter ${datacenter} has unusual number of concurrent incidents`
        });
      }
      
      // High failure risk anomaly
      if (data.highRiskServers > serverCount * 0.4) {
        anomalyIndicators.push({
          type: 'failure_risk_spike',
          severity: 'high',
          value: data.highRiskServers,
          description: `Datacenter ${datacenter} has multiple servers at high failure risk`
        });
      }
      
      if (anomalyIndicators.length > 0) {
        anomalies[datacenter] = {
          datacenter,
          serverCount,
          anomalies: anomalyIndicators,
          overallSeverity: this.calculateOverallSeverity(anomalyIndicators),
          detectedAt: Date.now(),
          metrics: {
            avgCpu: data.avgCpu,
            avgMemory: data.avgMemory,
            avgLatency: data.avgLatency,
            incidentCount: data.incidentCount,
            highRiskServers: data.highRiskServers
          }
        };
      }
    });
    
    return anomalies;
  }

  calculateOverallSeverity(anomalyIndicators) {
    if (anomalyIndicators.some(a => a.severity === 'critical')) return 'critical';
    if (anomalyIndicators.some(a => a.severity === 'high')) return 'high';
    return 'medium';
  }

  // Enhanced incident tracking
  getActiveIncidents() {
    const incidents = [];
    
    this.servers.forEach((server) => {
      if (server.currentIncident) {
        incidents.push({
          ...server.currentIncident,
          serverId: server.id,
          serverName: server.name,
          serverType: server.type,
          datacenter: server.datacenter,
          region: server.region,
          duration: Date.now() - server.currentIncident.startTime,
          businessImpact: server.currentIncident.businessImpact || 0,
          contextual: server.currentIncident.contextual || false,
          prediction: server.prediction
        });
      }
    });
    
    // Sort by business impact and severity
    return incidents.sort((a, b) => {
      const severityOrder = { 'critical': 3, 'warning': 2, 'online': 1 };
      const aSeverity = severityOrder[a.severity] || 1;
      const bSeverity = severityOrder[b.severity] || 1;
      
      if (aSeverity !== bSeverity) return bSeverity - aSeverity;
      return (b.businessImpact || 0) - (a.businessImpact || 0);
    });
  }

  // Rest of the original methods...
  getServerDegradationRate(server) {
    const baseRates = {
      'db': 0.002,
      'cache': 0.001,
      'web': 0.0015,
      'api': 0.0018,
      'worker': 0.0025,
      'lb': 0.001,
      'queue': 0.002,
      'monitor': 0.0008
    };

    let rate = baseRates[server.type] || 0.0015;
    
    // Increase degradation if server has high failure risk
    if (server.prediction && server.prediction.risk > 0.6) {
      rate *= (1 + server.prediction.risk);
    }
    
    return rate;
  }

  degradeMetrics(metrics, degradationRate) {
    const noise = () => (Math.random() - 0.5) * 0.02;
    
    return {
      cpuUsage: Math.max(0, Math.min(100, (metrics?.cpuUsage || 30) + degradationRate * 50 + noise())),
      memoryUsage: Math.max(0, Math.min(100, (metrics?.memoryUsage || 50) + degradationRate * 30 + noise())),
      diskUsage: Math.max(0, Math.min(100, (metrics?.diskUsage || 20) + degradationRate * 20 + noise())),
      networkLatency: Math.max(1, (metrics?.networkLatency || 25) + degradationRate * 100 + noise()),
      storageIO: Math.max(100, (metrics?.storageIO || 2000) + degradationRate * 200 + noise())
    };
  }

  improveMetrics(metrics, improvementRate) {
    return {
      cpuUsage: Math.max(5, (metrics?.cpuUsage || 30) - improvementRate * 40),
      memoryUsage: Math.max(10, (metrics?.memoryUsage || 50) - improvementRate * 25),
      diskUsage: Math.max(0, (metrics?.diskUsage || 20) - improvementRate * 5),
      networkLatency: Math.max(1, (metrics?.networkLatency || 25) - improvementRate * 80),
      storageIO: Math.max(100, (metrics?.storageIO || 2000) - improvementRate * 150)
    };
  }

  calculateStatusFromMetrics(metrics, currentStatus) {
    const criticalThreshold = 90;
    const warningThreshold = 70;
    
    const isCritical = (metrics?.cpuUsage || 0) > criticalThreshold || 
                      (metrics?.memoryUsage || 0) > criticalThreshold ||
                      (metrics?.networkLatency || 0) > 500;
    
    const isWarning = (metrics?.cpuUsage || 0) > warningThreshold || 
                     (metrics?.memoryUsage || 0) > warningThreshold ||
                     (metrics?.networkLatency || 0) > 200;

    if (isCritical && currentStatus !== 'offline') return 'critical';
    if (isWarning && currentStatus === 'online') return 'warning';
    if (!isWarning && !isCritical && ['warning', 'critical'].includes(currentStatus)) return 'online';
    
    return currentStatus;
  }

  getRecoveryRate(server) {
    const baseRates = {
      'cache': 0.3,
      'web': 0.2,
      'api': 0.15,
      'lb': 0.25,
      'worker': 0.1,
      'db': 0.05,
      'queue': 0.1,
      'monitor': 0.2
    };

    let rate = baseRates[server.type] || 0.15;
    
    // Improve recovery rate if predictive interventions were applied
    if (server.predictiveInterventions && server.predictiveInterventions.length > 0) {
      rate *= 1.5;
    }
    
    return rate;
  }

  calculateRegionalBusinessLoad(region) {
    const now = Date.now();
    const trends = this.globalTrends.businessLoad;
    const timeZoneOffset = trends.timeZoneOffsets[region] || 0;
    
    const regionalTime = now + (timeZoneOffset * 60 * 60 * 1000);
    const hourOfDay = new Date(regionalTime).getHours();
    
    let businessMultiplier = 0.3;
    
    if (hourOfDay >= 9 && hourOfDay <= 17) {
      businessMultiplier = 0.8 + 0.2 * Math.sin((hourOfDay - 9) * Math.PI / 8);
      if (hourOfDay === 12) {
        businessMultiplier *= 0.7;
      }
    } else if (hourOfDay >= 18 && hourOfDay <= 22) {
      businessMultiplier = 0.5 + 0.3 * Math.exp(-(hourOfDay - 18) / 2);
    }
    
    const dayOfWeek = new Date(regionalTime).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      businessMultiplier *= 0.4;
    }
    
    return businessMultiplier;
  }

  applyRegionalLoadBalancing(server, regionalLoad) {
    const metrics = { ...server.metrics };
    
    const typeMultipliers = {
      'web': 1.5,
      'api': 1.3,
      'db': 1.1,
      'cache': 1.2,
      'queue': 1.0,
      'lb': 1.4,
      'worker': 0.8,
      'monitor': 1.0
    };
    
    const multiplier = typeMultipliers[server.type] || 1.0;
    const loadFactor = 0.7 + (regionalLoad * multiplier * 0.3);
    
    if (server.type === 'web' || server.type === 'api' || server.type === 'lb') {
      metrics.cpuUsage = Math.min(100, (metrics.cpuUsage || 30) * loadFactor);
      metrics.networkLatency = Math.max(1, (metrics.networkLatency || 25) * loadFactor);
    }
    
    if (server.type === 'db') {
      metrics.storageIO = Math.max(100, (metrics.storageIO || 2000) * loadFactor);
      metrics.memoryUsage = Math.min(100, (metrics.memoryUsage || 50) * loadFactor);
    }

    return metrics;
  }

  triggerSimpleIncident(server) {
    return this.triggerIntelligentIncident(server);
  }

  updateGlobalTrends() {
    const now = Date.now();
    
    const timeOfDay = (now % this.globalTrends.businessLoad.cycle) / this.globalTrends.businessLoad.cycle;
    const businessHourMultiplier = 0.5 + 0.5 * Math.sin(2 * Math.PI * timeOfDay - Math.PI/2) + 0.5;
    this.globalTrends.businessLoad.value = 0.7 + 0.3 * businessHourMultiplier;

    const dayOfWeek = (now % this.globalTrends.seasonalTrend.cycle) / this.globalTrends.seasonalTrend.cycle;
    const weekendReduction = dayOfWeek > 5/7 ? 0.6 : 1.0;
    this.globalTrends.seasonalTrend.value = weekendReduction;

    const momentum = this.globalTrends.networkCongestion.momentum;
    const volatility = this.globalTrends.networkCongestion.volatility;
    const change = (Math.random() - 0.5) * volatility;
    this.globalTrends.networkCongestion.value = 
      momentum * this.globalTrends.networkCongestion.value + (1 - momentum) * (1 + change);
    this.globalTrends.networkCongestion.value = Math.max(0.5, Math.min(2.0, this.globalTrends.networkCongestion.value));
  }

  evolveSystem() {
    const now = Date.now();
    const deltaTime = now - this.lastUpdate;
    this.lastUpdate = now;

    this.updateGlobalTrends();

    const globalFactors = {
      businessLoad: this.globalTrends.businessLoad.value * this.globalTrends.seasonalTrend.value,
      networkCongestion: this.globalTrends.networkCongestion.value,
      cascades: new Map(),
      businessHours: this.isBusinessHours(),
      criticalPeriod: this.isCriticalPeriod()
    };

    const evolvedServers = new Map();
    this.servers.forEach((server, id) => {
      const evolved = this.evolveServer(server, deltaTime, globalFactors);
      evolvedServers.set(id, evolved);
    });

    this.servers = evolvedServers;
    return Array.from(this.servers.values());
  }

  getServerStates() {
    return Array.from(this.servers.values());
  }

  getTrends() {
    return { 
      ...this.globalTrends,
      regionalLoads: Object.keys(this.globalTrends.businessLoad.timeZoneOffsets).reduce((acc, region) => {
        acc[region] = this.calculateRegionalBusinessLoad(region);
        return acc;
      }, {}),
      businessContext: {
        isBusinessHours: this.isBusinessHours(),
        isCriticalPeriod: this.isCriticalPeriod()
      }
    };
  }

  getSystemHealth() {
    const servers = Array.from(this.servers.values());
    const statusCounts = servers.reduce((acc, server) => {
      acc[server.status] = (acc[server.status] || 0) + 1;
      return acc;
    }, {});

    const total = servers.length || 1;
    
    // Calculate predictive health
    const highRiskServers = servers.filter(s => s.prediction && s.prediction.risk > 0.7).length;
    const avgFailureRisk = servers.reduce((sum, s) => sum + (s.prediction?.risk || 0), 0) / servers.length;
    
    return {
      healthy: ((statusCounts.online || 0) / total) * 100,
      warning: ((statusCounts.warning || 0) / total) * 100,
      critical: ((statusCounts.critical || 0) / total) * 100,
      offline: ((statusCounts.offline || 0) / total) * 100,
      maintenance: ((statusCounts.maintenance || 0) / total) * 100,
      totalServers: total,
      timestamp: Date.now(),
      
      // Enhanced health metrics
      predictiveHealth: {
        highRiskServers,
        avgFailureRisk,
        predictiveInterventions: servers.filter(s => s.predictiveInterventions?.length > 0).length
      },
      
      businessContext: {
        isBusinessHours: this.isBusinessHours(),
        isCriticalPeriod: this.isCriticalPeriod(),
        overallBusinessImpact: this.calculateOverallBusinessImpact(servers)
      }
    };
  }

  calculateOverallBusinessImpact(servers) {
    const incidentServers = servers.filter(s => s.currentIncident);
    if (incidentServers.length === 0) return 0;
    
    const totalImpact = incidentServers.reduce((sum, s) => 
      sum + (s.currentIncident.businessImpact || 0), 0
    );
    
    return totalImpact / servers.length;
  }
}

export const createDynamicEnterpriseSystem = (initialData) => {
  const evolution = new ServerEvolutionEngine(
    initialData.serverOverview || [], 
    {
      datacenters: initialData.datacenters || [],
      serverTypes: initialData.serverTypes || [],
      applications: initialData.applications || []
    }
  );

  let evolutionInterval = null;
  let callbackFunction = null;

  const systemWrapper = {
    ...initialData,
    serverOverview: [...(initialData.serverOverview || [])],
    lastEvolutionUpdate: Date.now(),

    startEvolution(intervalMs = 5000) {
      if (evolutionInterval) clearInterval(evolutionInterval);

      evolutionInterval = setInterval(() => {
        try {
          const evolvedServers = evolution.evolveSystem();
          const systemHealth = evolution.getSystemHealth();
          
          // Enhanced application health with real topology awareness
          const applicationHealth = new Map([
            ['user-service', { 
              health: 85 + Math.random() * 10, 
              status: Math.random() > 0.9 ? 'warning' : 'healthy',
              nodeDetails: { total: 3, healthy: 3, warning: 0, critical: 0, offline: 0 },
              prediction: { risk: Math.random() * 0.3, confidence: 0.8 }
            }],
            ['order-service', { 
              health: 78 + Math.random() * 15, 
              status: Math.random() > 0.8 ? 'warning' : 'healthy',
              nodeDetails: { total: 2, healthy: 2, warning: 0, critical: 0, offline: 0 },
              prediction: { risk: Math.random() * 0.4, confidence: 0.7 }
            }],
            ['payment-service', { 
              health: 92 + Math.random() * 8, 
              status: 'healthy',
              nodeDetails: { total: 2, healthy: 2, warning: 0, critical: 0, offline: 0 },
              prediction: { risk: Math.random() * 0.2, confidence: 0.9 }
            }]
          ]);
          
          systemWrapper.serverOverview = evolvedServers;
          systemWrapper.lastEvolutionUpdate = Date.now();
          
          if (callbackFunction) {
            callbackFunction(evolvedServers, systemHealth, applicationHealth, {
              trends: evolution.getTrends(),
              incidents: evolution.getActiveIncidents(),
              anomalies: evolution.getDatacenterAnomalies(),
              heatMaps: evolution.getHeatMaps(),
              degradation: { memoryLeaks: [], diskCreep: [] },
              intelligence: {
                predictiveInterventions: evolvedServers.filter(s => s.predictiveInterventions?.length > 0).length,
                autoHealingEvents: 0, // Would track actual healing events
                businessContext: evolution.contextualIntelligence
              }
            });
          }
        } catch (error) {
          console.error('Evolution step failed:', error);
        }
      }, intervalMs);
    },

    stopEvolution() {
      if (evolutionInterval) clearInterval(evolutionInterval);
      evolutionInterval = null;
    },

    setEvolutionCallback(callback) {
      callbackFunction = callback;
    },

    getSystemHealth: () => evolution.getSystemHealth(),
    getGlobalTrends: () => evolution.getTrends(),
    getApplicationHealth: () => {
      return new Map([
        ['user-service', { 
          health: 85 + Math.random() * 10, 
          status: 'healthy',
          nodeDetails: { total: 3, healthy: 3, warning: 0, critical: 0, offline: 0 }
        }],
        ['order-service', { 
          health: 78 + Math.random() * 15, 
          status: Math.random() > 0.8 ? 'warning' : 'healthy',
          nodeDetails: { total: 2, healthy: 2, warning: 0, critical: 0, offline: 0 }
        }]
      ]);
    },
    
    getDatacenterAnomalies: () => evolution.getDatacenterAnomalies(),
    getHeatMaps: () => evolution.getHeatMaps(),
    getActiveIncidents: () => evolution.getActiveIncidents(),
    getSlowDegradationStatus: () => ({ memoryLeaks: [], diskCreep: [] }),
    getInjectedIncidents: () => [],
    
    // Enhanced incident injection with intelligence
    injectIncident: (serverId, scenarioName, options = {}) => {
      if (import.meta?.env?.VITE_INFRA_DEBUG === 'true') {
        console.log(`Intelligent incident injection: ${scenarioName} on ${serverId}`);
      }
      const server = evolution.servers.get(serverId);
      if (server) {
        const businessImpact = evolution.calculateBusinessImpact(server, scenarioName);
        const incident = {
          id: `inj-${Date.now()}-${serverId}`,
          type: scenarioName,
          startTime: Date.now(),
          description: evolution.getIncidentDescription(scenarioName),
          injected: true,
          businessImpact,
          contextual: true
        };
        
        server.status = evolution.getIncidentSeverity(scenarioName, server);
        server.currentIncident = incident;
        
        // Trigger auto-healing for critical incidents
        if (server.status === 'critical' && businessImpact > 0.7) {
          setTimeout(() => {
            evolution.autoHealer.autoHeal(server, incident).then(result => {
              if (result.success) {
                if (import.meta?.env?.VITE_INFRA_DEBUG === 'true') {
                  console.log(`Auto-healed injected incident on ${server.name}`);
                }
              }
            });
          }, 5000);
        }
        
        setTimeout(() => {
          const currentServer = evolution.servers.get(serverId);
          if (currentServer && currentServer.currentIncident?.id === incident.id) {
            currentServer.status = 'online';
            currentServer.currentIncident = null;
          }
        }, options.duration || 60000);
        
        return {
          incidentId: incident.id,
          message: `Injected ${scenarioName} incident with business impact: ${businessImpact.toFixed(2)}`,
          estimatedDuration: options.duration || 60000,
          businessImpact,
          autoHealingEnabled: server.status === 'critical' && businessImpact > 0.7
        };
      }
      throw new Error(`Server ${serverId} not found`);
    },
    
    cancelIncident: (incidentId) => {
      if (import.meta?.env?.VITE_INFRA_DEBUG === 'true') {
        console.log(`Cancelled incident: ${incidentId}`);
      }
      evolution.servers.forEach((server) => {
        if (server.currentIncident?.id === incidentId) {
          server.status = 'online';
          server.currentIncident = null;
        }
      });
      return { message: `Incident ${incidentId} cancelled` };
    },
    
    updateServiceDiscovery: () => {},
    addServiceDiscovery: () => {},
    
    evolveOnce: () => {
      return evolution.evolveSystem();
    },
    
    // New intelligence methods
    getPredictiveAnalytics: () => {
      const servers = Array.from(evolution.servers.values());
      return servers.map(server => ({
        serverId: server.id,
        serverName: server.name,
        prediction: server.prediction || { risk: 0, confidence: 0 },
        recommendations: server.predictiveInterventions || []
      }));
    },
    
    getBusinessIntelligence: () => {
      return {
        isBusinessHours: evolution.isBusinessHours(),
        isCriticalPeriod: evolution.isCriticalPeriod(),
        overallBusinessImpact: evolution.calculateOverallBusinessImpact(Array.from(evolution.servers.values())),
        criticalBusinessServices: Array.from(evolution.servers.values())
          .filter(s => s.currentIncident && s.currentIncident.businessImpact > 0.7)
          .map(s => ({ id: s.id, name: s.name, impact: s.currentIncident.businessImpact }))
      };
    },
    
    getAutoHealingStatus: () => {
      const servers = Array.from(evolution.servers.values());
      return {
        healingCapableServers: servers.filter(s => s.lastHealed).length,
        recentHealingEvents: servers
          .filter(s => s.lastHealed && Date.now() - s.lastHealed < 300000) // 5 minutes
          .map(s => ({ serverId: s.id, serverName: s.name, healedAt: s.lastHealed })),
        predictiveInterventions: servers
          .filter(s => s.predictiveInterventions && s.predictiveInterventions.length > 0)
          .map(s => ({ 
            serverId: s.id, 
            serverName: s.name, 
            interventions: s.predictiveInterventions,
            appliedAt: s.lastIntervention
          }))
      };
    }
  };

  return systemWrapper;
};

// ---- OPTIONAL: explicit module-level start/stop for legacy callers ----
let __globalSystem = null;
export function start(intervalMs = 5000, seed = {}) {
  if (__globalSystem) stop();
  __globalSystem = createDynamicEnterpriseSystem(seed);
  __globalSystem.startEvolution(intervalMs);
  return __globalSystem;
}

export function stop() {
  if (__globalSystem) {
    try { __globalSystem.stopEvolution(); } catch {}
    __globalSystem = null;
  }
}