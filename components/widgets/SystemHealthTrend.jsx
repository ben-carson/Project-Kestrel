import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, AreaChart, Area, ReferenceLine, ReferenceArea, ComposedChart, Bar
} from 'recharts';
import {
  TrendingUp, TrendingDown, Brain, AlertTriangle, Activity, 
  Zap, Target, Clock, Shield, Gauge, Eye, Settings, 
  ChevronUp, ChevronDown, Cpu, Database, Network
} from 'lucide-react';

const IntelligentSystemHealthTrend = () => {
  // Live system state
  const [liveData, setLiveData] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [applicationHealth, setApplicationHealth] = useState(new Map());
  const [predictiveAnalytics, setPredictiveAnalytics] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [businessContext, setBusinessContext] = useState({});
  const [trends, setTrends] = useState({});
  
  // UI state
  const [selectedMetric, setSelectedMetric] = useState('overall');
  const [timeWindow, setTimeWindow] = useState('1h');
  const [showPredictions, setShowPredictions] = useState(true);
  const [showAnomalies, setShowAnomalies] = useState(true);
  const [alertMode, setAlertMode] = useState(false);
  const [viewMode, setViewMode] = useState('comprehensive');
  
  // System refs
  const evolutionSystemRef = useRef(null);
  const dataHistoryRef = useRef([]);
  const anomalyDetectorRef = useRef(null);

  // Initialize dynamic enterprise system
  const initializeDynamicSystem = useCallback(() => {
    // Create comprehensive mock enterprise data
    const mockServerData = {
      serverOverview: [
        // Production Critical Infrastructure
        { id: 'fw-dmz-01', name: 'Firewall DMZ 01', type: 'firewall', datacenter: 'dc-dallas-primary', 
          environment: 'production', criticality: 'critical',
          metrics: { cpuUsage: 35, memoryUsage: 45, networkLatency: 5, storageIO: 1200, diskUsage: 25 },
          specs: { cpu: 8, memory: 32, storage: 500 } },
        { id: 'lb-web-01', name: 'Load Balancer Web', type: 'lb', datacenter: 'dc-dallas-primary',
          environment: 'production', criticality: 'critical',
          metrics: { cpuUsage: 28, memoryUsage: 38, networkLatency: 12, storageIO: 800, diskUsage: 15 },
          specs: { cpu: 4, memory: 16, storage: 50 } },
        { id: 'web-01', name: 'Web Server 01', type: 'web', datacenter: 'dc-dallas-primary',
          environment: 'production', criticality: 'high',
          metrics: { cpuUsage: 52, memoryUsage: 67, networkLatency: 18, storageIO: 2200, diskUsage: 42 },
          specs: { cpu: 8, memory: 32, storage: 100 } },
        { id: 'web-02', name: 'Web Server 02', type: 'web', datacenter: 'dc-dallas-primary',
          environment: 'production', criticality: 'high', status: 'warning',
          metrics: { cpuUsage: 78, memoryUsage: 85, networkLatency: 35, storageIO: 3500, diskUsage: 68 },
          specs: { cpu: 8, memory: 32, storage: 100 } },
        { id: 'api-customer-01', name: 'Customer API 01', type: 'api', datacenter: 'dc-dallas-primary',
          environment: 'production', criticality: 'high',
          metrics: { cpuUsage: 42, memoryUsage: 58, networkLatency: 22, storageIO: 1900, diskUsage: 35 },
          specs: { cpu: 16, memory: 64, storage: 200 } },
        { id: 'api-payment-01', name: 'Payment API 01', type: 'api', datacenter: 'dc-dallas-primary',
          environment: 'production', criticality: 'critical',
          metrics: { cpuUsage: 35, memoryUsage: 48, networkLatency: 15, storageIO: 1500, diskUsage: 28 },
          specs: { cpu: 16, memory: 64, storage: 200 } },
        { id: 'api-order-02', name: 'Order API 02', type: 'api', datacenter: 'dc-dallas-primary',
          environment: 'production', criticality: 'high', status: 'critical',
          metrics: { cpuUsage: 92, memoryUsage: 95, networkLatency: 180, storageIO: 4500, diskUsage: 85 },
          specs: { cpu: 16, memory: 64, storage: 200 } },
        { id: 'cache-session-01', name: 'Session Cache 01', type: 'cache', datacenter: 'dc-dallas-primary',
          environment: 'production', criticality: 'high', status: 'warning',
          metrics: { cpuUsage: 25, memoryUsage: 82, networkLatency: 3, storageIO: 500, diskUsage: 15 },
          specs: { cpu: 8, memory: 128, storage: 50 } },
        { id: 'db-user-primary', name: 'User DB Primary', type: 'db', datacenter: 'dc-dallas-primary',
          environment: 'production', criticality: 'critical',
          metrics: { cpuUsage: 48, memoryUsage: 72, networkLatency: 8, storageIO: 2800, diskUsage: 55 },
          specs: { cpu: 24, memory: 128, storage: 2000 } },
        { id: 'db-payment-primary', name: 'Payment DB Primary', type: 'db', datacenter: 'dc-dallas-primary',
          environment: 'production', criticality: 'critical',
          metrics: { cpuUsage: 35, memoryUsage: 62, networkLatency: 6, storageIO: 2200, diskUsage: 48 },
          specs: { cpu: 24, memory: 128, storage: 2000 } },
        { id: 'db-inventory-01', name: 'Inventory DB 01', type: 'db', datacenter: 'dc-dallas-primary',
          environment: 'production', criticality: 'high', status: 'warning',
          metrics: { cpuUsage: 68, memoryUsage: 78, networkLatency: 45, storageIO: 3200, diskUsage: 72 },
          specs: { cpu: 24, memory: 128, storage: 2000 } },
        
        // DR and Development servers
        { id: 'fw-dr-01', name: 'Firewall DR 01', type: 'firewall', datacenter: 'dc-denver-dr',
          environment: 'disaster-recovery', criticality: 'high',
          metrics: { cpuUsage: 15, memoryUsage: 25, networkLatency: 8, storageIO: 600, diskUsage: 20 },
          specs: { cpu: 8, memory: 32, storage: 500 } },
        { id: 'web-dr-01', name: 'Web DR 01', type: 'web', datacenter: 'dc-denver-dr',
          environment: 'disaster-recovery', criticality: 'medium',
          metrics: { cpuUsage: 12, memoryUsage: 20, networkLatency: 12, storageIO: 400, diskUsage: 18 },
          specs: { cpu: 8, memory: 32, storage: 100 } },
        { id: 'db-dr-replica-01', name: 'DB DR Replica', type: 'db-replica', datacenter: 'dc-denver-dr',
          environment: 'disaster-recovery', criticality: 'high',
          metrics: { cpuUsage: 18, memoryUsage: 35, networkLatency: 15, storageIO: 1200, diskUsage: 45 },
          specs: { cpu: 16, memory: 96, storage: 2000 } },
        
        // Cloud infrastructure
        { id: 'aws-ecs-cluster-01', name: 'ECS Cluster 01', type: 'container-host', datacenter: 'dc-aws-east',
          environment: 'development', criticality: 'medium',
          metrics: { cpuUsage: 45, memoryUsage: 58, networkLatency: 25, storageIO: 1800, diskUsage: 35 },
          specs: { cpu: 32, memory: 128, storage: 500 } },
        { id: 'aws-rds-staging-01', name: 'RDS Staging 01', type: 'db', datacenter: 'dc-aws-east',
          environment: 'staging', criticality: 'low',
          metrics: { cpuUsage: 28, memoryUsage: 42, networkLatency: 18, storageIO: 1400, diskUsage: 32 },
          specs: { cpu: 24, memory: 128, storage: 2000 } }
      ]
    };

    // Initialize evolution system with enhanced capabilities
    evolutionSystemRef.current = createEnhancedEvolutionSystem(mockServerData);
    
    // Initialize anomaly detector
    anomalyDetectorRef.current = createAnomalyDetector();
    
    // Set up evolution callback
    evolutionSystemRef.current.setEvolutionCallback((servers, health, appHealth, analytics) => {
      const timestamp = Date.now();
      
      // Calculate comprehensive system metrics
      const aggregatedMetrics = calculateAggregatedMetrics(servers);
      const businessMetrics = calculateBusinessMetrics(servers, appHealth);
      const predictiveMetrics = calculatePredictiveMetrics(servers, analytics);
      
      // Create comprehensive data point
      const dataPoint = {
        timestamp,
        time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        
        // Core system health
        overallHealth: health.healthy || 0,
        cpuUsage: aggregatedMetrics.avgCpu,
        memoryUsage: aggregatedMetrics.avgMemory,
        networkLatency: aggregatedMetrics.avgLatency,
        storageIO: aggregatedMetrics.avgStorageIO,
        diskUsage: aggregatedMetrics.avgDisk,
        
        // Server status distribution
        healthyServers: health.healthy || 0,
        warningServers: health.warning || 0,
        criticalServers: health.critical || 0,
        offlineServers: health.offline || 0,
        
        // Business metrics
        businessImpact: businessMetrics.overallImpact,
        customerFacing: businessMetrics.customerFacingHealth,
        transactionThroughput: businessMetrics.transactionThroughput,
        responseTime: businessMetrics.avgResponseTime,
        
        // Predictive metrics
        failureRisk: predictiveMetrics.avgFailureRisk,
        predictionConfidence: predictiveMetrics.avgConfidence,
        autoHealingEvents: analytics.autoHealingEvents || 0,
        
        // Infrastructure tiers
        dmzHealth: calculateTierHealth(servers, 'dmz'),
        webTierHealth: calculateTierHealth(servers, 'web-tier'),
        appTierHealth: calculateTierHealth(servers, 'app-tier'),
        dataTierHealth: calculateTierHealth(servers, 'data-tier'),
        
        // Regional distribution
        dallasHealth: calculateDatacenterHealth(servers, 'dc-dallas-primary'),
        denverHealth: calculateDatacenterHealth(servers, 'dc-denver-dr'),
        awsHealth: calculateDatacenterHealth(servers, 'dc-aws-east'),
        
        // Security and compliance
        securityScore: calculateSecurityScore(servers),
        complianceScore: calculateComplianceScore(servers)
      };
      
      // Update live data with rolling window
      setLiveData(prevData => {
        const newData = [...prevData, dataPoint];
        // Keep last 500 data points (about 25 minutes at 3-second intervals)
        return newData.slice(-500);
      });
      
      // Detect anomalies
      const detectedAnomalies = anomalyDetectorRef.current.detectAnomalies(dataPoint, dataHistoryRef.current);
      if (detectedAnomalies.length > 0) {
        setAnomalies(prev => [...prev.slice(-10), ...detectedAnomalies]);
      }
      
      // Update other state
      setSystemHealth(health);
      setApplicationHealth(appHealth);
      setPredictiveAnalytics(analytics.predictiveAnalytics || []);
      setBusinessContext(analytics.businessContext || {});
      setTrends(analytics.trends || {});
      
      // Store in history reference
      dataHistoryRef.current = newData.slice(-100); // Keep last 100 points for anomaly detection
    });
    
    // Start the evolution
    evolutionSystemRef.current.startEvolution(3000); // 3-second intervals for smooth visualization
    
    return () => {
      if (evolutionSystemRef.current) {
        evolutionSystemRef.current.stopEvolution();
      }
    };
  }, []);

  // Enhanced evolution system
  const createEnhancedEvolutionSystem = (initialData) => {
    let servers = [...initialData.serverOverview];
    let evolutionCallback = null;
    let evolutionInterval = null;
    let lastUpdate = Date.now();

    const evolveServer = (server, deltaTime, globalContext) => {
      const timeFactor = deltaTime / 1000;
      let newServer = { ...server };
      
      // Business hours impact
      const businessHours = isBusinessHours();
      const loadMultiplier = businessHours ? 1.4 : 0.7;
      
      // Environment-based evolution rates
      const envMultipliers = {
        'production': 1.0,
        'staging': 0.6,
        'development': 0.4,
        'disaster-recovery': 0.3
      };
      const envMultiplier = envMultipliers[server.environment] || 1.0;
      
      // Criticality-based stability
      const criticalityMultipliers = {
        'critical': 0.8, // More stable
        'high': 1.0,
        'medium': 1.2,
        'low': 1.5
      };
      const criticalityMultiplier = criticalityMultipliers[server.criticality] || 1.0;
      
      if (server.status === 'online' || !server.status) {
        // Normal evolution with realistic patterns
        const volatility = 0.08 * timeFactor * loadMultiplier * envMultiplier * criticalityMultiplier;
        
        newServer.metrics = {
          ...server.metrics,
          cpuUsage: Math.max(5, Math.min(95, 
            server.metrics.cpuUsage + (Math.random() - 0.45) * 20 * volatility
          )),
          memoryUsage: Math.max(10, Math.min(95,
            server.metrics.memoryUsage + (Math.random() - 0.5) * 10 * volatility
          )),
          networkLatency: Math.max(1, 
            server.metrics.networkLatency + (Math.random() - 0.5) * 30 * volatility
          ),
          storageIO: Math.max(100,
            server.metrics.storageIO + (Math.random() - 0.5) * 800 * volatility
          ),
          diskUsage: Math.max(5, Math.min(95,
            server.metrics.diskUsage + (Math.random() - 0.5) * 2 * volatility
          ))
        };
        
        // Status degradation logic
        const { cpuUsage, memoryUsage, diskUsage, networkLatency } = newServer.metrics;
        
        if (cpuUsage > 90 || memoryUsage > 90 || diskUsage > 90 || networkLatency > 200) {
          newServer.status = 'critical';
        } else if (cpuUsage > 75 || memoryUsage > 75 || diskUsage > 75 || networkLatency > 100) {
          newServer.status = 'warning';
        } else {
          newServer.status = 'online';
        }
        
      } else if (server.status === 'warning') {
        // Warning state - can recover or degrade
        if (Math.random() < 0.15 * timeFactor) {
          if (Math.random() < 0.65) {
            // Recovery
            newServer.status = 'online';
            newServer.metrics = {
              ...server.metrics,
              cpuUsage: Math.max(5, server.metrics.cpuUsage - 15),
              memoryUsage: Math.max(10, server.metrics.memoryUsage - 12),
              networkLatency: Math.max(1, server.metrics.networkLatency - 20),
              diskUsage: Math.max(5, server.metrics.diskUsage - 5)
            };
          } else {
            // Degradation
            newServer.status = 'critical';
          }
        }
      } else if (server.status === 'critical') {
        // Critical state - recovery or auto-healing
        if (Math.random() < 0.2 * timeFactor) {
          // Auto-healing
          newServer.status = 'online';
          newServer.metrics = {
            ...server.metrics,
            cpuUsage: Math.max(5, server.metrics.cpuUsage * 0.5),
            memoryUsage: Math.max(10, server.metrics.memoryUsage * 0.6),
            networkLatency: Math.max(1, server.metrics.networkLatency * 0.7),
            diskUsage: Math.max(5, server.metrics.diskUsage * 0.9)
          };
          newServer.lastHealed = Date.now();
          newServer.autoHealingEvent = {
            timestamp: Date.now(),
            reason: 'Automatic recovery from critical state',
            actions: ['Service restart', 'Memory cleanup', 'Cache flush']
          };
        }
      }
      
      // Generate prediction
      newServer.prediction = generateEnhancedPrediction(newServer, globalContext);
      
      return newServer;
    };

    const generateEnhancedPrediction = (server, context) => {
      const { cpuUsage, memoryUsage, diskUsage, networkLatency } = server.metrics;
      
      // Multi-factor risk assessment
      let risk = 0;
      
      // Resource utilization risk
      if (cpuUsage > 80) risk += 0.3 * (cpuUsage - 80) / 20;
      if (memoryUsage > 80) risk += 0.4 * (memoryUsage - 80) / 20;
      if (diskUsage > 80) risk += 0.2 * (diskUsage - 80) / 20;
      if (networkLatency > 100) risk += 0.1 * Math.min(1, (networkLatency - 100) / 200);
      
      // Status-based risk
      if (server.status === 'warning') risk += 0.3;
      if (server.status === 'critical') risk += 0.6;
      
      // Business context risk
      if (context.businessHours && server.environment === 'production') risk += 0.1;
      if (server.criticality === 'critical') risk += 0.1;
      
      // Historical pattern risk (simplified)
      if (server.lastHealed && Date.now() - server.lastHealed < 600000) risk -= 0.2; // Recently healed
      
      const confidence = 0.6 + Math.random() * 0.4;
      const timeToFailure = risk > 0.6 ? (30000 + Math.random() * 600000) : null; // 30s to 10min
      
      return { 
        risk: Math.max(0, Math.min(1, risk)), 
        confidence, 
        timeToFailure,
        factors: {
          resourceUtilization: (cpuUsage + memoryUsage + diskUsage) / 300,
          networkPerformance: Math.min(1, networkLatency / 500),
          systemStability: server.status === 'critical' ? 0.2 : server.status === 'warning' ? 0.6 : 0.9,
          businessContext: context.businessHours ? 0.7 : 0.9
        }
      };
    };

    const isBusinessHours = () => {
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();
      return day >= 1 && day <= 5 && hour >= 9 && hour <= 17;
    };

    const evolveSystem = () => {
      const now = Date.now();
      const deltaTime = now - lastUpdate;
      lastUpdate = now;

      const globalContext = {
        businessHours: isBusinessHours(),
        timestamp: now,
        systemLoad: servers.reduce((sum, s) => sum + (s.metrics?.cpuUsage || 0), 0) / servers.length
      };

      servers = servers.map(server => evolveServer(server, deltaTime, globalContext));

      // Calculate system health
      const statusCounts = servers.reduce((acc, server) => {
        const status = server.status || 'online';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      const total = servers.length || 1;
      const health = {
        healthy: ((statusCounts.online || 0) / total) * 100,
        warning: ((statusCounts.warning || 0) / total) * 100,
        critical: ((statusCounts.critical || 0) / total) * 100,
        offline: ((statusCounts.offline || 0) / total) * 100,
        totalServers: total,
        timestamp: now
      };

      // Generate application health
      const appHealth = new Map([
        ['customer-portal', {
          health: 85 + Math.random() * 10 - (statusCounts.critical * 5),
          status: statusCounts.critical > 0 ? 'critical' : statusCounts.warning > 1 ? 'warning' : 'healthy',
          responseTime: 150 + Math.random() * 100 + (statusCounts.critical * 200),
          nodeDetails: { total: 3, healthy: 3 - statusCounts.critical, warning: statusCounts.warning, critical: statusCounts.critical, offline: 0 }
        }],
        ['payment-processor', {
          health: 92 + Math.random() * 8 - (statusCounts.critical * 8),
          status: statusCounts.critical > 1 ? 'critical' : 'healthy',
          responseTime: 80 + Math.random() * 50 + (statusCounts.critical * 100),
          nodeDetails: { total: 2, healthy: 2 - statusCounts.critical, warning: 0, critical: Math.min(statusCounts.critical, 2), offline: 0 }
        }],
        ['order-management', {
          health: 78 + Math.random() * 15 - (statusCounts.warning * 3),
          status: statusCounts.warning > 2 ? 'warning' : 'healthy',
          responseTime: 200 + Math.random() * 150 + (statusCounts.warning * 100),
          nodeDetails: { total: 2, healthy: 2 - statusCounts.warning, warning: Math.min(statusCounts.warning, 2), critical: 0, offline: 0 }
        }]
      ]);

      const analytics = {
        predictiveAnalytics: servers.map(s => ({
          serverId: s.id,
          serverName: s.name,
          prediction: s.prediction || { risk: 0, confidence: 0 },
          recommendations: s.prediction?.risk > 0.7 ? ['Scale resources', 'Investigate performance'] : []
        })),
        businessContext: globalContext,
        autoHealingEvents: servers.filter(s => s.autoHealingEvent).length,
        trends: {
          businessHours: globalContext.businessHours,
          systemLoad: globalContext.systemLoad
        }
      };

      if (evolutionCallback) {
        evolutionCallback(servers, health, appHealth, analytics);
      }
    };

    return {
      startEvolution: (intervalMs = 3000) => {
        if (evolutionInterval) clearInterval(evolutionInterval);
        evolutionInterval = setInterval(evolveSystem, intervalMs);
      },
      
      stopEvolution: () => {
        if (evolutionInterval) clearInterval(evolutionInterval);
        evolutionInterval = null;
      },
      
      setEvolutionCallback: (callback) => {
        evolutionCallback = callback;
      },
      
      injectIncident: (serverId, scenarioName) => {
        const server = servers.find(s => s.id === serverId);
        if (server) {
          server.status = 'critical';
          server.metrics.cpuUsage = 95;
          server.metrics.memoryUsage = 90;
          return { message: `Injected ${scenarioName} on ${server.name}` };
        }
        return { error: 'Server not found' };
      }
    };
  };

  // Helper calculation functions
  const calculateAggregatedMetrics = (servers) => {
    if (!servers.length) return { avgCpu: 0, avgMemory: 0, avgLatency: 0, avgStorageIO: 0, avgDisk: 0 };
    
    const totals = servers.reduce((acc, server) => {
      acc.cpu += server.metrics?.cpuUsage || 0;
      acc.memory += server.metrics?.memoryUsage || 0;
      acc.latency += server.metrics?.networkLatency || 0;
      acc.storageIO += server.metrics?.storageIO || 0;
      acc.disk += server.metrics?.diskUsage || 0;
      return acc;
    }, { cpu: 0, memory: 0, latency: 0, storageIO: 0, disk: 0 });
    
    const count = servers.length;
    return {
      avgCpu: totals.cpu / count,
      avgMemory: totals.memory / count,
      avgLatency: totals.latency / count,
      avgStorageIO: totals.storageIO / count,
      avgDisk: totals.disk / count
    };
  };

  const calculateBusinessMetrics = (servers, applicationHealth) => {
    const productionServers = servers.filter(s => s.environment === 'production');
    const customerFacingServers = productionServers.filter(s => 
      ['web', 'api', 'lb'].includes(s.type)
    );
    
    const customerFacingHealth = customerFacingServers.length > 0 ?
      customerFacingServers.reduce((sum, s) => {
        const statusScore = { online: 100, warning: 60, critical: 20, offline: 0 };
        return sum + (statusScore[s.status] || 50);
      }, 0) / customerFacingServers.length : 100;
    
    const avgResponseTime = Array.from(applicationHealth.values())
      .reduce((sum, app) => sum + (app.responseTime || 200), 0) / applicationHealth.size;
    
    return {
      overallImpact: productionServers.filter(s => s.status === 'critical').length * 0.15,
      customerFacingHealth,
      transactionThroughput: 1000 - (productionServers.filter(s => s.status === 'critical').length * 200),
      avgResponseTime
    };
  };

  const calculatePredictiveMetrics = (servers) => {
    const predictions = servers.map(s => s.prediction).filter(Boolean);
    if (!predictions.length) return { avgFailureRisk: 0, avgConfidence: 0 };
    
    return {
      avgFailureRisk: predictions.reduce((sum, p) => sum + p.risk, 0) / predictions.length,
      avgConfidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
    };
  };

  const calculateTierHealth = (servers, tier) => {
    const tierServers = servers.filter(s => s.tier === tier);
    if (!tierServers.length) return 100;
    
    return tierServers.reduce((sum, s) => {
      const statusScore = { online: 100, warning: 60, critical: 20, offline: 0 };
      return sum + (statusScore[s.status] || 50);
    }, 0) / tierServers.length;
  };

  const calculateDatacenterHealth = (servers, datacenter) => {
    const dcServers = servers.filter(s => s.datacenter === datacenter);
    if (!dcServers.length) return 100;
    
    return dcServers.reduce((sum, s) => {
      const statusScore = { online: 100, warning: 60, critical: 20, offline: 0 };
      return sum + (statusScore[s.status] || 50);
    }, 0) / dcServers.length;
  };

  const calculateSecurityScore = (servers) => {
    const securityServers = servers.filter(s => ['firewall', 'waf'].includes(s.type));
    if (!securityServers.length) return 100;
    
    return securityServers.reduce((sum, s) => {
      const statusScore = { online: 100, warning: 70, critical: 30, offline: 0 };
      return sum + (statusScore[s.status] || 50);
    }, 0) / securityServers.length;
  };

  const calculateComplianceScore = (servers) => {
    const productionServers = servers.filter(s => s.environment === 'production');
    const criticalServers = productionServers.filter(s => s.criticality === 'critical');
    const healthyCritical = criticalServers.filter(s => s.status === 'online').length;
    
    return criticalServers.length > 0 ? (healthyCritical / criticalServers.length) * 100 : 100;
  };

  // Enhanced anomaly detector
  const createAnomalyDetector = () => {
    const anomalyThresholds = {
      cpuSpike: { threshold: 20, window: 5 },
      memoryLeak: { threshold: 15, window: 10 },
      latencySpike: { threshold: 50, window: 3 },
      healthDrop: { threshold: 25, window: 5 }
    };

    const detectAnomalies = (currentData, historicalData) => {
      const anomalies = [];
      
      if (historicalData.length < 5) return anomalies;
      
      const recent = historicalData.slice(-anomalyThresholds.cpuSpike.window);
      const avgCpu = recent.reduce((sum, d) => sum + d.cpuUsage, 0) / recent.length;
      const avgMemory = recent.reduce((sum, d) => sum + d.memoryUsage, 0) / recent.length;
      const avgLatency = recent.reduce((sum, d) => sum + d.networkLatency, 0) / recent.length;
      const avgHealth = recent.reduce((sum, d) => sum + d.overallHealth, 0) / recent.length;
      
      // CPU spike detection
      if (currentData.cpuUsage - avgCpu > anomalyThresholds.cpuSpike.threshold) {
        anomalies.push({
          id: `cpu-spike-${Date.now()}`,
          type: 'cpu_spike',
          severity: 'high',
          message: `CPU usage spiked by ${Math.round(currentData.cpuUsage - avgCpu)}%`,
          timestamp: currentData.timestamp,
          value: currentData.cpuUsage,
          baseline: avgCpu
        });
      }
      
      // Memory leak detection
      if (currentData.memoryUsage - avgMemory > anomalyThresholds.memoryLeak.threshold) {
        anomalies.push({
          id: `memory-leak-${Date.now()}`,
          type: 'memory_leak',
          severity: 'high',
          message: `Memory usage increased by ${Math.round(currentData.memoryUsage - avgMemory)}%`,
          timestamp: currentData.timestamp,
          value: currentData.memoryUsage,
          baseline: avgMemory
        });
      }
      
      // Latency spike detection
      if (currentData.networkLatency - avgLatency > anomalyThresholds.latencySpike.threshold) {
        anomalies.push({
          id: `latency-spike-${Date.now()}`,
          type: 'latency_spike',
          severity: 'medium',
          message: `Network latency increased by ${Math.round(currentData.networkLatency - avgLatency)}ms`,
          timestamp: currentData.timestamp,
          value: currentData.networkLatency,
          baseline: avgLatency
        });
      }
      
      // Health drop detection
      if (avgHealth - currentData.overallHealth > anomalyThresholds.healthDrop.threshold) {
        anomalies.push({
          id: `health-drop-${Date.now()}`,
          type: 'health_degradation',
          severity: 'critical',
          message: `System health dropped by ${Math.round(avgHealth - currentData.overallHealth)}%`,
          timestamp: currentData.timestamp,
          value: currentData.overallHealth,
          baseline: avgHealth
        });
      }
      
      return anomalies;
    };

    return { detectAnomalies };
  };

  // Filter data based on time window
  const getFilteredData = useMemo(() => {
    if (!liveData.length) return [];
    
    const now = Date.now();
    const timeWindows = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000
    };
    
    const windowMs = timeWindows[timeWindow] || timeWindows['1h'];
    const cutoff = now - windowMs;
    
    return liveData.filter(d => d.timestamp >= cutoff);
  }, [liveData, timeWindow]);

  // Get metrics based on selected metric type
  const getMetricsConfig = useMemo(() => {
    const configs = {
      overall: {
        title: 'Overall System Health',
        lines: [
          { key: 'overallHealth', name: 'System Health %', color: '#10b981', yAxisId: 'left' },
          { key: 'cpuUsage', name: 'CPU %', color: '#3b82f6', yAxisId: 'left' },
          { key: 'memoryUsage', name: 'Memory %', color: '#8b5cf6', yAxisId: 'left' },
          { key: 'networkLatency', name: 'Latency (ms)', color: '#f59e0b', yAxisId: 'right' }
        ]
      },
      business: {
        title: 'Business Impact Metrics',
        lines: [
          { key: 'customerFacing', name: 'Customer Facing %', color: '#10b981', yAxisId: 'left' },
          { key: 'responseTime', name: 'Response Time (ms)', color: '#ef4444', yAxisId: 'right' },
          { key: 'transactionThroughput', name: 'Throughput', color: '#3b82f6', yAxisId: 'right' },
          { key: 'businessImpact', name: 'Business Impact', color: '#f59e0b', yAxisId: 'left', multiplier: 100 }
        ]
      },
      predictive: {
        title: 'Predictive Analytics',
        lines: [
          { key: 'failureRisk', name: 'Failure Risk', color: '#ef4444', yAxisId: 'left', multiplier: 100 },
          { key: 'predictionConfidence', name: 'Confidence', color: '#10b981', yAxisId: 'left', multiplier: 100 },
          { key: 'autoHealingEvents', name: 'Auto-Healing Events', color: '#8b5cf6', yAxisId: 'right' }
        ]
      },
      infrastructure: {
        title: 'Infrastructure Tiers',
        lines: [
          { key: 'dmzHealth', name: 'DMZ Health %', color: '#ef4444', yAxisId: 'left' },
          { key: 'webTierHealth', name: 'Web Tier %', color: '#3b82f6', yAxisId: 'left' },
          { key: 'appTierHealth', name: 'App Tier %', color: '#10b981', yAxisId: 'left' },
          { key: 'dataTierHealth', name: 'Data Tier %', color: '#f59e0b', yAxisId: 'left' }
        ]
      },
      regional: {
        title: 'Regional Health Distribution',
        lines: [
          { key: 'dallasHealth', name: 'Dallas Primary %', color: '#3b82f6', yAxisId: 'left' },
          { key: 'denverHealth', name: 'Denver DR %', color: '#8b5cf6', yAxisId: 'left' },
          { key: 'awsHealth', name: 'AWS Cloud %', color: '#f59e0b', yAxisId: 'left' }
        ]
      },
      security: {
        title: 'Security & Compliance',
        lines: [
          { key: 'securityScore', name: 'Security Score %', color: '#ef4444', yAxisId: 'left' },
          { key: 'complianceScore', name: 'Compliance Score %', color: '#10b981', yAxisId: 'left' }
        ]
      }
    };
    
    return configs[selectedMetric] || configs.overall;
  }, [selectedMetric]);

  // Check for alert conditions
  const checkAlertConditions = useMemo(() => {
    if (!liveData.length) return false;
    
    const latest = liveData[liveData.length - 1];
    const alertConditions = [
      latest.overallHealth < 70,
      latest.criticalServers > 0,
      latest.failureRisk > 0.8,
      anomalies.filter(a => Date.now() - a.timestamp < 300000).length > 0 // Anomalies in last 5 minutes
    ];
    
    return alertConditions.some(condition => condition);
  }, [liveData, anomalies]);

  // Initialize system
  useEffect(() => {
    const cleanup = initializeDynamicSystem();
    return cleanup;
  }, [initializeDynamicSystem]);

  // Alert mode detection
  useEffect(() => {
    setAlertMode(checkAlertConditions);
  }, [checkAlertConditions]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600 dark:text-gray-400">{entry.name}:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
              {entry.name.includes('%') ? '%' : entry.name.includes('ms') ? 'ms' : ''}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Inject test incident
  const injectTestIncident = () => {
    if (evolutionSystemRef.current) {
      const scenarios = ['cpu_overload', 'memory_exhaustion', 'network_degradation', 'disk_full'];
      const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      
      // For demo, we'll just trigger a system-wide stress
      const message = evolutionSystemRef.current.injectIncident('api-order-02', scenario);
      console.log('Injected incident:', message);
    }
  };

  return (
    <div className={`h-full flex flex-col transition-all duration-300 ${
      alertMode ? 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20' :
      businessContext.isBusinessHours ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20' :
      'bg-gradient-to-br from-slate-50 to-gray-50 dark:from-gray-900 dark:to-gray-800'
    }`}>
      
      {/* Enhanced Header */}
      <div className={`flex items-center justify-between p-4 border-b transition-all duration-300 ${
        alertMode ? 'bg-red-100/50 border-red-200 dark:bg-red-900/30 dark:border-red-700' :
        'bg-white/80 border-gray-200 dark:bg-gray-800/80 dark:border-gray-700'
      } backdrop-blur-sm`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className={`w-6 h-6 transition-colors duration-300 ${
              alertMode ? 'text-red-500' : 'text-blue-500'
            }`} />
            {alertMode && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Intelligent System Health Monitor
              {businessContext.isBusinessHours && !alertMode && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  🕐 Business Hours
                </span>
              )}
              {alertMode && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full animate-pulse">
                  🚨 Alert Mode
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Live Enterprise Analytics • {liveData.length} data points • 
              {systemHealth.totalServers || 0} servers monitored
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Health Status */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm">
            <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              systemHealth.critical > 0 ? 'bg-red-500 animate-pulse' :
              systemHealth.warning > 0 ? 'bg-yellow-500' : 'bg-green-500'
            }`} />
            <span className="text-sm font-medium">
              {Math.round(systemHealth.healthy || 0)}% System Health
            </span>
          </div>

          {/* Metric Selector */}
          <select 
            value={selectedMetric} 
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="text-sm bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1"
          >
            <option value="overall">Overall Health</option>
            <option value="business">Business Impact</option>
            <option value="predictive">AI Predictions</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="regional">Regional View</option>
            <option value="security">Security & Compliance</option>
          </select>

          {/* Time Window */}
          <select 
            value={timeWindow} 
            onChange={(e) => setTimeWindow(e.target.value)}
            className="text-sm bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1"
          >
            <option value="5m">Last 5 Minutes</option>
            <option value="15m">Last 15 Minutes</option>
            <option value="1h">Last Hour</option>
            <option value="4h">Last 4 Hours</option>
            <option value="24h">Last 24 Hours</option>
          </select>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPredictions(!showPredictions)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                showPredictions ? 'bg-purple-100 text-purple-600 shadow-sm' : 'bg-gray-100 text-gray-600'
              }`}
              title="Toggle Predictions"
            >
              <Brain className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowAnomalies(!showAnomalies)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                showAnomalies ? 'bg-orange-100 text-orange-600 shadow-sm' : 'bg-gray-100 text-gray-600'
              }`}
              title="Toggle Anomalies"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
            
            <button
              onClick={injectTestIncident}
              className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all duration-200 shadow-sm"
              title="Inject Test Incident"
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="flex-1 p-4">
        <div className="h-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              {getMetricsConfig.title}
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                {getFilteredData.length} points
              </div>
            </h4>
          </div>
          
          <div className="p-4 h-80">
            {getFilteredData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={getFilteredData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                  <XAxis 
                    dataKey="time" 
                    strokeOpacity={0.6} 
                    fontSize={12}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    yAxisId="left" 
                    domain={[0, 100]} 
                    strokeOpacity={0.6} 
                    fontSize={12}
                    label={{ value: '%', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    strokeOpacity={0.6} 
                    fontSize={12}
                    label={{ value: 'ms / ops', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    iconType="line"
                  />
                  
                  {/* Anomaly highlighting */}
                  {showAnomalies && anomalies.map(anomaly => {
                    const dataPoint = getFilteredData.find(d => Math.abs(d.timestamp - anomaly.timestamp) < 10000);
                    if (!dataPoint) return null;
                    
                    return (
                      <ReferenceLine
                        key={anomaly.id}
                        x={dataPoint.time}
                        stroke="#ef4444"
                        strokeDasharray="2 2"
                        strokeOpacity={0.7}
                      />
                    );
                  })}
                  
                  {/* Business hours highlighting */}
                  {businessContext.isBusinessHours && (
                    <ReferenceArea
                      x1={getFilteredData[0]?.time}
                      x2={getFilteredData[getFilteredData.length - 1]?.time}
                      fill="#3b82f6"
                      fillOpacity={0.05}
                    />
                  )}
                  
                  {/* Main metric lines */}
                  {getMetricsConfig.lines.map(line => (
                    <Line
                      key={line.key}
                      yAxisId={line.yAxisId}
                      type="monotone"
                      dataKey={line.key}
                      name={line.name}
                      stroke={line.color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, stroke: line.color, strokeWidth: 2 }}
                    />
                  ))}
                  
                  {/* Prediction overlay */}
                  {showPredictions && selectedMetric === 'predictive' && (
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="failureRisk"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.1}
                      strokeDasharray="5 5"
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3 animate-pulse" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Initializing live data stream...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Bottom Panel */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Real-time Metrics */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              Real-time Metrics
            </h4>
            <div className="space-y-2">
              {liveData.length > 0 && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">System Health</span>
                    <span className={`font-bold ${
                      liveData[liveData.length - 1].overallHealth > 80 ? 'text-green-600' :
                      liveData[liveData.length - 1].overallHealth > 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {Math.round(liveData[liveData.length - 1].overallHealth)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">CPU Average</span>
                    <span className="font-medium">
                      {Math.round(liveData[liveData.length - 1].cpuUsage)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Memory Average</span>
                    <span className="font-medium">
                      {Math.round(liveData[liveData.length - 1].memoryUsage)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Network Latency</span>
                    <span className="font-medium">
                      {Math.round(liveData[liveData.length - 1].networkLatency)}ms
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* AI Predictions */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI Predictions
            </h4>
            <div className="space-y-2">
              {predictiveAnalytics.slice(0, 3).map((prediction, i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {prediction.serverName}
                    </span>
                    <span className={`text-xs font-bold ${
                      prediction.prediction.risk > 0.7 ? 'text-red-600' :
                      prediction.prediction.risk > 0.5 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {Math.round(prediction.prediction.risk * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full transition-all duration-500 ${
                        prediction.prediction.risk > 0.7 ? 'bg-red-500' :
                        prediction.prediction.risk > 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${prediction.prediction.risk * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Anomalies */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Recent Anomalies
            </h4>
            <div className="space-y-2 max-h-24 overflow-y-auto">
              {anomalies.slice(-3).map((anomaly, i) => (
                <div key={i} className="text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      anomaly.severity === 'critical' ? 'bg-red-500' :
                      anomaly.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                    }`} />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {anomaly.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 ml-3.5">
                    {anomaly.message}
                  </div>
                </div>
              ))}
              {anomalies.length === 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No anomalies detected
                </div>
              )}
            </div>
          </div>

          {/* Application Health */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Application Health
            </h4>
            <div className="space-y-2">
              {Array.from(applicationHealth.entries()).slice(0, 3).map(([name, health]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {name.replace('-', ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      health.status === 'healthy' ? 'bg-green-500' :
                      health.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm font-medium">
                      {Math.round(health.health)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {alertMode && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg border border-red-600 animate-pulse">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">
                Critical system conditions detected - immediate attention required
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelligentSystemHealthTrend;