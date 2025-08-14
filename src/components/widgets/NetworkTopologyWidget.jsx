import React, { useState, useEffect, useRef } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { Globe, Server, Database, Wifi, Router, Cloud, Zap, AlertTriangle } from 'lucide-react';

const NetworkTopologyWidget = () => {
  const { serverOverview, applicationHealth } = useDashboardStore();
  const [selectedNode, setSelectedNode] = useState(null);
  const [viewMode, setViewMode] = useState('logical'); // logical, physical, services
  const svgRef = useRef(null);

  // Generate network topology based on servers and applications
  const generateTopology = () => {
    const nodes = [];
    const connections = [];

    // Create infrastructure nodes
    const infraNodes = {
      'load-balancer': {
        id: 'load-balancer',
        type: 'load-balancer',
        name: 'Load Balancer',
        x: 200,
        y: 50,
        status: 'online',
        icon: Router,
        connections: [],
        metrics: { traffic: 1500, latency: 5 }
      },
      'api-gateway': {
        id: 'api-gateway',
        type: 'gateway',
        name: 'API Gateway',
        x: 200,
        y: 120,
        status: 'online',
        icon: Globe,
        connections: [],
        metrics: { requests: 2400, latency: 12 }
      },
      'database-cluster': {
        id: 'database-cluster',
        type: 'database',
        name: 'Database Cluster',
        x: 350,
        y: 200,
        status: 'online',
        icon: Database,
        connections: [],
        metrics: { queries: 800, connections: 45 }
      },
      'cache-layer': {
        id: 'cache-layer',
        type: 'cache',
        name: 'Cache Layer',
        x: 50,
        y: 200,
        status: 'online',
        icon: Zap,
        connections: [],
        metrics: { hitRate: 85, memory: 60 }
      }
    };

    // Add infrastructure nodes
    Object.values(infraNodes).forEach(node => nodes.push(node));

    // Add server nodes from dashboard store
    if (serverOverview && serverOverview.length > 0) {
      serverOverview.forEach((server, index) => {
        const angle = (index / serverOverview.length) * 2 * Math.PI;
        const radius = 120;
        const centerX = 200;
        const centerY = 160;
        
        nodes.push({
          id: server.id,
          type: 'server',
          name: server.name,
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          status: server.status,
          icon: Server,
          connections: [],
          metrics: server.metrics || {},
          serverType: server.type || 'web'
        });
      });
    }

    // Add application service nodes
    if (applicationHealth && applicationHealth.size > 0) {
      let serviceIndex = 0;
      applicationHealth.forEach((health, serviceName) => {
        const angle = (serviceIndex / applicationHealth.size) * 2 * Math.PI;
        const radius = 80;
        const centerX = 200;
        const centerY = 160;
        
        nodes.push({
          id: `service-${serviceName}`,
          type: 'service',
          name: serviceName,
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          status: health.status || 'unknown',
          icon: Cloud,
          connections: [],
          metrics: { health: health.health || 0 },
          nodeDetails: health.nodeDetails || {}
        });
        
        serviceIndex++;
      });
    }

    // Create connections based on typical network topology
    const createConnection = (from, to, type = 'network', status = 'active', bandwidth = 100) => {
      connections.push({
        id: `${from}-${to}`,
        from,
        to,
        type,
        status,
        bandwidth,
        latency: Math.random() * 20 + 5 // Random latency 5-25ms
      });
    };

    // Connect load balancer to API gateway
    createConnection('load-balancer', 'api-gateway', 'http', 'active', 1000);

    // Connect API gateway to servers
    nodes.filter(n => n.type === 'server').forEach(server => {
      createConnection('api-gateway', server.id, 'http', server.status === 'online' ? 'active' : 'inactive', 100);
    });

    // Connect servers to database cluster
    nodes.filter(n => n.type === 'server' && (n.serverType === 'api' || n.serverType === 'db')).forEach(server => {
      createConnection(server.id, 'database-cluster', 'tcp', 'active', 200);
    });

    // Connect cache layer to API gateway
    createConnection('cache-layer', 'api-gateway', 'redis', 'active', 500);

    // Connect services to servers
    nodes.filter(n => n.type === 'service').forEach(service => {
      const relatedServers = nodes.filter(n => n.type === 'server').slice(0, 2);
      relatedServers.forEach(server => {
        createConnection(service.id, server.id, 'service', 'active', 50);
      });
    });

    return { nodes, connections };
  };

  const topology = generateTopology();

  const getNodeColor = (node) => {
    if (node.status === 'critical' || node.status === 'offline') return '#ef4444';
    if (node.status === 'warning') return '#f59e0b';
    if (node.status === 'maintenance') return '#6b7280';
    return '#10b981';
  };

  const getNodeIcon = (node) => {
    const IconComponent = node.icon;
    return <IconComponent className="w-4 h-4" />;
  };

  const getConnectionColor = (connection) => {
    if (connection.status === 'inactive' || connection.status === 'error') return '#ef4444';
    if (connection.latency > 50) return '#f59e0b';
    return '#10b981';
  };

  const getConnectionStyle = (connection) => {
    const baseStyle = {
      stroke: getConnectionColor(connection),
      strokeWidth: Math.max(1, connection.bandwidth / 200),
      strokeDasharray: connection.type === 'service' ? '5,5' : 'none'
    };

    if (connection.status === 'inactive') {
      baseStyle.strokeDasharray = '10,5';
      baseStyle.opacity = 0.5;
    }

    return baseStyle;
  };

  const handleNodeClick = (node) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node);
  };

  const getNodeMetricsText = (node) => {
    switch (node.type) {
      case 'server':
        return `CPU: ${Math.round(node.metrics.cpuUsage || 0)}%`;
      case 'service':
        return `Health: ${Math.round(node.metrics.health || 0)}%`;
      case 'database':
        return `Queries: ${node.metrics.queries || 0}/s`;
      case 'load-balancer':
        return `Traffic: ${node.metrics.traffic || 0}/s`;
      default:
        return '';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Network Topology</h3>
        </div>
        <div className="flex gap-2">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="text-xs bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
          >
            <option value="logical">Logical View</option>
            <option value="physical">Physical View</option>
            <option value="services">Services View</option>
          </select>
        </div>
      </div>

      {/* Network Diagram */}
      <div className="flex-1 relative overflow-hidden">
        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox="0 0 400 320"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Connections */}
          <g className="connections">
            {topology.connections.map(connection => {
              const fromNode = topology.nodes.find(n => n.id === connection.from);
              const toNode = topology.nodes.find(n => n.id === connection.to);
              
              if (!fromNode || !toNode) return null;
              
              return (
                <g key={connection.id}>
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    style={getConnectionStyle(connection)}
                  />
                  {/* Connection label */}
                  <text
                    x={(fromNode.x + toNode.x) / 2}
                    y={(fromNode.y + toNode.y) / 2 - 5}
                    className="fill-gray-500 text-xs"
                    textAnchor="middle"
                  >
                    {Math.round(connection.latency)}ms
                  </text>
                </g>
              );
            })}
          </g>

          {/* Nodes */}
          <g className="nodes">
            {topology.nodes.map(node => (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => handleNodeClick(node)}
                className="cursor-pointer"
              >
                {/* Node circle */}
                <circle
                  r={node.type === 'server' ? 20 : 25}
                  fill={getNodeColor(node)}
                  stroke={selectedNode?.id === node.id ? '#3b82f6' : '#ffffff'}
                  strokeWidth={selectedNode?.id === node.id ? 3 : 2}
                  className="transition-all duration-200 hover:stroke-blue-400"
                />
                
                {/* Node icon */}
                <foreignObject
                  x={-8}
                  y={-8}
                  width={16}
                  height={16}
                  className="pointer-events-none"
                >
                  <div className="text-white flex items-center justify-center">
                    {getNodeIcon(node)}
                  </div>
                </foreignObject>
                
                {/* Node label */}
                <text
                  y={node.type === 'server' ? 35 : 40}
                  className="fill-gray-900 dark:fill-white text-xs font-medium"
                  textAnchor="middle"
                >
                  {node.name}
                </text>
                
                {/* Node metrics */}
                <text
                  y={node.type === 'server' ? 48 : 53}
                  className="fill-gray-500 text-xs"
                  textAnchor="middle"
                >
                  {getNodeMetricsText(node)}
                </text>
                
                {/* Status indicator */}
                {(node.status === 'critical' || node.status === 'warning') && (
                  <circle
                    cx={15}
                    cy={-15}
                    r={6}
                    fill={node.status === 'critical' ? '#ef4444' : '#f59e0b'}
                    className="animate-pulse"
                  />
                )}
              </g>
            ))}
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Online</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Warning</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Critical</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-1 bg-green-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Active Connection</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-1 bg-gray-400" style={{ background: 'repeating-linear-gradient(90deg, #9ca3af 0, #9ca3af 2px, transparent 2px, transparent 5px)' }}></div>
            <span className="text-gray-600 dark:text-gray-400">Service Link</span>
          </div>
        </div>
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                {getNodeIcon(selectedNode)}
                {selectedNode.name}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {selectedNode.type} • Status: {selectedNode.status}
              </p>
              
              {/* Node-specific details */}
              {selectedNode.type === 'server' && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>CPU: {Math.round(selectedNode.metrics.cpuUsage || 0)}%</div>
                  <div>Memory: {Math.round(selectedNode.metrics.memoryUsage || 0)}%</div>
                  <div>Network: {Math.round(selectedNode.metrics.networkLatency || 0)}ms</div>
                  <div>Storage: {Math.round(selectedNode.metrics.storageIO || 0)} IOPS</div>
                </div>
              )}
              
              {selectedNode.type === 'service' && selectedNode.nodeDetails && (
                <div className="mt-2 text-xs">
                  <div>Health Score: {Math.round(selectedNode.metrics.health || 0)}%</div>
                  <div>
                    Nodes: {selectedNode.nodeDetails.healthy || 0} healthy, 
                    {selectedNode.nodeDetails.warning || 0} warning, 
                    {selectedNode.nodeDetails.critical || 0} critical
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkTopologyWidget;