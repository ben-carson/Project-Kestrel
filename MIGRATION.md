// MIGRATION.md - Step-by-step guide to extract AIDA/MAIA to plugins

/*
# Dashboard Shell Migration Guide

## Phase 1: Shell Stabilization (CURRENT)
- ✅ Plugin API v0.1 defined and frozen
- ✅ Core services implemented (EventBus, Gateway, PermissionManager, Storage)
- ✅ PluginManager with lifecycle management
- ✅ Plugin loading infrastructure (bundled/remote/local)
- ✅ Dummy plugin proves contract works
- ✅ Dashboard shell UI with dynamic tabs/widgets

## Phase 2: Mark Entanglement Points
Before extracting AIDA/MAIA, identify ALL coupling points in existing code:

### AIDA Entanglement Points (search codebase for):
- Infrastructure tab component
- Simulation planner components
- Root cause canvas
- Asset discovery widgets  
- Performance monitoring widgets
- Simulation service API calls
- Infrastructure metrics store state
- AIDA-specific event handlers
- Hardcoded AIDA permissions

### MAIA Entanglement Points (search codebase for):
- Insights tab component
- Recommendation widgets
- Memory store integration
- Insight badge components
- Context synthesis logic
- MAIA service API calls
- Memory-related store state
- Insight generation event handlers
- Hardcoded MAIA permissions

## Phase 3: Extract AIDA Plugin
1. Create plugins/aida-plugin/ directory
2. Move AIDA components to plugin
3. Implement AIDA PluginManifest
4. Update AIDA service client to use gateway
5. Replace hardcoded Infrastructure tab with plugin registration
6. Test AIDA plugin in isolation
7. Remove AIDA code from host

## Phase 4: Extract MAIA Plugin  
1. Create plugins/maia-plugin/ directory
2. Move MAIA components to plugin
3. Implement MAIA PluginManifest
4. Update MAIA service client to use gateway
5. Replace hardcoded Insights tab with plugin registration
6. Test MAIA plugin in isolation
7. Remove MAIA code from host

## Phase 5: Production Hardening
- Add plugin sandboxing
- Implement proper CSP policies
- Add plugin signature verification
- Create plugin marketplace/registry
- Add plugin update mechanism
- Implement plugin telemetry
*/

// integration/HostEntanglementMarkers.ts
// These are the exact patterns to search for and extract

export const AIDA_ENTANGLEMENT_MARKERS = {
  // UI Components
  INFRASTRUCTURE_TAB: 'InfrastructureTab',
  SIMULATION_PLANNER: 'SimulationPlanner', 
  ROOT_CAUSE_CANVAS: 'RootCauseCanvas',
  ASSET_DISCOVERY: 'AssetDiscovery',
  PERFORMANCE_WIDGET: 'PerformanceMonitor',
  
  // Store/State
  SIMULATION_STORE: 'simulationStore',
  INFRASTRUCTURE_METRICS: 'infrastructureMetrics',
  ASSET_INVENTORY: 'assetInventory',
  
  // API Calls
  AIDA_SERVICE_BASE: '/api/aida',
  SIMULATION_ENDPOINTS: ['/simulate', '/discover', '/analyze'],
  
  // Events
  SIMULATION_EVENTS: ['simulation.start', 'simulation.complete', 'asset.discovered'],
  THRESHOLD_EVENTS: ['threshold.breach', 'performance.alert'],
  
  // Permissions
  SIMULATION_PERMISSIONS: ['actions:simulate.run', 'data:metrics.read'],
  
  // CSS/Styling
  AIDA_CSS_CLASSES: ['aida-', 'simulation-', 'infrastructure-'],
};

export const MAIA_ENTANGLEMENT_MARKERS = {
  // UI Components  
  INSIGHTS_TAB: 'InsightsTab',
  RECOMMENDATIONS_PANEL: 'RecommendationsPanel',
  INSIGHT_BADGE: 'InsightBadge',
  MEMORY_BROWSER: 'MemoryBrowser',
  CONTEXT_SYNTHESIS: 'ContextSynthesis',
  
  // Store/State
  MEMORY_STORE: 'memoryStore',
  INSIGHTS_STATE: 'insightsState', 
  RECOMMENDATIONS: 'recommendations',
  
  // API Calls
  MAIA_SERVICE_BASE: '/api/maia',
  MEMORY_ENDPOINTS: ['/memories', '/insights', '/recommend'],
  
  // Events
  INSIGHT_EVENTS: ['insight.generated', 'context.updated', 'memory.stored'],
  
  // Permissions
  MEMORY_PERMISSIONS: ['data:memories.read', 'data:insights.generate'],
  
  // CSS/Styling
  MAIA_CSS_CLASSES: ['maia-', 'insight-', 'memory-', 'recommendation-'],
};

