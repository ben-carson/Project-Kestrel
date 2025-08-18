// src/components/widgets/NetworkTopology/Sidebar/panels/NodeDetailsPanel.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  Server,
  Activity,
  Cpu,
  MemoryStick,
  HardDrive,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Info,
  Search,
  Copy,
} from "lucide-react";

/**
 * @typedef {Object} Metrics
 * @property {number} cpuUsage   // 0..100
 * @property {number} memoryUsage // 0..100
 * @property {number} networkLatency // ms
 *
 * @typedef {Object} Specs
 * @property {number} cpu
 * @property {number} memory
 * @property {number} storage
 *
 * @typedef {Object} Node
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {('online'|'warning'|'critical'|'offline')} status
 * @property {string} tier
 * @property {Metrics} metrics
 * @property {Specs} specs
 * @property {Object} networkConfig
 *
 * @typedef {Object} NodeDetailsPanelProps
 * @property {Node=} node                       - Node to display. (If omitted, will use data?.selectedNode)
 * @property {{selectedNode?: Node}=} data      - Optional data model with selectedNode for backward-compat.
 * @property {boolean=} isLoading               - External loading state.
 * @property {any=} error                       - External error object/string.
 * @property {(sectionId:string)=>void=} onToggleSection - Controlled expand/collapse handler.
 * @property {{[key:string]:boolean}=} expandedSections  - Controlled expanded state.
 * @property {(text:string)=>void=} onCopy      - Optional copy callback.
 * @property {(query:string)=>void=} onSearch   - Optional search query callback.
 */

export default function NodeDetailsPanel(props) {
  return (
    <PanelErrorBoundary>
      <NodeDetailsPanelInner {...props} />
    </PanelErrorBoundary>
  );
}

/* ---------------------------- Inner Component ---------------------------- */

