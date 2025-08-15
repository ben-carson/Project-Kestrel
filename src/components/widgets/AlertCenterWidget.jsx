// src/components/widgets/AlertCenterWidget.jsx
import React, { useMemo, useState } from 'react';
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle, Eye, EyeOff, Filter } from 'lucide-react';
import { useDashboardStore } from '../../store/useDashboardStore';

// Minimal, store-compatible Alert Center.
// - Reads servers from useDashboardStore
// - Derives alerts (CPU/Mem/Offline) on the fly
// - Local acknowledge state for now

export default function AlertCenterWidget() {
  const servers = useDashboardStore(s => s.servers) || [];

  const [filter, setFilter] = useState('all');
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [acked, setAcked] = useState(() => new Set());

  const allAlerts = useMemo(() => {
    const alerts = [];
    const now = Date.now();

    for (const server of servers) {
      if (!server) continue;
      const m = server.metrics || {};

      if (typeof m.cpuUsage === 'number' && m.cpuUsage > 80) {
        alerts.push({
          id: `cpu-${server.id}-${now}`,
          eventType: 'high_cpu',
          title: 'High CPU Usage',
          description: `${server.name} CPU at ${Math.round(m.cpuUsage)}%`,
          severity: m.cpuUsage > 90 ? 'critical' : 'warning',
          timestamp: now,
          source: server.name || server.id,
          category: 'performance',
        });
      }
      if (typeof m.memoryUsage === 'number' && m.memoryUsage > 85) {
        alerts.push({
          id: `mem-${server.id}-${now}`,
          eventType: 'memory_pressure',
          title: 'Memory Pressure',
          description: `${server.name} memory at ${Math.round(m.memoryUsage)}%`,
          severity: m.memoryUsage > 95 ? 'critical' : 'warning',
          timestamp: now,
          source: server.name || server.id,
          category: 'performance',
        });
      }
      if (server.status === 'offline') {
        alerts.push({
          id: `offline-${server.id}-${now}`,
          eventType: 'server_offline',
          title: 'Server Offline',
          description: `${server.name} is not responding`,
          severity: 'critical',
          timestamp: now,
          source: server.name || server.id,
          category: 'infrastructure',
        });
      }
    }
    return alerts;
  }, [servers]);

  const filtered = useMemo(() => {
    return allAlerts.filter(a => {
      const isAck = acked.has(a.id);
      if (!showAcknowledged && isAck) return false;
      if (filter === 'all') return true;
      return a.severity === filter || (filter === 'warning' && a.severity === 'high');
    });
  }, [allAlerts, filter, showAcknowledged, acked]);

  const sortedAlerts = useMemo(
    () => [...filtered].sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)),
    [filtered]
  );

  const counts = useMemo(() => {
    const unacked = allAlerts.filter(a => !acked.has(a.id));
    return {
      total: unacked.length,
      critical: unacked.filter(a => a.severity === 'critical').length,
      warning: unacked.filter(a => a.severity === 'warning' || a.severity === 'high').length,
      info: unacked.filter(a => a.severity === 'info').length,
    };
  }, [allAlerts, acked]);

  const fmt = (ts) => {
    const d = Date.now() - (ts ?? Date.now());
    const m = Math.floor(d / 60000);
    const h = Math.floor(m / 60);
    const day = Math.floor(h / 24);
    if (day > 0) return `${day}d ago`;
    if (h > 0) return `${h}h ago`;
    if (m > 0) return `${m}m ago`;
    return 'Just now';
  };

  const sevIcon = (s) => s === 'critical'
    ? <AlertTriangle className="w-4 h-4 text-red-500" />
    : s === 'warning' || s === 'high'
    ? <AlertCircle className="w-4 h-4 text-yellow-500" />
    : s === 'info'
    ? <Info className="w-4 h-4 text-blue-500" />
    : <Bell className="w-4 h-4 text-gray-500" />;

  const sevClass = (s) =>
    s === 'critical' ? 'border-l-red-500 bg-red-500/5' :
    s === 'warning' || s === 'high' ? 'border-l-yellow-500 bg-yellow-500/5' :
    s === 'info' ? 'border-l-blue-500 bg-blue-500/5' :
    'border-l-gray-500 bg-gray-500/5';

  const ack = (id, e) => {
    e.stopPropagation();
    setAcked(prev => {
      const n = new Set(prev);
      n.add(id);
      return n;
    });
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-red-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Alert Center</h3>
          {counts.total > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {counts.total}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAcknowledged(v => !v)}
            className={`p-1 rounded ${showAcknowledged ? 'text-blue-500' : 'text-gray-500'}`}
            title={showAcknowledged ? 'Hide acknowledged' : 'Show acknowledged'}
          >
            {showAcknowledged ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Counts */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-sm">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">Critical:</span>
            <span className="font-medium text-gray-900 dark:text-white">{counts.critical}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">Warning:</span>
            <span className="font-medium text-gray-900 dark:text-white">{counts.warning}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">Info:</span>
            <span className="font-medium text-gray-900 dark:text-white">{counts.info}</span>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1 flex-1"
          >
            <option value="all">All Alerts</option>
            <option value="critical">Critical Only</option>
            <option value="warning">Warnings</option>
            <option value="info">Information</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {sortedAlerts.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">{filter === 'all' ? 'No alerts at this time' : `No ${filter} alerts`}</p>
              <p className="text-xs mt-1">All systems running normally</p>
            </div>
          </div>
        ) : (
          sortedAlerts.map((a) => {
            const isAck = acked.has(a.id);
            return (
              <div
                key={a.id}
                onClick={() => setSelectedId(id => id === a.id ? null : a.id)}
                className={`mb-2 p-3 rounded-lg border-l-4 cursor-pointer transition-all duration-200
                            ${sevClass(a.severity)} ${isAck ? 'opacity-60' : ''} 
                            ${selectedId === a.id ? 'ring-2 ring-blue-500' : ''} 
                            hover:bg-gray-50 dark:hover:bg-gray-700/50`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    {sevIcon(a.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium text-sm ${isAck ? 'line-through' : ''} text-gray-900 dark:text-white`}>
                          {a.title}
                        </h4>
                        {isAck && <CheckCircle className="w-3 h-3 text-green-500" />}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{a.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                        <span>{fmt(a.timestamp)}</span>
                        {a.source && (<><span>•</span><span>{a.source}</span></>)}
                        {a.category && (<><span>•</span><span className="capitalize">{a.category}</span></>)}
                      </div>
                    </div>
                  </div>
                  {!isAck && (
                    <button
                      onClick={(e) => ack(a.id, e)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      title="Acknowledge alert"
                    >
                      <CheckCircle className="w-4 h-4 text-gray-500 hover:text-green-500" />
                    </button>
                  )}
                </div>

                {selectedId === a.id && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
                    Details available on next pass (logs/process drill-down).
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <span>{sortedAlerts.length} alert{sortedAlerts.length !== 1 ? 's' : ''} shown</span>
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}
