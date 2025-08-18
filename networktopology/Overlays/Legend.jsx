// src/components/widgets/NetworkTopology/Overlays/Legend.jsx

import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

const Legend = ({ className = "absolute bottom-4 left-4" }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const legendItems = [
    {
      category: "Node Status",
      items: [
        { type: 'status', color: 'bg-green-500', shape: 'rounded-full', label: 'Healthy/Online' },
        { type: 'status', color: 'bg-yellow-500', shape: 'rounded-full', label: 'Warning' },
        { type: 'status', color: 'bg-red-500', shape: 'rounded-full', label: 'Critical' },
        { type: 'status', color: 'bg-gray-500', shape: 'rounded-full', label: 'Offline' },
        { type: 'status', color: 'bg-purple-500', shape: 'rounded-full', label: 'Maintenance' }
      ]
    },
    {
      category: "Network Elements",
      items: [
        { type: 'connection', color: 'bg-blue-500', shape: '', label: 'Network Connection', width: 'w-6 h-1' },
        { type: 'connection', color: 'bg-purple-500', shape: '', label: 'Replication Link', width: 'w-6 h-1', pattern: 'dashed' },
        { type: 'connection', color: 'bg-red-500', shape: '', label: 'Security Boundary', width: 'w-6 h-1' }
      ]
    },
    {
      category: "AI Features",
      items: [
        { type: 'special', color: 'bg-blue-100 border-2 border-blue-500', shape: 'rounded-full', label: 'AI Prediction Active' },
        { type: 'special', color: 'bg-green-100 border-2 border-green-500', shape: 'rounded-full', label: 'Auto-Healed Node' },
        { type: 'special', color: 'bg-purple-100 border-2 border-purple-500', shape: 'rounded-full', label: 'ML Anomaly Detected' }
      ]
    },
    {
      category: "Node Types",
      items: [
        { type: 'icon', icon: '🔥', label: 'Firewall' },
        { type: 'icon', icon: '🌐', label: 'Web Server' },
        { type: 'icon', icon: '💾', label: 'Database' },
        { type: 'icon', icon: '⚡', label: 'Cache/API' },
        { type: 'icon', icon: '⚖️', label: 'Load Balancer' },
        { type: 'icon', icon: '📦', label: 'Container Host' }
      ]
    }
  ];

  const compactItems = [
    { type: 'status', color: 'bg-green-500', shape: 'rounded-full', label: 'Healthy' },
    { type: 'status', color: 'bg-yellow-500', shape: 'rounded-full', label: 'Warning' },
    { type: 'status', color: 'bg-red-500', shape: 'rounded-full', label: 'Critical' },
    { type: 'connection', color: 'bg-blue-500', shape: '', label: 'Connection', width: 'w-4 h-1' }
  ];

  return (
    <div className={className}>
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Legend</h3>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            {isExpanded ? 
              <ChevronDown className="w-4 h-4 text-gray-500" /> : 
              <ChevronUp className="w-4 h-4 text-gray-500" />
            }
          </button>
        </div>

        {/* Content */}
        <div className="px-3 pb-3">
          {isExpanded ? (
            <div className="space-y-4">
              {legendItems.map((category, categoryIndex) => (
                <LegendCategory key={categoryIndex} category={category} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {compactItems.map((item, index) => (
                <LegendItem key={index} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer tip */}
        {isExpanded && (
          <div className="px-3 pb-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💡 Node colors change dynamically based on health and AI predictions
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const LegendCategory = ({ category }) => (
  <div>
    <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
      {category.category}
    </h4>
    <div className="grid grid-cols-1 gap-1">
      {category.items.map((item, index) => (
        <LegendItem key={index} item={item} />
      ))}
    </div>
  </div>
);

const LegendItem = ({ item }) => (
  <div className="flex items-center gap-2 text-xs">
    {item.type === 'icon' ? (
      <span className="text-sm">{item.icon}</span>
    ) : (
      <div className={`${item.width || 'w-3 h-3'} ${item.color} ${item.shape} ${item.pattern === 'dashed' ? 'border-dashed border-2' : ''}`} />
    )}
    <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
  </div>
);

export default Legend;