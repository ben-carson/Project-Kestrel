import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Server, Database, Globe, Zap, Router, Cloud, Shield, Monitor, 
  Cpu, HardDrive, Activity, AlertTriangle, CheckCircle, XCircle, 
  Wifi, Settings, Eye, Layers, Filter, TrendingUp, Gauge, Brain, 
  Zap as Lightning, Timer, Target
} from 'lucide-react';

const EnterpriseNetworkTopology = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const evolutionSystemRef = useRef(null);
  
  const [selectedNode, setSelectedNode] = useState(null);
  const [viewMode, setViewMode] = useState('intelligent');
  const [showTrafficFlow, setShowTrafficFlow] = useState(true);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [showPredictive, setShowPredictive] = useState(true);
  const [filterTier, setFilterTier] = useState('all');
  const [autoHealing, setAutoHealing] = useState(true);
  
  // Live system state
  const [liveServers, setLiveServers] = useState([]);
  const [liveConnections, setLiveConnections] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [applicationHealth, setApplicationHealth] = useState(new Map());
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [predictiveAnalytics, setPredictiveAnalytics] = useState([]);
  const [businessIntelligence, setBusinessIntelligence] = useState({});
  const [autoHealingEvents, setAutoHealingEvents] = useState([]);
  
  // Visualization state
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [particles, setParticles] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [time, setTime] = useState(0);

  const CANVAS_WIDTH = 1400;
  const CANVAS_HEIGHT = 900;
  const NODE_RADIUS = 32;

  // Initialize the dynamic enterprise system
  const initializeDynamicSystem = useCallback(() => {
    // Mock the enterprise data structure from your files
    const mockServerData = {
      serverOverview: [
        // Dallas Primary DC - Critical Infrastructure
        { id: 'fw-dmz-01', name: 'Firewall DMZ 01', type: 'firewall', datacenter: 'dc-dallas-primary', 
          tier: 'dmz', status: 'online', environment: 'production',
          metrics: { cpuUsage: 35, memoryUsage: 45, networkLatency: 5, storageIO: 1200 },
          specs: { cpu: 8, memory: 32, storage: 500 } },
        { id: 'rp-dmz-01', name: 'Reverse Proxy 01', type: 'reverse-proxy', datacenter: 'dc-dallas-primary',
          tier: 'dmz', status: 'online', environment: 'production',
          metrics: { cpuUsage: 42, memoryUsage: 55, networkLatency: 8, storageIO: 1800 },
          specs: { cpu: 16, memory: 64, storage: 200 } },
        { id: 'lb-web-01', name: 'Load Balancer Web', type: 'lb', datacenter: 'dc-dallas-primary',
          tier: 'web-tier', status: 'online', environment: 'production',
          metrics: { cpuUsage: 28, memoryUsage: 38, networkLatency: 12, storageIO: 800 },
          specs: { cpu: 4, memory: 16, storage: 50 } },
        { id: 'web-01', name: 'Web Server 01', type: 'web', datacenter: 'dc-dallas-primary',
          tier: 'web-tier', status: 'online', environment: 'production',
          metrics: { cpuUsage: 52, memoryUsage: 67, networkLatency: 18, storageIO: 2200 },
          specs: { cpu: 8, memory: 32, storage: 100 } },
        { id: 'web-02', name: 'Web Server 02', type: 'web', datacenter: 'dc-dallas-primary',
          tier: 'web-tier', status: 'warning', environment: 'production',
          metrics: { cpuUsage: 78, memoryUsage: 85, networkLatency: 35, storageIO: 3500 },
          specs: { cpu: 8, memory: 32, storage: 100 } },
        { id: 'customer-api-01', name: 'Customer API 01', type: 'api', datacenter: 'dc-dallas-primary',
          tier: 'app-tier', status: 'online', environment: 'production',
          metrics: { cpuUsage: 42, memoryUsage: 58, networkLatency: 22, storageIO: 1900 },
          specs: { cpu: 16, memory: 64, storage: 200 } },
        { id: 'payment-api-01', name: 'Payment API 01', type: 'api', datacenter: 'dc-dallas-primary',
          tier: 'app-tier', status: 'online', environment: 'production',
          metrics: { cpuUsage: 35, memoryUsage: 48, networkLatency: 15, storageIO: 1500 },
          specs: { cpu: 16, memory: 64, storage: 200 } },
        { id: 'order-api-02', name: 'Order API 02', type: 'api', datacenter: 'dc-dallas-primary',
          tier: 'app-tier', status: 'critical', environment: 'production',
          metrics: { cpuUsage: 92, memoryUsage: 95, networkLatency: 180, storageIO: 4500 },
          specs: { cpu: 16, memory: 64, storage: 200 } },
        { id: 'session-cache-01', name: 'Session Cache 01', type: 'cache', datacenter: 'dc-dallas-primary',
          tier: 'app-tier', status: 'warning', environment: 'production',
          metrics: { cpuUsage: 25, memoryUsage: 82, networkLatency: 3, storageIO: 500 },
          specs: { cpu: 8, memory: 128, storage: 50 } },
        { id: 'user-db-primary', name: 'User DB Primary', type: 'db', datacenter: 'dc-dallas-primary',
          tier: 'data-tier', status: 'online', environment: 'production',
          metrics: { cpuUsage: 48, memoryUsage: 72, networkLatency: 8, storageIO: 2800 },
          specs: { cpu: 24, memory: 128, storage: 2000 } },
        { id: 'payment-db-primary', name: 'Payment DB Primary', type: 'db', datacenter: 'dc-dallas-primary',
          tier: 'data-tier', status: 'online', environment: 'production',
          metrics: { cpuUsage: 35, memoryUsage: 62, networkLatency: 6, storageIO: 2200 },
          specs: { cpu: 24, memory: 128, storage: 2000 } },
        { id: 'inventory-db-01', name: 'Inventory DB 01', type: 'db', datacenter: 'dc-dallas-primary',
          tier: 'data-tier', status: 'warning', environment: 'production',
          metrics: { cpuUsage: 68, memoryUsage: 78, networkLatency: 45, storageIO: 3200 },
          specs: { cpu: 24, memory: 128, storage: 2000 } },
        
        // Denver DR Site
        { id: 'fw-dr-01', name: 'Firewall DR 01', type: 'firewall', datacenter: 'dc-denver-dr',
          tier: 'dmz', status: 'online', environment: 'disaster-recovery',
          metrics: { cpuUsage: 15, memoryUsage: 25, networkLatency: 8, storageIO: 600 },
          specs: { cpu: 8, memory: 32, storage: 500 } },
        { id: 'web-dr-01', name: 'Web DR 01', type: 'web', datacenter: 'dc-denver-dr',
          tier: 'web-tier', status: 'online', environment: 'disaster-recovery',
          metrics: { cpuUsage: 12, memoryUsage: 20, networkLatency: 12, storageIO: 400 },
          specs: { cpu: 8, memory: 32, storage: 100 } },
        { id: 'db-dr-replica-01', name: 'DB DR Replica', type: 'db-replica', datacenter: 'dc-denver-dr',
          tier: 'data-tier', status: 'online', environment: 'disaster-recovery',
          metrics: { cpuUsage: 18, memoryUsage: 35, networkLatency: 15, storageIO: 1200 },
          specs: { cpu: 16, memory: 96, storage: 2000 } },
        
        // AWS Cloud
        { id: 'aws-ecs-cluster-01', name: 'ECS Cluster 01', type: 'container-host', datacenter: 'dc-aws-east',
          tier: 'cloud-hybrid', status: 'online', environment: 'development',
          metrics: { cpuUsage: 45, memoryUsage: 58, networkLatency: 25, storageIO: 1800 },
          specs: { cpu: 32, memory: 128, storage: 500 } },
        { id: 'aws-rds-staging-01', name: 'RDS Staging 01', type: 'db', datacenter: 'dc-aws-east',
          tier: 'data-tier', status: 'online', environment: 'staging',
          metrics: { cpuUsage: 28, memoryUsage: 42, networkLatency: 18, storageIO: 1400 },
          specs: { cpu: 24, memory: 128, storage: 2000 } },
        
        // Austin Dev Center
        { id: 'dev-api-01', name: 'Dev API 01', type: 'api', datacenter: 'dc-austin-dev',
          tier: 'app-tier', status: 'online', environment: 'development',
          metrics: { cpuUsage: 22, memoryUsage: 35, networkLatency: 28, storageIO: 900 },
          specs: { cpu: 16, memory: 64, storage: 200 } },
        { id: 'staging-db-01', name: 'Staging DB 01', type: 'db', datacenter: 'dc-austin-dev',
          tier: 'data-tier', status: 'online', environment: 'staging',
          metrics: { cpuUsage: 32, memoryUsage: 48, networkLatency: 22, storageIO: 1100 },
          specs: { cpu: 24, memory: 128, storage: 2000 } }
      ],
      
      datacenters: [
        { id: 'dc-dallas-primary', name: 'Dallas Primary DC', region: 'US-South', x: 350, y: 250 },
        { id: 'dc-denver-dr', name: 'Denver DR Site', region: 'US-West', x: 150, y: 180 },
        { id: 'dc-aws-east', name: 'AWS US-East-1', region: 'US-East', x: 550, y: 150 },
        { id: 'dc-austin-dev', name: 'Austin Dev Center', region: 'US-South', x: 320, y: 420 }
      ]
    };

    // Initialize the dynamic evolution system
    evolutionSystemRef.current = createDynamicEnterpriseSystem(mockServerData);
    
    // Set up real-time evolution callback
    evolutionSystemRef.current.setEvolutionCallback((servers, health, appHealth, analytics) => {
      setLiveServers(servers);
      setSystemHealth(health);
      setApplicationHealth(appHealth);
      setActiveIncidents(analytics.incidents || []);
      
      // Update predictive analytics
      if (evolutionSystemRef.current.getPredictiveAnalytics) {
        setPredictiveAnalytics(evolutionSystemRef.current.getPredictiveAnalytics());
      }
      
      // Update business intelligence
      if (evolutionSystemRef.current.getBusinessIntelligence) {
        setBusinessIntelligence(evolutionSystemRef.current.getBusinessIntelligence());
      }
      
      // Update auto-healing events
      if (evolutionSystemRef.current.getAutoHealingStatus) {
        setAutoHealingEvents(evolutionSystemRef.current.getAutoHealingStatus().recentHealingEvents || []);
      }
    });
    
    // Start the evolution system
    evolutionSystemRef.current.startEvolution(3000); // Update every 3 seconds
    
    return () => {
      if (evolutionSystemRef.current) {
        evolutionSystemRef.current.stopEvolution();
      }
    };
  }, []);

  // Create dynamic enterprise system (simplified version of your system)
  const createDynamicEnterpriseSystem = (initialData) => {
    let servers = [...initialData.serverOverview];
    let evolutionCallback = null;
    let evolutionInterval = null;
    let lastUpdate = Date.now();

    const evolveServer = (server, deltaTime) => {
      const timeFactor = deltaTime / 1000;
      let newServer = { ...server };
      
      // Simulate real server evolution
      const baseVolatility = 0.1;
      const businessLoadFactor = isBusinessHours() ? 1.5 : 0.6;
      
      if (server.status === 'online') {
        // Normal operation with gradual changes
        newServer.metrics = {
          ...server.metrics,
          cpuUsage: Math.max(5, Math.min(95, 
            server.metrics.cpuUsage + (Math.random() - 0.5) * 10 * timeFactor * businessLoadFactor
          )),
          memoryUsage: Math.max(10, Math.min(95,
            server.metrics.memoryUsage + (Math.random() - 0.5) * 5 * timeFactor
          )),
          networkLatency: Math.max(1, 
            server.metrics.networkLatency + (Math.random() - 0.5) * 20 * timeFactor
          ),
          storageIO: Math.max(100,
            server.metrics.storageIO + (Math.random() - 0.5) * 500 * timeFactor
          )
        };
        
        // Check for status degradation
        if (newServer.metrics.cpuUsage > 90 || newServer.metrics.memoryUsage > 90) {
          newServer.status = 'critical';
        } else if (newServer.metrics.cpuUsage > 75 || newServer.metrics.memoryUsage > 75) {
          newServer.status = 'warning';
        }
      } else if (server.status === 'warning') {
        // Warning state - can recover or degrade
        if (Math.random() < 0.1 * timeFactor) {
          if (Math.random() < 0.7) {
            // Recovery
            newServer.status = 'online';
            newServer.metrics = {
              ...server.metrics,
              cpuUsage: Math.max(5, server.metrics.cpuUsage - 20),
              memoryUsage: Math.max(10, server.metrics.memoryUsage - 15),
              networkLatency: Math.max(1, server.metrics.networkLatency - 10)
            };
          } else {
            // Degradation
            newServer.status = 'critical';
          }
        }
      } else if (server.status === 'critical') {
        // Critical state - auto-healing or recovery
        if (autoHealing && Math.random() < 0.15 * timeFactor) {
          // Auto-healing triggered
          newServer.status = 'online';
          newServer.metrics = {
            ...server.metrics,
            cpuUsage: Math.max(5, server.metrics.cpuUsage * 0.6),
            memoryUsage: Math.max(10, server.metrics.memoryUsage * 0.7),
            networkLatency: Math.max(1, server.metrics.networkLatency * 0.8)
          };
          newServer.lastHealed = Date.now();
        }
      }
      
      // Add predictive analytics
      newServer.prediction = generatePrediction(newServer);
      
      return newServer;
    };

    const generatePrediction = (server) => {
      const { cpuUsage, memoryUsage, networkLatency } = server.metrics;
      
      // Simple risk calculation
      let risk = 0;
      if (cpuUsage > 80) risk += 0.3;
      if (memoryUsage > 80) risk += 0.4;
      if (networkLatency > 100) risk += 0.2;
      if (server.status === 'warning') risk += 0.2;
      if (server.status === 'critical') risk += 0.5;
      
      const confidence = 0.7 + Math.random() * 0.3;
      const timeToFailure = risk > 0.7 ? (60000 + Math.random() * 300000) : null; // 1-5 minutes
      
      return { risk: Math.min(1, risk), confidence, timeToFailure };
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

      servers = servers.map(server => evolveServer(server, deltaTime));

      // Calculate system health
      const statusCounts = servers.reduce((acc, server) => {
        acc[server.status] = (acc[server.status] || 0) + 1;
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
          health: 85 + Math.random() * 10,
          status: Math.random() > 0.9 ? 'warning' : 'healthy',
          nodeDetails: { total: 3, healthy: 3, warning: 0, critical: 0, offline: 0 }
        }],
        ['payment-processor', {
          health: 92 + Math.random() * 8,
          status: 'healthy',
          nodeDetails: { total: 2, healthy: 2, warning: 0, critical: 0, offline: 0 }
        }],
        ['order-management', {
          health: 78 + Math.random() * 15,
          status: Math.random() > 0.8 ? 'warning' : 'healthy',
          nodeDetails: { total: 2, healthy: 1, warning: 1, critical: 0, offline: 0 }
        }]
      ]);

      // Generate incidents
      const incidents = servers
        .filter(server => server.status === 'critical' || server.status === 'warning')
        .map(server => ({
          id: `inc-${server.id}-${now}`,
          serverId: server.id,
          serverName: server.name,
          type: server.metrics.cpuUsage > 90 ? 'cpu_overload' : 
                server.metrics.memoryUsage > 90 ? 'memory_exhaustion' : 'performance_degradation',
          severity: server.status,
          description: `${server.name} experiencing performance issues`,
          startTime: now - Math.random() * 300000, // Started within last 5 minutes
          businessImpact: server.environment === 'production' ? 0.7 : 0.3
        }));

      const analytics = {
        incidents,
        trends: { businessHours: isBusinessHours() },
        anomalies: {},
        heatMaps: servers.map(s => ({
          serverId: s.id,
          heat: (s.metrics.cpuUsage + s.metrics.memoryUsage) / 200
        }))
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
      
      getPredictiveAnalytics: () => {
        return servers.map(server => ({
          serverId: server.id,
          serverName: server.name,
          prediction: server.prediction || { risk: 0, confidence: 0 },
          recommendations: server.prediction?.risk > 0.7 ? ['Scale resources', 'Investigate performance'] : []
        }));
      },
      
      getBusinessIntelligence: () => ({
        isBusinessHours: isBusinessHours(),
        overallBusinessImpact: servers.filter(s => s.status === 'critical' && s.environment === 'production').length * 0.2,
        criticalBusinessServices: servers
          .filter(s => s.status === 'critical' && s.environment === 'production')
          .map(s => ({ id: s.id, name: s.name, impact: 0.7 }))
      }),
      
      getAutoHealingStatus: () => ({
        recentHealingEvents: servers
          .filter(s => s.lastHealed && Date.now() - s.lastHealed < 300000)
          .map(s => ({ serverId: s.id, serverName: s.name, healedAt: s.lastHealed }))
      }),
      
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

  // Icon mapping
  const getNodeIcon = (type) => {
    const iconMap = {
      'firewall': Shield,
      'reverse-proxy': Globe,
      'waf': Shield,
      'web': Server,
      'lb': Router,
      'api': Cpu,
      'app-server': Server,
      'worker': Settings,
      'queue': Activity,
      'cache': Zap,
      'db': Database,
      'db-replica': Database,
      'nosql': Database,
      'data-warehouse': HardDrive,
      'monitor': Monitor,
      'backup': HardDrive,
      'jump-host': Shield,
      'cloud-gateway': Cloud,
      'container-host': Layers
    };
    return iconMap[type] || Server;
  };

  // Status color mapping with intelligence
  const getStatusColor = (server, showHeat = false) => {
    if (showHeat && server.prediction) {
      const risk = server.prediction.risk;
      const hue = (1 - risk) * 120; // 120 = green, 0 = red
      return `hsl(${hue}, 70%, 60%)`;
    }
    
    const statusColors = {
      'online': '#10b981',
      'warning': '#f59e0b', 
      'critical': '#ef4444',
      'offline': '#6b7280',
      'maintenance': '#8b5cf6'
    };
    return statusColors[server.status] || statusColors['online'];
  };

  // Create dynamic topology layout
  const createDynamicTopology = useCallback(() => {
    if (!liveServers.length) return;

    const newNodes = [];
    const newConnections = [];

    // Datacenter positions
    const datacenters = [
      { id: 'dc-dallas-primary', name: 'Dallas Primary', x: 350, y: 250, color: '#3b82f6' },
      { id: 'dc-denver-dr', name: 'Denver DR', x: 150, y: 180, color: '#8b5cf6' },
      { id: 'dc-aws-east', name: 'AWS East', x: 550, y: 150, color: '#f59e0b' },
      { id: 'dc-austin-dev', name: 'Austin Dev', x: 320, y: 420, color: '#10b981' }
    ];

    // Filter servers based on tier filter
    let filteredServers = liveServers;
    if (filterTier !== 'all') {
      filteredServers = filteredServers.filter(server => server.tier === filterTier);
    }

    if (viewMode === 'intelligent') {
      // AI-driven layout based on relationships and criticality
      
      // Add datacenter nodes
      datacenters.forEach(dc => {
        const dcServers = filteredServers.filter(s => s.datacenter === dc.id);
        if (dcServers.length > 0) {
          newNodes.push({
            id: dc.id,
            name: dc.name,
            type: 'datacenter',
            x: dc.x,
            y: dc.y,
            vx: 0,
            vy: 0,
            fixed: true,
            radius: 50,
            color: dc.color,
            servers: dcServers.length,
            health: dcServers.reduce((sum, s) => {
              const statusScore = { online: 100, warning: 60, critical: 20, offline: 0 };
              return sum + (statusScore[s.status] || 50);
            }, 0) / dcServers.length
          });
        }
      });

      // Position servers intelligently around datacenters
      datacenters.forEach(dc => {
        const dcServers = filteredServers.filter(s => s.datacenter === dc.id);
        
        // Group by tier for better organization
        const tierGroups = {};
        dcServers.forEach(server => {
          if (!tierGroups[server.tier]) tierGroups[server.tier] = [];
          tierGroups[server.tier].push(server);
        });

        let tierIndex = 0;
        Object.entries(tierGroups).forEach(([tier, servers]) => {
          servers.forEach((server, index) => {
            const tierAngle = (tierIndex / Object.keys(tierGroups).length) * 2 * Math.PI;
            const serverAngle = (index / servers.length) * (Math.PI / 2) + tierAngle;
            const radius = 80 + (tierIndex * 25);
            
            newNodes.push({
              ...server,
              x: dc.x + Math.cos(serverAngle) * radius,
              y: dc.y + Math.sin(serverAngle) * radius,
              vx: 0,
              vy: 0,
              fixed: false,
              radius: NODE_RADIUS,
              icon: getNodeIcon(server.type),
              prediction: server.prediction || { risk: 0, confidence: 0 },
              lastHealed: server.lastHealed
            });
          });
          tierIndex++;
        });
      });

      // Create intelligent connections based on typical enterprise architecture
      const connectionRules = [
        // DMZ connections
        { from: 'firewall', to: 'reverse-proxy', type: 'security' },
        { from: 'reverse-proxy', to: 'lb', type: 'load-balancing' },
        
        // Web tier
        { from: 'lb', to: 'web', type: 'http' },
        { from: 'web', to: 'api', type: 'api' },
        
        // App tier
        { from: 'api', to: 'cache', type: 'cache' },
        { from: 'api', to: 'db', type: 'database' },
        
        // Replication
        { from: 'db', to: 'db-replica', type: 'replication' }
      ];

      connectionRules.forEach(rule => {
        const fromNodes = newNodes.filter(n => n.type === rule.from || n.type?.includes(rule.from));
        const toNodes = newNodes.filter(n => n.type === rule.to || n.type?.includes(rule.to));
        
        fromNodes.forEach(fromNode => {
          toNodes.forEach(toNode => {
            if (fromNode.id !== toNode.id && fromNode.datacenter === toNode.datacenter) {
              const utilization = 0.3 + Math.random() * 0.6;
              newConnections.push({
                id: `${fromNode.id}-${toNode.id}`,
                from: fromNode.id,
                to: toNode.id,
                fromNode,
                toNode,
                type: rule.type,
                utilization,
                bandwidth: 1000 * utilization,
                latency: 5 + Math.random() * 20
              });
            }
          });
        });
      });

      // Cross-datacenter connections
      const primaryDC = newNodes.filter(n => n.datacenter === 'dc-dallas-primary');
      const drDC = newNodes.filter(n => n.datacenter === 'dc-denver-dr');
      
      if (primaryDC.length && drDC.length) {
        const primaryDB = primaryDC.find(n => n.type === 'db');
        const drReplica = drDC.find(n => n.type === 'db-replica');
        
        if (primaryDB && drReplica) {
          newConnections.push({
            id: `${primaryDB.id}-${drReplica.id}`,
            from: primaryDB.id,
            to: drReplica.id,
            fromNode: primaryDB,
            toNode: drReplica,
            type: 'replication',
            utilization: 0.2 + Math.random() * 0.3,
            bandwidth: 100,
            latency: 15 + Math.random() * 10
          });
        }
      }
    }

    setNodes(newNodes);
    setConnections(newConnections);
  }, [liveServers, viewMode, filterTier]);

  // Enhanced physics simulation with intelligence
  const updatePhysics = useCallback(() => {
    if (!nodes.length) return;

    setNodes(prevNodes => {
      const newNodes = [...prevNodes];
      const dt = 0.016;
      
      newNodes.forEach((node, i) => {
        if (node.fixed) return;
        
        let fx = 0, fy = 0;
        
        // Repulsion between nodes
        newNodes.forEach((other, j) => {
          if (i === j) return;
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy) + 1;
          
          if (distance < 150) {
            const force = 3000 / (distance * distance);
            fx += (dx / distance) * force;
            fy += (dy / distance) * force;
          }
        });
        
        // Attraction to connections with adaptive strength
        connections.forEach(conn => {
          let targetNode = null;
          let isSource = false;
          
          if (conn.fromNode.id === node.id) {
            targetNode = conn.toNode;
            isSource = true;
          } else if (conn.toNode.id === node.id) {
            targetNode = conn.fromNode;
          }
          
          if (targetNode) {
            const dx = targetNode.x - node.x;
            const dy = targetNode.y - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Adaptive optimal distance based on connection type
            const optimalDistances = {
              'security': 90,
              'load-balancing': 100,
              'http': 80,
              'api': 85,
              'cache': 70,
              'database': 95,
              'replication': 200
            };
            
            const optimalDistance = optimalDistances[conn.type] || 100;
            const force = (distance - optimalDistance) * 0.05 * conn.utilization;
            
            fx += (dx / distance) * force;
            fy += (dy / distance) * force;
          }
        });
        
        // Gravity toward datacenter for non-datacenter nodes
        if (node.type !== 'datacenter' && node.datacenter) {
          const datacenterNode = newNodes.find(n => n.id === node.datacenter);
          if (datacenterNode) {
            const dx = datacenterNode.x - node.x;
            const dy = datacenterNode.y - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const force = 0.02;
            fx += (dx / distance) * force;
            fy += (dy / distance) * force;
          }
        }
        
        // Boundary forces with smooth falloff
        const margin = 60;
        if (node.x < margin) fx += Math.pow(margin - node.x, 2) * 0.01;
        if (node.x > CANVAS_WIDTH - margin) fx += -Math.pow(node.x - (CANVAS_WIDTH - margin), 2) * 0.01;
        if (node.y < margin) fy += Math.pow(margin - node.y, 2) * 0.01;
        if (node.y > CANVAS_HEIGHT - margin) fy += -Math.pow(node.y - (CANVAS_HEIGHT - margin), 2) * 0.01;
        
        // Update velocity with adaptive damping
        const damping = node.status === 'critical' ? 0.95 : 0.88; // Critical nodes move more
        node.vx = (node.vx + fx * dt) * damping;
        node.vy = (node.vy + fy * dt) * damping;
        
        // Update position
        node.x += node.vx * dt;
        node.y += node.vy * dt;
      });
      
      return newNodes;
    });
  }, [nodes, connections]);

  // Enhanced traffic particle system
  const updateTrafficParticles = useCallback(() => {
    if (!showTrafficFlow || !connections.length) return;

    setParticles(prevParticles => {
      let newParticles = [...prevParticles];
      
      // Remove expired particles
      newParticles = newParticles.filter(p => p.life > 0);
      
      // Generate new particles based on live data
      connections.forEach(conn => {
        const spawnRate = conn.utilization * 0.15;
        
        if (Math.random() < spawnRate) {
          const isIncident = conn.fromNode.status === 'critical' || conn.toNode.status === 'critical';
          
          newParticles.push({
            id: Math.random(),
            x: conn.fromNode.x,
            y: conn.fromNode.y,
            targetX: conn.toNode.x,
            targetY: conn.toNode.y,
            progress: 0,
            life: 1,
            speed: isIncident ? 0.01 : 0.03 + Math.random() * 0.02,
            size: 2 + conn.utilization * 4,
            color: isIncident ? '#ef4444' : 
                   conn.utilization > 0.8 ? '#f59e0b' : 
                   conn.type === 'replication' ? '#8b5cf6' : '#10b981',
            type: conn.type,
            pulsing: isIncident
          });
        }
      });
      
      // Update particle positions with realistic movement
      newParticles.forEach(particle => {
        particle.progress += particle.speed;
        particle.life -= 0.008;
        
        if (particle.progress <= 1) {
          // Smooth interpolation with slight curve for realism
          const t = particle.progress;
          const curveOffset = Math.sin(t * Math.PI) * 10;
          
          particle.x = particle.x + (particle.targetX - particle.x) * particle.speed;
          particle.y = particle.y + (particle.targetY - particle.y) * particle.speed + 
                      Math.sin(t * Math.PI * 2) * curveOffset * 0.1;
        }
      });
      
      return newParticles.slice(-300); // Limit total particles
    });
  }, [connections, showTrafficFlow]);

  // Enhanced animation loop
  const animate = useCallback(() => {
    setTime(t => t + 1);
    updatePhysics();
    updateTrafficParticles();
    animationRef.current = requestAnimationFrame(animate);
  }, [updatePhysics, updateTrafficParticles]);

  // Mouse interaction handlers
  const handleCanvasClick = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find clicked node
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      return distance <= node.radius;
    });

    setSelectedNode(clickedNode);
  }, [nodes]);

  const handleCanvasMouseMove = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const hoveredNode = nodes.find(node => {
      const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      return distance <= node.radius;
    });

    setHoveredNode(hoveredNode);
    canvas.style.cursor = hoveredNode ? 'pointer' : 'default';
  }, [nodes]);

  // Advanced canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Enhanced background with subtle patterns
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid with business intelligence overlay
    ctx.strokeStyle = businessIntelligence.isBusinessHours ? '#e2e8f0' : '#f1f5f9';
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Draw connections with enhanced styling
    connections.forEach(conn => {
      const { fromNode, toNode, utilization, type, latency } = conn;
      
      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      
      // Advanced connection styling
      const connectionStyles = {
        'security': { color: '#dc2626', pattern: [] },
        'load-balancing': { color: '#7c3aed', pattern: [] },
        'http': { color: '#059669', pattern: [] },
        'api': { color: '#0891b2', pattern: [] },
        'cache': { color: '#db2777', pattern: [3, 3] },
        'database': { color: '#d97706', pattern: [] },
        'replication': { color: '#6b7280', pattern: [8, 4] }
      };
      
      const style = connectionStyles[type] || { color: '#9ca3af', pattern: [] };
      
      ctx.strokeStyle = style.color;
      ctx.lineWidth = Math.max(1, utilization * 12);
      ctx.globalAlpha = 0.4 + (utilization * 0.5);
      ctx.setLineDash(style.pattern);
      
      // Critical connection indicator
      if (utilization > 0.9) {
        ctx.shadowColor = style.color;
        ctx.shadowBlur = 8;
      }
      
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
      
      // Connection metrics
      const midX = (fromNode.x + toNode.x) / 2;
      const midY = (fromNode.y + toNode.y) / 2;
      
      ctx.fillStyle = '#374151';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(utilization * 100)}%`, midX, midY - 8);
      ctx.fillText(`${latency.toFixed(0)}ms`, midX, midY + 3);
    });

    // Draw enhanced traffic particles
    particles.forEach(particle => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      
      if (particle.pulsing) {
        const pulse = Math.sin(time * 0.3) * 0.3 + 0.7;
        ctx.globalAlpha = particle.life * pulse;
      } else {
        ctx.globalAlpha = particle.life;
      }
      
      ctx.fillStyle = particle.color;
      ctx.fill();
      
      // Particle trail effect for high-priority traffic
      if (particle.type === 'security' || particle.type === 'database') {
        ctx.beginPath();
        ctx.arc(particle.x - particle.speed * 10, particle.y - particle.speed * 10, 
                particle.size * 0.5, 0, Math.PI * 2);
        ctx.globalAlpha = particle.life * 0.3;
        ctx.fill();
      }
      
      ctx.globalAlpha = 1;
    });

    // Draw enhanced nodes
    nodes.forEach(node => {
      const { x, y, radius, type } = node;
      
      // Node shadow with dynamic sizing
      ctx.beginPath();
      ctx.arc(x + 3, y + 3, radius + (node.prediction?.risk * 5 || 0), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fill();
      
      if (type === 'datacenter') {
        // Enhanced datacenter visualization
        const healthGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        const healthColor = node.health > 80 ? '#10b981' : node.health > 60 ? '#f59e0b' : '#ef4444';
        healthGradient.addColorStop(0, healthColor + '40');
        healthGradient.addColorStop(1, healthColor + '10');
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = healthGradient;
        ctx.fill();
        
        ctx.strokeStyle = healthColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Datacenter pulse effect during business hours
        if (businessIntelligence.isBusinessHours) {
          const pulse = Math.sin(time * 0.1) * 5 + radius;
          ctx.beginPath();
          ctx.arc(x, y, pulse, 0, Math.PI * 2);
          ctx.strokeStyle = healthColor + '30';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        
        // Datacenter information
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, x, y - 5);
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(`${node.servers} servers`, x, y + 8);
        ctx.fillText(`${Math.round(node.health)}% health`, x, y + 20);
      } else {
        // Enhanced server nodes
        const color = getStatusColor(node, showHeatMap || showPredictive);
        
        // Predictive risk indicator
        if (showPredictive && node.prediction?.risk > 0.5) {
          const riskRadius = radius + 8 + (node.prediction.risk * 12);
          ctx.beginPath();
          ctx.arc(x, y, riskRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `hsl(${(1 - node.prediction.risk) * 60}, 80%, 50%)`;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        
        // Main node circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        
        // Status rings and effects
        if (node.status === 'critical') {
          const pulse = Math.sin(time * 0.2) * 3 + radius + 5;
          ctx.beginPath();
          ctx.arc(x, y, pulse, 0, Math.PI * 2);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3;
          ctx.stroke();
        } else if (node.status === 'warning') {
          ctx.beginPath();
          ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        
        // Auto-healing indicator
        if (node.lastHealed && Date.now() - node.lastHealed < 30000) {
          const healingRadius = radius + 12;
          ctx.beginPath();
          ctx.arc(x, y, healingRadius, 0, Math.PI * 2);
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.7;
          ctx.stroke();
          ctx.globalAlpha = 1;
          
          // Healing particle effect
          for (let i = 0; i < 3; i++) {
            const angle = (time * 0.1 + i * (Math.PI * 2 / 3)) % (Math.PI * 2);
            const px = x + Math.cos(angle) * healingRadius;
            const py = y + Math.sin(angle) * healingRadius;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#10b981';
            ctx.fill();
          }
        }
        
        // Hover/selection highlight
        if (hoveredNode?.id === node.id || selectedNode?.id === node.id) {
          ctx.beginPath();
          ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        
        // Server type icon (simplified)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        const iconText = {
          'firewall': '🔥', 'reverse-proxy': '🌐', 'web': '🖥️', 'api': '⚡',
          'db': '💾', 'cache': '⚡', 'lb': '⚖️', 'container-host': '📦'
        };
        ctx.fillText(iconText[node.type] || '⚙️', x, y + 4);
        
        // Server name and metrics
        ctx.fillStyle = '#374151';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(node.name, x, y + radius + 18);
        
        // Live metrics display
        if (node.metrics) {
          ctx.font = '8px Inter, sans-serif';
          ctx.fillStyle = '#6b7280';
          ctx.fillText(
            `CPU: ${Math.round(node.metrics.cpuUsage)}% | Mem: ${Math.round(node.metrics.memoryUsage)}%`,
            x, y + radius + 30
          );
        }
        
        // Incident indicator
        if (node.status === 'critical' || node.status === 'warning') {
          ctx.beginPath();
          ctx.arc(x + radius - 8, y - radius + 8, 6, 0, Math.PI * 2);
          ctx.fillStyle = node.status === 'critical' ? '#ef4444' : '#f59e0b';
          ctx.fill();
          
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px Inter, sans-serif';
          ctx.fillText('!', x + radius - 8, y - radius + 12);
        }
        
        // Prediction confidence indicator
        if (showPredictive && node.prediction?.confidence > 0.7) {
          ctx.beginPath();
          ctx.arc(x - radius + 8, y - radius + 8, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#3b82f6';
          ctx.fill();
          
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px Inter, sans-serif';
          ctx.fillText('AI', x - radius + 8, y - radius + 11);
        }
      }
    });

    // Business hours overlay
    if (businessIntelligence.isBusinessHours) {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText('🕐 Business Hours Active', 20, 25);
    }

    // Critical alerts overlay
    if (activeIncidents.length > 0) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, 50);
      
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(`⚠️ ${activeIncidents.length} Active Incidents`, CANVAS_WIDTH - 200, 25);
    }
  }, [nodes, connections, particles, time, hoveredNode, selectedNode, businessIntelligence, 
      activeIncidents, showHeatMap, showPredictive]);

  // Initialize system
  useEffect(() => {
    const cleanup = initializeDynamicSystem();
    return cleanup;
  }, [initializeDynamicSystem]);

  // Update topology when live data changes
  useEffect(() => {
    createDynamicTopology();
  }, [createDynamicTopology]);

  // Start animation
  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  // Event handlers for canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);

    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('mousemove', handleCanvasMouseMove);
    };
  }, [handleCanvasClick, handleCanvasMouseMove]);

  // Incident injection for demo
  const injectTestIncident = () => {
    if (evolutionSystemRef.current && liveServers.length > 0) {
      const randomServer = liveServers[Math.floor(Math.random() * liveServers.length)];
      const scenarios = ['cpu_overload', 'memory_exhaustion', 'network_slow', 'cache_miss_storm'];
      const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      
      evolutionSystemRef.current.injectIncident(randomServer.id, scenario);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-blue-500" />
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Intelligent Network Topology</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Live Enterprise Infrastructure • {liveServers.length} Servers • 
              {businessIntelligence.isBusinessHours ? ' 🟢 Business Hours' : ' 🔵 Off Hours'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* System Health Indicator */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700">
            <div className={`w-2 h-2 rounded-full ${
              systemHealth.critical > 0 ? 'bg-red-500 animate-pulse' :
              systemHealth.warning > 0 ? 'bg-yellow-500' : 'bg-green-500'
            }`} />
            <span className="text-sm font-medium">
              {Math.round(systemHealth.healthy || 0)}% Healthy
            </span>
          </div>

          {/* View Mode Selector */}
          <select 
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value)}
            className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1"
          >
            <option value="intelligent">AI-Driven Layout</option>
            <option value="datacenter">Datacenter View</option>
            <option value="logical">Logical Tiers</option>
          </select>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTrafficFlow(!showTrafficFlow)}
              className={`p-2 rounded-lg transition-colors ${
                showTrafficFlow ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}
              title="Toggle Traffic Flow"
            >
              <Activity className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowPredictive(!showPredictive)}
              className={`p-2 rounded-lg transition-colors ${
                showPredictive ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
              }`}
              title="Toggle Predictive Analytics"
            >
              <Brain className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowHeatMap(!showHeatMap)}
              className={`p-2 rounded-lg transition-colors ${
                showHeatMap ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
              }`}
              title="Toggle Heat Map"
            >
              <Gauge className="w-4 h-4" />
            </button>
            
            <button
              onClick={injectTestIncident}
              className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
              title="Inject Test Incident"
            >
              <Lightning className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full object-contain cursor-default"
        />
        
        {/* Floating Stats */}
        <div className="absolute top-4 left-4 space-y-2">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Live Metrics</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Active: <span className="text-green-600 font-medium">{liveServers.filter(s => s.status === 'online').length}</span></div>
              <div>Warning: <span className="text-yellow-600 font-medium">{liveServers.filter(s => s.status === 'warning').length}</span></div>
              <div>Critical: <span className="text-red-600 font-medium">{liveServers.filter(s => s.status === 'critical').length}</span></div>
              <div>Incidents: <span className="text-orange-600 font-medium">{activeIncidents.length}</span></div>
            </div>
          </div>
          
          {autoHealingEvents.length > 0 && (
            <div className="bg-green-50/90 dark:bg-green-900/20 backdrop-blur-sm rounded-lg p-3 border border-green-200 dark:border-green-700">
              <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                🔧 Recent Auto-Healing
              </div>
              {autoHealingEvents.slice(0, 3).map((event, i) => (
                <div key={i} className="text-xs text-green-600 dark:text-green-400">
                  {event.serverName} • {new Date(event.healedAt).toLocaleTimeString()}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Predictive Analytics Panel */}
        {showPredictive && predictiveAnalytics.length > 0 && (
          <div className="absolute top-4 right-4 w-80">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Predictions</span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {predictiveAnalytics
                  .filter(p => p.prediction.risk > 0.3)
                  .sort((a, b) => b.prediction.risk - a.prediction.risk)
                  .slice(0, 5)
                  .map((prediction, i) => (
                    <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {prediction.serverName}
                        </span>
                        <span className={`text-xs font-bold ${
                          prediction.prediction.risk > 0.7 ? 'text-red-600' :
                          prediction.prediction.risk > 0.5 ? 'text-yellow-600' : 'text-blue-600'
                        }`}>
                          {Math.round(prediction.prediction.risk * 100)}% risk
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            prediction.prediction.risk > 0.7 ? 'bg-red-500' :
                            prediction.prediction.risk > 0.5 ? 'bg-yellow-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${prediction.prediction.risk * 100}%` }}
                        />
                      </div>
                      {prediction.recommendations.length > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          💡 {prediction.recommendations[0]}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Bottom Panel */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Application Health */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Application Health
            </h4>
            <div className="space-y-2">
              {Array.from(applicationHealth.entries()).map(([name, health]) => (
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

          {/* Active Incidents */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Active Incidents ({activeIncidents.length})
            </h4>
            <div className="space-y-2 max-h-24 overflow-y-auto">
              {activeIncidents.slice(0, 3).map((incident, i) => (
                <div key={i} className="text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      incident.severity === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {incident.serverName}
                    </span>
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 ml-3.5">
                    {incident.type.replace('_', ' ')} • 
                    {Math.round((Date.now() - incident.startTime) / 60000)}m ago
                  </div>
                </div>
              ))}
              {activeIncidents.length === 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No active incidents
                </div>
              )}
            </div>
          </div>

          {/* System Controls */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              System Controls
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Auto-Healing</span>
                <button
                  onClick={() => setAutoHealing(!autoHealing)}
                  className={`w-8 h-4 rounded-full transition-colors ${
                    autoHealing ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                    autoHealing ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tier Filter</span>
                <select 
                  value={filterTier} 
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="text-xs bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                >
                  <option value="all">All Tiers</option>
                  <option value="dmz">DMZ</option>
                  <option value="web-tier">Web Tier</option>
                  <option value="app-tier">App Tier</option>
                  <option value="data-tier">Data Tier</option>
                  <option value="cloud-hybrid">Cloud</option>
                </select>
              </div>

              <div className="flex gap-2 mt-3">
                <button 
                  onClick={injectTestIncident}
                  className="flex-1 text-xs bg-red-50 text-red-600 border border-red-200 rounded px-2 py-1 hover:bg-red-100 transition-colors"
                >
                  Inject Incident
                </button>
                <button 
                  onClick={() => {
                    if (evolutionSystemRef.current) {
                      evolutionSystemRef.current.evolveOnce();
                    }
                  }}
                  className="flex-1 text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded px-2 py-1 hover:bg-blue-100 transition-colors"
                >
                  Force Evolution
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Node Details Modal */}
      {selectedNode && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {React.createElement(getNodeIcon(selectedNode.type), { 
                    className: "w-8 h-8 text-blue-500" 
                  })}
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {selectedNode.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {selectedNode.type} • {selectedNode.status}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {selectedNode.type !== 'datacenter' && (
                <>
                  {/* Live Metrics */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Live Metrics
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">CPU Usage</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {Math.round(selectedNode.metrics?.cpuUsage || 0)}%
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1 mt-1">
                          <div 
                            className="bg-blue-500 h-1 rounded-full transition-all duration-500"
                            style={{ width: `${selectedNode.metrics?.cpuUsage || 0}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Memory Usage</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {Math.round(selectedNode.metrics?.memoryUsage || 0)}%
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1 mt-1">
                          <div 
                            className="bg-green-500 h-1 rounded-full transition-all duration-500"
                            style={{ width: `${selectedNode.metrics?.memoryUsage || 0}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Network Latency</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {Math.round(selectedNode.metrics?.networkLatency || 0)}ms
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Storage I/O</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {Math.round(selectedNode.metrics?.storageIO || 0)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Predictive Analytics */}
                  {selectedNode.prediction && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        AI Prediction
                      </h4>
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-700 dark:text-gray-300">Failure Risk</span>
                          <span className={`text-sm font-bold ${
                            selectedNode.prediction.risk > 0.7 ? 'text-red-600' :
                            selectedNode.prediction.risk > 0.5 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {Math.round(selectedNode.prediction.risk * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              selectedNode.prediction.risk > 0.7 ? 'bg-red-500' :
                              selectedNode.prediction.risk > 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${selectedNode.prediction.risk * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Confidence: {Math.round(selectedNode.prediction.confidence * 100)}%
                          {selectedNode.prediction.timeToFailure && (
                            <span className="ml-2">
                              • Est. {Math.round(selectedNode.prediction.timeToFailure / 60000)}min to failure
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Auto-Healing Status */}
                  {selectedNode.lastHealed && (
                    <div className="mb-4">
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-300">
                            Auto-Healed
                          </span>
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400">
                          Healed {Math.round((Date.now() - selectedNode.lastHealed) / 1000)}s ago
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Server Specifications */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Server Specifications
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Datacenter:</span>
                          <div className="font-medium">{selectedNode.datacenter}</div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Environment:</span>
                          <div className="font-medium capitalize">{selectedNode.environment}</div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">CPU Cores:</span>
                          <div className="font-medium">{selectedNode.specs?.cpu || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Memory:</span>
                          <div className="font-medium">{selectedNode.specs?.memory || 'N/A'}GB</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {selectedNode.type === 'datacenter' && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Datacenter Overview
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Servers:</span>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {selectedNode.servers}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Health:</span>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {Math.round(selectedNode.health)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 border border-gray-200 dark:border-gray-700">
        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Legend</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-blue-500" />
            <span className="text-gray-600 dark:text-gray-400">Connection</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-100 border-2 border-blue-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">AI Prediction</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 border-2 border-green-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">Auto-Healed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseNetworkTopology;