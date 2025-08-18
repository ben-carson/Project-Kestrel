//src/components/os/plugins/PluginsPullout.jsx
import React from "react";
import { RefreshCw, Search, ExternalLink, PlugZap, Clock, Copy, Shield, Atom, ExternalLinkIcon } from "lucide-react";

function relativeTime(ts) {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function PluginsPullout({ onClose }) {
  const [services, setServices] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [lastTs, setLastTs] = React.useState(null);
  const [q, setQ] = React.useState("");
  const [sortKey, setSortKey] = React.useState("updated");

  const fetchServices = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const resp = await fetch("/api/plugin-services", { cache: "no-store" });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setServices(Array.isArray(data?.services) ? data.services : []);
      setLastTs(Date.now());
    } catch (e) {
      setError(e?.message ?? "Failed to load plugin services");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchServices(); }, [fetchServices]);

  const list = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    let out = services.slice();
    if (term) {
      out = out.filter(s => {
        const m = s.meta || {};
        return (
          s.name.toLowerCase().includes(term) ||
          (s.url || "").toLowerCase().includes(term) ||
          (m.kind || "").toString().toLowerCase().includes(term) ||
          (m.version || "").toString().toLowerCase().includes(term)
        );
      });
    }
    out.sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      if (sortKey === "kind") return (a.meta?.kind || "").localeCompare(b.meta?.kind || "");
      if (sortKey === "version") return (a.meta?.version || "").localeCompare(b.meta?.version || "");
      if (sortKey === "updated") return (b.ts || 0) - (a.ts || 0);
      return 0;
    });
    return out;
  }, [services, q, sortKey]);

  const copyUrl = async (url) => { try { await navigator.clipboard.writeText(url); } catch {} };

  const openAsWindow = React.useCallback(() => {
    try {
      // Dispatch custom event to open plugins window
      window.dispatchEvent(new CustomEvent("kestrel:openWindow", {
        detail: {
          id: `plugins-${Date.now()}`,
          title: "Plugin Manager",
          width: 720, 
          height: 520,
          component: "PluginsWindowBody",
          // Pass current state to the window
          props: {
            initialServices: services,
            initialQuery: q,
            initialSortKey: sortKey
          }
        }
      }));
      
      // Close the pullout after opening window
      onClose?.();
    } catch (error) {
      console.error("Failed to open plugins window:", error);
    }
  }, [services, q, sortKey, onClose]);

  return (
    <div className="fixed inset-0 z-[1100] bg-black/40" onClick={onClose}>
      {/* panel sits above taskbar: bottom-12 right-3, mirrors your AppLauncher chroming */}
      <aside
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="fixed bottom-12 right-3 w-[460px] max-w-[92vw] max-h-[80vh]
                   rounded-xl border border-neutral-700 bg-neutral-850/95 backdrop-blur
                   p-3 shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlugZap className="w-4 h-4" />
            <h3 className="text-sm font-semibold opacity-90">Plugins</h3>
            <span className="text-xs opacity-60 ml-2">
              {loading ? "Loading…" : `${list.length} visible`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="bg-neutral-800 rounded px-2 py-1 text-xs border border-neutral-700"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              title="Sort by"
            >
              <option value="updated">Last seen</option>
              <option value="name">Name</option>
              <option value="kind">Kind</option>
              <option value="version">Version</option>
            </select>
            
            {/* Open as Window Button */}
            <button
              onClick={openAsWindow}
              className="inline-flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 px-2.5 py-1.5 rounded border border-blue-500 transition-colors"
              title="Open in dedicated window"
            >
              <ExternalLinkIcon className="w-3.5 h-3.5" />
              Open Window
            </button>
            
            <button
              onClick={fetchServices}
              className="inline-flex items-center gap-1 text-xs bg-neutral-800 hover:bg-neutral-750 px-2.5 py-1.5 rounded border border-neutral-700"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-2 bg-neutral-800 rounded px-2.5 py-1.5 border border-neutral-700">
            <Search className="w-4 h-4 opacity-60" />
            <input
              className="bg-transparent outline-none text-sm w-full"
              placeholder="Search name, kind, version, URL…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          {error ? <div className="text-red-400 text-xs mt-2">{error}</div> : null}
        </div>

        <div className="mt-3 overflow-auto max-h-[60vh] pr-1">
          <ul className="space-y-2">
            {list.map((s) => {
              const kind = s.meta?.kind ?? "—";
              const version = s.meta?.version ?? "—";
              return (
                <li key={s.name} className="rounded-lg border border-neutral-700 p-3 bg-neutral-800/70 hover:bg-neutral-800/90 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{s.name}</div>
                      <div className="text-[11px] opacity-70 break-all">
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="underline decoration-dotted inline-flex items-center gap-1 hover:opacity-80"
                        >
                          {s.url}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1 bg-neutral-900 rounded-full px-2.5 py-1 text-[11px] border border-neutral-700">
                        <Atom className="w-3.5 h-3.5" /> {kind}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-neutral-900 rounded-full px-2.5 py-1 text-[11px] border border-neutral-700">
                        <Shield className="w-3.5 h-3.5" /> v{version}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <button
                      onClick={() => copyUrl(s.url)}
                      className="text-xs opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Copy className="w-3.5 h-3.5" /> Copy URL
                      </span>
                    </button>
                    <span className="text-xs opacity-70 inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {relativeTime(s.ts)}
                    </span>
                  </div>
                </li>
              );
            })}
            {!loading && list.length === 0 ? (
              <li className="text-center text-sm opacity-60 py-6">
                No plugins match your filters.
                {q && (
                  <div className="mt-2">
                    <button 
                      onClick={() => setQ("")}
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Clear search
                    </button>
                  </div>
                )}
              </li>
            ) : null}
          </ul>
        </div>

        {/* Enhanced Footer */}
        <div className="mt-3 pt-2 border-t border-neutral-700">
          <div className="flex items-center justify-between text-[11px] opacity-60">
            <div className="flex items-center gap-3">
              <span>Powered by /api/plugin-services</span>
              <span>•</span>
              <span>Last fetched: {lastTs ? relativeTime(lastTs) : "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{services.length} total</span>
              {q && (
                <>
                  <span>•</span>
                  <span>{list.length} filtered</span>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}