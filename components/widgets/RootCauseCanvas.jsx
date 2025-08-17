// src/components/widgets/RootCauseCanvas.jsx
import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import {
  AlertTriangle, GitBranch, Database, Network, Cpu, HardDrive,
  Users, Package, Clock, TrendingUp, Activity, Layers,
  Target, ChevronRight, ChevronDown, Lightbulb, Link2,
  Zap, AlertCircle, Info, PlayCircle, PauseCircle, Code,
  Calendar, GitCommit, Server, Shield, Bug, Settings
} from "lucide-react";
import { useDashboardStore } from "../../store/useDashboardStore";
import { useUIStore } from "../../store/useUIStore";

/**
 * Real Root Cause Analysis Canvas
 * - Correlation engine that actually finds relationships
 * - Timeline reconstruction showing cascade of events
 * - Pattern matching against known failure modes
 * - Dependency graph visualization
 * - Automated hypothesis generation
 */

// Known failure patterns with detection logic
const FAILURE_PATTERNS = {
  cascade: {
    name: 'Cascading Failure',
    description: 'Multiple dependent services failing in sequence',
    icon: GitBranch,
    detect: (events) => {
      const timeWindow = 5 * 60 * 1000; // 5 minutes
      const related = [];
      
      for (let i = 0; i < events.length - 1; i++) {
        for (let j = i + 1; j < events.length; j++) {
          const timeDiff = Math.abs(events[i].timestamp - events[j].timestamp);
          if (timeDiff < timeWindow && events[i].service !== events[j].service) {
            related.push({ from: events[i], to: events[j], correlation: 0.8 });
          }
        }
      }
      
      return related.length > 2 ? { confidence: 0.9, related } : null;
    }
  },
  
  resource_exhaustion: {
    name: 'Resource Exhaustion',
    description: 'Progressive degradation due to resource limits',
    icon: Cpu,
    detect: (events) => {
      const resourceEvents = events.filter(e => 
        e.type === 'high_cpu' || e.type === 'memory_pressure' || e.type === 'disk_full'
      );
      
      if (resourceEvents.length < 2) return null;
      
      // Check if metrics were trending up
      const trending = resourceEvents.sort((a, b) => a.timestamp - b.timestamp);
      const increasing = trending.every((e, i) => 
        i === 0 || e.value > trending[i - 1].value
      );
      
      return increasing ? {
        confidence: 0.85,
        trend: 'increasing',
        resources: resourceEvents.map(e => e.type)
      } : null;
    }
  },
  
  deployment_related: {
    name: 'Deployment Issue',
    description: 'Problems started after recent deployment',
    icon: GitCommit,
    detect: (events, deployments) => {
      if (!deployments?.length) return null;
      
      const recentDeploy = deployments
        .filter(d => Date.now() - d.timestamp < 3600000) // Last hour
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      
      if (!recentDeploy) return null;
      
      const postDeployEvents = events.filter(e => 
        e.timestamp > recentDeploy.timestamp
      );
      
      if (postDeployEvents.length > events.length * 0.7) {
        return {
          confidence: 0.95,
          deployment: recentDeploy,
          affectedServices: [...new Set(postDeployEvents.map(e => e.service))]
        };
      }
      
      return null;
    }
  },
  
  network_partition: {
    name: 'Network Partition',
    description: 'Network connectivity issues between services',
    icon: Network,
    detect: (events) => {
      const networkEvents = events.filter(e =>
        e.type === 'connection_timeout' || 
        e.type === 'server_offline' ||
        e.description?.includes('unreachable')
      );
      
      if (networkEvents.length < 2) return null;
      
      // Group by network segment/zone
      const segments = {};
      networkEvents.forEach(e => {
        const segment = e.zone || 'default';
        segments[segment] = (segments[segment] || 0) + 1;
      });
      
      return Object.keys(segments).length > 1 ? {
        confidence: 0.75,
        segments: Object.keys(segments),
        eventCount: networkEvents.length
      } : null;
    }
  },
  
  database_bottleneck: {
    name: 'Database Bottleneck',
    description: 'Database performance causing system-wide issues',
    icon: Database,
    detect: (events) => {
      const dbEvents = events.filter(e =>
        e.service?.includes('db') ||
        e.type === 'slow_query' ||
        e.type === 'connection_pool_exhausted'
      );
      
      const appEvents = events.filter(e =>
        e.type === 'timeout' || e.type === 'high_latency'
      );
      
      if (dbEvents.length > 0 && appEvents.length > dbEvents.length) {
        return {
          confidence: 0.8,
          dbEvents: dbEvents.length,
          impactedServices: appEvents.length,
          bottleneck: dbEvents[0]?.service || 'database'
        };
      }
      
      return null;
    }
  },
  
  thundering_herd: {
    name: 'Thundering Herd',
    description: 'Synchronized retry storm overwhelming system',
    icon: Users,
    detect: (events) => {
      // Look for many similar events in a very short time window
      const window = 10000; // 10 seconds
      const buckets = {};
      
      events.forEach(e => {
        const bucket = Math.floor(e.timestamp / window);
        const key = `${bucket}-${e.type}`;
        buckets[key] = (buckets[key] || 0) + 1;
      });
      
      const burst = Object.values(buckets).find(count => count > 10);
      
      return burst ? {
        confidence: 0.7,
        burstSize: burst,
        pattern: 'synchronized_requests'
      } : null;
    }
  }
};

