// src/components/widgets/NetworkTopology/hooks/useEvolutionSystem.js

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing network evolution system
 * Handles real-time server state changes, auto-healing, and incident management
 */
export const useEvolutionSystem = (initialServers = [], options = {}) => {
  const {
    autoHealing = true,
    evolutionInterval = 3000,
    businessHours = { start: 9, end: 17 },
    enabled = true
  } = options;

  // State
  const [servers, setServers] = useState(initialServers);
  const [systemHealth, setSystemHealth] = useState({});
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [autoHealingEvents, setAutoHealingEvents] = useState([]);
  const [predictiveAnalytics, setPredictiveAnalytics] = useState([]);
  const [businessIntelligence, setBusinessIntelligence] = useState({});

  // Refs
  const evolutionIntervalRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());
  const incidentCounterRef = useRef(0);

  // Helper functions
  const isBusinessHours = useCallback(() => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    return day >= 1 && day <= 5 && hour >= businessHours.start && hour < businessHours.end;
  }, [businessHours]);

  const generatePrediction = useCallback((server) => {
    const { cpuUsage = 0, memoryUsage = 0, networkLatency = 0 } = server.metrics || {};
    
    let risk = 0;
    if (cpuUsage > 80) risk += 0.3;
    if (memoryUsage > 80) risk += 0.4;
    if (networkLatency > 100) risk += 0.2;
    if (server.status === 'warning') risk += 0.2;
    if (server.status === 'critical') risk += 0.5;
    
    const confidence = 0.7 + Math.random() * 0.3;
    const timeToFailure = risk > 0.7 ? (60000 + Math.random() * 300000) : null;
    
    return { 
      risk: Math.min(1, risk), 
      confidence, 
      timeToFailure 
    };
  }, []);

  const createIncident = useCallback((server, severity, description) => {
    const incident = {
      id: `inc-${++incidentCounterRef.current}-${server.id}`,
      serverId: server.id,
      serverName: server.name,
      type: description.toLowerCase().replace(/ /g, '_'),
      severity,
      description,
      startTime: Date.now(),
      status: 'active',
      businessImpact: server.environment === 'production' ? 0.7 : 0.3
    };
    
    setActiveIncidents(prev => [...prev, incident]);
    return incident;
  }, []);

  const resolveIncidents = useCallback((serverId, resolution = 'Auto-resolved') => {
    setActiveIncidents(prev => 
      prev.map(incident => 
        incident.serverId === serverId && incident.status === 'active'
          ? { ...incident, status: 'resolved', endTime: Date.now(), resolution }
          : incident
      )
    );
  }, []);

  const evolveServer = useCallback((server, deltaTime) => {
    const timeFactor = deltaTime / 1000;
    let newServer = { ...server };
    
    const businessLoadFactor = isBusinessHours() ? 1.5 : 0.6;
    
    // Initialize metrics if they don't exist
    if (!newServer.metrics) {
      newServer.metrics = {
        cpuUsage: 20 + Math.random() * 30,
        memoryUsage: 30 + Math.random() * 20,
        networkLatency: 5 + Math.random() * 15,
        storageIO: 1000 + Math.random() * 500
      };
    }
    
    if (server.status === 'online' || server.status === 'healthy') {
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
        createIncident(newServer, 'critical', 'Resource exhaustion detected');
      } else if (newServer.metrics.cpuUsage > 75 || newServer.metrics.memoryUsage > 75) {
        newServer.status = 'warning';
      } else {
        newServer.status = 'online';
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
          resolveIncidents(server.id, 'Warning state resolved');
        } else {
          // Degradation
          newServer.status = 'critical';
          createIncident(newServer, 'critical', 'System degraded from warning');
        }
      }
    } else if (server.status === 'critical') {
      // Critical state - auto-healing or recovery
      if (autoHealing && Math.random() < 0.15 * timeFactor) {
        newServer.status = 'online';
        newServer.metrics = {
          ...server.metrics,
          cpuUsage: Math.max(5, server.metrics.cpuUsage * 0.6),
          memoryUsage: Math.max(10, server.metrics.memoryUsage * 0.7),
          networkLatency: Math.max(1, server.metrics.networkLatency * 0.8)
        };
        newServer.lastHealed = Date.now();
        
        // Add to healing events
        setAutoHealingEvents(prev => [...prev, {
          serverId: server.id,
          serverName: server.name,
          healedAt: Date.now()
        }].slice(-10)); // Keep last 10 events
        
        resolveIncidents(server.id, 'Auto-healing successful');
      }
    } else if (server.status === 'offline') {
      // Offline nodes might come back online
      if (Math.random() < 0.05 * timeFactor) {
        newServer.status = 'online';
        newServer.metrics = {
          cpuUsage: 10 + Math.random() * 20,
          memoryUsage: 15 + Math.random() * 25,
          networkLatency: 5 + Math.random() * 10,
          storageIO: 500 + Math.random() * 1000
        };
        resolveIncidents(server.id, 'System restored');
      }
    }
    
    // Add predictive analytics
    newServer.prediction = generatePrediction(newServer);
    
    return newServer;
  }, [autoHealing, isBusinessHours, createIncident, resolveIncidents, generatePrediction]);

  const calculateSystemHealth = useCallback((currentServers) => {
    const statusCounts = currentServers.reduce((acc, server) => {
      const status = server.status === 'healthy' ? 'online' : server.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    const total = currentServers.length || 1;
    return {
      healthy: ((statusCounts.online || 0) / total) * 100,
      warning: ((statusCounts.warning || 0) / total) * 100,
      critical: ((statusCounts.critical || 0) / total) * 100,
      offline: ((statusCounts.offline || 0) / total) * 100,
      totalServers: total,
      timestamp: Date.now()
    };
  }, []);

  const updateBusinessIntelligence = useCallback((currentServers) => {
    const criticalProductionServers = currentServers.filter(
      s => s.status === 'critical' && s.environment === 'production'
    );
    
    setBusinessIntelligence({
      isBusinessHours: isBusinessHours(),
      overallBusinessImpact: criticalProductionServers.length * 0.2,
      criticalBusinessServices: criticalProductionServers.map(s => ({
        id: s.id,
        name: s.name,
        impact: 0.7
      }))
    });
  }, [isBusinessHours]);

  const updatePredictiveAnalytics = useCallback((currentServers) => {
    const analytics = currentServers.map(server => ({
      serverId: server.id,
      serverName: server.name,
      prediction: server.prediction || { risk: 0, confidence: 0 },
      recommendations: server.prediction?.risk > 0.7 
        ? ['Scale resources', 'Investigate performance', 'Check dependencies']
        : server.prediction?.risk > 0.4
        ? ['Monitor closely', 'Prepare scaling']
        : []
    }));
    
    setPredictiveAnalytics(analytics);
  }, []);

  const evolveSystem = useCallback(() => {
    const now = Date.now();
    const deltaTime = now - lastUpdateRef.current;
    lastUpdateRef.current = now;

    setServers(currentServers => {
      const evolvedServers = currentServers.map(server => evolveServer(server, deltaTime));
      
      // Update derived state
      const health = calculateSystemHealth(evolvedServers);
      setSystemHealth(health);
      
      updateBusinessIntelligence(evolvedServers);
      updatePredictiveAnalytics(evolvedServers);
      
      return evolvedServers;
    });

    // Clean up old incidents (older than 1 hour)
    setActiveIncidents(prev => 
      prev.filter(incident => 
        incident.status === 'active' || 
        (Date.now() - (incident.endTime || incident.startTime)) < 3600000
      )
    );

    // Clean up old healing events (older than 30 minutes)
    setAutoHealingEvents(prev => 
      prev.filter(event => Date.now() - event.healedAt < 1800000)
    );
  }, [evolveServer, calculateSystemHealth, updateBusinessIntelligence, updatePredictiveAnalytics]);

  // Public methods
  const startEvolution = useCallback(() => {
    if (evolutionIntervalRef.current || !enabled) return;
    
    evolutionIntervalRef.current = setInterval(evolveSystem, evolutionInterval);
  }, [evolveSystem, evolutionInterval, enabled]);

  const stopEvolution = useCallback(() => {
    if (evolutionIntervalRef.current) {
      clearInterval(evolutionIntervalRef.current);
      evolutionIntervalRef.current = null;
    }
  }, []);

  const injectIncident = useCallback((serverId, incidentType = 'critical') => {
    setServers(currentServers => 
      currentServers.map(server => {
        if (server.id !== serverId) return server;
        
        let updatedServer = { ...server };
        
        switch (incidentType) {
          case 'cpu_spike':
            updatedServer.metrics = { ...server.metrics, cpuUsage: 95 };
            updatedServer.status = 'critical';
            createIncident(updatedServer, 'critical', 'CPU spike detected');
            break;
          case 'memory_leak':
            updatedServer.metrics = { ...server.metrics, memoryUsage: 90 };
            updatedServer.status = 'critical';
            createIncident(updatedServer, 'critical', 'Memory leak detected');
            break;
          case 'network_congestion':
            updatedServer.metrics = { ...server.metrics, networkLatency: 500 };
            updatedServer.status = 'warning';
            createIncident(updatedServer, 'warning', 'Network congestion');
            break;
          case 'hardware_failure':
            updatedServer.status = 'offline';
            createIncident(updatedServer, 'critical', 'Hardware failure');
            break;
          default:
            updatedServer.status = 'critical';
            createIncident(updatedServer, 'critical', 'Unknown incident');
        }
        
        return updatedServer;
      })
    );
  }, [createIncident]);

  const forceEvolution = useCallback(() => {
    evolveSystem();
  }, [evolveSystem]);

  // Effects
  useEffect(() => {
    if (initialServers.length > 0) {
      setServers(initialServers);
      const health = calculateSystemHealth(initialServers);
      setSystemHealth(health);
      updateBusinessIntelligence(initialServers);
      updatePredictiveAnalytics(initialServers);
    }
  }, [initialServers, calculateSystemHealth, updateBusinessIntelligence, updatePredictiveAnalytics]);

  useEffect(() => {
    if (enabled) {
      startEvolution();
    } else {
      stopEvolution();
    }
    
    return stopEvolution;
  }, [enabled, startEvolution, stopEvolution]);

  // Return hook interface
  return {
    // State
    servers,
    systemHealth,
    activeIncidents,
    autoHealingEvents,
    predictiveAnalytics,
    businessIntelligence,
    
    // Actions
    startEvolution,
    stopEvolution,
    injectIncident,
    forceEvolution,
    
    // Utilities
    isBusinessHours: isBusinessHours()
  };
};