// integration/ExtractorTools.ts
export class PluginExtractor {
  private sourceCode: string;
  private markers: typeof AIDA_ENTANGLEMENT_MARKERS;
  
  constructor(sourceCode: string, markers: typeof AIDA_ENTANGLEMENT_MARKERS) {
    this.sourceCode = sourceCode;
    this.markers = markers;
  }
  
  findEntanglementPoints(): Array<{ type: string; location: number; context: string }> {
    const points: Array<{ type: string; location: number; context: string }> = [];
    
    Object.entries(this.markers).forEach(([type, patterns]) => {
      const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
      
      patternsArray.forEach(pattern => {
        const regex = new RegExp(pattern, 'gi');
        let match;
        
        while ((match = regex.exec(this.sourceCode)) !== null) {
          const start = Math.max(0, match.index - 100);
          const end = Math.min(this.sourceCode.length, match.index + match[0].length + 100);
          const context = this.sourceCode.slice(start, end);
          
          points.push({
            type,
            location: match.index,
            context: context
          });
        }
      });
    });
    
    return points.sort((a, b) => a.location - b.location);
  }
  
  generateExtractionPlan(): ExtractionPlan {
    const entanglements = this.findEntanglementPoints();
    
    return {
      pluginId: this.markers === AIDA_ENTANGLEMENT_MARKERS ? 'aida' : 'maia',
      entanglements,
      extractionSteps: this.generateSteps(entanglements),
      riskAssessment: this.assessRisk(entanglements)
    };
  }
  
  private generateSteps(entanglements: Array<{ type: string; location: number; context: string }>): string[] {
    const steps: string[] = [
      '1. Create plugin directory structure',
      '2. Move UI components to plugin',
      '3. Implement PluginManifest interface',
      '4. Update service client to use gateway',
      '5. Replace hardcoded registrations with plugin calls',
      '6. Test plugin in isolation',
      '7. Remove code from host',
      '8. Update tests and documentation'
    ];
    
    // Add specific steps based on entanglements found
    if (entanglements.some(e => e.type.includes('STORE'))) {
      steps.splice(3, 0, '3a. Migrate store state to plugin storage');
    }
    
    if (entanglements.some(e => e.type.includes('EVENTS'))) {
      steps.splice(4, 0, '3b. Update event handlers to use plugin event bus');
    }
    
    return steps;
  }
  
  private assessRisk(entanglements: Array<{ type: string; location: number; context: string }>): RiskAssessment {
    let riskScore = 0;
    const risks: string[] = [];
    
    if (entanglements.length > 20) {
      riskScore += 3;
      risks.push('High coupling: Many entanglement points found');
    }
    
    if (entanglements.some(e => e.type.includes('STORE'))) {
      riskScore += 2;
      risks.push('State management complexity');
    }
    
    if (entanglements.some(e => e.type.includes('EVENTS'))) {
      riskScore += 1;
      risks.push('Event system dependencies');
    }
    
    return {
      score: riskScore,
      level: riskScore >= 5 ? 'HIGH' : riskScore >= 3 ? 'MEDIUM' : 'LOW',
      risks,
      mitigationSteps: [
        'Extract in small batches',
        'Maintain backward compatibility during transition',
        'Create extensive tests for plugin boundary',
        'Use feature flags to enable/disable plugin loading'
      ]
    };
  }
}

interface ExtractionPlan {
  pluginId: string;
  entanglements: Array<{ type: string; location: number; context: string }>;
  extractionSteps: string[];
  riskAssessment: RiskAssessment;
}

interface RiskAssessment {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  risks: string[];
  mitigationSteps: string[];
}