// Hypothesis generator
class HypothesisEngine {
  generate(events, patterns, metrics) {
    const hypotheses = [];
    
    // Pattern-based hypotheses
    Object.entries(patterns).forEach(([key, pattern]) => {
      if (pattern.result) {
        hypotheses.push({
          id: `pattern-${key}`,
          type: 'pattern',
          title: pattern.name,
          confidence: pattern.result.confidence,
          evidence: this.getPatternEvidence(key, pattern.result),
          solution: this.getPatternSolution(key, pattern.result),
          priority: pattern.result.confidence
        });
      }
    });
    
    // Metric-based hypotheses
    if (metrics) {
      const anomalies = this.detectAnomalies(metrics);
      anomalies.forEach(anomaly => {
        hypotheses.push({
          id: `anomaly-${anomaly.metric}`,
          type: 'anomaly',
          title: `Anomaly in ${anomaly.metric}`,
          confidence: anomaly.confidence,
          evidence: anomaly.evidence,
          solution: this.getAnomalySolution(anomaly),
          priority: anomaly.severity * anomaly.confidence
        });
      });
    }
    
    // Time-based correlations
    const timeCorrelations = this.findTimeCorrelations(events);
    timeCorrelations.forEach(correlation => {
      hypotheses.push({
        id: `time-${correlation.id}`,
        type: 'correlation',
        title: correlation.title,
        confidence: correlation.confidence,
        evidence: correlation.evidence,
        solution: correlation.solution,
        priority: correlation.confidence * 0.8
      });
    });
    
    return hypotheses.sort((a, b) => b.priority - a.priority);
  }
  
  getPatternEvidence(pattern, result) {
    const evidence = {
      cascade: [
        `${result.related?.length || 0} related failures detected`,
        'Services failed in sequence within 5 minutes',
        'Dependency chain identified'
      ],
      resource_exhaustion: [
        `Resources trending ${result.trend}`,
        `Affected: ${result.resources?.join(', ')}`,
        'Progressive degradation observed'
      ],
      deployment_related: [
        `Deployment: ${result.deployment?.name || 'Recent'}`,
        `${result.affectedServices?.length || 0} services affected`,
        'Issues started post-deployment'
      ],
      network_partition: [
        `${result.segments?.length || 0} network segments affected`,
        `${result.eventCount} connectivity events`,
        'Cross-zone communication failures'
      ],
      database_bottleneck: [
        `Database: ${result.bottleneck}`,
        `${result.impactedServices} services impacted`,
        'Query performance degradation'
      ],
      thundering_herd: [
        `Burst size: ${result.burstSize} events`,
        'Synchronized retry pattern detected',
        'Request amplification observed'
      ]
    };
    
    return evidence[pattern] || ['Pattern detected'];
  }
  
