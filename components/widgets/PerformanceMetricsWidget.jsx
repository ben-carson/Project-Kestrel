// src/components/widgets/PerformanceMetricsWidget.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Activity, Cpu, MemoryStick, HardDrive, Wifi, Clock, ChevronDown, ChevronUp } from "lucide-react";
import InsightBadge from "./InsightBadge";
import DebateLog from "./DebateLog";
import { useDashboardStore } from "../../store/useDashboardStore";
import { useWidgetMemoryStore, createMemoryEvent, MEMORY_EVENT_TYPES, FEEDBACK_TYPES } from "../../store/useWidgetMemoryStore";
import { metricsSource } from "../../services/metricsSource";
import { usePerformanceMetrics } from "../../hooks/usePerformanceMetrics";

const WIDGET_ID = "performance-metrics";

const PERFORMANCE_THRESHOLDS = {
  cpu: { warning: 70, critical: 85 },
  memory: { warning: 80, critical: 90 },
  network: { warning: 100, critical: 200 },
  storage: { warning: 5000, critical: 8000 },
  response: { warning: 150, critical: 300 },
};

const PerformanceMetricsWidget = () => {
  const { serverOverview, healthTrend } = useDashboardStore();
  const { storeMemory, queryMemories, recordFeedback, getConfidenceAdjustment, shouldSuppressAlert } = useWidgetMemoryStore();

  const [selectedMetric, setSelectedMetric] = useState("cpu");
  const [timeRange, setTimeRange] = useState("1h");
  const [showInsightPanel, setShowInsightPanel] = useState(false);
  const [widgetState, setWidgetState] = useState("baseline");
  const [currentMode, setCurrentMode] = useState("idle");

  const lastAnalysisRef = useRef(null);
  const stateChangeCountRef = useRef(0);
  const lastMemoryCleanupRef = useRef(Date.now());

  // live metrics feed (bounded)
  const { latest, history } = usePerformanceMetrics(metricsSource.subscribe.bind(metricsSource), 600);

  useEffect(() => {
    const updateMode = () => setCurrentMode(metricsSource.getMode());
    updateMode();
    const t = setInterval(updateMode, 2000);
    return () => clearInterval(t);
  }, []);

  // normalize latest with safe defaults
  const L = useMemo(
    () => ({
      cpu: Number.isFinite(latest.cpu) ? latest.cpu : 0,
      mem: Number.isFinite(latest.mem) ? latest.mem : 0,
      net: Number.isFinite(latest.net) ? latest.net : 0,
      io: Number.isFinite(latest.io) ? latest.io : 0,
      resp: Number.isFinite(latest.resp) ? latest.resp : 0,
      ts: latest.ts || 0,
    }),
    [latest]
  );

  const metrics = useMemo(() => {
    const live = {
      cpu: { current: L.cpu, avg: L.cpu * 0.9, peak: L.cpu * 1.1, trend: "stable" },
      memory: { current: L.mem, avg: L.mem * 0.9, peak: L.mem * 1.1, trend: "stable" },
      network: { current: L.net, avg: L.net * 0.9, peak: L.net * 1.1, trend: "stable" },
      storage: { current: L.io, avg: L.io * 0.9, peak: L.io * 1.1, trend: "stable" },
      response: { current: L.resp, avg: L.resp * 0.9, peak: L.resp * 1.1, trend: "stable" },
      throughput: { current: 1200, avg: 1200, peak: 1200, trend: "stable" },
    };

    if (serverOverview && serverOverview.length > 0) {
      const n = serverOverview.length;
      const avg = (f) => serverOverview.reduce((s, srv) => s + (srv.metrics?.[f] || 0), 0) / n;

      const currentCpu = avg("cpuUsage");
      const currentMemory = avg("memoryUsage");
      const currentNetwork = avg("networkLatency");
      const currentStorage = avg("storageIO");

      if (currentCpu > 0 || currentMemory > 0) {
        live.cpu.current = currentCpu;
        live.memory.current = currentMemory;
        live.network.current = currentNetwork;
        live.storage.current = currentStorage;
      }

      const recent = healthTrend?.slice(-20) || [];
      if (recent.length) {
        const mean = (arr, key) => arr.reduce((s, t) => s + (t[key] || 0), 0) / arr.length;
        const aCpu = mean(recent, "cpuUsage");
        const aMem = mean(recent, "memoryUsage");
        const aNet = mean(recent, "networkLatency");
        const trend = (cur, a) => {
          const diff = a === 0 ? 0 : ((cur - a) / a) * 100;
          if (Math.abs(diff) < 5) return "stable";
          return diff > 0 ? "increasing" : "decreasing";
        };

        Object.assign(live.cpu, { avg: aCpu, peak: Math.max(...recent.map((t) => t.cpuUsage || 0)), trend: trend(live.cpu.current, aCpu) });
        Object.assign(live.memory, { avg: aMem, peak: Math.max(...recent.map((t) => t.memoryUsage || 0)), trend: trend(live.memory.current, aMem) });
        Object.assign(live.network, { avg: aNet, peak: Math.max(...recent.map((t) => t.networkLatency || 0)), trend: trend(live.network.current, aNet) });
      }
    }
    return live;
  }, [L, serverOverview, healthTrend]);

  const performMemoryCleanup = useCallback(() => {
    const now = Date.now();
    if (now - lastMemoryCleanupRef.current > 5 * 60 * 1000) {
      lastMemoryCleanupRef.current = now;
    }
  }, []);

  const performIntelligentAnalysis = useMemo(() => {
    const ctx = {
      cpu: Math.round(metrics.cpu.current),
      memory: Math.round(metrics.memory.current),
      network: Math.round(metrics.network.current),
      storage: Math.round(metrics.storage.current),
      trends: { cpu: metrics.cpu.trend, memory: metrics.memory.trend, network: metrics.network.trend },
    };

    if (lastAnalysisRef.current) {
      const prev = lastAnalysisRef.current.context;
      const changed =
        Math.abs(ctx.cpu - prev.cpu) > 5 || Math.abs(ctx.memory - prev.memory) > 5 || Math.abs(ctx.network - prev.network) > 10;
      if (!changed) return lastAnalysisRef.current;
    }

    const agents = [
      { name: "CVE Analyst", opinion: "NEUTRAL", rationale: "No obvious security performance indicators detected", confidence: 0.7 },
      { name: "Config Drift Watcher", opinion: "AGREE", rationale: "Performance aligns with baseline", confidence: 0.6 },
      { name: "Simulation Planner", opinion: "AGREE", rationale: "Within normal parameters", confidence: 0.8 },
    ];

    if (ctx.cpu > 85) Object.assign(agents[0], { opinion: "DISAGREE", rationale: "High CPU may indicate abuse", confidence: 0.8 });
    if (ctx.memory > PERFORMANCE_THRESHOLDS.memory.warning)
      Object.assign(agents[1], { opinion: "DISAGREE", rationale: "Memory exceeds thresholds; possible config drift", confidence: 0.9 });
    if (ctx.cpu > 75 && ctx.memory > 75)
      Object.assign(agents[2], { opinion: "DISAGREE", rationale: "Combined load risks degradation", confidence: 0.85 });
    else if (ctx.network > PERFORMANCE_THRESHOLDS.network.warning)
      Object.assign(agents[2], { opinion: "NEUTRAL", rationale: "Network latency may impact UX", confidence: 0.7 });

    const similar = queryMemories
      ? queryMemories(WIDGET_ID, { similarContext: ctx, limit: 3, maxAge: 2 * 24 * 60 * 60 * 1000 })
      : [];

    const agreeing = agents.filter((a) => a.opinion === "AGREE").length;
    const disagreeing = agents.filter((a) => a.opinion === "DISAGREE").length;
    const total = agents.length;
    const simulationCertainty = Math.max(0, (agreeing - disagreeing) / total + 0.5);
    const historicalAccuracy = similar.length > 0 ? Math.min(1, 0.5 + similar.length * 0.15) : 0.4;
    const avgAgentConfidence = agents.reduce((s, a) => s + a.confidence, 0) / agents.length;
    const dataFreshness = L.ts > 0 ? 0.9 : 0.5;

    const baseConfidence =
      0.4 * simulationCertainty + 0.3 * historicalAccuracy + 0.2 * avgAgentConfidence + 0.1 * dataFreshness;
    const feedbackAdj = getConfidenceAdjustment ? getConfidenceAdjustment(WIDGET_ID) : 0;
    const finalConfidence = Math.max(0, Math.min(1, baseConfidence + feedbackAdj));

    const result = {
      agents,
      confidence: finalConfidence,
      context: ctx,
      hasDisagreement: agents.some((a) => a.opinion === "DISAGREE") && agents.some((a) => a.opinion === "AGREE"),
      shouldSuppress: shouldSuppressAlert ? shouldSuppressAlert(WIDGET_ID, ctx) : false,
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
    L.ts,
  ]);

  useEffect(() => {
    const { confidence, shouldSuppress } = performIntelligentAnalysis;
    if (shouldSuppress) {
      setWidgetState("baseline");
      return;
    }

    stateChangeCountRef.current++;

    const breachCritical =
      metrics.cpu.current > PERFORMANCE_THRESHOLDS.cpu.critical ||
      metrics.memory.current > PERFORMANCE_THRESHOLDS.memory.critical ||
      metrics.network.current > PERFORMANCE_THRESHOLDS.network.critical;
    const breachWarn =
      metrics.cpu.current > PERFORMANCE_THRESHOLDS.cpu.warning ||
      metrics.memory.current > PERFORMANCE_THRESHOLDS.memory.warning ||
      metrics.network.current > PERFORMANCE_THRESHOLDS.network.warning;

    let next = "baseline";
    if (breachCritical && confidence >= 0.75) next = "critical";
    else if ((breachWarn && confidence >= 0.5) || confidence >= 0.75) next = "alert";
    else if (confidence >= 0.25) next = "advisory";

    if (next !== widgetState) {
      setWidgetState(next);
      if ((next === "critical" || next === "alert") && storeMemory) {
        if (stateChangeCountRef.current % 3 === 0) {
          const eventType = next === "critical" ? MEMORY_EVENT_TYPES.THRESHOLD_BREACH : MEMORY_EVENT_TYPES.ALERT;
          storeMemory(
            WIDGET_ID,
            createMemoryEvent(eventType, performIntelligentAnalysis.context, `Performance metrics ${next}`, {
              confidence,
              level: next,
              agentCount: performIntelligentAnalysis.agents.length,
            })
          );
        }
      }
    }
    performMemoryCleanup();
  }, [
    performIntelligentAnalysis,
    metrics.cpu.current,
    metrics.memory.current,
    metrics.network.current,
    widgetState,
    storeMemory,
    performMemoryCleanup,
  ]);

  useEffect(() => () => { lastAnalysisRef.current = null; stateChangeCountRef.current = 0; }, []);

  const getWidgetBorderStyle = useCallback(() => {
    switch (widgetState) {
      case "critical":
        return "border-red-500 border-4 animate-pulse";
      case "alert":
        return "border-orange-500 border-4";
      case "advisory":
        return "border-amber-500 border-2";
      default:
        return "border-gray-200 dark:border-gray-700";
    }
  }, [widgetState]);

  const handleFeedback = useCallback(
    (feedback) => {
      if (recordFeedback) {
        recordFeedback(WIDGET_ID, feedback, {
          confidence: performIntelligentAnalysis.confidence,
          state: widgetState,
          metrics: {
            cpu: Math.round(metrics.cpu.current),
            memory: Math.round(metrics.memory.current),
            network: Math.round(metrics.network.current),
          },
        });
      }
      if (feedback !== FEEDBACK_TYPES.SNOOZE) setShowInsightPanel(false);
    },
    [recordFeedback, performIntelligentAnalysis.confidence, widgetState, metrics.cpu.current, metrics.memory.current, metrics.network.current]
  );

  const metricConfigs = useMemo(
    () => ({
      cpu: { name: "CPU Usage", icon: Cpu, unit: "%", color: "text-blue-500", bgColor: "bg-blue-500/10", data: metrics.cpu },
      memory: { name: "Memory Usage", icon: MemoryStick, unit: "%", color: "text-green-500", bgColor: "bg-green-500/10", data: metrics.memory },
      network: { name: "Network Latency", icon: Wifi, unit: "ms", color: "text-purple-500", bgColor: "bg-purple-500/10", data: metrics.network },
      storage: { name: "Storage I/O", icon: HardDrive, unit: " IOPS", color: "text-orange-500", bgColor: "bg-orange-500/10", data: metrics.storage },
      response: { name: "Response Time", icon: Clock, unit: "ms", color: "text-red-500", bgColor: "bg-red-500/10", data: metrics.response },
      throughput: { name: "Throughput", icon: Activity, unit: " req/s", color: "text-indigo-500", bgColor: "bg-indigo-500/10", data: metrics.throughput },
    }),
    [metrics]
  );

  const formatValue = useCallback((v, unit) => `${Math.round(v)}${unit}`, []);

  const getTrendIcon = useCallback((trend) => (trend === "increasing" ? "↗️" : trend === "decreasing" ? "↘️" : "➡️"), []);
  const getTrendColor = useCallback((trend, kind) => {
    if (kind === "network" || kind === "response") return trend === "decreasing" ? "text-green-500" : trend === "increasing" ? "text-red-500" : "text-gray-500";
    if (kind === "throughput") return trend === "increasing" ? "text-green-500" : trend === "decreasing" ? "text-red-500" : "text-gray-500";
    return trend === "increasing" ? "text-yellow-500" : trend === "stable" ? "text-green-500" : "text-blue-500";
  }, []);

  const modeColor = () =>
    currentMode === "websocket" ? "text-green-400" : currentMode === "eventbus" ? "text-blue-400" : currentMode === "polling" ? "text-yellow-400" : "text-gray-400";

  return (
    <div className={`h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg border-2 ${getWidgetBorderStyle()}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Performance Metrics</h3>

          {widgetState !== "baseline" && (
            <InsightBadge confidenceScore={performIntelligentAnalysis.confidence} agents={performIntelligentAnalysis.agents.map((a) => a.name)} tooltip={`${widgetState} level insight`} />
          )}
          <span className={`text-xs px-2 py-1 rounded ${modeColor()} bg-gray-100 dark:bg-gray-700`}>{currentMode}</span>
        </div>

        <div className="flex items-center gap-2">
          {(widgetState === "alert" || widgetState === "critical") && (
            <button
              onClick={() => setShowInsightPanel(!showInsightPanel)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500/10 text-blue-600 rounded border border-blue-200 hover:bg-blue-500/20 transition-colors"
            >
              Why? {showInsightPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="text-xs bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1">
            <option value="1h">1 Hour</option>
            <option value="4h">4 Hours</option>
            <option value="24h">24 Hours</option>
          </select>
        </div>
      </div>

      {/* Insight Panel */}
      {showInsightPanel && (widgetState === "alert" || widgetState === "critical") && (
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">AIDA Analysis</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Confidence: {Math.round(performIntelligentAnalysis.confidence * 100)}% {performIntelligentAnalysis.hasDisagreement && " • Agent disagreement detected"}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleFeedback(FEEDBACK_TYPES.HELPFUL)} className="px-2 py-1 text-xs bg-green-500/10 text-green-600 rounded hover:bg-green-500/20" title="This insight was helpful">
                  👍 Helpful
                </button>
                <button onClick={() => handleFeedback(FEEDBACK_TYPES.SNOOZE)} className="px-2 py-1 text-xs bg-yellow-500/10 text-yellow-600 rounded hover:bg-yellow-500/20" title="Remind me later">
                  😴 Snooze
                </button>
                <button onClick={() => handleFeedback(FEEDBACK_TYPES.IGNORE)} className="px-2 py-1 text-xs bg-gray-500/10 text-gray-600 rounded hover:bg-gray-500/20" title="Not relevant right now">
                  🙄 Ignore
                </button>
              </div>
            </div>
            {performIntelligentAnalysis.hasDisagreement && <DebateLog entries={performIntelligentAnalysis.agents} />}
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              <strong>Current State:</strong> CPU {Math.round(metrics.cpu.current)}%, Memory {Math.round(metrics.memory.current)}%, Network {Math.round(metrics.network.current)}ms
            </div>
          </div>
        </div>
      )}

      {/* Metrics grid */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 h-full">
          {Object.entries(metricConfigs).map(([key, config]) => {
            const Icon = config.icon;
            const isSelected = selectedMetric === key;
            return (
              <div
                key={key}
                onClick={() => setSelectedMetric(key)}
                className={`relative p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                  isSelected ? "border-indigo-500 bg-indigo-500/5" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                } ${config.bgColor}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`w-5 h-5 ${config.color}`} />
                  <span className={`text-sm ${getTrendColor(config.data.trend, key)}`}>{getTrendIcon(config.data.trend)}</span>
                </div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">{config.name}</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{formatValue(config.data.current, config.unit)}</div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Avg: {formatValue(config.data.avg, config.unit)}</span>
                  <span>Peak: {formatValue(config.data.peak, config.unit)}</span>
                </div>
                {isSelected && <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected metric details */}
      {selectedMetric && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">{metricConfigs[selectedMetric].name} Details</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Trend: {metricConfigs[selectedMetric].data.trend} over {timeRange} • Samples: {history.ts.length}
                {widgetState !== "baseline" && <span className="ml-2 px-2 py-1 text-xs bg-blue-500/10 text-blue-600 rounded">AIDA: {widgetState}</span>}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{formatValue(metricConfigs[selectedMetric].data.current, metricConfigs[selectedMetric].unit)}</div>
              <div className={`text-sm ${getTrendColor(metricConfigs[selectedMetric].data.trend, selectedMetric)}`}>
                {getTrendIcon(metricConfigs[selectedMetric].data.trend)} {metricConfigs[selectedMetric].data.trend}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMetricsWidget;
