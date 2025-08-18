// src/components/widgets/NetworkTopology/Sidebar/panels/NetworkConfigPanel.jsx
import React, { useMemo, useState } from "react";
import {
  Network,
  Cable,
  Globe,
  FileCode,
  Search,
  ChevronDown,
  ChevronRight,
  Copy,
} from "lucide-react";

/**
 * @typedef {Object} Interface
 * @property {string} name
 * @property {string} ip
 * @property {('up'|'down')} status
 *
 * @typedef {Object} Port
 * @property {number} port
 * @property {('TCP'|'UDP')} protocol
 * @property {string} service
 *
 * @typedef {Object} RoutingEntry
 * @property {string} destination
 * @property {string} gateway
 * @property {string} iface
 * @property {number} metric
 *
 * @typedef {Object} NetworkConfig
 * @property {Interface[]=} interfaces
 * @property {Port[]=} ports
 * @property {RoutingEntry[]=} routes
 *
 * @typedef {Object} NetworkConfigPanelProps
 * @property {{ networkConfig?: NetworkConfig }|undefined=} nodeContainer - Optional container with node.networkConfig
 * @property {NetworkConfig=} config           - Direct config (takes precedence if provided)
 * @property {boolean=} isLoading
 * @property {any=} error
 * @property {{[key:string]:boolean}=} expandedSections
 * @property {(id:string)=>void=} onToggleSection
 * @property {(item:any)=>void=} onSelectInterface
 * @property {(item:any)=>void=} onSelectPort
 * @property {(text:string)=>void=} onCopy
 */

