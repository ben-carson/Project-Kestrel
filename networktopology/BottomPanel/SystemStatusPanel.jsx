// src/components/widgets/NetworkTopology/BottomPanel/SystemStatusPanel.jsx

import React from 'react';
import { Activity, AlertTriangle, Settings, TrendingUp, Zap } from 'lucide-react';
import StatusIndicator from '../../../shared/StatusIndicator';

const SystemStatusPanel = ({
  applicationHealth = new Map(),
  activeIncidents = [],
  autoHealing = true,
  filterTier = 'all',
  onAutoHealingToggle,
  onFilterChange,
  onInjectIncident,
  onForceEvolution
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Application Health Section */}
        <ApplicationHealthSection applicationHealth={applicationHealth} />
        
        {/* Active Incidents Section */}
        <ActiveIncidentsSection activeIncidents={activeIncidents} />
        
        {/* System Controls Section */}
        <SystemControlsSection
          autoHealing={autoHealing}
          filterTier={filterTier}
          onAutoHealingToggle={onAutoHealingToggle}
          onFilterChange={onFilterChange}
          onInjectIncident={onInjectIncident}
          onForceEvolution={onForceEvolution}
        />
      </div>
    </div>
  );
};

const ApplicationHealthSection = ({ applicationHealth }) => {
  const apps = Array.from(applicationHealth.entries());
  
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
        <Activity className="w-4 h-4" />
        Application Health
      </h4>
      
      {apps.length > 0 ? (
        <div className="space-y-2">
          {apps.map(([name, health]) => (
            <ApplicationHealthCard key={name} name={name} health={health} />
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
          No application health data available
        </div>
      )}
    </div>
  );
};

const ApplicationHealthCard = ({ name, health }) => {
  const displayName = name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const healthPercentage = Math.round(health.health || 0);
  const status = health.status || 'unknown';
  
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {displayName}
      </span>
      <div className="flex items-center gap-2">
        <StatusIndicator status={status === 'healthy' ? 'online' : status} size="sm" />
        <span className="text-sm font-medium min-w-[3rem] text-right">
          {healthPercentage}%
        </span>
      </div>
    </div>
  );
};

const ActiveIncidentsSection = ({ activeIncidents }) => {
  const sortedIncidents = activeIncidents
    .sort((a, b) => {
      // Sort by severity (critical first) then by start time (newest first)
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      const severityDiff = (severityOrder[a.severity] || 2) - (severityOrder[b.severity] || 2);
      if (severityDiff !== 0) return severityDiff;
      return (b.startTime || 0) - (a.startTime || 0);
    })
    .slice(0, 3); // Show only top 3
  
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        Active Incidents ({activeIncidents.length})
      </h4>
      
      {sortedIncidents.length > 0 ? (
        <div className="space-y-2 max-h-24 overflow-y-auto">
          {sortedIncidents.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} />
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
          No active incidents
        </div>
      )}
    </div>
  );
};

const IncidentCard = ({ incident }) => {
  const timeAgo = incident.startTime 
    ? Math.round((Date.now() - incident.startTime) / 60000)
    : 0;
  
  return (
    <div className="text-xs">
      <div className="flex items-center gap-2">
        <StatusIndicator 
          status={incident.severity === 'critical' ? 'critical' : 'warning'} 
          size="xs"
          animated={incident.severity === 'critical'}
        />
        <span className="font-medium text-gray-700 dark:text-gray-300 truncate flex-1">
          {incident.serverName || incident.nodeName || 'Unknown Node'}
        </span>
      </div>
      <div className="text-gray-500 dark:text-gray-400 ml-4 truncate">
        {(incident.type || 'Unknown').replace(/_/g, ' ')} • {timeAgo}m ago
      </div>
    </div>
  );
};

const SystemControlsSection = ({
  autoHealing,
  filterTier,
  onAutoHealingToggle,
  onFilterChange,
  onInjectIncident,
  onForceEvolution
}) => {
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
        <Settings className="w-4 h-4" />
        System Controls
      </h4>
      
      <div className="space-y-3">
        {/* Auto-Healing Toggle */}
        <ControlRow label="Auto-Healing">
          <ToggleSwitch 
            enabled={autoHealing} 
            onChange={onAutoHealingToggle}
            color="green"
          />
        </ControlRow>
        
        {/* Tier Filter */}
        <ControlRow label="Tier Filter">
          <select 
            value={filterTier} 
            onChange={(e) => onFilterChange?.(e.target.value)}
            className="text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 min-w-[6rem]"
          >
            <option value="all">All Tiers</option>
            <option value="dmz">DMZ</option>
            <option value="web-tier">Web Tier</option>
            <option value="app-tier">App Tier</option>
            <option value="data-tier">Data Tier</option>
            <option value="cloud-hybrid">Cloud</option>
            <option value="monitoring">Monitoring</option>
          </select>
        </ControlRow>
        
        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <ActionButton
            onClick={onInjectIncident}
            icon={<Zap className="w-3 h-3" />}
            label="Inject Incident"
            variant="danger"
          />
          <ActionButton
            onClick={onForceEvolution}
            icon={<TrendingUp className="w-3 h-3" />}
            label="Force Evolution"
            variant="primary"
          />
        </div>
      </div>
    </div>
  );
};

const ControlRow = ({ label, children }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
    {children}
  </div>
);

const ToggleSwitch = ({ enabled, onChange, color = 'blue' }) => {
  const bgColor = enabled 
    ? `bg-${color}-500` 
    : 'bg-gray-300 dark:bg-gray-600';
  
  const translateClass = enabled 
    ? 'translate-x-4' 
    : 'translate-x-0.5';
  
  return (
    <button
      onClick={onChange}
      className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${bgColor}`}
      type="button"
    >
      <div 
        className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${translateClass}`}
      />
    </button>
  );
};

const ActionButton = ({ onClick, icon, label, variant = 'primary' }) => {
  const variantClasses = {
    primary: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/50',
    danger: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/50',
    success: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/50'
  };
  
  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1 text-xs border rounded px-2 py-1 transition-colors ${variantClasses[variant]}`}
      type="button"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

export default SystemStatusPanel;