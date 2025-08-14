import React, { useState, useEffect } from 'react';
import { useServerStore } from '../../store/useServerStore';
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle, X, Eye, EyeOff, Filter } from 'lucide-react';

const AlertCenterWidget = () => {
  const { 
    systemEvents, 
    serverOverview, 
    acknowledgeEvent,
    addToast 
  } = useDashboardStore();
  
  const [filter, setFilter] = useState('all');
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);

  // Generate additional alerts from server states
  const generateSystemAlerts = () => {
    const alerts = [...(systemEvents || [])];
    const now = Date.now();
    
    // Check for server-specific alerts
    serverOverview?.forEach(server => {
      // High CPU alert
      if (server.metrics?.cpuUsage > 80) {
        const existingAlert = alerts.find(a => 
          a.source === server.id && a.eventType === 'high_cpu'
        );
        
        if (!existingAlert) {
          alerts.push({
            id: `cpu-${server.id}-${now}`,
            eventType: 'high_cpu',
            title: 'High CPU Usage',
            description: `${server.name} CPU usage at ${Math.round(server.metrics.cpuUsage)}%`,
            severity: server.metrics.cpuUsage > 90 ? 'critical' : 'warning',
            timestamp: now,
            source: server.id,
            acknowledged: false,
            category: 'performance',
            affectedServices: [server.name]
          });
        }
      }
      
      // Memory pressure alert
      if (server.metrics?.memoryUsage > 85) {
        const existingAlert = alerts.find(a => 
          a.source === server.id && a.eventType === 'memory_pressure'
        );
        
        if (!existingAlert) {
          alerts.push({
            id: `mem-${server.id}-${now}`,
            eventType: 'memory_pressure',
            title: 'Memory Pressure',
            description: `${server.name} memory usage at ${Math.round(server.metrics.memoryUsage)}%`,
            severity: server.metrics.memoryUsage > 95 ? 'critical' : 'warning',
            timestamp: now,
            source: server.id,
            acknowledged: false,
            category: 'performance',
            affectedServices: [server.name]
          });
        }
      }
      
      // Server offline alert
      if (server.status === 'offline') {
        const existingAlert = alerts.find(a => 
          a.source === server.id && a.eventType === 'server_offline'
        );
        
        if (!existingAlert) {
          alerts.push({
            id: `offline-${server.id}-${now}`,
            eventType: 'server_offline',
            title: 'Server Offline',
            description: `${server.name} is not responding`,
            severity: 'critical',
            timestamp: now,
            source: server.id,
            acknowledged: false,
            category: 'infrastructure',
            affectedServices: [server.name]
          });
        }
      }
    });
    
    return alerts;
  };

  const allAlerts = generateSystemAlerts();

  // Filter alerts
  const filteredAlerts = allAlerts.filter(alert => {
    if (!showAcknowledged && alert.acknowledged) return false;
    if (filter === 'all') return true;
    return alert.severity === filter;
  });

  // Sort by timestamp (newest first)
  const sortedAlerts = filteredAlerts.sort((a, b) => b.timestamp - a.timestamp);

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'border-l-red-500 bg-red-500/5';
      case 'high': return 'border-l-orange-500 bg-orange-500/5';
      case 'warning': return 'border-l-yellow-500 bg-yellow-500/5';
      case 'info': return 'border-l-blue-500 bg-blue-500/5';
      default: return 'border-l-gray-500 bg-gray-500/5';
    }
  };

  const handleAcknowledgeAlert = (alertId, e) => {
    e.stopPropagation();
    acknowledgeEvent(alertId);
    addToast({
      type: 'success',
      title: 'Alert Acknowledged',
      message: 'Alert has been acknowledged and marked as handled'
    });
  };

  const getAlertCounts = () => {
    const counts = {
      total: allAlerts.filter(a => !a.acknowledged).length,
      critical: allAlerts.filter(a => a.severity === 'critical' && !a.acknowledged).length,
      warning: allAlerts.filter(a => (a.severity === 'warning' || a.severity === 'high') && !a.acknowledged).length,
      info: allAlerts.filter(a => a.severity === 'info' && !a.acknowledged).length
    };
    return counts;
  };

  const alertCounts = getAlertCounts();

  const formatTimestamp = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-red-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Alert Center</h3>
          {alertCounts.total > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {alertCounts.total}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAcknowledged(!showAcknowledged)}
            className={`p-1 rounded ${showAcknowledged ? 'text-blue-500' : 'text-gray-500'}`}
            title={showAcknowledged ? 'Hide acknowledged' : 'Show acknowledged'}
          >
            {showAcknowledged ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Alert Counts Summary */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-sm">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Critical:</span>
            <span className="font-medium text-gray-900 dark:text-white">{alertCounts.critical}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Warning:</span>
            <span className="font-medium text-gray-900 dark:text-white">{alertCounts.warning}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Info:</span>
            <span className="font-medium text-gray-900 dark:text-white">{alertCounts.info}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
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

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto">
        {sortedAlerts.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">
                {filter === 'all' ? 'No alerts at this time' : `No ${filter} alerts`}
              </p>
              <p className="text-xs mt-1">All systems running normally</p>
            </div>
          </div>
        ) : (
          <div className="p-2">
            {sortedAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => setSelectedAlert(selectedAlert === alert.id ? null : alert.id)}
                className={`
                  mb-2 p-3 rounded-lg border-l-4 cursor-pointer transition-all duration-200
                  ${getSeverityColor(alert.severity)}
                  ${alert.acknowledged ? 'opacity-60' : ''}
                  ${selectedAlert === alert.id ? 'ring-2 ring-blue-500' : ''}
                  hover:bg-gray-50 dark:hover:bg-gray-700/50
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium text-sm ${alert.acknowledged ? 'line-through' : ''} text-gray-900 dark:text-white`}>
                          {alert.title}
                        </h4>
                        {alert.acknowledged && (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {alert.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                        <span>{formatTimestamp(alert.timestamp)}</span>
                        {alert.source && (
                          <>
                            <span>•</span>
                            <span>{alert.source}</span>
                          </>
                        )}
                        {alert.category && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{alert.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <button
                      onClick={(e) => handleAcknowledgeAlert(alert.id, e)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      title="Acknowledge alert"
                    >
                      <CheckCircle className="w-4 h-4 text-gray-500 hover:text-green-500" />
                    </button>
                  )}
                </div>

                {/* Expanded Details */}
                {selectedAlert === alert.id && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    {alert.affectedServices && alert.affectedServices.length > 0 && (
                      <div className="mb-2">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Affected Services:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {alert.affectedServices.map((service, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {alert.acknowledgedBy && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Acknowledged by {alert.acknowledgedBy} at{' '}
                        {new Date(alert.acknowledgedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <span>
            {sortedAlerts.length} alert{sortedAlerts.length !== 1 ? 's' : ''} shown
          </span>
          <span>
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AlertCenterWidget;