function NodeDetailsPanelInner({
  node: nodeProp,
  data,
  isLoading: loadingProp,
  error,
  onToggleSection,
  expandedSections,
  onCopy,
  onSearch,
}) {
  const node = nodeProp ?? data?.selectedNode ?? null;
  const isLoading = loadingProp ?? (node == null && !error);

  // Uncontrolled expand state fallback (controlled if expandedSections provided)
  const [internalExpanded, setInternalExpanded] = useState({
    meta: true,
    metrics: true,
    specs: true,
    details: true,
  });

  const isExpanded = (k) => (expandedSections ? !!expandedSections[k] : !!internalExpanded[k]);
  const toggle = (k) => {
    onToggleSection?.(k);
    if (!expandedSections) setInternalExpanded((s) => ({ ...s, [k]: !s[k] }));
  };

  const [metricQuery, setMetricQuery] = useState("");
  useEffect(() => {
    onSearch?.(metricQuery);
  }, [metricQuery, onSearch]);

  const filteredMetrics = useMemo(() => {
    const m = node?.metrics ?? {};
    if (!metricQuery.trim()) return m;
    const q = metricQuery.toLowerCase();
    return Object.fromEntries(
      Object.entries(m).filter(([key]) => key.toLowerCase().includes(q))
    );
  }, [node?.metrics, metricQuery]);

  const configString = useMemo(() => {
    if (!node) return "";
    const safe = {
      id: node.id,
      name: node.name,
      type: node.type,
      status: node.status,
      tier: node.tier,
      metrics: node.metrics,
      specs: node.specs,
      networkConfig: node.networkConfig,
    };
    return JSON.stringify(safe, null, 2);
  }, [node]);

  if (error) {
    return (
      <PanelCard title="Node Details" icon={<AlertTriangle className="h-4 w-4 text-red-500" />}>
        <div className="text-sm text-red-400">Error: {String(error)}</div>
      </PanelCard>
    );
  }

  if (isLoading) {
    return (
      <PanelCard title="Node Details" icon={<Info className="h-4 w-4 opacity-70" />}>
        <div className="animate-pulse space-y-2">
          <div className="h-4 rounded bg-neutral-700/40" />
          <div className="h-4 rounded bg-neutral-700/40 w-2/3" />
          <div className="h-4 rounded bg-neutral-700/40 w-1/2" />
        </div>
      </PanelCard>
    );
  }

  if (!node) {
    return (
      <PanelCard title="Node Details" icon={<Info className="h-4 w-4 opacity-70" />}>
        <div className="text-sm opacity-70">Select a node to view details.</div>
      </PanelCard>
    );
  }

  return (
    <PanelCard title="Node Details" icon={<Server className="h-4 w-4" />}>
      {/* Header: name + status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="space-y-0.5">
          <div className="text-base font-semibold">{node.name}</div>
          <div className="text-xs opacity-70">{node.id} · {node.tier} · {node.type}</div>
        </div>
        <StatusPill status={node.status} />
      </div>

      {/* Search metrics */}
      <div className="relative mb-3">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
        <input
          value={metricQuery}
          onChange={(e) => setMetricQuery(e.target.value)}
          placeholder="Filter metrics…"
          className="w-full pl-8 pr-2 py-1.5 text-sm rounded-md bg-white/90 dark:bg-neutral-900/70 border border-neutral-300/70 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        />
      </div>

      {/* Metrics */}
      <Section
        id="metrics"
        title="Real-time Metrics"
        icon={<Activity className="h-4 w-4" />}
        expanded={isExpanded("metrics")}
        onToggle={toggle}
      >
        <div className="space-y-2">
          {"cpuUsage" in filteredMetrics && (
            <MetricBar
              label="CPU Usage"
              value={filteredMetrics.cpuUsage}
              suffix="%"
              icon={<Cpu className="h-3.5 w-3.5" />}
            />
          )}
          {"memoryUsage" in filteredMetrics && (
            <MetricBar
              label="Memory Usage"
              value={filteredMetrics.memoryUsage}
              suffix="%"
              icon={<MemoryStick className="h-3.5 w-3.5" />}
            />
          )}
          {"networkLatency" in filteredMetrics && (
            <MetricBar
              label="Network Latency"
              value={filteredMetrics.networkLatency}
              suffix="ms"
              color="indigo"
              icon={<Activity className="h-3.5 w-3.5" />}
            />
          )}
          {/* Render any other numeric metrics generically */}
          {Object.entries(filteredMetrics)
            .filter(([k]) => !["cpuUsage", "memoryUsage", "networkLatency"].includes(k))
            .map(([k, v]) => (
              <MetricBar key={k} label={toTitle(k)} value={Number(v)} suffix="" />
            ))}
        </div>
      </Section>

      {/* Specs */}
      <Section
        id="specs"
        title="System Specs"
        icon={<HardDrive className="h-4 w-4" />}
        expanded={isExpanded("specs")}
        onToggle={toggle}
      >
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <KVItem icon={<Cpu className="h-3.5 w-3.5" />} k="CPU Cores" v={node.specs?.cpu ?? "—"} />
          <KVItem icon={<MemoryStick className="h-3.5 w-3.5" />} k="Memory (GB)" v={node.specs?.memory ?? "—"} />
          <KVItem icon={<HardDrive className="h-3.5 w-3.5" />} k="Storage (GB)" v={node.specs?.storage ?? "—"} />
        </dl>
      </Section>

      {/* Raw Config w/ copy + basic syntax highlight */}
      <Section
        id="details"
        title="Configuration JSON"
        icon={<Info className="h-4 w-4" />}
        expanded={isExpanded("details")}
        onToggle={toggle}
        actions={
          <CopyButton
            text={configString}
            onCopy={onCopy}
            className="ml-2"
            label="Copy JSON"
          />
        }
      >
        <CodeBlock lang="json" code={configString} />
      </Section>
    </PanelCard>
  );
}

/* -------------------------------- Sub-UI -------------------------------- */

function PanelCard({ title, icon, children }) {
  return (
    <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-700/70 bg-white/95 dark:bg-neutral-900/80 backdrop-blur-sm shadow-sm p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="shrink-0 opacity-80">{icon}</div>
        <div className="text-sm font-semibold">{title}</div>
      </div>
      {children}
    </div>
  );
}

function StatusPill({ status = "online" }) {
  const map = {
    online: "bg-emerald-500",
    warning: "bg-amber-500",
    critical: "bg-red-500",
    offline: "bg-neutral-500",
  };
  const text = {
    online: "Online",
    warning: "Warning",
    critical: "Critical",
    offline: "Offline",
  }[status] ?? status;
  return (
    <span className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full border border-neutral-300/70 dark:border-neutral-700 bg-white/80 dark:bg-neutral-900/60 backdrop-blur-sm">
      <span className={`h-2.5 w-2.5 rounded-full ${map[status] ?? "bg-neutral-500"}`} />
      <span className="opacity-90">{text}</span>
    </span>
  );
}