// integration/LegacyBridge.ts
// Temporary bridge for gradual migration
export class LegacyBridge {
  private pluginManager: PluginManager;
  private legacyComponents = new Map<string, React.ComponentType<any>>();
  
  constructor(pluginManager: PluginManager) {
    this.pluginManager = pluginManager;
  }
  
  // Register legacy components that haven't been migrated yet
  registerLegacyComponent(id: string, component: React.ComponentType<any>): void {
    this.legacyComponents.set(id, component);
  }
  
  // Get component, preferring plugin version over legacy
  getComponent(id: string): React.ComponentType<any> | null {
    // First check if plugin provides this component
    const widgets = this.pluginManager.getRegisteredWidgets();
    const widget = widgets.find(w => w.id === id);
    
    if (widget) {
      return widget.component;
    }
    
    // Fall back to legacy component
    return this.legacyComponents.get(id) || null;
  }
  
  // Check if component has been migrated to plugin
  isMigrated(id: string): boolean {
    const widgets = this.pluginManager.getRegisteredWidgets();
    return widgets.some(w => w.id === id);
  }
  
  // Get migration status report
  getMigrationStatus(): MigrationStatus {
    const total = this.legacyComponents.size;
    const migrated = Array.from(this.legacyComponents.keys())
      .filter(id => this.isMigrated(id)).length;
    
    return {
      total,
      migrated,
      remaining: total - migrated,
      percentage: total > 0 ? Math.round((migrated / total) * 100) : 100,
      components: Array.from(this.legacyComponents.keys()).map(id => ({
        id,
        migrated: this.isMigrated(id)
      }))
    };
  }
}

interface MigrationStatus {
  total: number;
  migrated: number;
  remaining: number;
  percentage: number;
  components: Array<{ id: string; migrated: boolean }>;
}

// integration/TestHelpers.ts
export class PluginTestHelper {
  static createMockHostContext(): HostContext {
    return {
      eventBus: new EventBusImpl(),
      gateway: new GatewayImpl(),
      storage: new StorageImpl('test'),
      theme: DEFAULT_THEME_TOKENS,
      permissions: {
        hasPermission: () => true,
        checkPermission: () => {},
        getPermissions: () => []
      }
    };
  }
  
  static createMockPlugin(id: string): PluginManifest {
    return {
      id,
      name: `Test Plugin ${id}`,
      version: '1.0.0',
      permissions: [PERMISSION_SCOPES.UI.TABS, PERMISSION_SCOPES.UI.WIDGETS],
      
      init: async () => {},
      dispose: async () => {},
      registerTabs: () => [{
        id: `${id}-tab`,
        label: `${id} Tab`,
        component: () => React.createElement('div', {}, `${id} content`)
      }],
      registerWidgets: () => [{
        id: `${id}-widget`,
        title: `${id} Widget`,
        component: ({ onRemove }) => React.createElement('div', {}, `${id} widget`),
        sizeHints: { defaultWidth: 200, defaultHeight: 200 }
      }]
    };
  }
  
  static async testPluginLifecycle(plugin: PluginManifest): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const context = this.createMockHostContext();
    
    try {
      // Test initialization
      await plugin.init(context);
      results.push({ test: 'init', passed: true });
    } catch (error) {
      results.push({ test: 'init', passed: false, error: error.message });
    }
    
    try {
      // Test tab registration
      const tabs = plugin.registerTabs();
      const validTabs = tabs.every(tab => tab.id && tab.label && tab.component);
      results.push({ test: 'registerTabs', passed: validTabs });
    } catch (error) {
      results.push({ test: 'registerTabs', passed: false, error: error.message });
    }
    
    try {
      // Test widget registration
      const widgets = plugin.registerWidgets();
      const validWidgets = widgets.every(widget => 
        widget.id && widget.title && widget.component && widget.sizeHints
      );
      results.push({ test: 'registerWidgets', passed: validWidgets });
    } catch (error) {
      results.push({ test: 'registerWidgets', passed: false, error: error.message });
    }
    
    try {
      // Test disposal
      await plugin.dispose();
      results.push({ test: 'dispose', passed: true });
    } catch (error) {
      results.push({ test: 'dispose', passed: false, error: error.message });
    }
    
