// src/components/widgets/NetworkTopology/Canvas/NetworkCanvas.jsx

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { CanvasRenderer } from './CanvasRenderer.js';
import { useCanvasRenderer } from '../hooks/useCanvasRenderer.js';
import { CANVAS_CONFIG } from '../lib/constants.js';

const NetworkCanvas = ({
  liveServers = [],
  systemHealth = {},
  businessIntelligence = {},
  activeIncidents = [],
  zoom = 1,
  panX = 0,
  panY = 0,
  viewMode = 'intelligent',
  showTrafficFlow = true,
  showHeatMap = false,
  showPredictive = true,
  selectedNode = null,
  filterTier = 'all',
  onNodeSelect,
  canvasEventHandlers = {}
}) => {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Use the canvas renderer hook to get processed data
  const {
    nodes,
    connections,
    particles,
    isReady
  } = useCanvasRenderer({
    liveServers,
    systemHealth,
    businessIntelligence,
    activeIncidents,
    viewMode,
    showTrafficFlow,
    showHeatMap,
    showPredictive,
    filterTier
  });

  // Initialize canvas renderer
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new CanvasRenderer(canvasRef.current, {
        showLabels: true,
        showMetrics: true,
        showParticles: showTrafficFlow
      });
    }
  }, [showTrafficFlow]);

  // Handle canvas click events
  const handleCanvasClick = useCallback((event) => {
    if (!canvasRef.current || !nodes.length) return;

    // Handle pan mode vs select mode
    const mode = canvasEventHandlers.onMouseDown?.(event) || 'select';
    
    if (mode === 'select') {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = (event.clientX - rect.left - panX) / zoom;
      const mouseY = (event.clientY - rect.top - panY) / zoom;

      // Find clicked node
      const clickedNode = nodes.find(node => {
        const radius = node.radius || CANVAS_CONFIG.NODE_RADIUS;
        const distance = Math.sqrt((node.x - mouseX) ** 2 + (node.y - mouseY) ** 2);
        return distance <= radius;
      });

      if (onNodeSelect) {
        onNodeSelect(clickedNode);
      }
    }
  }, [nodes, onNodeSelect, panX, panY, zoom, canvasEventHandlers]);

  // Handle mouse move for hover effects
  const handleCanvasMouseMove = useCallback((event) => {
    if (!canvasRef.current || !nodes.length) return;

    // Handle pan dragging
    canvasEventHandlers.onMouseMove?.(event);

    // Calculate mouse position in canvas coordinates
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (event.clientX - rect.left - panX) / zoom;
    const mouseY = (event.clientY - rect.top - panY) / zoom;

    // Find hovered node
    const hoveredNode = nodes.find(node => {
      const radius = node.radius || CANVAS_CONFIG.NODE_RADIUS;
      const distance = Math.sqrt((node.x - mouseX) ** 2 + (node.y - mouseY) ** 2);
      return distance <= radius;
    });

    setHoveredNode(hoveredNode);

    // Update cursor
    if (canvasRef.current) {
      canvasRef.current.style.cursor = hoveredNode ? 'pointer' : 'default';
    }
  }, [nodes, panX, panY, zoom, canvasEventHandlers]);

  // Handle other mouse events
  const handleMouseUp = useCallback((event) => {
    canvasEventHandlers.onMouseUp?.(event);
  }, [canvasEventHandlers]);

  const handleWheel = useCallback((event) => {
    canvasEventHandlers.onWheel?.(event);
  }, [canvasEventHandlers]);

  const handleContextMenu = useCallback((event) => {
    canvasEventHandlers.onContextMenu?.(event);
  }, [canvasEventHandlers]);

  // Render the canvas
  useEffect(() => {
    if (!rendererRef.current || !isReady) return;

    const renderData = {
      nodes,
      connections,
      particles,
      zoom,
      panX,
      panY,
      selectedNode,
      hoveredNode,
      showTrafficFlow,
      showPredictive,
      businessIntelligence,
      activeIncidents
    };

    // Use requestAnimationFrame for smooth rendering
    const renderFrame = () => {
      rendererRef.current.render(renderData);
    };

    renderFrame();
  }, [
    nodes,
    connections, 
    particles,
    zoom,
    panX,
    panY,
    selectedNode,
    hoveredNode,
    showTrafficFlow,
    showPredictive,
    businessIntelligence,
    activeIncidents,
    isReady
  ]);

  // Animation loop for particles and effects
  useEffect(() => {
    if (!showTrafficFlow) return;

    let animationId;
    const animate = () => {
      if (rendererRef.current && isReady) {
        rendererRef.current.render({
          nodes,
          connections,
          particles,
          zoom,
          panX,
          panY,
          selectedNode,
          hoveredNode,
          showTrafficFlow,
          showPredictive,
          businessIntelligence,
          activeIncidents
        });
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [
    showTrafficFlow,
    nodes,
    connections,
    particles,
    zoom,
    panX,
    panY,
    selectedNode,
    hoveredNode,
    showPredictive,
    businessIntelligence,
    activeIncidents,
    isReady
  ]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-gray-50 dark:bg-gray-900">
      <canvas
        ref={canvasRef}
        width={CANVAS_CONFIG.WIDTH}
        height={CANVAS_CONFIG.HEIGHT}
        className="w-full h-full object-contain cursor-default"
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        style={{
          imageRendering: 'pixelated', // Crisp rendering at different zoom levels
          touchAction: 'none' // Prevent default touch behaviors
        }}
      />
      
      {/* Loading indicator */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 dark:bg-gray-900/80">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading network topology...</span>
          </div>
        </div>
      )}
      
      {/* Performance indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 text-xs text-gray-500 dark:text-gray-400 bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded">
          {nodes.length} nodes • {connections.length} connections • {particles.length} particles
        </div>
      )}
    </div>
  );
};

export default NetworkCanvas;