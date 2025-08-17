// src/components/widgets/AlertCenterWidget.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Bell, AlertTriangle, AlertCircle, Info, CheckCircle, X, 
  Zap, Brain, Shield, Activity, Clock, TrendingUp, 
  Server, Database, Globe, Router, Cpu, Settings,
  Eye, EyeOff, Filter, Layers, Target, Gauge
} from 'lucide-react';

const IntelligentAlertCenter = () => {
  // Alert management state
  const [alerts, setAlerts] = useState([]);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState(new Set());
  const [suppressedAlerts, setSuppressedAlerts] = useState([]);
  const [processingActions, setProcessingActions] = useState(new Map());
  
  // UI state
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showSuppressed, setShowSuppressed] = useState(false);
  const [autoAcknowledge, setAutoAcknowledge] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  
  // System integration
  const evolutionSystemRef = useRef(null);
  const noiseReducerRef = useRef(null);
  const alertHistoryRef = useRef([]);

  // Initialize enterprise alert system
  const initializeAlertSystem = useCallback(() => {
    // Initialize noise reducer for intelligent alert filtering
    noiseReducerRef.current = createIntelligentNoiseReducer();
    
    // Create enterprise evolution system
    const mockServerData = {
      serverOverview: [
        { id: 'fw-dmz-01', name: 'Firewall DMZ 01', type: 'firewall', datacenter: 'dc-dallas-primary', 
          environment: 'production', criticality: 'critical',
          metrics: { cpuUsage: 35, memoryUsage: 45, networkLatency: 5, storageIO: 1200 } },
        { id: 'lb-web-01', name: 'Load Balancer Web', type: 'lb', datacenter: 'dc-dallas-primary',
          environment: 'production', criticality: 'critical',
          metrics: { cpuUsage: 28, memoryUsage: 38, networkLatency: 12, storageIO: 800 } },
        { id: 'web-01', name: 'Web Server 01', type: 'web', datacenter: 'dc-dallas-primary',
          environment: 'production', criticality: 'high',
          metrics: { cpuUsage: 52, memoryUsage: 67, networkLatency: 18, storageIO: 2200 } },
        { id: 'web-02', name: 'Web Server 02', type: 'web', datacenter: 'dc-dallas-primary',
          environment: 'production', criticality: 'high', status: 'warning',
          metrics: { cpuUsage: 78, memoryUsage: 85, networkLatency: 35, storageIO: 3500 } },
        { id: 'api-customer-01', name: 'Customer API 01', type: 'api', datacenter: 'dc-dallas-primary',
          environment: 'production', criticality: 'high',
          metrics: { cpuUsage: 42, memoryUsage: 58, networkLatency: 22, storageIO: 1900 } },
        { id: 'api-payment-01', name: 'Payment API 01', type: 'api', datacenter: 'dc-dallas-primary',
          environment: 'production', criticality: 'critical',
          metrics: { cpuUsage: 35, memoryUsage: 48, networkLatency: 15, storageIO: 1500 } },
        { id: 'api-order-02', name: 'Order API 02', type: 'api', datacenter: 'dc-dallas-primary',
          environment: 'production', criticality: 'high', status: 'critical',
          metrics: { cpuUsage: 92, memoryUsage: 95, networkLatency: 180, storageIO: 4500 } },
        { id: 'cache-session-01', name: 'Session Cache 01', type: 'cache', datacenter: 'dc-dallas-primary',
          environment: 'production', criticality: 'high', status: 'warning',
          metrics: { cpuUsage: 25, memoryUsage: 82, networkLatency: 3, storageIO: 500 } },
        { id: 'db-user-primary', name: 'User DB Primary', type: 'db', datacenter: 'dc-dallas-primary',
          environment: 'production', criticality: 'critical',
          metrics: { cpuUsage: 48, memoryUsage: 72, networkLatency: 8, storageIO: 2800 } },
        { id: 'db-payment-primary', name: 'Payment DB Primary', type: 'db', datacenter: 'dc-dallas-primary',
          environment: 'production', criticality: 'critical',
          metrics: { cpuUsage: 35, memoryUsage: 62, networkLatency: 6, storageIO: 2200 } },
        { id: 'db-inventory-01', name: 'Inventory DB 01', type: 'db', datacenter: 'dc-dallas-primary',
          environment: 'production', criticality: 'high', status: 'warning',
          metrics: { cpuUsage: 68, memoryUsage: 78, networkLatency: 45, storageIO: 3200 } }
      ]
    };

    evolutionSystemRef.current = createEnhancedEvolutionSystem(mockServerData);
    
    // Set up alert callback
    evolutionSystemRef.current.setAlertCallback((newAlerts, incidents, predictions, anomalies) => {
      // Process each type of alert
      const processedAlerts = [];
      
      // System incidents
      incidents.forEach(incident => {
        const alert = createSystemAlert(incident, 'incident');
        if (alert) processedAlerts.push(alert);
      });
      
      // Predictive alerts
      predictions.forEach(prediction => {
        if (prediction.prediction.risk > 0.7) {
          const alert = createPredictiveAlert(prediction);
          if (alert) processedAlerts.push(alert);
        }
      });
      
      // Anomaly alerts
      anomalies.forEach(anomaly => {
        const alert = createAnomalyAlert(anomaly);
        if (alert) processedAlerts.push(alert);
      });
      
      // Auto-healing success alerts
      newAlerts.filter(a => a.type === 'auto_healing').forEach(healingAlert => {
        const alert = createAutoHealingAlert(healingAlert);
        if (alert) processedAlerts.push(alert);
      });
      
      // Process through noise reducer
      processedAlerts.forEach(alert => {
        const noiseResult = noiseReducerRef.current.shouldSuppress(alert);
        if (noiseResult.suppress) {
          setSuppressedAlerts(prev => [...prev.slice(-50), { ...alert, suppressionReason: noiseResult.reason }]);
        } else {
          setAlerts(prev => {
            const newAlerts = [...prev, alert].sort((a, b) => {
              // Sort by: criticality -> business impact -> timestamp
              const severityOrder = { critical: 3, warning: 2, info: 1 };
              const aScore = severityOrder[a.severity] * 100 + (a.businessImpact || 0) * 10;
              const bScore = severityOrder[b.severity] * 100 + (b.businessImpact || 0) * 10;
              if (aScore !== bScore) return bScore - aScore;
              return b.timestamp - a.timestamp;
            });
            return newAlerts.slice(-100); // Keep last 100 alerts
          });
          
          // Store in history
          alertHistoryRef.current.push(alert);
          if (alertHistoryRef.current.length > 500) {
            alertHistoryRef.current = alertHistoryRef.current.slice(-500);
          }
        }
      });
    });
    
    // Start the evolution system
    evolutionSystemRef.current.startEvolution(5000); // 5-second intervals for realistic alerting
    
    return () => {
      if (evolutionSystemRef.current) {
        evolutionSystemRef.current.stopEvolution();
      }
    };
  }, []);

  // Enhanced evolution system with alert generation
  const createEnhancedEvolutionSystem = (initialData) => {
    let servers = [...initialData.serverOverview];
    let alertCallback = null;
    let evolutionInterval = null;
    let lastUpdate = Date.now();

    const evolveServer = (server, deltaTime, globalContext) => {
      const timeFactor = deltaTime / 1000;
      let newServer = { ...server };
      let generatedAlerts = [];
      
      // Business hours impact
      const businessHours = isBusinessHours();
      const loadMultiplier = businessHours ? 1.6 : 0.8;
      
      // Environment-based evolution rates
      const envMultipliers = {
        'production': 1.0,
        'staging': 0.7,
        'development': 0.5,
        'disaster-recovery': 0.4
      };
      const envMultiplier = envMultipliers[server.environment] || 1.0;
      
      if (server.status === 'online' || !server.status) {
        // Normal evolution with realistic patterns
        const volatility = 0.12 * timeFactor * loadMultiplier * envMultiplier;
        
        const oldMetrics = { ...server.metrics };
        newServer.metrics = {
          ...server.metrics,
          cpuUsage: Math.max(5, Math.min(95, 
            server.metrics.cpuUsage + (Math.random() - 0.4) * 25 * volatility
          )),
          memoryUsage: Math.max(10, Math.min(95,
            server.metrics.memoryUsage + (Math.random() - 0.5) * 15 * volatility
          )),
          networkLatency: Math.max(1, 
            server.metrics.networkLatency + (Math.random() - 0.5) * 40 * volatility
          ),
          storageIO: Math.max(100,
            server.metrics.storageIO + (Math.random() - 0.5) * 1000 * volatility
          )
        };
        
        // Generate threshold alerts
        if (newServer.metrics.cpuUsage > 85 && oldMetrics.cpuUsage <= 85) {
          generatedAlerts.push({
            type: 'cpu_threshold',
            serverId: server.id,
            serverName: server.name,
            severity: newServer.metrics.cpuUsage > 90 ? 'critical' : 'warning',
            threshold: 85,
            currentValue: newServer.metrics.cpuUsage,
            metric: 'CPU'
          });
        }
        
        if (newServer.metrics.memoryUsage > 80 && oldMetrics.memoryUsage <= 80) {
          generatedAlerts.push({
            type: 'memory_threshold',
            serverId: server.id,
            serverName: server.name,
            severity: newServer.metrics.memoryUsage > 90 ? 'critical' : 'warning',
            threshold: 80,
            currentValue: newServer.metrics.memoryUsage,
            metric: 'Memory'
          });
        }
        
        if (newServer.metrics.networkLatency > 100 && oldMetrics.networkLatency <= 100) {
          generatedAlerts.push({
            type: 'latency_threshold',
            serverId: server.id,
            serverName: server.name,
            severity: newServer.metrics.networkLatency > 200 ? 'critical' : 'warning',
            threshold: 100,
            currentValue: newServer.metrics.networkLatency,
            metric: 'Network Latency'
          });
        }
        
        // Status degradation
        const { cpuUsage, memoryUsage, networkLatency } = newServer.metrics;
        const oldStatus = server.status || 'online';
        
        if (cpuUsage > 90 || memoryUsage > 90 || networkLatency > 200) {
          newServer.status = 'critical';
          if (oldStatus !== 'critical') {
            generatedAlerts.push({
              type: 'status_change',
              serverId: server.id,
              serverName: server.name,
              severity: 'critical',
              oldStatus,
              newStatus: 'critical',
              reason: cpuUsage > 90 ? 'High CPU' : memoryUsage > 90 ? 'High Memory' : 'High Latency'
            });
          }
        } else if (cpuUsage > 75 || memoryUsage > 75 || networkLatency > 100) {
          newServer.status = 'warning';
          if (oldStatus === 'online') {
            generatedAlerts.push({
              type: 'status_change',
              serverId: server.id,
              serverName: server.name,
              severity: 'warning',
              oldStatus,
              newStatus: 'warning',
              reason: cpuUsage > 75 ? 'Elevated CPU' : memoryUsage > 75 ? 'Elevated Memory' : 'Elevated Latency'
            });
          }
        } else {
          if (oldStatus !== 'online') {
            newServer.status = 'online';
            generatedAlerts.push({
              type: 'recovery',
              serverId: server.id,
              serverName: server.name,
              severity: 'info',
              oldStatus,
              newStatus: 'online'
            });
          }
        }
        
      } else if (server.status === 'warning') {
        // Warning state - can recover or degrade
        if (Math.random() < 0.2 * timeFactor) {
          if (Math.random() < 0.6) {
            // Recovery
            newServer.status = 'online';
            newServer.metrics = {
              ...server.metrics,
              cpuUsage: Math.max(5, server.metrics.cpuUsage - 20),
              memoryUsage: Math.max(10, server.metrics.memoryUsage - 15),
              networkLatency: Math.max(1, server.metrics.networkLatency - 30)
            };
            generatedAlerts.push({
              type: 'recovery',
              serverId: server.id,
              serverName: server.name,
              severity: 'info',
              oldStatus: 'warning',
              newStatus: 'online'
            });
          } else {
            // Degradation
            newServer.status = 'critical';
            generatedAlerts.push({
              type: 'degradation',
              serverId: server.id,
              serverName: server.name,
              severity: 'critical',
              oldStatus: 'warning',
              newStatus: 'critical'
            });
          }
        }
      } else if (server.status === 'critical') {
        // Critical state - auto-healing or manual intervention needed
        if (Math.random() < 0.25 * timeFactor) {
          // Auto-healing triggered
          newServer.status = 'online';
          newServer.metrics = {
            ...server.metrics,
            cpuUsage: Math.max(5, server.metrics.cpuUsage * 0.4),
            memoryUsage: Math.max(10, server.metrics.memoryUsage * 0.6),
            networkLatency: Math.max(1, server.metrics.networkLatency * 0.7)
          };
          newServer.lastHealed = Date.now();
          
          generatedAlerts.push({
            type: 'auto_healing',
            serverId: server.id,
            serverName: server.name,
            severity: 'info',
            healingActions: ['Service restart', 'Memory cleanup', 'Cache flush'],
            oldStatus: 'critical',
            newStatus: 'online'
          });
        }
      }
      
      // Generate prediction
      newServer.prediction = generatePrediction(newServer, globalContext);
      
      return { server: newServer, alerts: generatedAlerts };
    };

    const generatePrediction = (server, context) => {
      const { cpuUsage, memoryUsage, networkLatency } = server.metrics;
      
      let risk = 0;
      if (cpuUsage > 80) risk += 0.3 * (cpuUsage - 80) / 20;
      if (memoryUsage > 80) risk += 0.4 * (memoryUsage - 80) / 20;
      if (networkLatency > 100) risk += 0.2 * Math.min(1, (networkLatency - 100) / 200);
      
      // Status-based risk
      if (server.status === 'warning') risk += 0.3;
      if (server.status === 'critical') risk += 0.6;
      
      // Business context risk
      if (context.businessHours && server.environment === 'production') risk += 0.1;
      if (server.criticality === 'critical') risk += 0.1;
      
      const confidence = 0.7 + Math.random() * 0.3;
      const timeToFailure = risk > 0.6 ? (60000 + Math.random() * 600000) : null;
      
      return { risk: Math.max(0, Math.min(1, risk)), confidence, timeToFailure };
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

      let allAlerts = [];
      let allIncidents = [];
      let allPredictions = [];
      let allAnomalies = [];

      servers = servers.map(server => {
        const result = evolveServer(server, deltaTime, globalContext);
        allAlerts.push(...result.alerts);
        
        // Check for incidents
        if (result.server.status === 'critical' || result.server.status === 'warning') {
          allIncidents.push({
            id: `inc-${result.server.id}-${now}`,
            serverId: result.server.id,
            serverName: result.server.name,
            type: result.server.metrics.cpuUsage > 90 ? 'cpu_overload' : 
                  result.server.metrics.memoryUsage > 90 ? 'memory_exhaustion' : 'performance_degradation',
            severity: result.server.status,
            description: `${result.server.name} experiencing performance issues`,
            startTime: now - Math.random() * 300000,
            businessImpact: result.server.environment === 'production' ? 0.7 : 0.3
          });
        }
        
        // Add predictions
        if (result.server.prediction) {
          allPredictions.push({
            serverId: result.server.id,
            serverName: result.server.name,
            prediction: result.server.prediction
          });
        }
        
        return result.server;
      });

      // Generate anomalies (simplified)
      if (Math.random() < 0.1) {
        const randomServer = servers[Math.floor(Math.random() * servers.length)];
        allAnomalies.push({
          id: `anomaly-${now}`,
          type: 'performance_spike',
          serverId: randomServer.id,
          serverName: randomServer.name,
          severity: 'warning',
          description: 'Unusual performance pattern detected',
          timestamp: now
        });
      }

      if (alertCallback) {
        alertCallback(allAlerts, allIncidents, allPredictions, allAnomalies);
      }
    };

    return {
      startEvolution: (intervalMs = 5000) => {
        if (evolutionInterval) clearInterval(evolutionInterval);
        evolutionInterval = setInterval(evolveSystem, intervalMs);
      },
      
      stopEvolution: () => {
        if (evolutionInterval) clearInterval(evolutionInterval);
        evolutionInterval = null;
      },
      
      setAlertCallback: (callback) => {
        alertCallback = callback;
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

  // Alert creation functions
  const createSystemAlert = (incident, category) => {
    const businessImpact = calculateBusinessImpact(incident);
    const alertId = `alert-${incident.id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: alertId,
      title: incident.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: incident.description || `${incident.serverName} is experiencing ${incident.type}`,
      severity: incident.severity === 'critical' ? 'critical' : 'warning',
      type: incident.type,
      category: 'system',
      sourceId: incident.serverId,
      sourceName: incident.serverName,
      timestamp: incident.startTime || Date.now(),
      businessImpact,
      tags: [incident.type, 'system', 'infrastructure'],
      metadata: {
        serverId: incident.serverId,
        serverName: incident.serverName,
        incidentType: incident.type,
        environment: 'production'
      }
    };
  };

  const createPredictiveAlert = (prediction) => {
    const alertId = `pred-alert-${prediction.serverId}-${Date.now()}`;
    
    return {
      id: alertId,
      title: `Predictive Alert: High Failure Risk`,
      description: `AI prediction indicates ${prediction.serverName} has ${Math.round(prediction.prediction.risk * 100)}% failure risk`,
      severity: prediction.prediction.risk > 0.8 ? 'critical' : 'warning',
      type: 'predictive_failure_risk',
      category: 'predictive',
      sourceId: prediction.serverId,
      sourceName: prediction.serverName,
      timestamp: Date.now(),
      businessImpact: prediction.prediction.risk * 0.8,
      tags: ['predictive', 'ai', 'failure-risk'],
      metadata: {
        serverId: prediction.serverId,
        serverName: prediction.serverName,
        failureRisk: prediction.prediction.risk,
        confidence: prediction.prediction.confidence,
        timeToFailure: prediction.prediction.timeToFailure
      }
    };
  };

  const createAnomalyAlert = (anomaly) => {
    const alertId = `anomaly-${anomaly.id || Date.now()}`;
    
    return {
      id: alertId,
      title: `Anomaly Detected: ${anomaly.type.replace('_', ' ')}`,
      description: anomaly.description || `Unusual ${anomaly.type} pattern detected on ${anomaly.serverName}`,
      severity: anomaly.severity || 'warning',
      type: 'anomaly',
      category: 'anomaly',
      sourceId: anomaly.serverId,
      sourceName: anomaly.serverName,
      timestamp: anomaly.timestamp || Date.now(),
      businessImpact: 0.4,
      tags: ['anomaly', 'detection', anomaly.type],
      metadata: {
        serverId: anomaly.serverId,
        serverName: anomaly.serverName,
        anomalyType: anomaly.type
      }
    };
  };

  const createAutoHealingAlert = (healingAlert) => {
    const alertId = `healing-${healingAlert.serverId}-${Date.now()}`;
    
    return {
      id: alertId,
      title: `Auto-Healing Successful`,
      description: `${healingAlert.serverName} has been automatically healed`,
      severity: 'info',
      type: 'auto_healing_success',
      category: 'healing',
      sourceId: healingAlert.serverId,
      sourceName: healingAlert.serverName,
      timestamp: Date.now(),
      businessImpact: -0.3, // Positive impact
      tags: ['auto-healing', 'recovery', 'success'],
      metadata: {
        serverId: healingAlert.serverId,
        serverName: healingAlert.serverName,
        healingActions: healingAlert.healingActions,
        oldStatus: healingAlert.oldStatus,
        newStatus: healingAlert.newStatus
      }
    };
  };

  const calculateBusinessImpact = (incident) => {
    let impact = 0.3; // Base impact
    
    // Severity impact
    if (incident.severity === 'critical') impact += 0.4;
    else if (incident.severity === 'warning') impact += 0.2;
    
    // Environment impact
    if (incident.environment === 'production') impact += 0.3;
    
    // Server type impact
    const highImpactTypes = ['api', 'db', 'lb', 'web'];
    if (highImpactTypes.includes(incident.serverType)) impact += 0.2;
    
    return Math.min(1.0, impact);
  };

  // Intelligent noise reducer
  const createIntelligentNoiseReducer = () => {
    const recentAlerts = [];
    const windowMs = 5 * 60 * 1000; // 5 minutes
    const maxBuffer = 1000;

    const prune = () => {
      const cutoff = Date.now() - windowMs;
      while (recentAlerts.length > 0 && recentAlerts[0].timestamp < cutoff) {
        recentAlerts.shift();
      }
      if (recentAlerts.length > maxBuffer) {
        recentAlerts.splice(0, Math.floor(maxBuffer * 0.25));
      }
    };

    const shouldSuppress = (alert) => {
      prune();
      
      // Check for recent duplicates
      const duplicate = recentAlerts.find(a => 
        a.sourceId === alert.sourceId && 
        a.type === alert.type && 
        Math.abs(a.timestamp - alert.timestamp) < 60000 // 1 minute
      );
      
      if (duplicate) {
        return { suppress: true, reason: 'Duplicate alert within 1 minute' };
      }
      
      // Check for flapping
      const relatedAlerts = recentAlerts.filter(a => 
        a.sourceId === alert.sourceId && 
        Math.abs(a.timestamp - alert.timestamp) < windowMs
      ).sort((a, b) => a.timestamp - b.timestamp);
      
      if (relatedAlerts.length > 5) {
        const transitions = relatedAlerts.reduce((count, curr, i) => {
          if (i === 0) return count;
          return relatedAlerts[i - 1].severity !== curr.severity ? count + 1 : count;
        }, 0);
        
        if (transitions > 3) {
          return { suppress: true, reason: 'Flapping detected (multiple status changes)' };
        }
      }
      
      // Store alert for future analysis
      recentAlerts.push(alert);
      
      return { suppress: false };
    };

    return { shouldSuppress };
  };

  // Filter alerts based on UI filters
  const filteredAlerts = useMemo(() => {
    let filtered = alerts.filter(alert => !acknowledgedAlerts.has(alert.id));
    
    if (filterSeverity !== 'all') {
      filtered = filtered.filter(alert => alert.severity === filterSeverity);
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(alert => alert.category === filterType);
    }
    
    return filtered;
  }, [alerts, acknowledgedAlerts, filterSeverity, filterType]);

  // Alert counts
  const alertCounts = useMemo(() => {
    const unacknowledged = alerts.filter(alert => !acknowledgedAlerts.has(alert.id));
    return {
      total: unacknowledged.length,
      critical: unacknowledged.filter(a => a.severity === 'critical').length,
      warning: unacknowledged.filter(a => a.severity === 'warning').length,
      info: unacknowledged.filter(a => a.severity === 'info').length,
      suppressed: suppressedAlerts.length
    };
  }, [alerts, acknowledgedAlerts, suppressedAlerts]);

  // Alert actions
  const alertActions = [
    {
      id: 'restart-service',
      label: 'Restart Service',
      icon: Zap,
      dangerous: true,
      handler: async (alert) => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { success: true, message: 'Service restarted successfully' };
      }
    },
    {
      id: 'scale-up',
      label: 'Auto Scale',
      icon: TrendingUp,
      dangerous: false,
      handler: async (alert) => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return { success: true, message: 'Auto-scaling initiated' };
      }
    },
    {
      id: 'run-diagnostics',
      label: 'Diagnostics',
      icon: Activity,
      dangerous: false,
      handler: async (alert) => {
        await new Promise(resolve => setTimeout(resolve, 3000));
        return { success: true, message: 'Diagnostics completed', data: { cpu: '45%', memory: '67%' } };
      }
    },
    {
      id: 'open-runbook',
      label: 'Runbook',
      icon: Brain,
      dangerous: false,
      handler: async (alert) => {
        return { success: true, url: `/runbooks/${alert.type}` };
      }
    }
  ];

  // Action handlers
  const handleAcknowledge = useCallback((alertId) => {
    setAcknowledgedAlerts(prev => new Set([...prev, alertId]));
  }, []);

  const handleRunAction = useCallback(async (alert, action) => {
    setProcessingActions(prev => new Map(prev).set(`${alert.id}-${action.id}`, true));
    
    try {
      if (action.dangerous) {
        const confirmed = window.confirm(`Are you sure you want to "${action.label}" for ${alert.sourceName}?`);
        if (!confirmed) {
          setProcessingActions(prev => {
            const newMap = new Map(prev);
            newMap.delete(`${alert.id}-${action.id}`);
            return newMap;
          });
          return;
        }
      }

      const result = await action.handler(alert);
      
      if (result.success) {
        // Auto-acknowledge successful actions
        if (action.id !== 'run-diagnostics' && action.id !== 'open-runbook') {
          handleAcknowledge(alert.id);
        }
        
        // Show success feedback
        console.log(`Action ${action.label} completed successfully for ${alert.sourceName}`);
        
        // If it's a healing action, potentially trigger system update
        if (action.id === 'restart-service' && evolutionSystemRef.current) {
          // Simulate immediate improvement
          setTimeout(() => {
            const healingAlert = {
              type: 'manual_healing',
              serverId: alert.sourceId,
              serverName: alert.sourceName,
              severity: 'info',
              healingActions: [action.label],
              triggeredBy: 'manual_action'
            };
            
            const processedAlert = createAutoHealingAlert(healingAlert);
            setAlerts(prev => [...prev, processedAlert]);
          }, 1000);
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Action ${action.label} failed:`, error);
      return { success: false, error: error.message };
    } finally {
      setProcessingActions(prev => {
        const newMap = new Map(prev);
        newMap.delete(`${alert.id}-${action.id}`);
        return newMap;
      });
    }
  }, [handleAcknowledge]);

  const handleBulkAcknowledge = useCallback(() => {
    const alertIds = filteredAlerts.map(alert => alert.id);
    setAcknowledgedAlerts(prev => new Set([...prev, ...alertIds]));
  }, [filteredAlerts]);

  const injectTestIncident = useCallback(() => {
    if (evolutionSystemRef.current) {
      const scenarios = ['cpu_overload', 'memory_exhaustion', 'network_degradation', 'database_slow_query'];
      const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      const serverIds = ['api-order-02', 'web-02', 'cache-session-01', 'db-inventory-01'];
      const serverId = serverIds[Math.floor(Math.random() * serverIds.length)];
      
      evolutionSystemRef.current.injectIncident(serverId, scenario);
    }
  }, []);

  // Icon mapping for different alert types
  const getAlertIcon = (alert) => {
    const iconMap = {
      'cpu_threshold': Cpu,
      'memory_threshold': Database,
      'latency_threshold': Globe,
      'status_change': AlertTriangle,
      'degradation': AlertCircle,
      'recovery': CheckCircle,
      'auto_healing_success': Shield,
      'predictive_failure_risk': Brain,
      'anomaly': Eye,
      'manual_healing': Settings
    };
    
    return iconMap[alert.type] || AlertTriangle;
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'text-red-500 bg-red-50 border-red-200',
      warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      info: 'text-blue-500 bg-blue-50 border-blue-200'
    };
    return colors[severity] || colors.info;
  };

  // Initialize system
  useEffect(() => {
    const cleanup = initializeAlertSystem();
    return cleanup;
  }, [initializeAlertSystem]);

  // Auto-acknowledge low-priority alerts if enabled
  useEffect(() => {
    if (autoAcknowledge) {
      const lowPriorityAlerts = alerts.filter(alert => 
        alert.severity === 'info' && 
        alert.type === 'auto_healing_success' &&
        !acknowledgedAlerts.has(alert.id)
      );
      
      if (lowPriorityAlerts.length > 0) {
        const alertIds = lowPriorityAlerts.map(alert => alert.id);
        setAcknowledgedAlerts(prev => new Set([...prev, ...alertIds]));
      }
    }
  }, [alerts, autoAcknowledge, acknowledgedAlerts]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      {/* Enhanced Header */}
      <div className={`flex items-center justify-between p-4 border-b backdrop-blur-sm transition-all duration-300 ${
        alertCounts.critical > 0 ? 'bg-red-50/80 border-red-200 dark:bg-red-900/20 dark:border-red-700' :
        alertCounts.warning > 0 ? 'bg-yellow-50/80 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700' :
        'bg-white/80 border-gray-200 dark:bg-gray-800/80 dark:border-gray-700'
      }`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className={`w-6 h-6 transition-colors duration-300 ${
              alertCounts.critical > 0 ? 'text-red-500' :
              alertCounts.warning > 0 ? 'text-yellow-500' : 'text-blue-500'
            }`} />
            {alertCounts.total > 0 && (
              <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center ${
                alertCounts.critical > 0 ? 'bg-red-500 animate-pulse' :
                alertCounts.warning > 0 ? 'bg-yellow-500' : 'bg-blue-500'
              }`}>
                {alertCounts.total > 99 ? '99+' : alertCounts.total}
              </div>
            )}
          </div>
          
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Intelligent Alert Center
              {alertCounts.critical > 0 && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full animate-pulse">
                  🚨 Critical Alerts
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enterprise Infrastructure Monitoring • {alertCounts.total} active alerts
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Alert Summary */}
          <div className="flex items-center gap-2 text-sm">
            {alertCounts.critical > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded">
                <AlertTriangle className="w-3 h-3" />
                {alertCounts.critical}
              </div>
            )}
            {alertCounts.warning > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                <AlertCircle className="w-3 h-3" />
                {alertCounts.warning}
              </div>
            )}
            {alertCounts.info > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded">
                <Info className="w-3 h-3" />
                {alertCounts.info}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkAcknowledge}
              disabled={filteredAlerts.length === 0}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Ack All
            </button>
            
            <button
              onClick={injectTestIncident}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              title="Inject Test Incident"
            >
              Test Alert
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-3 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Filters:</span>
        </div>
        
        <select 
          value={filterSeverity} 
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        
        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
          className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
        >
          <option value="all">All Types</option>
          <option value="system">System</option>
          <option value="predictive">Predictive</option>
          <option value="anomaly">Anomaly</option>
          <option value="healing">Auto-Healing</option>
        </select>
        
        <div className="flex items-center gap-2 ml-auto">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={showSuppressed}
              onChange={(e) => setShowSuppressed(e.target.checked)}
              className="rounded"
            />
            Show Suppressed ({suppressedAlerts.length})
          </label>
          
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={autoAcknowledge}
              onChange={(e) => setAutoAcknowledge(e.target.checked)}
              className="rounded"
            />
            Auto-Ack Healing
          </label>
        </div>
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredAlerts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                All Clear!
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                No active alerts matching your filters
              </p>
              {alertCounts.total > 0 && (
                <p className="text-sm text-gray-400 mt-2">
                  {alertCounts.total} acknowledged alerts hidden
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => {
              const AlertIcon = getAlertIcon(alert);
              const isProcessing = Array.from(processingActions.keys()).some(key => key.startsWith(alert.id));
              
              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${getSeverityColor(alert.severity)} ${
                    selectedAlert?.id === alert.id ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                  }`}
                  onClick={() => setSelectedAlert(selectedAlert?.id === alert.id ? null : alert)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <AlertIcon className={`w-5 h-5 ${
                        alert.severity === 'critical' ? 'text-red-500' :
                        alert.severity === 'warning' ? 'text-yellow-600' : 'text-blue-500'
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                            {alert.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {alert.description}
                          </p>
                          
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimestamp(alert.timestamp)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Server className="w-3 h-3" />
                              {alert.sourceName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              Impact: {Math.round((alert.businessImpact || 0) * 100)}%
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                              {alert.category}
                            </span>
                          </div>
                          
                          {alert.tags && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {alert.tags.map((tag, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 text-xs rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcknowledge(alert.id);
                            }}
                            className="px-3 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                          >
                            Acknowledge
                          </button>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {alertActions
                          .filter(action => {
                            // Show relevant actions based on alert type
                            if (alert.category === 'predictive') {
                              return ['scale-up', 'run-diagnostics', 'open-runbook'].includes(action.id);
                            }
                            if (alert.category === 'healing') {
                              return ['run-diagnostics', 'open-runbook'].includes(action.id);
                            }
                            return true;
                          })
                          .map((action) => {
                            const ActionIcon = action.icon;
                            const isActionProcessing = processingActions.has(`${alert.id}-${action.id}`);
                            
                            return (
                              <button
                                key={action.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRunAction(alert, action);
                                }}
                                disabled={isActionProcessing || isProcessing}
                                className={`flex items-center gap-1 px-2 py-1 text-xs border rounded transition-colors ${
                                  action.dangerous 
                                    ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' 
                                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                } ${
                                  isActionProcessing || isProcessing 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : ''
                                }`}
                              >
                                <ActionIcon className="w-3 h-3" />
                                {isActionProcessing ? 'Processing...' : action.label}
                              </button>
                            );
                          })}
                      </div>
                      
                      {/* Expanded Details */}
                      {selectedAlert?.id === alert.id && (
                        <div className="mt-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border">
                          <h5 className="font-medium text-sm text-gray-900 dark:text-white mb-2">
                            Alert Details
                          </h5>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Alert ID:</span>
                              <div className="font-mono text-gray-700 dark:text-gray-300">{alert.id}</div>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Source ID:</span>
                              <div className="font-mono text-gray-700 dark:text-gray-300">{alert.sourceId}</div>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Type:</span>
                              <div className="text-gray-700 dark:text-gray-300">{alert.type}</div>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Severity:</span>
                              <div className={`font-medium ${
                                alert.severity === 'critical' ? 'text-red-600' :
                                alert.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                              }`}>
                                {alert.severity.toUpperCase()}
                              </div>
                            </div>
                          </div>
                          
                          {alert.metadata && (
                            <div className="mt-3">
                              <span className="text-gray-500 dark:text-gray-400 text-xs">Metadata:</span>
                              <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">
                                {JSON.stringify(alert.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Suppressed Alerts */}
        {showSuppressed && suppressedAlerts.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <EyeOff className="w-4 h-4" />
              Suppressed Alerts ({suppressedAlerts.length})
            </h4>
            <div className="space-y-2">
              {suppressedAlerts.slice(-10).map((alert, i) => (
                <div key={i} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg opacity-60">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{alert.title}</span>
                    <span className="text-xs text-gray-500 ml-auto">
                      Suppressed: {alert.suppressionReason}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            Showing {filteredAlerts.length} of {alertCounts.total} active alerts
          </span>
          <span>
            Suppressed: {alertCounts.suppressed} • History: {alertHistoryRef.current.length} total
          </span>
        </div>
      </div>
    </div>
  );
};

export default IntelligentAlertCenter;