    return results;
  }
  
  static validatePluginManifest(plugin: PluginManifest): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Required fields
    if (!plugin.id) errors.push('Missing required field: id');
    if (!plugin.name) errors.push('Missing required field: name');
    if (!plugin.version) errors.push('Missing required field: version');
    if (!Array.isArray(plugin.permissions)) errors.push('permissions must be an array');
    
    // Method validation
    if (typeof plugin.init !== 'function') errors.push('init must be a function');
    if (typeof plugin.dispose !== 'function') errors.push('dispose must be a function');
    if (typeof plugin.registerTabs !== 'function') errors.push('registerTabs must be a function');
    if (typeof plugin.registerWidgets !== 'function') errors.push('registerWidgets must be a function');
    
    // ID format validation
    if (plugin.id && !/^[a-z][a-z0-9-]*$/.test(plugin.id)) {
      errors.push('Plugin ID must be lowercase, start with letter, contain only letters, numbers, and hyphens');
    }
    
    // Version format validation
    if (plugin.version && !/^\d+\.\d+\.\d+/.test(plugin.version)) {
      warnings.push('Plugin version should follow semantic versioning (x.y.z)');
    }
    
    // Permission validation
    if (plugin.permissions) {
      plugin.permissions.forEach(permission => {
        if (!permission.includes(':')) {
          errors.push(`Invalid permission format: ${permission}`);
        }
      });
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// integration/DebugTools.ts
export class PluginDebugger {
  private pluginManager: PluginManager;
  private eventLog: Array<{ timestamp: number; event: string; data: any }> = [];
  
  constructor(pluginManager: PluginManager) {
    this.pluginManager = pluginManager;
    this.setupEventLogging();
  }
  
  private setupEventLogging(): void {
    // Log all events for debugging
    const originalEmit = this.pluginManager['eventBus'].emit.bind(this.pluginManager['eventBus']);
    
    this.pluginManager['eventBus'].emit = (eventName: string, payload: any) => {
      this.eventLog.push({
        timestamp: Date.now(),
        event: eventName,
        data: payload
      });
      
      // Keep only last 100 events
      if (this.eventLog.length > 100) {
        this.eventLog.shift();
      }
      
      return originalEmit(eventName, payload);
    };
  }
  
  getEventLog(): Array<{ timestamp: number; event: string; data: any }> {
    return [...this.eventLog];
  }
  
  getPluginDiagnostics(pluginId: string): PluginDiagnostics {
    const status = this.pluginManager.getPluginStatus(pluginId);
    const tabs = this.pluginManager.getRegisteredTabs().filter(t => t.pluginId === pluginId);
    const widgets = this.pluginManager.getRegisteredWidgets().filter(w => w.pluginId === pluginId);
    const relatedEvents = this.eventLog.filter(e => 
      e.data?.pluginId === pluginId || e.event.includes(pluginId)
    );
    
    return {
      pluginId,
      status,
      tabCount: tabs.length,
      widgetCount: widgets.length,
      eventCount: relatedEvents.length,
      lastEventTime: relatedEvents.length > 0 ? 
        Math.max(...relatedEvents.map(e => e.timestamp)) : null,
      memoryUsage: this.estimatePluginMemoryUsage(pluginId),
      tabs: tabs.map(t => ({ id: t.id, label: t.label })),
      widgets: widgets.map(w => ({ id: w.id, title: w.title })),
      recentEvents: relatedEvents.slice(-10)
    };
  }
  
  private estimatePluginMemoryUsage(pluginId: string): number {
    // Simple estimation - in real implementation would be more sophisticated
    const tabs = this.pluginManager.getRegisteredTabs().filter(t => t.pluginId === pluginId);
    const widgets = this.pluginManager.getRegisteredWidgets().filter(w => w.pluginId === pluginId);
    
    return (tabs.length * 10000) + (widgets.length * 5000); // rough bytes estimate
  }
  
  exportDiagnostics(): string {
    const allPlugins = this.pluginManager.getAllPluginStatuses();
    const diagnostics = {
      timestamp: new Date().toISOString(),
      plugins: allPlugins.map(p => this.getPluginDiagnostics(p.id)),
      eventLog: this.eventLog,
      systemStats: {
        totalTabs: this.pluginManager.getRegisteredTabs().length,
        totalWidgets: this.pluginManager.getRegisteredWidgets().length,
        totalEvents: this.eventLog.length
      }
    };
    
    return JSON.stringify(diagnostics, null, 2);
  }
}

interface PluginDiagnostics {
  pluginId: string;
  status: string;
  tabCount: number;
  widgetCount: number;
  eventCount: number;
  lastEventTime: number | null;
  memoryUsage: number;
  tabs: Array<{ id: string; label: string }>;
  widgets: Array<{ id: string; title: string }>;
  recentEvents: Array<{ timestamp: number; event: string; data: any }>;
}

// Example usage and CLI commands
export const CLI_COMMANDS = `
# Migration Commands

# 1. Analyze current codebase for entanglements
npm run analyze:entanglements -- --plugin=aida --source=./src

# 2. Generate extraction plan
npm run plan:extraction -- --plugin=aida --output=./migration-plan.json

# 3. Extract plugin (dry run)
npm run extract:plugin -- --plugin=aida --dry-run

# 4. Extract plugin (actual)
npm run extract:plugin -- --plugin=aida --target=./plugins/aida-plugin

# 5. Test plugin in isolation
npm run test:plugin -- --plugin=./plugins/aida-plugin

# 6. Validate plugin manifest
npm run validate:plugin -- --plugin=./plugins/aida-plugin/manifest.json

# 7. Install plugin to dashboard
npm run install:plugin -- --plugin=./plugins/aida-plugin --dashboard=./src

# Debug Commands

# 1. Check plugin health
npm run debug:plugin-health

# 2. Export diagnostics
npm run debug:export-diagnostics -- --output=./debug-report.json

# 3. Monitor plugin events
npm run debug:monitor-events -- --plugin=aida --duration=60

# 4. Test plugin lifecycle
npm run debug:test-lifecycle -- --plugin=aida
`;

// Final integration checklist
export const INTEGRATION_CHECKLIST = `
## Plugin API Implementation Checklist

### Core Infrastructure ✅
- [x] Plugin API v0.1 contract defined
- [x] PluginManager with lifecycle management  
- [x] EventBus with schema validation
- [x] Gateway with rate limiting and plugin scoping
- [x] PermissionManager with runtime enforcement
- [x] StorageAPI with namespaced isolation
- [x] ThemeProvider with token system

### Plugin Loading ✅  
- [x] PluginLoader supporting bundled/remote/local
- [x] Integrity verification (SRI)
- [x] Plugin sandboxing framework
- [x] Error boundaries and kill switch
- [x] Plugin registry integration

### Dashboard Shell ✅
- [x] Dynamic tab registration/rendering
- [x] Dynamic widget registration/rendering  
- [x] Plugin management UI
- [x] Status monitoring and diagnostics

### Testing & Debug Tools ✅
- [x] Plugin test helpers
- [x] Manifest validation
- [x] Lifecycle testing
- [x] Event logging and diagnostics
- [x] Performance monitoring

### Migration Tools ✅
- [x] Entanglement analysis
- [x] Extraction planning
- [x] Risk assessment
- [x] Legacy bridge for gradual migration

## Next Steps
1. **Lock down Plugin API v0.1** - Freeze interface, no breaking changes
2. **Extract AIDA Plugin** - Move Infrastructure tab + widgets to plugin  
3. **Extract MAIA Plugin** - Move Insights tab + widgets to plugin
4. **Test in production** - Deploy with plugin loading enabled
5. **Harden security** - Add CSP, signature verification, audit logging
6. **Build ecosystem** - Plugin marketplace, documentation, examples

## Security Considerations
- Plugin code sandboxing (CSP, isolated contexts)
- Permission enforcement at runtime
- Signed plugin verification
- Network isolation via gateway
- Storage isolation per plugin
- Kill switch for emergency disable

## Performance Considerations  
- Lazy loading of plugin components
- Memory isolation and cleanup
- Event bus performance monitoring
- Gateway rate limiting per plugin
- Bundle size optimization
`;

export default {
  AIDA_ENTANGLEMENT_MARKERS,
  MAIA_ENTANGLEMENT_MARKERS,
  PluginExtractor,
  LegacyBridge,
  PluginTestHelper,
  PluginDebugger,
  CLI_COMMANDS,
  INTEGRATION_CHECKLIST
};