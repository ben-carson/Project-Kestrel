// src/plugins/aida/index.ts - AIDA Infrastructure Advisor Plugin
import React from 'react';
import { PluginManifest, PERMISSION_SCOPES } from '../../Types/plugin';
import { Activity, Cpu, Network, HardDrive, Zap, GitBranch } from 'lucide-react';

// AIDA Components (these will be moved from existing codebase)
// For now, lazy load to avoid breaking builds during migration
const InfrastructureTab = React.lazy(() => import('../../components/infrastructure/InfrastructureTab'));
const SimulationPlanner = React.lazy(() => import('../../components/simulation/SimulationPlanner'));
const RootCauseCanvas = React.lazy(() => import('../../components/analysis/RootCauseCanvas'));
const AssetDiscovery = React.lazy(() => import('../../components/discovery/AssetDiscovery'));
const PerformanceMonitor = React.lazy(() => import('../../components/monitoring/PerformanceMonitor'));
const NetworkTopology = React.lazy(() => import('../../components/topology/NetworkTopology'));

// Wrapped components with error boundaries
const withAidaErrorBoundary = (Component: React.ComponentType<any>, name: string) => {
  return React.forwardRef<any, any>((props, ref) => (
    <React.Suspense fallback={<div className="p-4 text-gray-500 animate-pulse">Loading {name}...</div>}>
      <div data-aida-component={name.toLowerCase().replace(' ', '-')}>
        <Component {...props} ref={ref} />
      </div>
    </React.Suspense>
  ));
};