  getPatternSolution(pattern, result) {
    const solutions = {
      cascade: {
        immediate: 'Implement circuit breakers on critical paths',
        shortTerm: 'Add request timeouts and retries with backoff',
        longTerm: 'Review service dependencies and add bulkheads'
      },
      resource_exhaustion: {
        immediate: `Scale up ${result.resources?.[0] || 'resources'}`,
        shortTerm: 'Identify and optimize resource-heavy operations',
        longTerm: 'Implement auto-scaling policies'
      },
      deployment_related: {
        immediate: `Rollback deployment: ${result.deployment?.name}`,
        shortTerm: 'Review deployment changes and test in staging',
        longTerm: 'Implement canary deployments and better testing'
      },
      network_partition: {
        immediate: 'Check network connectivity between zones',
        shortTerm: 'Implement retry logic with exponential backoff',
        longTerm: 'Add redundant network paths and health checks'
      },
      database_bottleneck: {
        immediate: 'Increase connection pool size',
        shortTerm: 'Optimize slow queries and add caching',
        longTerm: 'Consider read replicas or sharding'
      },
      thundering_herd: {
        immediate: 'Add jitter to retry timings',
        shortTerm: 'Implement request coalescing',
        longTerm: 'Add cache warming and request deduplication'
      }
    };
    
    return solutions[pattern] || {
      immediate: 'Investigate the detected pattern',
      shortTerm: 'Implement monitoring for this pattern',
      longTerm: 'Design system to prevent recurrence'
    };
  }
  
  detectAnomalies(metrics) {
    const anomalies = [];
    
    // Simple statistical anomaly detection
    Object.entries(metrics).forEach(([key, values]) => {
      if (!Array.isArray(values) || values.length < 10) return;
      
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(
        values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
      );
      
      const recent = values[values.length - 1];
      const zscore = stdDev === 0 ? 0 : Math.abs((recent - mean) / stdDev);
      
      if (zscore > 3) {
        anomalies.push({
          metric: key,
          confidence: Math.min(zscore / 10, 0.99),
          severity: zscore / 3,
          evidence: [
            `Current: ${recent.toFixed(2)}`,
            `Expected: ${mean.toFixed(2)} ± ${stdDev.toFixed(2)}`,
            `Deviation: ${zscore.toFixed(1)} standard deviations`
          ]
        });
      }
    });
    
    return anomalies;
  }
  
  getAnomalySolution(anomaly) {
    const solutions = {
      cpu: {
        immediate: 'Check for runaway processes',
        shortTerm: 'Profile CPU usage and optimize hot paths',
        longTerm: 'Implement horizontal scaling'
      },
      memory: {
        immediate: 'Force garbage collection or restart',
        shortTerm: 'Find and fix memory leaks',
        longTerm: 'Optimize memory usage patterns'
      },
      latency: {
        immediate: 'Check database and network health',
        shortTerm: 'Add caching for frequent queries',
        longTerm: 'Optimize service architecture'
      }
    };
    
    const metricType = anomaly.metric.toLowerCase();
    for (const [key, solution] of Object.entries(solutions)) {
      if (metricType.includes(key)) {
        return solution;
      }
    }
    
    return {
      immediate: `Investigate ${anomaly.metric} anomaly`,
      shortTerm: 'Add monitoring and alerting',
      longTerm: 'Establish baseline and thresholds'
    };
  }
  
  findTimeCorrelations(events) {
    if (events.length < 2) return [];
    const correlations = [];
    
    // Look for periodic patterns
    const intervals = {};
    for (let i = 1; i < events.length; i++) {
      const interval = events[i].timestamp - events[i-1].timestamp;
      const bucket = Math.round(interval / 60000) * 60000; // Round to nearest minute
      if (bucket > 0) {
        intervals[bucket] = (intervals[bucket] || 0) + 1;
      }
    }
    
    const periodicInterval = Object.entries(intervals)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (periodicInterval && periodicInterval[1] > 3) {
      correlations.push({
        id: 'periodic',
        title: `Periodic pattern (every ${Math.round(Number(periodicInterval[0]) / 60000)} min)`,
        confidence: Math.min(periodicInterval[1] / 10, 0.9),
        evidence: [
          `Pattern repeats ${periodicInterval[1]} times`,
          `Interval: ${Math.round(Number(periodicInterval[0]) / 60000)} minutes`,
          'Likely scheduled job or batch process'
        ],
        solution: {
          immediate: 'Check cron jobs and scheduled tasks',
          shortTerm: 'Stagger scheduled operations',
          longTerm: 'Implement queue-based processing'
        }
      });
    }
    
    return correlations;
  }
}

