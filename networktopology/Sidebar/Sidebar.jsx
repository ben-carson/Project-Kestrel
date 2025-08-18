//src/components/widgets/NetworkTopology/Sidebar/Sidebar.jsx
import React, { useState } from 'react';
import { Network, ChevronRight } from 'lucide-react';
import NodeDetailsPanel from './panels/NodeDetailsPanel';
import NetworkConfigPanel from './panels/NetworkConfigPanel';
import ConfigPanel from './panels/ConfigPanel';
import NetworkOverviewPanel from './panels/NetworkOverviewPanel';

const Sidebar = ({ selectedNode, systemHealth, onClose }) => {
  const [sidebarContent, setSidebarContent] = useState('node-details');

  const renderContent = () => {
    if (selectedNode) {
      switch (sidebarContent) {
        case 'node-details':
          return <NodeDetailsPanel node={selectedNode} />;
        case 'network-config':
          return <NetworkConfigPanel node={selectedNode} />;
        case 'running-config':
          return <ConfigPanel node={selectedNode} configType="running" />;
        case 'startup-config':
          return <ConfigPanel node={selectedNode} configType="startup" />;
        default:
          return <NodeDetailsPanel node={selectedNode} />;
      }
    } else {
      return <NetworkOverviewPanel systemHealth={systemHealth} />;
    }
  };

  return (
    <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {selectedNode ? 'Node Details' : 'Network Overview'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {selectedNode && (
            <select
              value={sidebarContent}
              onChange={(e) => setSidebarContent(e.target.value)}
              className="text-xs bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
            >
              <option value="node-details">Node Details</option>
              <option value="network-config">Network Config</option>
              <option value="running-config">Running Config</option>
              <option value="startup-config">Startup Config</option>
            </select>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default Sidebar;