// AIDA Plugin Manifest
export const AidaPlugin: PluginManifest = {
  id: 'aida',
  name: 'AIDA Infrastructure Advisor',
  version: '1.0.0',
  description: 'Sentinel-class infrastructure advisor for simulations, discovery, and impact analysis',
  
  permissions: [
    // UI Permissions
    PERMISSION_SCOPES.UI.TABS,
    PERMISSION_SCOPES.UI.WIDGETS,
    PERMISSION_SCOPES.UI.NAVIGATION,
    
    // Event Permissions
    PERMISSION_SCOPES.EVENTS.EMIT,
    PERMISSION_SCOPES.EVENTS.SUBSCRIBE,
    
    // Data Permissions
    PERMISSION_SCOPES.DATA.METRICS_READ,
    PERMISSION_SCOPES.DATA.CONFIG_READ,
    
    // Action Permissions
    PERMISSION_SCOPES.ACTIONS.SIMULATE_RUN,
    PERMISSION_SCOPES.ACTIONS.ALERT_CREATE
  ],
  
  async init(context) {
    const { eventBus, gateway, storage, permissions } = context;
    
    // Verify required permissions
    permissions.checkPermission(PERMISSION_SCOPES.UI.TABS);
    permissions.checkPermission(PERMISSION_SCOPES.DATA.METRICS_READ);
    permissions.checkPermission(PERMISSION_SCOPES.ACTIONS.SIMULATE_RUN);
    
    // Initialize AIDA-specific storage
    await storage.set('initialized', true);
    await storage.set('initTime', Date.now());
    await storage.set('version', '1.0.0');
    
    // Subscribe to relevant system events
    const unsubscribers = [
      // System health events
      eventBus.subscribe('threshold.breach', (payload) => {
        console.log('AIDA: Threshold breach detected', payload.data);
        // Trigger automatic root cause analysis
        this.handleThresholdBreach(payload.data, context);
      }),
      
      // Simulation events
      eventBus.subscribe('simulation.requested', (payload) => {
        console.log('AIDA: Simulation requested', payload.data);
        this.handleSimulationRequest(payload.data, context);
      }),
      
      // Discovery events
      eventBus.subscribe('asset.discovered', (payload) => {
        console.log('AIDA: New asset discovered', payload.data);
        storage.set(`assets.${payload.data.id}`, payload.data);
      })
    ];
    
    // Store unsubscribers for cleanup
    await storage.set('eventUnsubscribers', unsubscribers.length);
    this.unsubscribers = unsubscribers;
    
    // Emit initialization event
    eventBus.emit('plugin.initialized', {
      version: '1.0',
      timestamp: Date.now(),
      source: 'aida',
      data: {
        pluginId: 'aida',
        capabilities: ['simulation', 'discovery', 'analysis', 'monitoring'],
        endpoints: ['/api/aida/simulate', '/api/aida/discover', '/api/aida/analyze']
      }
    });
    
    console.log('AIDA Plugin initialized successfully');
  },
  
  async dispose() {
    // Clean up event subscriptions
    if (this.unsubscribers) {
      this.unsubscribers.forEach(unsub => unsub());
      this.unsubscribers = [];
    }
    
    // Clear any running simulations
    // await this.cancelRunningSimulations();
    
    console.log('AIDA Plugin disposed successfully');
  },
  
  registerTabs() {
    return [
      {
        id: 'infrastructure-tab',
        label: 'Infrastructure',
        component: withAidaErrorBoundary(InfrastructureTab, 'Infrastructure Tab'),
        icon: Activity,
        order: 1
      }
    ];
  },
  
  registerWidgets() {
    return [
      {
        id: 'simulation-planner',
        title: 'Simulation Planner',
        component: withAidaErrorBoundary(SimulationPlanner, 'Simulation Planner'),
        sizeHints: {
          minWidth: 400,
          minHeight: 300,
          defaultWidth: 600,
          defaultHeight: 400,
          maxWidth: 1200,
          maxHeight: 800
        },
        category: 'planning',
        description: 'Plan and execute infrastructure simulations'
      },
      
      {
        id: 'root-cause-canvas',
        title: 'Root Cause Analysis',
        component: withAidaErrorBoundary(RootCauseCanvas, 'Root Cause Canvas'),
        sizeHints: {
          minWidth: 500,
          minHeight: 400,
          defaultWidth: 800,
          defaultHeight: 600,
          maxWidth: 1400,
          maxHeight: 1000
        },
        category: 'analysis',
        description: 'Visual root cause analysis and impact mapping'
      },
      
      {
        id: 'asset-discovery',
        title: 'Asset Discovery',
        component: withAidaErrorBoundary(AssetDiscovery, 'Asset Discovery'),
        sizeHints: {
          minWidth: 350,
          minHeight: 250,
          defaultWidth: 450,
          defaultHeight: 350
        },
        category: 'discovery',
        description: 'Discover and catalog infrastructure assets'
      },
      
      {
        id: 'performance-monitor',
        title: 'Performance Monitor',
        component: withAidaErrorBoundary(PerformanceMonitor, 'Performance Monitor'),
        sizeHints: {
          minWidth: 300,
          minHeight: 200,
          defaultWidth: 400,
          defaultHeight: 300
        },
        category: 'monitoring',
        description: 'Real-time infrastructure performance metrics'
      },
      
      {
        id: 'network-topology',
        title: 'Network Topology',
        component: withAidaErrorBoundary(NetworkTopology, 'Network Topology'),
        sizeHints: {
          minWidth: 500,
          minHeight: 400,
          defaultWidth: 700,
          defaultHeight: 500,
          maxWidth: 1200,
          maxHeight: 800
        },
        category: 'visualization',
        description: 'Interactive network topology visualization'
      }
    ];
  },
  
  async healthCheck() {
    try {
      // Check if core services are accessible
      const initialized = await this.storage?.get('initialized');
      const hasPermissions = this.permissions?.hasPermission(PERMISSION_SCOPES.DATA.METRICS_READ);
      
      // Test gateway connectivity
      // await this.gateway?.request('/api/aida/health', { timeout: 5000 });
      
      return !!(initialized && hasPermissions);
    } catch (error) {
      console.error('AIDA health check failed:', error);
      return false;
    }
  },
  
  // Private methods for event handling
  unsubscribers: [] as Array<() => void>,
  storage: null as any,
  permissions: null as any,
  gateway: null as any,
  
  async handleThresholdBreach(data: any, context: any) {
    const { eventBus, storage } = context;
    
    // Store breach event for analysis
    const breachId = `breach_${Date.now()}`;
    await storage.set(`breaches.${breachId}`, {
      ...data,
      timestamp: Date.now(),
      analyzed: false
    });
    
    // Emit analysis started event
    eventBus.emit('analysis.started', {
      version: '1.0',
      timestamp: Date.now(),
      source: 'aida',
      data: {
        type: 'threshold_breach',
        breachId,
        metric: data.metric,
        severity: data.severity
      }
    });
  },
  
  async handleSimulationRequest(data: any, context: any) {
    const { eventBus, storage, gateway } = context;
    
    try {
      // Store simulation request
      const simulationId = data.id || `sim_${Date.now()}`;
      await storage.set(`simulations.${simulationId}`, {
        ...data,
        status: 'queued',
        timestamp: Date.now()
      });
      
      // Call AIDA simulation service (via plugin gateway)
      const result = await gateway.request('/api/aida/simulate', {
        method: 'POST',
        body: data
      });
      
      // Update simulation status
      await storage.set(`simulations.${simulationId}`, {
        ...data,
        status: 'completed',
        result,
        completedAt: Date.now()
      });
      
      // Emit completion event
      eventBus.emit('simulation.complete', {
        version: '1.0',
        timestamp: Date.now(),
        source: 'aida',
        data: {
          simulationId,
          results: result,
          duration: Date.now() - data.timestamp
        }
      });
      
    } catch (error) {
      console.error('AIDA simulation failed:', error);
      
      eventBus.emit('simulation.error', {
        version: '1.0',
        timestamp: Date.now(),
        source: 'aida',
        data: {
          simulationId: data.id,
          error: error.message
        }
      });
    }
  }
};

// Export for dynamic loading
export default AidaPlugin;
export const createPlugin = () => AidaPlugin;