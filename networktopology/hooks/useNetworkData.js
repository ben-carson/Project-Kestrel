//src/components/widgets/NetworkTopology/hooks/useNetworkData.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { EnterpriseNetworkSimulator } from '/src/components/widgets/networktopology/lib/simulators/NetworkSimulator.js';
import { MOCK_SERVER_DATA } from '../lib/constants';

export const useNetworkData = ({ autoHealing = true } = {}) => {
  const [liveServers, setLiveServers] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [applicationHealth, setApplicationHealth] = useState(new Map());
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [predictiveAnalytics, setPredictiveAnalytics] = useState([]);
  const [businessIntelligence, setBusinessIntelligence] = useState({});
  const [autoHealingEvents, setAutoHealingEvents] = useState([]);
  
  const simulatorRef = useRef(null);

  useEffect(() => {
    const simulator = new EnterpriseNetworkSimulator(MOCK_SERVER_DATA, { autoHealing });
    simulatorRef.current = simulator;
    
    simulator.setEvolutionCallback((servers, health, appHealth, analytics) => {
      setLiveServers(servers);
      setSystemHealth(health);
      setApplicationHealth(appHealth);
      setActiveIncidents(analytics.incidents || []);
      setPredictiveAnalytics(simulator.getPredictiveAnalytics());
      setBusinessIntelligence(simulator.getBusinessIntelligence());
      setAutoHealingEvents(simulator.getAutoHealingStatus().recentHealingEvents || []);
    });
    
    simulator.startEvolution(3000);
    
    return () => {
      simulator.stopEvolution();
    };
  }, [autoHealing]);

  const injectTestIncident = useCallback(() => {
    if (simulatorRef.current && liveServers.length > 0) {
      const randomServer = liveServers[Math.floor(Math.random() * liveServers.length)];
      const scenarios = ['cpu_overload', 'memory_exhaustion', 'network_slow', 'cache_miss_storm'];
      const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      simulatorRef.current.injectIncident(randomServer.id, scenario);
    }
  }, [liveServers]);

  return {
    liveServers,
    systemHealth,
    applicationHealth,
    activeIncidents,
    predictiveAnalytics,
    businessIntelligence,
    autoHealingEvents,
    injectTestIncident
  };
};