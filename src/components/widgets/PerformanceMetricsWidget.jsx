// src/components/widgets/PerformanceMetricsWidget.jsx
// Enhanced with AIDA intelligence: confidence scoring, memory, agent debates, and feedback
import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Cpu, MemoryStick, HardDrive, Wifi, Clock, ChevronDown, ChevronUp, Settings } from 'lucide-react';

// AIDA Intelligence Components
import InsightBadge from './InsightBadge';
import DebateLog from './DebateLog';

// Store Integrations
import { useDashboardStore } from '../../store/useDashboardStore';
import { useWidgetMemoryStore, createMemoryEvent, MEMORY_EVENT_TYPES, FEEDBACK_TYPES } from '../../store/useWidgetMemoryStore';

const WIDGET_ID = 'performance-metrics';

// Confidence scoring thresholds
const PERFORMANCE_THRESHOLDS = {
  cpu: { warning: 70, critical: 85 },
  memory: { warning: 80, critical: 90 },
  network: { warning: 100, critical: 200 },
  storage: { warning: 5000, critical: 8000 },
  response: { warning: 150, critical: 300 }
};

const PerformanceMetricsWidget = () => {
  const { serverOverview, healthTrend, getAdvancedMetrics } = useDashboardStore();
  const { 
    storeMemory, 
    queryMemories, 
    recordFeedback, 
    getConfidenceAdjustment,
    shouldSuppressAlert 
  } = useWidgetMemoryStore();
  
  const [selectedMetric, setSelectedMetric] = useState('cpu');
  const [timeRange, setTimeRange] = useState('1h');
  const [showInsightPanel, setShowInsightPanel] = useState(false);
  const [widgetState, setWidgetState] = useState('baseline'); // baseline, advisory, alert, critical

  // Calculate real-time performance metrics (same as original)
  const calculateMetrics = () => {
    if (!serverOverview || serverOverview.length === 0) {
      return {
        cpu: { current: 0, avg: 0, peak: 0, trend: 'stable' },
        memory: { current: 0, avg: 0, peak: 0, trend: 'stable' },
        network: { current: 0, avg: 0, peak: 0, trend: 'stable' },
        storage: { current: 0, avg: 0, peak: 0, trend: 'stable' },
        response: { current: 0, avg: 0, peak: 0, trend: 'stable' },
        throughput: { current: 0, avg: 0, peak: 0, trend: 'stable' }
      };
    }

    const serverCount = serverOverview.length;
    
    // Current metrics (average across all servers)
    const currentCpu = serverOverview.reduce((sum, s) => sum + (s.metrics?.cpuUsage || 0), 0) / serverCount;
    const currentMemory = serverOverview.reduce((sum, s) => sum + (s.metrics?.memoryUsage || 0), 0) / serverCount;
    const currentNetwork = serverOverview.reduce((sum, s) => sum + (s.metrics?.networkLatency || 0), 0) / serverCount;
    const currentStorage = serverOverview.reduce((sum, s) => sum + (s.metrics?.storageIO || 0), 0) / serverCount;

    // Historical metrics from health trend
    const recentTrend = healthTrend?.slice(-20) || [];
    const avgCpu = recentTrend.length > 0 ? recentTrend.reduce((sum, t) => sum + (t.cpuUsage || 0), 0) / recentTrend.length : currentCpu;
    const avgMemory = recentTrend.length > 0 ? recentTrend.reduce((sum, t) => sum + (t.memoryUsage || 0), 0) / recentTrend.length : currentMemory;
    const avgNetwork = recentTrend.length > 0 ? recentTrend.reduce((sum, t) => sum + (t.networkLatency || 0), 0) / recentTrend.length : currentNetwork;
    const avgRequests = recentTrend.length > 0 ? recentTrend.reduce((sum, t) => sum + (t.requestsPerSecond || 0), 0) / recentTrend.length : 1200;

    // Calculate trends
    const getTrend = (current, avg) => {
      const diff = ((current - avg) / avg) * 100;
      if (Math.abs(diff) < 5) return 'stable';
      return diff > 0 ? 'increasing' : 'decreasing';
    };

    return {
      cpu: {
        current: currentCpu,
        avg: avgCpu,
        peak: Math.max(...recentTrend.map(t => t.cpuUsage || 0), currentCpu),
        trend: getTrend(currentCpu, avgCpu)
      },
      memory: {
        current: currentMemory,
        avg: avgMemory,
        peak: Math.max(...recentTrend.map(t => t.memoryUsage || 0), currentMemory),
        trend: getTrend(currentMemory, avgMemory)
      },
      network: {
        current: currentNetwork,
        avg: avgNetwork,
        peak: Math.max(...recentTrend.map(t => t.networkLatency || 0), currentNetwork),
        trend: getTrend(currentNetwork, avgNetwork)
      },
      storage: {
        current: currentStorage,
        avg: currentStorage * 0.9,
        peak: currentStorage * 1.2,
        trend: 'stable'
      },
      response: {
        current: currentNetwork * 1.5,
        avg: avgNetwork * 1.5,
        peak: Math.max(...recentTrend.map(t => (t.networkLatency || 0) * 1.5)),
        trend: getTrend(currentNetwork, avgNetwork)
      },
      throughput: {
        current: avgRequests,
        avg: avgRequests,
        peak: Math.max(...recentTrend.map(t => t.requestsPerSecond || 0), avgRequests),
        trend: 'stable'
      }
    };
  };

  const metrics = calculateMetrics();

  // === AIDA INTELLIGENCE LAYER ===

  // Simulate agent analysis and confidence scoring
  const performIntelligentAnalysis = useMemo(() => {
    const agents = [];
    const context = {
      cpu: metrics.cpu.current,
      memory: metrics.memory.current,
      network: metrics.network.current,
      storage: metrics.storage.current,
      trends: {
        cpu: metrics.cpu.trend,
        memory: metrics.memory.trend,
        network: metrics.network.trend
      }
    };

    // CVE Analyst Agent
    const cveAnalyst = {
      name: 'CVE Analyst',
      opinion: 'NEUTRAL',
      rationale: 'No obvious security performance indicators detected',
      confidence: 0.7
    };

    if (metrics.cpu.current > 85) {
      cveAnalyst.opinion = 'DISAGREE';
      cveAnalyst.rationale = 'High CPU could indicate crypto mining or DDoS attack';
      cveAnalyst.confidence = 0.8;
    }

    agents.push(cveAnalyst);

    // Config Drift Watcher Agent
    const configDrift = {
      name: 'Config Drift Watcher',
      opinion: 'AGREE',
      rationale: 'Performance metrics align with expected configuration baseline',
      confidence: 0.6
    };

    if (metrics.memory.current > PERFORMANCE_THRESHOLDS.memory.warning) {
      configDrift.opinion = 'DISAGREE';
      configDrift.rationale = 'Memory usage exceeds configured thresholds, possible config drift';
      configDrift.confidence = 0.9;
    }

    agents.push(configDrift);

    // Simulation Planner Agent
    const simulationPlanner = {
      name: 'Simulation Planner',
      opinion: 'AGREE',
      rationale: 'Current performance levels are within normal operating parameters',
      confidence: 0.8
    };

    // Check for concerning combinations
    if (metrics.cpu.current > 75 && metrics.memory.current > 75) {
      simulationPlanner.opinion = 'DISAGREE';
      simulationPlanner.rationale = 'Combined CPU/Memory load could cascade to service degradation';
      simulationPlanner.confidence = 0.85;
    } else if (metrics.network.current > PERFORMANCE_THRESHOLDS.network.warning) {
      simulationPlanner.opinion = 'NEUTRAL';
      simulationPlanner.rationale = 'Network latency may impact user experience under load';
      simulationPlanner.confidence = 0.7;
    }

    agents.push(simulationPlanner);

    // Calculate overall confidence using AIDA formula
    // C = (0.40 * S) + (0.30 * H) + (0.20 * A) + (0.10 * D)
    
    // Simulation Certainty (based on agent consensus and data quality)
    const agreeing = agents.filter(a => a.opinion === 'AGREE').length;
    const disagreeing = agents.filter(a => a.opinion === 'DISAGREE').length;
    const total = agents.length;
    const simulationCertainty = Math.max(0, (agreeing - disagreeing) / total + 0.5);

    // Historical Accuracy (query similar past events)
    const similarEvents = queryMemories(WIDGET_ID, {
      similarContext: context,
      limit: 5,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    const historicalAccuracy = similarEvents.length > 0 ? 
      Math.min(1, 0.5 + (similarEvents.length * 0.1)) : 0.4;

    // Agent Consensus
    const avgAgentConfidence = agents.reduce((sum, a) => sum + a.confidence, 0) / agents.length;
    const agentConsensus = avgAgentConfidence;

    // Data Freshness (based on server data recency)
    const dataFreshness = serverOverview?.length > 0 ? 0.9 : 0.5;

    // Apply AIDA confidence formula
    const baseConfidence = (0.40 * simulationCertainty) + 
                          (0.30 * historicalAccuracy) + 
                          (0.20 * agentConsensus) + 
                          (0.10 * dataFreshness);

    // Apply operator feedback adjustment
    const feedbackAdjustment = getConfidenceAdjustment(WIDGET_ID);
    const finalConfidence = Math.max(0, Math.min(1, baseConfidence + feedbackAdjustment));

    // Determine if there are agent disagreements
    const hasDisagreement = agents.some(a => a.opinion === 'DISAGREE') && 
                           agents.some(a => a.opinion === 'AGREE');

    // Check for alert suppression
    const shouldSuppress = shouldSuppressAlert(WIDGET_ID, context);

    return {
      agents,
      confidence: finalConfidence,
      context,
      hasDisagreement,
      shouldSuppress,
      breakdown: {
        simulationCertainty,
        historicalAccuracy,
        agentConsensus,
        dataFreshness,
        feedbackAdjustment
      }
    };
  }, [metrics, queryMemories, getConfidenceAdjustment, shouldSuppressAlert, serverOverview]);

  // Update widget state based on confidence and thresholds
  useEffect(() => {
    const { confidence, shouldSuppress } = performIntelligentAnalysis;
    
    if (shouldSuppress) {
      setWidgetState('baseline');
      return;
    }

    // Determine alert state based on both thresholds and confidence
    const hasThresholdBreach = 
      metrics.cpu.current > PERFORMANCE_THRESHOLDS.cpu.critical ||
      metrics.memory.current > PERFORMANCE_THRESHOLDS.memory.critical ||
      metrics.network.current > PERFORMANCE_THRESHOLDS.network.critical;

    const hasWarningBreach = 
      metrics.cpu.current > PERFORMANCE_THRESHOLDS.cpu.warning ||
      metrics.memory.current > PERFORMANCE_THRESHOLDS.memory.warning ||
      metrics.network.current > PERFORMANCE_THRESHOLDS.network.warning;

    if (hasThresholdBreach && confidence >= 0.75) {
      setWidgetState('critical');
      
      // Store memory event for critical state
      storeMemory(WIDGET_ID, createMemoryEvent(
        MEMORY_EVENT_TYPES.THRESHOLD_BREACH,
        performIntelligentAnalysis.context,
        `Critical performance thresholds breached with high confidence`,
        { 
          confidence,
          thresholds: PERFORMANCE_THRESHOLDS,
          agents: performIntelligentAnalysis.agents.map(a => a.name)
        }
      ));
      
    } else if ((hasWarningBreach && confidence >= 0.50) || confidence >= 0.75) {
      setWidgetState('alert');
      
      // Store memory for alert state
      storeMemory(WIDGET_ID, createMemoryEvent(
        MEMORY_EVENT_TYPES.ALERT,
        performIntelligentAnalysis.context,
        `Performance metrics warrant attention`,
        { confidence, level: 'warning' }
      ));
      
    } else if (confidence >= 0.25) {
      setWidgetState('advisory');
    } else {
      setWidgetState('baseline');
    }
  }, [performIntelligentAnalysis, metrics, storeMemory]);

  // Widget border styling based on intelligence state
  const getWidgetBorderStyle = () => {
    switch (widgetState) {
      case 'critical':
        return 'border-red-500 border-4 animate-pulse';
      case 'alert':
        return 'border-orange-500 border-4';
      case 'advisory':
        return 'border-amber-500 border-2';
      default:
        return 'border-gray-200 dark:border-gray-700';
    }
  };

  // Handle operator feedback
  const handleFeedback = (feedback) => {
    recordFeedback(WIDGET_ID, feedback, {
      confidence: performIntelligentAnalysis.confidence,
      state: widgetState,
      metrics: {
        cpu: metrics.cpu.current,
        memory: metrics.memory.current,
        network: metrics.network.current
      }
    });

    // Auto-hide insight panel after feedback (except for snooze)
    if (feedback !== FEEDBACK_TYPES.SNOOZE) {
      setShowInsightPanel(false);
    }
  };

  // Original metric configurations (unchanged)
  const metricConfigs = {
    cpu: {
      name: 'CPU Usage',
      icon: Cpu,
      unit: '%',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      data: metrics.cpu
    },
    memory: {
      name: 'Memory Usage',
      icon: MemoryStick,
      unit: '%',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      data: metrics.memory
    },
    network: {
      name: 'Network Latency',
      icon: Wifi,
      unit: 'ms',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      data: metrics.network
    },
    storage: {
      name: 'Storage I/O',
      icon: HardDrive,
      unit: ' IOPS',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      data: metrics.storage
    },
    response: {
      name: 'Response Time',
      icon: Clock,
      unit: 'ms',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      data: metrics.response
    },
    throughput: {
      name: 'Throughput',
      icon: Activity,
      unit: ' req/s',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      data: metrics.throughput
    }
  };

  // Original helper functions (unchanged)
  const formatValue = (value, unit) => {
    if (unit === '%') return `${Math.round(value)}${unit}`;
    if (unit === 'ms') return `${Math.round(value)}${unit}`;
    if (unit === ' IOPS') return `${Math.round(value)}${unit}`;
    if (unit === ' req/s') return `${Math.round(value)}${unit}`;
    return `${Math.round(value)}${unit}`;
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing': return '↗️';
      case 'decreasing': return '↘️';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend, metricType) => {
    if (metricType === 'network' || metricType === 'response') {
      switch (trend) {
        case 'decreasing': return 'text-green-500';
        case 'increasing': return 'text-red-500';
        default: return 'text-gray-500';
      }
    }
    
    if (metricType === 'throughput') {
      switch (trend) {
        case 'increasing': return 'text-green-500';
        case 'decreasing': return 'text-red-500';
        default: return 'text-gray-500';
      }
    }
    
    switch (trend) {
      case 'increasing': return 'text-yellow-500';
      case 'stable': return 'text-green-500';
      case 'decreasing': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className={`h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg border-2 ${getWidgetBorderStyle()}`}>
      {/* Enhanced Header with Intelligence Indicators */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Performance Metrics</h3>
          
          {/* AIDA Intelligence Badge */}
          {widgetState !== 'baseline' && (
            <InsightBadge
              confidenceScore={performIntelligentAnalysis.confidence}
              agents={performIntelligentAnalysis.agents.map(a => a.name)}
              tooltip={`${widgetState} level insight`}
            />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Insight Panel Toggle */}
          {(widgetState === 'alert' || widgetState === 'critical') && (
            <button
              onClick={() => setShowInsightPanel(!showInsightPanel)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500/10 text-blue-600 rounded border border-blue-200 hover:bg-blue-500/20 transition-colors"
            >
              Why?
              {showInsightPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="text-xs bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
          >
            <option value="1h">1 Hour</option>
            <option value="4h">4 Hours</option>
            <option value="24h">24 Hours</option>
          </select>
        </div>
      </div>

      {/* AIDA Insight Panel */}
      {showInsightPanel && (widgetState === 'alert' || widgetState === 'critical') && (
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  AIDA Analysis
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Confidence: {Math.round(performIntelligentAnalysis.confidence * 100)}% 
                  {performIntelligentAnalysis.hasDisagreement && " • Agent disagreement detected"}
                </p>
              </div>
              
              {/* Feedback Controls */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleFeedback(FEEDBACK_TYPES.HELPFUL)}
                  className="px-2 py-1 text-xs bg-green-500/10 text-green-600 rounded hover:bg-green-500/20"
                  title="This insight was helpful"
                >
                  👍 Helpful
                </button>
                <button
                  onClick={() => handleFeedback(FEEDBACK_TYPES.SNOOZE)}
                  className="px-2 py-1 text-xs bg-yellow-500/10 text-yellow-600 rounded hover:bg-yellow-500/20"
                  title="Remind me later"
                >
                  😴 Snooze
                </button>
                <button
                  onClick={() => handleFeedback(FEEDBACK_TYPES.IGNORE)}
                  className="px-2 py-1 text-xs bg-gray-500/10 text-gray-600 rounded hover:bg-gray-500/20"
                  title="Not relevant right now"
                >
                  🙄 Ignore
                </button>
              </div>
            </div>
            
            {/* Agent Debate Log */}
            {performIntelligentAnalysis.hasDisagreement && (
              <DebateLog entries={performIntelligentAnalysis.agents} />
            )}
            
            {/* Context Summary */}
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              <strong>Current State:</strong> CPU {Math.round(metrics.cpu.current)}%, 
              Memory {Math.round(metrics.memory.current)}%, 
              Network {Math.round(metrics.network.current)}ms
            </div>
          </div>
        </div>
      )}

      {/* Original Metrics Grid (unchanged) */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 h-full">
          {Object.entries(metricConfigs).map(([key, config]) => {
            const IconComponent = config.icon;
            const isSelected = selectedMetric === key;
            
            return (
              <div
                key={key}
                onClick={() => setSelectedMetric(key)}
                className={`
                  relative p-4 rounded-lg cursor-pointer transition-all duration-200 border-2
                  ${isSelected 
                    ? 'border-indigo-500 bg-indigo-500/5' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                  ${config.bgColor}
                `}
              >
                {/* Icon and Name */}
                <div className="flex items-center justify-between mb-3">
                  <IconComponent className={`w-5 h-5 ${config.color}`} />
                  <span className={`text-sm ${getTrendColor(config.data.trend, key)}`}>
                    {getTrendIcon(config.data.trend)}
                  </span>
                </div>
                
                {/* Metric Name */}
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  {config.name}
                </div>
                
                {/* Current Value */}
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {formatValue(config.data.current, config.unit)}
                </div>
                
                {/* Average and Peak */}
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Avg: {formatValue(config.data.avg, config.unit)}</span>
                  <span>Peak: {formatValue(config.data.peak, config.unit)}</span>
                </div>
                
                {/* Trend Indicator */}
                <div className="absolute top-2 right-2">
                  {isSelected && (
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enhanced Selected Metric Details */}
      {selectedMetric && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {metricConfigs[selectedMetric].name} Details
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Trend: {metricConfigs[selectedMetric].data.trend} over {timeRange}
                {widgetState !== 'baseline' && (
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-500/10 text-blue-600 rounded">
                    AIDA: {widgetState}
                  </span>
                )}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatValue(metricConfigs[selectedMetric].data.current, metricConfigs[selectedMetric].unit)}
              </div>
              <div className={`text-sm ${getTrendColor(metricConfigs[selectedMetric].data.trend, selectedMetric)}`}>
                {getTrendIcon(metricConfigs[selectedMetric].data.trend)} 
                {metricConfigs[selectedMetric].data.trend}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMetricsWidget;