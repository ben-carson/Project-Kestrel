// src/components/widgets/PerformanceMetricsWidget.jsx
// AIDA-enhanced with memory leak fixes and new metrics source
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Activity, Cpu, MemoryStick, HardDrive, Wifi, Clock, ChevronDown, ChevronUp, Settings } from 'lucide-react';

// AIDA Intelligence Components
import InsightBadge from './InsightBadge';
import DebateLog from './DebateLog';

// Store Integrations
import { useDashboardStore } from '../../store/useDashboardStore';
import { useWidgetMemoryStore, createMemoryEvent, MEMORY_EVENT_TYPES, FEEDBACK_TYPES } from '../../store/useWidgetMemoryStore';

// New metrics source
import { metricsSource } from '../../services/metricsSource';
import { usePerformanceMetrics } from '../../hooks/usePerformanceMetrics';

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
  const [widgetState, setWidgetState] = useState('baseline');
  const [currentMode, setCurrentMode] = useState('idle');

  // Memory leak prevention refs
  const lastAnalysisRef = useRef(null);
  const stateChangeCountRef = useRef(0);
  const lastMemoryCleanupRef = useRef(Date.now());

  // Subscribe to new metrics source with bounded history
  const { latest, history } = usePerformanceMetrics(
    metricsSource.subscribe.bind(metricsSource),
    600 // cap at 600 samples
  );

  // Update mode periodically
  useEffect(() => {
    const updateMode = () => {
      const mode = metricsSource.getMode();
      setCurrentMode(mode);
    };
    
    updateMode(); // initial
    const interval = setInterval(updateMode, 2000);
    return () => clearInterval(interval);
  }, []);

  // Convert new metrics format to old format for AIDA compatibility
  const metrics = useMemo(() => {
    // Use live metrics from new source, but also blend with dashboard store data if available
    const liveMetrics = {
      cpu: { current: latest.cpu, avg: latest.cpu * 0.9, peak: latest.cpu * 1.1, trend: 'stable' },
      memory: { current: latest.mem, avg: latest.mem * 0.9, peak: latest.mem * 1.1, trend: 'stable' },
      network: { current: latest.net, avg: latest.net * 0.9, peak: latest.net * 1.1, trend: 'stable' },
      storage: { current: latest.io, avg: latest.io * 0.9, peak: latest.io * 1.1, trend: 'stable' },
      response: { current: latest.resp, avg: latest.resp * 0.9, peak: latest.resp * 1.1, trend: 'stable' },
      throughput: { current: 1200, avg: 1200, peak: 1200, trend: 'stable' }
    };

    // If we have dashboard store data, use it for enhanced calculations
    if (serverOverview && serverOverview.length > 0) {
      const serverCount = serverOverview.length;
      
      // Current metrics (average across all servers)
      const currentCpu = serverOverview.reduce((sum, s) => sum + (s.metrics?.cpuUsage || 0), 0) / serverCount;
      const currentMemory = serverOverview.reduce((sum, s) => sum + (s.metrics?.memoryUsage || 0), 0) / serverCount;
      const currentNetwork = serverOverview.reduce((sum, s) => sum + (s.metrics?.networkLatency || 0), 0) / serverCount;
      const currentStorage = serverOverview.reduce((sum, s) => sum + (s.metrics?.storageIO || 0), 0) / serverCount;

      // Use dashboard data if it's fresher/more comprehensive
      if (currentCpu > 0 || currentMemory > 0) {
        liveMetrics.cpu.current = currentCpu;
        liveMetrics.memory.current = currentMemory;
        liveMetrics.network.current = currentNetwork;
        liveMetrics.storage.current = currentStorage;
      }

      // Calculate trends from health trend if available
      const recentTrend = healthTrend?.slice(-20) || [];
      if (recentTrend.length > 0) {
        const avgCpu = recentTrend.reduce((sum, t) => sum + (t.cpuUsage || 0), 0) / recentTrend.length;
        const avgMemory = recentTrend.reduce((sum, t) => sum + (t.memoryUsage || 0), 0) / recentTrend.length;
        const avgNetwork = recentTrend.reduce((sum, t) => sum + (t.networkLatency || 0), 0) / recentTrend.length;

        // Calculate trends
        const getTrend = (current, avg) => {
          const diff = ((current - avg) / avg) * 100;
          if (Math.abs(diff) < 5) return 'stable';
          return diff > 0 ? 'increasing' : 'decreasing';
        };

        liveMetrics.cpu.trend = getTrend(liveMetrics.cpu.current, avgCpu);
        liveMetrics.memory.trend = getTrend(liveMetrics.memory.current, avgMemory);
        liveMetrics.network.trend = getTrend(liveMetrics.network.current, avgNetwork);
        
        liveMetrics.cpu.avg = avgCpu;
        liveMetrics.memory.avg = avgMemory;
        liveMetrics.network.avg = avgNetwork;
        liveMetrics.cpu.peak = Math.max(...recentTrend.map(t => t.cpuUsage || 0));
        liveMetrics.memory.peak = Math.max(...recentTrend.map(t => t.memoryUsage || 0));
        liveMetrics.network.peak = Math.max(...recentTrend.map(t => t.networkLatency || 0));
      }
    }

    return liveMetrics;
  }, [latest, serverOverview, healthTrend]);

  // Memory cleanup throttling
  const performMemoryCleanup = useCallback(() => {
    const now = Date.now();
    if (now - lastMemoryCleanupRef.current > 5 * 60 * 1000) {
      lastMemoryCleanupRef.current = now;
    }
  }, []);

  // AIDA Intelligent Analysis
  const performIntelligentAnalysis = useMemo(() => {
    const currentContext = {
      cpu: Math.round(metrics.cpu.current),
      memory: Math.round(metrics.memory.current),
      network: Math.round(metrics.network.current),
      storage: Math.round(metrics.storage.current),
      trends: {
        cpu: metrics.cpu.trend,
        memory: metrics.memory.trend,
        network: metrics.network.trend
      }
    };

    // Check if analysis has changed significantly
    if (lastAnalysisRef.current) {
      const lastContext = lastAnalysisRef.current.context;
      const significantChange = Math.abs(currentContext.cpu - lastContext.cpu) > 5 ||
                               Math.abs(currentContext.memory - lastContext.memory) > 5 ||
                               Math.abs(currentContext.network - lastContext.network) > 10;
      
      if (!significantChange) {
        return lastAnalysisRef.current;
      }
    }

    // AIDA Agent Analysis
    const baseAgents = [
      {
        name: 'CVE Analyst',
        opinion: 'NEUTRAL',
        rationale: 'No obvious security performance indicators detected',
        confidence: 0.7
      },
      {
        name: 'Config Drift Watcher',
        opinion: 'AGREE',
        rationale: 'Performance metrics align with expected configuration baseline',
        confidence: 0.6
      },
      {
        name: 'Simulation Planner',
        opinion: 'AGREE',
        rationale: 'Current performance levels are within normal operating parameters',
        confidence: 0.8
      }
    ];

    // Modify agents based on current metrics
    if (currentContext.cpu > 85) {
      baseAgents[0].opinion = 'DISAGREE';
      baseAgents[0].rationale = 'High CPU could indicate crypto mining or DDoS attack';
      baseAgents[0].confidence = 0.8;
    }

    if (currentContext.memory > PERFORMANCE_THRESHOLDS.memory.warning) {
      baseAgents[1].opinion = 'DISAGREE';
      baseAgents[1].rationale = 'Memory usage exceeds configured thresholds, possible config drift';
      baseAgents[1].confidence = 0.9;
    }

    if (currentContext.cpu > 75 && currentContext.memory > 75) {
      baseAgents[2].opinion = 'DISAGREE';
      baseAgents[2].rationale = 'Combined CPU/Memory load could cascade to service degradation';
      baseAgents[2].confidence = 0.85;
    } else if (currentContext.network > PERFORMANCE_THRESHOLDS.network.warning) {
      baseAgents[2].opinion = 'NEUTRAL';
      baseAgents[2].rationale = 'Network latency may impact user experience under load';
      baseAgents[2].confidence = 0.7;
    }

    // Query similar events (throttled)
    const similarEvents = queryMemories ? queryMemories(WIDGET_ID, {
      similarContext: currentContext,
      limit: 3,
      maxAge: 2 * 24 * 60 * 60 * 1000
    }) : [];

    // AIDA confidence calculation
    const agreeing = baseAgents.filter(a => a.opinion === 'AGREE').length;
    const disagreeing = baseAgents.filter(a => a.opinion === 'DISAGREE').length;
    const total = baseAgents.length;
    const simulationCertainty = Math.max(0, (agreeing - disagreeing) / total + 0.5);

    const historicalAccuracy = similarEvents.length > 0 ? 
      Math.min(1, 0.5 + (similarEvents.length * 0.15)) : 0.4;

    const avgAgentConfidence = baseAgents.reduce((sum, a) => sum + a.confidence, 0) / baseAgents.length;
    const dataFreshness = latest.ts > 0 ? 0.9 : 0.5;

    const baseConfidence = (0.40 * simulationCertainty) + 
                          (0.30 * historicalAccuracy) + 
                          (0.20 * avgAgentConfidence) + 
                          (0.10 * dataFreshness);

    const feedbackAdjustment = getConfidenceAdjustment ? getConfidenceAdjustment(WIDGET_ID) : 0;
    const finalConfidence = Math.max(0, Math.min(1, baseConfidence + feedbackAdjustment));

    const hasDisagreement = baseAgents.some(a => a.opinion === 'DISAGREE') && 
                           baseAgents.some(a => a.opinion === 'AGREE');

    const shouldSuppress = shouldSuppressAlert ? shouldSuppressAlert(WIDGET_ID, currentContext) : false;

    const result = {
      agents: baseAgents,
      confidence: finalConfidence,
      context: currentContext,
      hasDisagreement,
      shouldSuppress,
      breakdown: {
        simulationCertainty,
        historicalAccuracy,
        agentConsensus: avgAgentConfidence,
        dataFreshness,
        feedbackAdjustment
      }
    };

    lastAnalysisRef.current = result;
    return result;
  }, [
    Math.round(metrics.cpu.current / 5) * 5,
    Math.round(metrics.memory.current / 5) * 5,
    Math.round(metrics.network.current / 10) * 10,
    metrics.cpu.trend,
    metrics.memory.trend,
    metrics.network.trend,
    latest.ts
  ]);

  // Widget state management
  useEffect(() => {
    const { confidence, shouldSuppress } = performIntelligentAnalysis;
    
    if (shouldSuppress) {
      setWidgetState('baseline');
      return;
    }

    stateChangeCountRef.current++;

    const hasThresholdBreach = 
      metrics.cpu.current > PERFORMANCE_THRESHOLDS.cpu.critical ||
      metrics.memory.current > PERFORMANCE_THRESHOLDS.memory.critical ||
      metrics.network.current > PERFORMANCE_THRESHOLDS.network.critical;

    const hasWarningBreach = 
      metrics.cpu.current > PERFORMANCE_THRESHOLDS.cpu.warning ||
      metrics.memory.current > PERFORMANCE_THRESHOLDS.memory.warning ||
      metrics.network.current > PERFORMANCE_THRESHOLDS.network.warning;

    let newState = 'baseline';

    if (hasThresholdBreach && confidence >= 0.75) {
      newState = 'critical';
    } else if ((hasWarningBreach && confidence >= 0.50) || confidence >= 0.75) {
      newState = 'alert';
    } else if (confidence >= 0.25) {
      newState = 'advisory';
    }

    if (newState !== widgetState) {
      setWidgetState(newState);

      // Store memory for significant state changes (throttled)
      if ((newState === 'critical' || newState === 'alert') && storeMemory) {
        if (stateChangeCountRef.current % 3 === 0) {
          const eventType = newState === 'critical' ? 
            MEMORY_EVENT_TYPES.THRESHOLD_BREACH : 
            MEMORY_EVENT_TYPES.ALERT;

          storeMemory(WIDGET_ID, createMemoryEvent(
            eventType,
            performIntelligentAnalysis.context,
            `Performance metrics ${newState}`,
            { 
              confidence,
              level: newState,
              agentCount: performIntelligentAnalysis.agents.length
            }
          ));
        }
      }
    }

    performMemoryCleanup();
  }, [performIntelligentAnalysis, metrics.cpu.current, metrics.memory.current, metrics.network.current, widgetState, storeMemory, performMemoryCleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      lastAnalysisRef.current = null;
      stateChangeCountRef.current = 0;
    };
  }, []);

  // Widget border styling
  const getWidgetBorderStyle = useCallback(() => {
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
  }, [widgetState]);

  // Feedback handling
  const handleFeedback = useCallback((feedback) => {
    if (recordFeedback) {
      recordFeedback(WIDGET_ID, feedback, {
        confidence: performIntelligentAnalysis.confidence,
        state: widgetState,
        metrics: {
          cpu: Math.round(metrics.cpu.current),
          memory: Math.round(metrics.memory.current),
          network: Math.round(metrics.network.current)
        }
      });
    }

    if (feedback !== FEEDBACK_TYPES.SNOOZE) {
      setShowInsightPanel(false);
    }
  }, [recordFeedback, performIntelligentAnalysis.confidence, widgetState, metrics.cpu.current, metrics.memory.current, metrics.network.current]);

  // Metric configurations
  const metricConfigs = useMemo(() => ({
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
  }), [metrics]);

  // Helper functions
  const formatValue = useCallback((value, unit) => {
    if (unit === '%') return `${Math.round(value)}${unit}`;
    if (unit === 'ms') return `${Math.round(value)}${unit}`;
    if (unit === ' IOPS') return `${Math.round(value)}${unit}`;
    if (unit === ' req/s') return `${Math.round(value)}${unit}`;
    return `${Math.round(value)}${unit}`;
  }, []);

  const getTrendIcon = useCallback((trend) => {
    switch (trend) {
      case 'increasing': return '↗️';
      case 'decreasing': return '↘️';
      default: return '➡️';
    }
  }, []);

  const getTrendColor = useCallback((trend, metricType) => {
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
  }, []);

  // Mode color for status
  const getModeColor = () => {
    switch (currentMode) {
      case 'websocket': return 'text-green-400';
      case 'eventbus': return 'text-blue-400';
      case 'polling': return 'text-yellow-400';
      case 'idle': return 'text-gray-400';
      default: return 'text-red-400';
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
          
          {/* Mode indicator */}
          <span className={`text-xs px-2 py-1 rounded ${getModeColor()} bg-gray-100 dark:bg-gray-700`}>
            {currentMode}
          </span>
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

      {/* Metrics Grid */}
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
                Trend: {metricConfigs[selectedMetric].data.trend} over {timeRange} • 
                Samples: {history.ts.length}
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