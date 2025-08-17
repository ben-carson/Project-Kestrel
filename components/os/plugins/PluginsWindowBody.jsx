import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, ExternalLink, PlugZap, Clock, Copy, Shield, Atom } from 'lucide-react';

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

export default function PluginsWindowBody({ initialServices = [], initialQuery = "", initialSortKey = "updated" }) {
  const [services, setServices] = useState(initialServices);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastTs, setLastTs] = useState(null);
  const [q, setQ] = useState(initialQuery);
  const [sortKey, setSortKey] = useState(initialSortKey);

  const fetchServices = React.useCallback(async () => {
    setLoading(true);
    setError(null);
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

  React.useEffect(() => {
    if (initialServices.length === 0) {
      fetchServices();
    }
  }, [fetchServices, initialServices.length]);

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

  const copyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {}
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <PlugZap className="w-5 h-5 text-blue-500" />
          <h1 className="text-lg font-semibold">Plugin Manager</h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {loading ? "Loading…" : `${list.length} visible`}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
          >
            <option value="updated">Last seen</option>
            <option value="name">Name</option>
            <option value="kind">Kind</option>
            <option value="version">Version</option>
          </select>
          <button
            onClick={fetchServices}
            className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded px-3 py-2">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            className="bg-transparent outline-none text-sm flex-1"
            placeholder="Search name, kind, version, URL…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {error && (
          <div className="text-red-500 text-sm mt-2">{error}</div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {list.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <PlugZap className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No plugins match your filters</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((service) => {
              const kind = service.meta?.kind ?? "—";
              const version = service.meta?.version ?? "—";
              return (
                <div key={service.name} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-lg mb-1">{service.name}</h3>
                      <a
                        href={service.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 mb-2"
                      >
                        {service.url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <Atom className="w-3 h-3" />
                          {kind}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          v{version}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {relativeTime(service.ts)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => copyUrl(service.url)}
                      className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors inline-flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copy URL
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 p-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center justify-between">
          <span>Powered by /api/plugin-services</span>
          <span>Last fetched: {lastTs ? relativeTime(lastTs) : "—"}</span>
        </div>
      </div>
    </div>
  );
}
