
// src/components/widgets/NetworkTopology/Overlays/FloatingMetrics.jsx

import React from 'react';
import { Activity, Zap, AlertTriangle, CheckCircle2, TrendingUp, Server } from 'lucide-react';

const FloatingMetrics = ({ 
  liveServers = [], 
  activeIncidents = [], 
  autoHealingEvents = [] 
}) => {
  const metrics = {
    online: liveServers.filter(s => s.status === 'online' || s.status === 'healthy').length,
    warning: liveServers.filter(s => s.status === 'warning').length,
    critical: liveServers.filter(s => s.status === 'critical').length,
    offline: liveServers.filter(s => s.status === 'offline').length,
    total: liveServers.length
  };

  const recentHealingEvents = autoHealingEvents.slice(0, 3);

  return (
    <div className="absolute top-4 left-4 space-y-3">
      {/* Live Metrics Card */}
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-lg min-w-[200px]">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Live Metrics
          </h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <MetricItem
            label="Online"
            value={metrics.online}
            color="green"
            icon={<CheckCircle2 className="w-3 h-3" />}
          />
          <MetricItem
            label="Warning"
            value={metrics.warning}
            color="yellow"
            icon={<AlertTriangle className="w-3 h-3" />}
          />
          <MetricItem
            label="Critical"
            value={metrics.critical}
            color="red"
            icon={<AlertTriangle className="w-3 h-3" />}
          />
          <MetricItem
            label="Incidents"
            value={activeIncidents.length}
            color="orange"
            icon={<Zap className="w-3 h-3" />}
          />
        </div>

        {/* System Health Bar */}
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>System Health</span>
            <span>{Math.round((metrics.online / metrics.total) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(metrics.online / metrics.total) * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Auto-Healing Events Card */}
      {recentHealingEvents.length > 0 && (
        <div className="bg-green-50/95 dark:bg-green-900/20 backdrop-blur-sm rounded-lg p-4 border border-green-200 dark:border-green-700 shadow-lg min-w-[200px]">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-sm font-semibold text-green-800 dark:text-green-300">
              Auto-Healing Active
            </h3>
          </div>
          
          <div className="space-y-2">
            {recentHealingEvents.map((event, i) => (
              <div key={i} className="text-xs">
                <div className="font-medium text-green-700 dark:text-green-400 truncate">
                  {event.serverName}
                </div>
                <div className="text-green-600 dark:text-green-500">
                  Healed at {new Date(event.healedAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Snapshot */}
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-lg min-w-[200px]">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Performance
          </h3>
        </div>
        
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Avg CPU:</span>
            <span className="font-medium">
              {Math.round(liveServers.reduce((sum, s) => sum + (s.metrics?.cpuUsage || 0), 0) / liveServers.length || 0)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Avg Memory:</span>
            <span className="font-medium">
              {Math.round(liveServers.reduce((sum, s) => sum + (s.metrics?.memoryUsage || 0), 0) / liveServers.length || 0)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Avg Latency:</span>
            <span className="font-medium">
              {Math.round(liveServers.reduce((sum, s) => sum + (s.metrics?.networkLatency || 0), 0) / liveServers.length || 0)}ms
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricItem = ({ label, value, color, icon }) => {
  const colorClasses = {
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    red: 'text-red-600 dark:text-red-400',
    orange: 'text-orange-600 dark:text-orange-400',
    blue: 'text-blue-600 dark:text-blue-400'
  };

  return (
    <div className="flex items-center gap-2">
      <span className={colorClasses[color]}>{icon}</span>
      <div>
        <div className={`font-bold ${colorClasses[color]}`}>{value}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      </div>
    </div>
  );
};

export default FloatingMetrics;