function Section({ id, title, icon, expanded, onToggle, children, actions }) {
  const open = !!expanded;
  return (
    <div className="rounded-lg border border-neutral-200/60 dark:border-neutral-700/70 bg-white/80 dark:bg-neutral-900/60 backdrop-blur-sm">
      <button
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition"
        onClick={() => onToggle?.(id)}
      >
        <div className="flex items-center gap-2">
          <span className="opacity-80">{icon}</span>
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden px-3 pb-3">{children}</div>
      </div>
    </div>
  );
}

function MetricBar({ label, value = 0, suffix = "", color = "emerald", icon }) {
  const pct = Math.max(0, Math.min(100, Number(value)));
  const track =
    "h-2 w-full rounded-full bg-neutral-200/70 dark:bg-neutral-800/70 overflow-hidden";
  const fill = `h-2 rounded-full transition-all duration-300 bg-${color}-500`; // Tailwind won't see dynamic color; use conditional map:
  const fillClass = {
    emerald: "bg-emerald-500",
    indigo: "bg-indigo-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    sky: "bg-sky-500",
  }[color] || "bg-emerald-500";

  // Auto-warn coloring for >80%
  const autoClass = pct >= 90 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : fillClass;

  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0 opacity-80">{icon}</div>
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="opacity-80">{label}</span>
          <span className="tabular-nums">{pct.toFixed(0)}{suffix}</span>
        </div>
        <div className={track}>
          <div className={`${autoClass}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

function KVItem({ icon, k, v }) {
  return (
    <>
      <div className="flex items-center gap-2 opacity-80">
        <span className="shrink-0">{icon}</span>
        <span className="text-xs">{k}</span>
      </div>
      <div className="text-xs font-medium">{String(v)}</div>
    </>
  );
}

function CopyButton({ text, label = "Copy", onCopy, className = "" }) {
  const [copied, setCopied] = useState(false);
  const doCopy = async () => {
    try {
      await navigator.clipboard?.writeText(text);
      setCopied(true);
      onCopy?.(text);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };
  return (
    <button
      onClick={doCopy}
      className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border border-neutral-300/70 dark:border-neutral-700 hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition ${className}`}
      title={label}
    >
      <Copy className="h-3.5 w-3.5" />
      {copied ? "Copied" : label}
    </button>
  );
}

function CodeBlock({ code = "", lang = "json" }) {
  // lightweight JSON "highlight"
  const html = useMemo(() => {
    if (lang !== "json") return escapeHtml(code);
    const esc = escapeHtml(code);
    return esc
      .replace(/(&quot;.*?&quot;)(\s*:)/g, '<span class="text-emerald-500">$1</span>$2')
      .replace(/(:\s*)(&quot;.*?&quot;)/g, '$1<span class="text-amber-400">$2</span>')
      .replace(/(:\s*)(\d+(\.\d+)?)/g, '$1<span class="text-sky-400">$2</span>')
      .replace(/\b(true|false|null)\b/g, '<span class="text-indigo-400">$1</span>');
  }, [code, lang]);

  return (
    <div className="rounded-lg border border-neutral-200/60 dark:border-neutral-700/70 bg-white/70 dark:bg-neutral-900/50 overflow-hidden">
      <pre className="text-xs p-3 overflow-auto">
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function toTitle(k = "") {
  return k.replace(/([A-Z])/g, " $1").replace(/[-_]/g, " ").replace(/\s+/g, " ").replace(/^./, c => c.toUpperCase());
}

/* --------------------------- Error Boundary --------------------------- */

class PanelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, err: null };
  }
  static getDerivedStateFromError(err) { return { hasError: true, err }; }
  componentDidCatch(err) { console.error("[NodeDetailsPanel] error:", err); }
  render() {
    if (this.state.hasError) {
      return (
        <PanelCard title="Node Details" icon={<AlertTriangle className="h-4 w-4 text-red-500" />}>
          <div className="text-sm text-red-400">Panel failed to render.</div>
        </PanelCard>
      );
    }
    return this.props.children;
  }
}
