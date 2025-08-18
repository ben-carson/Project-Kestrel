//networktopology/sidebar/panels/NetworkOverviewPanel.jsx
import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, ShieldCheck, ShieldAlert, ShieldOff } from 'lucide-react';

/**
 * A progress bar component for displaying metrics.
 * @param {{ value: number; color: string; label: string; }} props
 */
const MetricBar = ({ value, color, label }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value}%</span>
    </div>
    <div className="w-full bg-slate-700/50 rounded-full h-2">
      <div className={`${color.replace('text-', 'bg-')} h-2 rounded-full transition-all duration-500`} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

/**
 * An individual datacenter status component.
 * @param {{ dc: { name: string; status: 'online' | 'warning' | 'critical' | 'offline'; nodeCount: number; metrics: { cpu: number; mem: number; }; }; isExpanded: boolean; onToggle: () => void; }} props
 */
const DatacenterItem = ({ dc, isExpanded, onToggle }) => {
  const statusMap = {
    online: { icon: <ShieldCheck className="text-green-400" />, text: 'text-green-400', ring: 'ring-green-500/30' },
    warning: { icon: <ShieldAlert className="text-yellow-400" />, text: 'text-yellow-400', ring: 'ring-yellow-500/30' },
    critical: { icon: <ShieldOff className="text-red-400" />, text: 'text-red-400', ring: 'ring-red-500/30' },
    offline: { icon: <ShieldOff className="text-slate-500" />, text: 'text-slate-500', ring: 'ring-slate-500/30' },
  };

  return (
    <div className="bg-slate-800/50 rounded-lg ring-1 ring-slate-700/50">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-3 text-left">
        <div className="flex items-center space-x-3">
          <div className={`p-1.5 rounded-full bg-slate-900/50 ring-1 ${statusMap[dc.status].ring}`}>
            {statusMap[dc.status].icon}
          </div>
          <div>
            <p className="font-semibold text-white">{dc.name}</p>
            <p className="text-xs text-slate-400">{dc.nodeCount} Nodes</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-bold ${statusMap[dc.status].text}`}>{dc.status.charAt(0).toUpperCase() + dc.status.slice(1)}</span>
          {isExpanded ? <ChevronDown size={20} className="text-slate-500" /> : <ChevronRight size={20} className="text-slate-500" />}
        </div>
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-700/50">
          <div className="space-y-3">
            <MetricBar value={dc.metrics.cpu} color="text-sky-400" label="Avg. CPU Usage" />
            <MetricBar value={dc.metrics.mem} color="text-purple-400" label="Avg. Memory Usage" />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * A panel displaying an overview of the network status.
 * @param {{ isLoading: boolean; nodes: any[]; }} props
 */
export default function NetworkOverviewPanel({ isLoading, nodes }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDC, setExpandedDC] = useState(null);

  const overview = useMemo(() => {
    if (!nodes || nodes.length === 0) {
      return { total: 0, online: 0, warning: 0, critical: 0, offline: 0, datacenters: [] };
    }
    const statusCounts = nodes.reduce((acc, node) => {
      acc[node.status] = (acc[node.status] || 0) + 1;
      return acc;
    }, { online: 0, warning: 0, critical: 0, offline: 0 });

    const dcData = nodes.reduce((acc, node) => {
      if (!acc[node.datacenter]) {
        acc[node.datacenter] = { name: node.datacenter, nodes: [] };
      }
      acc[node.datacenter].nodes.push(node);
      return acc;
    }, {});

    const datacenters = Object.values(dcData).map(dc => {
      const dcNodes = dc.nodes;
      const dcStatusCounts = dcNodes.reduce((acc, node) => {
        acc[node.status] = (acc[node.status] || 0) + 1;
        return acc;
      }, { critical: 0, warning: 0, offline: 0 });

      let status = 'online';
      if (dcStatusCounts.critical > 0 || dcStatusCounts.offline > dcNodes.length / 2) status = 'critical';
      else if (dcStatusCounts.warning > 0) status = 'warning';
      else if (dcStatusCounts.offline > 0) status = 'offline';

      const avgCpu = dcNodes.reduce((sum, n) => sum + n.metrics.cpuUsage, 0) / dcNodes.length;
      const avgMem = dcNodes.reduce((sum, n) => sum + n.metrics.memoryUsage, 0) / dcNodes.length;

      return {
        name: dc.name,
        status,
        nodeCount: dcNodes.length,
        metrics: { cpu: Math.round(avgCpu), mem: Math.round(avgMem) }
      };
    });

    return { total: nodes.length, ...statusCounts, datacenters };
  }, [nodes]);

  const filteredDatacenters = useMemo(() => {
    return overview.datacenters.filter(dc =>
      dc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [overview.datacenters, searchTerm]);

  const handleToggle = (name) => {
    setExpandedDC(expandedDC === name ? null : name);
  };

  if (isLoading) {
    return (
      <div className="w-full h-full bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 flex items-center justify-center">
        <div className="text-slate-400">Loading Network Overview...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg shadow-2xl text-slate-300">
      <div className="flex-shrink-0 p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">Network Overview</h2>
        <p className="text-sm text-slate-400">Real-time system health and status.</p>
      </div>

      <div className="flex-shrink-0 p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-800/50 p-2 rounded-lg">
            <p className="text-2xl font-bold text-white">{overview.total}</p>
            <p className="text-xs text-slate-400">Total Nodes</p>
          </div>
          <div className="bg-slate-800/50 p-2 rounded-lg">
            <p className="text-2xl font-bold text-green-400">{overview.online}</p>
            <p className="text-xs text-slate-400">Online</p>
          </div>
          <div className="bg-slate-800/50 p-2 rounded-lg">
            <p className="text-2xl font-bold text-yellow-400">{overview.warning}</p>
            <p className="text-xs text-slate-400">Warning</p>
          </div>
          <div className="bg-slate-800/50 p-2 rounded-lg">
            <p className="text-2xl font-bold text-red-400">{overview.critical + overview.offline}</p>
            <p className="text-xs text-slate-400">Critical/Offline</p>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 px-4 pb-4 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Filter datacenters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/60 border border-slate-700 rounded-md pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-grow p-4 overflow-y-auto space-y-3">
        {filteredDatacenters.length > 0 ? (
          filteredDatacenters.map(dc => (
            <DatacenterItem
              key={dc.name}
              dc={dc}
              isExpanded={expandedDC === dc.name}
              onToggle={() => handleToggle(dc.name)}
            />
          ))
        ) : (
          <div className="text-center text-slate-500 py-8">No datacenters found.</div>
        )}
      </div>
    </div>
  );
};