export default function NetworkConfigPanel({
  nodeContainer,
  config,
  isLoading,
  error,
  expandedSections,
  onToggleSection,
  onSelectInterface,
  onSelectPort,
  onCopy,
}) {
  const cfg = config ?? nodeContainer?.networkConfig ?? nodeContainer?.evo?.networkConfig ?? nodeContainer?.data?.networkConfig ?? {};
  const [internalExpanded, setInternalExpanded] = useState({ ifaces: true, ports: true, routes: false });
  const [query, setQuery] = useState("");

  const isOpen = (k) => (expandedSections ? !!expandedSections[k] : !!internalExpanded[k]);
  const toggle = (k) => {
    onToggleSection?.(k);
    if (!expandedSections) setInternalExpanded((s) => ({ ...s, [k]: !s[k] }));
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cfg;
    const ifaces = (cfg.interfaces ?? []).filter((i) =>
      [i.name, i.ip, i.status].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
    const ports = (cfg.ports ?? []).filter((p) =>
      [p.port, p.protocol, p.service].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
    const routes = (cfg.routes ?? []).filter((r) =>
      [r.destination, r.gateway, r.iface, r.metric].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
    return { interfaces: ifaces, ports, routes };
  }, [cfg, query]);

  const configJson = useMemo(() => JSON.stringify(cfg, null, 2), [cfg]);

  if (error) return <Panel title="Network Configuration" icon={<FileCode className="h-4 w-4" />}><div className="text-sm text-red-400">Error: {String(error)}</div></Panel>;
  if (isLoading) return (
    <Panel title="Network Configuration" icon={<FileCode className="h-4 w-4" />}>
      <div className="animate-pulse space-y-2">
        <div className="h-4 rounded bg-neutral-700/40" />
        <div className="h-4 rounded bg-neutral-700/40 w-4/5" />
      </div>
    </Panel>
  );

  return (
    <Panel title="Network Configuration" icon={<FileCode className="h-4 w-4" />}>
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search interfaces, ports, routes…"
          className="w-full pl-8 pr-2 py-1.5 text-sm rounded-md bg-white/90 dark:bg-neutral-900/70 border border-neutral-300/70 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        />
      </div>

      {/* Interfaces */}
      <Section
        id="ifaces"
        title="Interfaces"
        icon={<Network className="h-4 w-4" />}
        expanded={isOpen("ifaces")}
        onToggle={toggle}
        actions={<CopyBtn text={toCliInterfaces(cfg.interfaces)} onCopy={onCopy} label="Copy CLI" />}
      >
        <div className="space-y-2">
          {(filtered.interfaces ?? []).length === 0 && (
            <div className="text-xs opacity-60">No interfaces.</div>
          )}
          {(filtered.interfaces ?? []).map((iface) => (
            <button
              key={iface.name}
              onClick={() => onSelectInterface?.(iface)}
              className="w-full rounded-md border border-neutral-300/70 dark:border-neutral-700/70 bg-white/80 dark:bg-neutral-900/60 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition px-3 py-2 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cable className="h-4 w-4 opacity-80" />
                  <div className="text-sm font-medium">{iface.name}</div>
                  <StatusDot up={iface.status === "up"} />
                </div>
                <div className="text-xs opacity-70">{iface.ip}</div>
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* Ports */}
      <Section
        id="ports"
        title="Exposed Ports"
        icon={<Globe className="h-4 w-4" />}
        expanded={isOpen("ports")}
        onToggle={toggle}
        actions={<CopyBtn text={toFirewallRules(cfg.ports)} onCopy={onCopy} label="Copy Rules" />}
      >
        <table className="w-full text-xs">
          <thead className="text-[11px] uppercase opacity-60">
            <tr>
              <th className="text-left py-1">Port</th>
              <th className="text-left py-1">Protocol</th>
              <th className="text-left py-1">Service</th>
            </tr>
          </thead>
          <tbody>
            {(filtered.ports ?? []).map((p, idx) => (
              <tr key={`${p.port}-${idx}`} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition">
                <td className="py-1">
                  <button
                    className="underline-offset-2 hover:underline"
                    onClick={() => onSelectPort?.(p)}
                  >
                    {p.port}
                  </button>
                </td>
                <td className="py-1">{p.protocol}</td>
                <td className="py-1">{p.service}</td>
              </tr>
            ))}
            {(filtered.ports ?? []).length === 0 && (
              <tr><td colSpan={3} className="py-2 opacity-60">No ports.</td></tr>
            )}
          </tbody>
        </table>
      </Section>

      {/* Routes */}
      <Section
        id="routes"
        title="Routing Table"
        icon={<FileCode className="h-4 w-4" />}
        expanded={isOpen("routes")}
        onToggle={toggle}
        actions={<CopyBtn text={toRouteCli(cfg.routes)} onCopy={onCopy} label="Copy Routes" />}
      >
        {(filtered.routes ?? []).length === 0 ? (
          <div className="text-xs opacity-60">No routes.</div>
        ) : (
          <div className="overflow-auto rounded-lg border border-neutral-200/60 dark:border-neutral-700/70 bg-white/70 dark:bg-neutral-900/50">
            <table className="min-w-full text-xs">
              <thead className="text-[11px] uppercase opacity-60">
                <tr>
                  <th className="text-left py-1 px-2">Destination</th>
                  <th className="text-left py-1 px-2">Gateway</th>
                  <th className="text-left py-1 px-2">Iface</th>
                  <th className="text-left py-1 px-2">Metric</th>
                </tr>
              </thead>
              <tbody>
                {(filtered.routes ?? []).map((r, i) => (
                  <tr key={`${r.destination}-${i}`} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition">
                    <td className="py-1 px-2">{r.destination}</td>
                    <td className="py-1 px-2">{r.gateway}</td>
                    <td className="py-1 px-2">{r.iface}</td>
                    <td className="py-1 px-2">{r.metric}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* JSON config viewer + copy */}
      <Section
        id="raw"
        title="Raw Configuration (JSON)"
        icon={<FileCode className="h-4 w-4" />}
        expanded={false}
        onToggle={toggle}
        actions={<CopyBtn text={configJson} onCopy={onCopy} label="Copy JSON" />}
      >
        <pre className="text-xs rounded-lg border border-neutral-200/60 dark:border-neutral-700/70 bg-white/70 dark:bg-neutral-900/50 p-3 overflow-auto">
          <code>{configJson}</code>
        </pre>
      </Section>
    </Panel>
  );
}

/* -------------------------------- Sub-UI -------------------------------- */

function Panel({ title, icon, children }) {
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

function Section({ id, title, icon, expanded, onToggle, actions, children }) {
  const open = !!expanded;
  return (
    <div className="rounded-lg border border-neutral-200/60 dark:border-neutral-700/70 bg-white/80 dark:bg-neutral-900/60 backdrop-blur-sm mb-3">
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

function StatusDot({ up }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${
        up ? "bg-emerald-500" : "bg-red-500"
      }`}
      title={up ? "Up" : "Down"}
    />
  );
}

function CopyBtn({ text, label = "Copy", onCopy }) {
  const [copied, setCopied] = useState(false);
  const doCopy = async () => {
    try {
      await navigator.clipboard?.writeText(text ?? "");
      setCopied(true);
      onCopy?.(text);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text ?? "";
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
      className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border border-neutral-300/70 dark:border-neutral-700 hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition"
      title={label}
    >
      <Copy className="h-3.5 w-3.5" />
      {copied ? "Copied" : label}
    </button>
  );
}

/* ------------------------------ CLI helpers ------------------------------ */

function toCliInterfaces(ifaces = []) {
  if (!ifaces.length) return "# no interfaces";
  // make a generic linux-ish CLI
  return ifaces
    .map(
      (i) =>
        `# ${i.name}\nip link set ${i.name} ${i.status === "up" ? "up" : "down"}\n` +
        (i.ip ? `ip addr add ${i.ip}/24 dev ${i.name}\n` : "")
    )
    .join("\n");
}

function toFirewallRules(ports = []) {
  if (!ports.length) return "# no ports";
  return ports
    .map((p) => `iptables -A INPUT -p ${p.protocol?.toLowerCase() || "tcp"} --dport ${p.port} -j ACCEPT # ${p.service || ""}`)
    .join("\n");
}

function toRouteCli(routes = []) {
  if (!routes.length) return "# no routes";
  return routes.map((r) => `ip route add ${r.destination} via ${r.gateway} dev ${r.iface} metric ${r.metric}`).join("\n");
}
