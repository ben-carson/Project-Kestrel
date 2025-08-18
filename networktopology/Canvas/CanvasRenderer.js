// src/components/widgets/NetworkTopology/Canvas/CanvasRenderer.js

import { 
  CANVAS_CONFIG, 
  STATUS_COLORS,  // ✅ Correct export name
  NODE_ICONS, 
  CONNECTION_STYLES,
  PHYSICS_CONFIG 
} from '../lib/constants.js';

/**
 * Canvas rendering utilities for network topology visualization
 * Handles all drawing operations, transformations, and visual effects
 */
export class CanvasRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = {
      showLabels: true,
      showMetrics: true,
      showParticles: true,
      ...options
    };
    
    // Set canvas size
    this.canvas.width = CANVAS_CONFIG.WIDTH;
    this.canvas.height = CANVAS_CONFIG.HEIGHT;
  }

  /**
   * Clear canvas and apply transformations
   */
  clearCanvas(zoom = 1, panX = 0, panY = 0) {
    const { ctx } = this;
    
    // Clear and reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, CANVAS_CONFIG.WIDTH, CANVAS_CONFIG.HEIGHT);
    
    // Apply zoom and pan transform
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);
    
    return ctx;
  }

  /**
   * Draw background grid
   */
  drawBackground(zoom, panX, panY, businessHours = false) {
    const { ctx } = this;
    
    // Enhanced background gradient
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_CONFIG.WIDTH, CANVAS_CONFIG.HEIGHT);
    gradient.addColorStop(0, businessHours ? '#f0f9ff' : '#f8fafc');
    gradient.addColorStop(1, businessHours ? '#e0f2fe' : '#f1f5f9');
    ctx.fillStyle = gradient;
    ctx.fillRect(-panX/zoom, -panY/zoom, CANVAS_CONFIG.WIDTH/zoom, CANVAS_CONFIG.HEIGHT/zoom);

    // Draw grid with zoom-aware sizing
    const gridSize = Math.max(20, 40 / zoom);
    ctx.strokeStyle = businessHours ? '#e2e8f0' : '#f1f5f9';
    ctx.lineWidth = 1 / zoom;
    
    const startX = Math.floor((-panX / zoom) / gridSize) * gridSize;
    const endX = Math.ceil((CANVAS_CONFIG.WIDTH - panX) / zoom / gridSize) * gridSize;
    const startY = Math.floor((-panY / zoom) / gridSize) * gridSize;
    const endY = Math.ceil((CANVAS_CONFIG.HEIGHT - panY) / zoom / gridSize) * gridSize;
    
    // Vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  }

  /**
   * Draw network connections
   */
  drawConnections(connections, zoom, showMetrics = true) {
    const { ctx } = this;
    
    connections.forEach(conn => {
      const { fromNode, toNode, utilization = 0.5, type = 'default', latency = 0 } = conn;
      
      if (!fromNode || !toNode) return;
      
      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      
      // Get connection style
      const style = CONNECTION_STYLES[type] || CONNECTION_STYLES.http;
      
      ctx.strokeStyle = style.color;
      ctx.lineWidth = Math.max(1/zoom, utilization * 8/zoom);
      ctx.globalAlpha = 0.4 + (utilization * 0.5);
      
      // Apply dash pattern if specified
      if (style.pattern && style.pattern.length > 0) {
        ctx.setLineDash(style.pattern.map(p => p/zoom));
      } else {
        ctx.setLineDash([]);
      }
      
      // Add glow effect for high utilization
      if (utilization > 0.8) {
        ctx.shadowColor = style.color;
        ctx.shadowBlur = 6/zoom;
      }
      
      ctx.stroke();
      
      // Reset effects
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
      
      // Draw connection metrics at higher zoom levels
      if (showMetrics && zoom > 0.6) {
        this.drawConnectionMetrics(fromNode, toNode, utilization, latency, zoom);
      }
    });
  }

  /**
   * Draw connection metrics
   */
  drawConnectionMetrics(fromNode, toNode, utilization, latency, zoom) {
    const { ctx } = this;
    
    const midX = (fromNode.x + toNode.x) / 2;
    const midY = (fromNode.y + toNode.y) / 2;
    
    ctx.fillStyle = '#374151';
    ctx.font = `${Math.max(8, 10/zoom)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    
    // Utilization percentage
    ctx.fillText(`${Math.round(utilization * 100)}%`, midX, midY - 8/zoom);
    
    // Latency
    if (latency > 0) {
      ctx.fillText(`${latency.toFixed(0)}ms`, midX, midY + 8/zoom);
    }
  }

  /**
   * Draw traffic particles
   */
  drawTrafficParticles(particles, zoom) {
    const { ctx } = this;
    
    particles.forEach(particle => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size/zoom, 0, Math.PI * 2);
      
      // Handle pulsing particles
      if (particle.pulsing) {
        const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
        ctx.globalAlpha = particle.life * pulse;
      } else {
        ctx.globalAlpha = particle.life;
      }
      
      ctx.fillStyle = particle.color;
      ctx.fill();
      
      // Trail effect for high-priority traffic
      if (particle.type === 'security' || particle.type === 'database') {
        ctx.beginPath();
        ctx.arc(
          particle.x - particle.vx * 10, 
          particle.y - particle.vy * 10, 
          particle.size * 0.5/zoom, 
          0, 
          Math.PI * 2
        );
        ctx.globalAlpha = particle.life * 0.3;
        ctx.fill();
      }
      
      ctx.globalAlpha = 1;
    });
  }

  /**
   * Draw network nodes
   */
  drawNodes(nodes, zoom, selectedNode, hoveredNode, showPredictive = false) {
    const { ctx } = this;
    
    nodes.forEach(node => {
      if (node.type === 'datacenter') {
        this.drawDatacenterNode(node, zoom);
      } else {
        this.drawServerNode(node, zoom, selectedNode, hoveredNode, showPredictive);
      }
    });
  }

  /**
   * Draw datacenter node
   */
  drawDatacenterNode(node, zoom) {
    const { ctx } = this;
    const { x, y, health = 100, servers = 0, name } = node;
    const radius = (node.radius || 50) / zoom;
    
    // Health-based gradient
    const healthColor = health > 80 ? '#10b981' : health > 60 ? '#f59e0b' : '#ef4444';
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, healthColor + '40');
    gradient.addColorStop(1, healthColor + '10');
    
    // Draw main circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Border
    ctx.strokeStyle = healthColor;
    ctx.lineWidth = 3/zoom;
    ctx.stroke();
    
    // Business hours pulse effect
    if (node.businessHours) {
      const pulse = Math.sin(Date.now() * 0.005) * 8/zoom + radius;
      ctx.beginPath();
      ctx.arc(x, y, pulse, 0, Math.PI * 2);
      ctx.strokeStyle = healthColor + '30';
      ctx.lineWidth = 2/zoom;
      ctx.stroke();
    }
    
    // Labels (only at higher zoom)
    if (zoom > 0.5) {
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(10, 14/zoom)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(name, x, y - 5/zoom);
      
      ctx.font = `${Math.max(8, 11/zoom)}px Inter, sans-serif`;
      ctx.fillText(`${servers} servers`, x, y + 8/zoom);
      ctx.fillText(`${Math.round(health)}% health`, x, y + 20/zoom);
    }
  }

  /**
   * Draw server node
   */
  drawServerNode(node, zoom, selectedNode, hoveredNode, showPredictive) {
    const { ctx } = this;
    const { x, y, status, type, name, metrics, prediction } = node;
    const radius = (node.radius || CANVAS_CONFIG.NODE_RADIUS) / zoom;
    
    // Node shadow
    ctx.beginPath();
    ctx.arc(x + 3/zoom, y + 3/zoom, radius + (prediction?.risk * 5/zoom || 0), 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fill();
    
    // Predictive risk indicator
    if (showPredictive && prediction?.risk > 0.5) {
      const riskRadius = radius + 8/zoom + (prediction.risk * 12/zoom);
      ctx.beginPath();
      ctx.arc(x, y, riskRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsl(${(1 - prediction.risk) * 60}, 80%, 50%)`;
      ctx.lineWidth = 2/zoom;
      ctx.setLineDash([4/zoom, 4/zoom]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Main node circle
    const color = this.getStatusColor(status, prediction, showPredictive);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Status effects
    this.drawStatusEffects(node, zoom);
    
    // Selection/hover highlight
    if (selectedNode?.id === node.id || hoveredNode?.id === node.id) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 6/zoom, 0, Math.PI * 2);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3/zoom;
      ctx.stroke();
    }
    
    // Node icon and labels
    if (zoom > 0.4) {
      this.drawNodeIcon(node, zoom);
    }
    
    if (zoom > 0.6) {
      this.drawNodeLabels(node, zoom);
    }
    
    // Status indicators
    this.drawStatusIndicators(node, zoom);
  }

  /**
   * Get status color with predictive override
   */
  getStatusColor(status, prediction, showPredictive) {
    if (showPredictive && prediction) {
      const risk = prediction.risk;
      const hue = (1 - risk) * 120; // 120 = green, 0 = red
      return `hsl(${hue}, 70%, 60%)`;
    }
    
    return STATUS_COLORS[status] || STATUS_COLORS.online;
  }

  /**
   * Draw status effects (pulses, rings, etc.)
   */
  drawStatusEffects(node, zoom) {
    const { ctx } = this;
    const { x, y, status, lastHealed } = node;
    const radius = (node.radius || CANVAS_CONFIG.NODE_RADIUS) / zoom;
    
    // Critical status pulse
    if (status === 'critical') {
      const pulse = Math.sin(Date.now() * 0.01) * 3/zoom + radius + 5/zoom;
      ctx.beginPath();
      ctx.arc(x, y, pulse, 0, Math.PI * 2);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3/zoom;
      ctx.stroke();
    }
    
    // Warning status dashed ring
    if (status === 'warning') {
      ctx.beginPath();
      ctx.arc(x, y, radius + 5/zoom, 0, Math.PI * 2);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2/zoom;
      ctx.setLineDash([5/zoom, 5/zoom]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Auto-healing indicator
    if (lastHealed && Date.now() - lastHealed < 30000) {
      const healingRadius = radius + 12/zoom;
      ctx.beginPath();
      ctx.arc(x, y, healingRadius, 0, Math.PI * 2);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2/zoom;
      ctx.globalAlpha = 0.7;
      ctx.stroke();
      ctx.globalAlpha = 1;
      
      // Healing particles
      for (let i = 0; i < 3; i++) {
        const angle = (Date.now() * 0.005 + i * (Math.PI * 2 / 3)) % (Math.PI * 2);
        const px = x + Math.cos(angle) * healingRadius;
        const py = y + Math.sin(angle) * healingRadius;
        ctx.beginPath();
        ctx.arc(px, py, 2/zoom, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();
      }
    }
  }

  /**
   * Draw node icon
   */
  drawNodeIcon(node, zoom) {
    const { ctx } = this;
    const { x, y, type } = node;
    
    // Simple emoji icons for different node types
    const iconMap = {
      firewall: '🔥',
      'reverse-proxy': '🌐', 
      web: '🖥️',
      api: '⚡',
      db: '💾',
      cache: '⚡',
      lb: '⚖️',
      'container-host': '📦'
    };
    
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(8, 12/zoom)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(iconMap[type] || '⚙️', x, y + 4/zoom);
  }

  /**
   * Draw node labels
   */
  drawNodeLabels(node, zoom) {
    const { ctx } = this;
    const { x, y, name, metrics } = node;
    const radius = (node.radius || CANVAS_CONFIG.NODE_RADIUS) / zoom;
    
    // Node name
    ctx.fillStyle = '#374151';
    ctx.font = `${Math.max(8, 10/zoom)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(name, x, y + radius + 18/zoom);
    
    // Metrics (only at high zoom)
    if (metrics && zoom > 0.8) {
      ctx.font = `${Math.max(6, 8/zoom)}px Inter, sans-serif`;
      ctx.fillStyle = '#6b7280';
      ctx.fillText(
        `CPU: ${Math.round(metrics.cpuUsage)}% | Mem: ${Math.round(metrics.memoryUsage)}%`,
        x, y + radius + 30/zoom
      );
    }
  }

  /**
   * Draw status indicators (badges, warnings, etc.)
   */
  drawStatusIndicators(node, zoom) {
    const { ctx } = this;
    const { x, y, status, prediction } = node;
    const radius = (node.radius || CANVAS_CONFIG.NODE_RADIUS) / zoom;
    
    // Incident indicator
    if (status === 'critical' || status === 'warning') {
      ctx.beginPath();
      ctx.arc(x + radius - 8/zoom, y - radius + 8/zoom, 6/zoom, 0, Math.PI * 2);
      ctx.fillStyle = status === 'critical' ? '#ef4444' : '#f59e0b';
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(6, 10/zoom)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('!', x + radius - 8/zoom, y - radius + 12/zoom);
    }
    
    // AI prediction confidence indicator
    if (prediction?.confidence > 0.7 && zoom > 0.5) {
      ctx.beginPath();
      ctx.arc(x - radius + 8/zoom, y - radius + 8/zoom, 5/zoom, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(5, 8/zoom)}px Inter, sans-serif`;
      ctx.fillText('AI', x - radius + 8/zoom, y - radius + 11/zoom);
    }
  }

  /**
   * Draw UI overlays (zoom level, alerts, etc.)
   */
  drawUIOverlays(zoom, activeIncidents = []) {
    const { ctx, canvas } = this;
    
    // Reset transform for UI overlays
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Business hours overlay
    const isBusinessHours = new Date().getHours() >= 9 && new Date().getHours() < 17;
    if (isBusinessHours) {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('🕘 Business Hours Active', 20, 25);
    }
    
    // Critical alerts overlay
    if (activeIncidents.length > 0) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
      ctx.fillRect(0, 0, canvas.width, 50);
      
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`⚠️ ${activeIncidents.length} Active Incidents`, canvas.width - 20, 25);
    }
    
    // Zoom level indicator
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Zoom: ${Math.round(zoom * 100)}%`, canvas.width - 20, canvas.height - 20);
  }

  /**
   * Main render method
   */
  render({
    nodes = [],
    connections = [],
    particles = [],
    zoom = 1,
    panX = 0,
    panY = 0,
    selectedNode = null,
    hoveredNode = null,
    showTrafficFlow = true,
    showPredictive = false,
    businessIntelligence = {},
    activeIncidents = []
  }) {
    // Clear canvas and apply transformations
    this.clearCanvas(zoom, panX, panY);
    
    // Draw background
    this.drawBackground(zoom, panX, panY, businessIntelligence.isBusinessHours);
    
    // Draw connections
    this.drawConnections(connections, zoom, this.options.showMetrics);
    
    // Draw traffic particles
    if (showTrafficFlow && this.options.showParticles) {
      this.drawTrafficParticles(particles, zoom);
    }
    
    // Draw nodes
    this.drawNodes(nodes, zoom, selectedNode, hoveredNode, showPredictive);
    
    // Draw UI overlays
    this.drawUIOverlays(zoom, activeIncidents);
  }
}
export function renderNetwork(ctx, { data, viewport } = {}) {
  const nodes = data?.nodes ?? [];
  const edges = data?.edges ?? [];
  const vp = viewport ?? { x: 0, y: 0, k: 1 };

  ctx.save();
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // world transform
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.k, vp.k);

  // edges (expecting edge = { source: {x,y}, target: {x,y} })
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = "#c7c7c7";
  for (const e of edges) {
    const a = e?.source, b = e?.target;
    if (!a || !b) continue;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  // nodes
  for (const n of nodes) {
    const status = (n.status || "").toLowerCase();
    const fill =
      status === "critical" || status === "down" || status === "offline" ? "#ef4444" :
      status === "warning" || status === "degraded"                   ? "#f59e0b" :
                                                                        "#2b6cb0";
    const r = n.r ?? n.radius ?? 4;

    ctx.beginPath();
    ctx.fillStyle = n.color || fill;
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export default CanvasRenderer;