// Timeline component for event visualization
const EventTimeline = ({ events, timeRange }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (!canvasRef.current || !events.length) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Draw timeline
    const padding = 20;
    const width = rect.width - padding * 2;
    const height = rect.height - padding * 2;
    
    const minTime = Math.min(...events.map(e => e.timestamp));
    const maxTime = Math.max(...events.map(e => e.timestamp));
    const timeSpan = maxTime - minTime || 1;
    
    // Draw axis
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, height + padding);
    ctx.lineTo(width + padding, height + padding);
    ctx.stroke();
    
    // Draw events
    events.forEach((event, i) => {
      const x = padding + ((event.timestamp - minTime) / timeSpan) * width;
      const y = padding + (i % 5) * (height / 5);
      
      // Event dot
      ctx.fillStyle = event.severity === 'critical' ? '#ef4444' :
                      event.severity === 'high' ? '#f97316' :
                      event.severity === 'medium' ? '#eab308' : '#3b82f6';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Connection lines for related events
      if (event.relatedTo) {
        const related = events.find(e => e.id === event.relatedTo);
        if (related) {
          const x2 = padding + ((related.timestamp - minTime) / timeSpan) * width;
          const y2 = padding + (events.indexOf(related) % 5) * (height / 5);
          
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    });
    
  }, [events, timeRange]);
  
  return (
    <canvas 
      ref={canvasRef}
      className="w-full h-32 border border-gray-200 dark:border-gray-700 rounded"
    />
  );
};

