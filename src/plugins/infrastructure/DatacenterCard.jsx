// src/components/infrastructure/DatacenterCard.jsx
import React, { useState, useMemo } from 'react';
import { Eye, Building2, Cloud } from 'lucide-react';
import AssetCard  from './AssetCard';
import StatusBadge from '../feedback/StatusBadge';

export default function DatacenterCard({ 
  datacenter, 
  assets, 
  selectedAssets, 
  onAssetToggle, 
  isPlanning, 
  isSimulationRunning, 
  impactedAssets 
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const summary = useMemo(() => {
    const total = assets.length;
    const online = assets.filter(a => a.status === 'online').length;
    const issues = assets.filter(a => ['warning', 'critical', 'offline'].includes(a.status)).length;
    const avgCpu = assets.reduce((acc, a) => acc + (a.metrics?.cpuUsage || 0), 0) / total;
    
    return { total, online, issues, avgCpu: Math.round(avgCpu) };
  }, [assets]);

  const getProviderIcon = (provider) => {
    switch (provider?.toLowerCase()) {
      case 'aws': return <Cloud className="w-4 h-4 text-orange-500" />;
      case 'azure': return <Cloud className="w-4 h-4 text-blue-500" />;
      case 'gcp': return <Cloud className="w-4 h-4 text-green-500" />;
      default: return <Building2 className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow transition-opacity ${
      isSimulationRunning ? 'opacity-50' : 'opacity-100'
    }`}>
      <div 
        className="p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getProviderIcon(datacenter.provider)}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{datacenter.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {datacenter.region} • {datacenter.provider}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{summary.total} Assets</p>
              <p className="text-xs text-gray-500">{summary.online} online, {summary.issues} issues</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{summary.avgCpu}% CPU</p>
              <p className="text-xs text-gray-500">Average utilization</p>
            </div>
            <Eye className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className={`p-4 transition-all ${isSimulationRunning ? 'pointer-events-none' : ''}`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {assets.map(asset => (
              <AssetCard 
                key={asset.id} 
                asset={asset}
                isSelected={selectedAssets?.has(asset.id)}
                onToggleSelect={onAssetToggle}
                isPlanning={isPlanning}
                isImpacted={impactedAssets?.has(asset.id)}
                isSimulationRunning={isSimulationRunning}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}