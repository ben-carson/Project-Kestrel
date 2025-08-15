// src/components/infrastructure/AssetCard.jsx
import React from 'react';
import { Database, Globe, Zap, Network, Server } from 'lucide-react';
import StatusBadge from '../feedback/StatusBadge';

export default function AssetCard({ 
  asset, 
  isSelected, 
  onToggleSelect, 
  isPlanning, 
  isImpacted, 
  isSimulationRunning 
}) {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'db': return <Database className="w-4 h-4" />;
      case 'web': case 'api': return <Globe className="w-4 h-4" />;
      case 'cache': case 'queue': return <Zap className="w-4 h-4" />;
      case 'lb': return <Network className="w-4 h-4" />;
      default: return <Server className="w-4 h-4" />;
    }
  };

  const cpu = asset.metrics?.cpuUsage || 0;
  const memory = asset.metrics?.memoryUsage || 0;

  // Determine visual state during simulation
  let cardClass = 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600';
  if (isSelected) {
    cardClass = 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg ring-2 ring-blue-500';
  } else if (isImpacted) {
    cardClass = 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 shadow-lg ring-2 ring-orange-500';
  } else if (isSimulationRunning) {
    cardClass = 'opacity-30';
  }

  return (
    <div 
      className={`border rounded-lg p-3 hover:shadow-md transition-all cursor-pointer relative group ${cardClass}`}
      onClick={() => onToggleSelect?.(asset.id)}
    >
      {/* Selection checkbox - appears on hover or when selected */}
      {(isPlanning || isSelected) && !isSimulationRunning && (
        <div className={`absolute top-2 right-2 ${isPlanning ? 'group-hover:opacity-100' : ''} ${isSelected ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
            isSelected 
              ? 'bg-blue-500 border-blue-500' 
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
          }`}>
            {isSelected && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="text-gray-600 dark:text-gray-400">
            {getTypeIcon(asset.type)}
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white text-sm">{asset.name}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">{asset.ip} • {asset.group}</p>
          </div>
        </div>
        <StatusBadge status={asset.status} size="sm" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">CPU</span>
          <span className="font-medium">{Math.round(cpu)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full ${
              cpu > 85 ? 'bg-red-500' : cpu > 70 ? 'bg-yellow-500' : 'bg-green-500'
            }`} 
            style={{ width: `${Math.min(cpu, 100)}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">Memory</span>
          <span className="font-medium">{Math.round(memory)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full ${
              memory > 85 ? 'bg-red-500' : memory > 70 ? 'bg-yellow-500' : 'bg-blue-500'
            }`} 
            style={{ width: `${Math.min(memory, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
        <span>Uptime: {asset.uptime}</span>
        <span className="capitalize">{asset.type}</span>
      </div>
    </div>
  );
}