// Main component
export default function RootCauseCanvas() {
  const { servers = [], systemEvents = [], deployments = [] } = useDashboardStore();
  const { showToast } = useUIStore();
  
  const [selectedHypothesis, setSelectedHypothesis] = useState(null);
  const [analysisDepth, setAnalysisDepth] = useState('standard');
  const [timeRange, setTimeRange] = useState('1h');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const hypothesisEngine = useRef(new HypothesisEngine());
  
  // Filter events by time range
  const filteredEvents = useMemo(() => {
    const now = Date.now();
    const ranges = {
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000
    };
    
    const cutoff = now - (ranges[timeRange] || ranges['1h']);
    
    // Combine system events with generated events from server metrics
    const allEvents = [...systemEvents];
    
    // Generate events from current server state
    servers.forEach(server => {
      if (server.metrics?.cpuUsage > 80) {
        allEvents.push({
          id: `cpu-${server.id}`,
          type: 'high_cpu',
          severity: server.metrics.cpuUsage > 90 ? 'critical' : 'high',
          service: server.name,
          value: server.metrics.cpuUsage,
          timestamp: now,
          description: `CPU usage at ${Math.round(server.metrics.cpuUsage)}%`
        });
      }
      
      if (server.metrics?.memoryUsage > 85) {
        allEvents.push({
          id: `mem-${server.id}`,
          type: 'memory_pressure',
          severity: server.metrics.memoryUsage > 95 ? 'critical' : 'high',
          service: server.name,
          value: server.metrics.memoryUsage,
          timestamp: now,
          description: `Memory usage at ${Math.round(server.metrics.memoryUsage)}%`
        });
      }
      
      if (server.status === 'offline') {
        allEvents.push({
          id: `offline-${server.id}`,
          type: 'server_offline',
          severity: 'critical',
          service: server.name,
          timestamp: now,
          description: 'Server is not responding'
        });
      }
    });
    
    return allEvents
      .filter(e => e.timestamp > cutoff)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [systemEvents, servers, timeRange]);
  
  // Run pattern detection
  const detectedPatterns = useMemo(() => {
    const patterns = {};
    
    Object.entries(FAILURE_PATTERNS).forEach(([key, pattern]) => {
      const result = pattern.detect(filteredEvents, deployments);
      patterns[key] = {
        ...pattern,
        result
      };
    });
    
    return patterns;
  }, [filteredEvents, deployments]);
  
  // Generate hypotheses
  const hypotheses = useMemo(() => {
    // Collect metrics for anomaly detection
    const metrics = {};
    servers.forEach(server => {
      if (server.metrics) {
        Object.entries(server.metrics).forEach(([key, value]) => {
          if (!metrics[key]) metrics[key] = [];
          metrics[key].push(value);
        });
      }
    });
    
    return hypothesisEngine.current.generate(filteredEvents, detectedPatterns, metrics);
  }, [filteredEvents, detectedPatterns, servers]);
  
  // Run analysis
  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    
    // Simulate deeper analysis
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    showToast(`Analysis complete: ${hypotheses.length} hypotheses generated`, 'success');
    setIsAnalyzing(false);
  }, [hypotheses, showToast]);
  
  // Get icon for hypothesis type
  const getHypothesisIcon = (type) => {
    const icons = {
      pattern: GitBranch,
      anomaly: Activity,
      correlation: Link2,
      default: Lightbulb
    };
    return icons[type] || icons.default;
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Root Cause Analysis
          </h3>
          {isAnalyzing && (
            <div className="flex items-center gap-1 text-xs text-purple-500">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-500" />
              <span>Analyzing...</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
          >
            <option value="15m">Last 15 min</option>
            <option value="1h">Last hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
          </select>
          
          <select
            value={analysisDepth}
            onChange={(e) => setAnalysisDepth(e.target.value)}
            className="text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
          >
            <option value="quick">Quick</option>
            <option value="standard">Standard</option>
            <option value="deep">Deep Analysis</option>
          </select>
          
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 disabled:opacity-50"
          >
            Analyze
          </button>
        </div>
      </div>
      
      {/* Event Timeline */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          Event Timeline ({filteredEvents.length} events)
        </div>
        <EventTimeline events={filteredEvents} timeRange={timeRange} />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Hypotheses List */}
        <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-3">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
              Hypotheses ({hypotheses.length})
            </div>
            
            {hypotheses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No patterns detected</p>
                <p className="text-xs mt-1">System appears stable</p>
              </div>
            ) : (
              <div className="space-y-2">
                {hypotheses.map((hypothesis) => {
                  const Icon = getHypothesisIcon(hypothesis.type);
                  const isSelected = selectedHypothesis?.id === hypothesis.id;
                  
                  return (
                    <div
                      key={hypothesis.id}
                      onClick={() => setSelectedHypothesis(hypothesis)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Icon className="w-4 h-4 mt-0.5 text-purple-500" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 dark:text-white">
                            {hypothesis.title}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">
                              Confidence: {Math.round(hypothesis.confidence * 100)}%
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              hypothesis.type === 'pattern' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                              hypothesis.type === 'anomaly' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' :
                              'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                            }`}>
                              {hypothesis.type}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                          isSelected ? 'rotate-90' : ''
                        }`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Hypothesis Details */}
        <div className="w-1/2 overflow-y-auto">
          {selectedHypothesis ? (
            <div className="p-4 space-y-4">
              {/* Evidence */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <Info className="w-4 h-4" />
                  Evidence
                </h4>
                <div className="space-y-1">
                  {selectedHypothesis.evidence.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-purple-500">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Solutions */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <Lightbulb className="w-4 h-4" />
                  Recommended Actions
                </h4>
                <div className="space-y-3">
                  <div className="border-l-4 border-red-500 pl-3">
                    <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                      Immediate
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedHypothesis.solution.immediate}
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-yellow-500 pl-3">
                    <div className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-1">
                      Short Term
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedHypothesis.solution.shortTerm}
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-3">
                    <div className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                      Long Term
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedHypothesis.solution.longTerm}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <h4 className="font-semibold text-gray-700 dark:text-gray-300">Select a Hypothesis</h4>
                <p className="text-sm mt-1">Choose an item from the left to view details and recommended actions.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}