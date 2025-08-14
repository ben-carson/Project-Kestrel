// src/core/LegacyBridge.ts - Enhanced with tab/widget support and lazy loading
import React from 'react';
import { PluginManager } from './PluginManager';
import { TabDef, WidgetDef } from '../Types/plugin';

interface LegacyComponent {
  id: string;
  type: 'tab' | 'widget';
  name: string; // Display name
  component: React.ComponentType<any>;
  metadata?: {
    originalPath?: string;
    pluginCandidate?: string; // Which plugin should replace this
    migrationPriority?: 'high' | 'medium' | 'low';
    dependencies?: string[]; // Other components this depends on
  };
}

interface MigrationStatus {
  total: number;
  migrated: number;
  remaining: number;
  percentage: number;
  components: Array<{
    id: string;
    type: 'tab' | 'widget';
    name: string;
    migrated: boolean;
    pluginId?: string;
    flagEnabled: boolean;
  }>;
  byType: {
    tabs: { total: number; migrated: number };
    widgets: { total: number; migrated: number };
  };
}

export class LegacyBridge {
  private pluginManager: PluginManager;
  private legacyComponents = new Map<string, LegacyComponent>();
  private migrationFlags = new Map<string, boolean>();
  
  constructor(pluginManager: PluginManager) {
    this.pluginManager = pluginManager;
    this.initializeLegacyComponents();
  }
  
  private initializeLegacyComponents(): void {
    // Register AIDA legacy components
    this.registerLegacyComponent({
      id: 'infrastructure-tab',
      type: 'tab',
      name: 'Infrastructure',
      component: React.lazy(() => import('../components/legacy/InfrastructureTab')),
      metadata: {
        originalPath: 'components/infrastructure/InfrastructureTab.tsx',
        pluginCandidate: 'aida',
        migrationPriority: 'high'
      }
    });
    
    this.registerLegacyComponent({
      id: 'simulation-planner',
      type: 'widget',
      name: 'Simulation Planner',
      component: React.lazy(() => import('../components/legacy/SimulationPlanner')),
      metadata: {
        originalPath: 'components/simulation/SimulationPlanner.tsx',
        pluginCandidate: 'aida',
        migrationPriority: 'high',
        dependencies: ['infrastructure-tab']
      }
    });
    
    this.registerLegacyComponent({
      id: 'root-cause-canvas',
      type: 'widget',
      name: 'Root Cause Canvas',
      component: React.lazy(() => import('../components/legacy/RootCauseCanvas')),
      metadata: {
        originalPath: 'components/analysis/RootCauseCanvas.tsx',
        pluginCandidate: 'aida',
        migrationPriority: 'medium'
      }
    });
    
    this.registerLegacyComponent({
      id: 'performance-monitor',
      type: 'widget',
      name: 'Performance Monitor',
      component: React.lazy(() => import('../components/legacy/PerformanceMonitor')),
      metadata: {
        originalPath: 'components/monitoring/PerformanceMonitor.tsx',
        pluginCandidate: 'aida',
        migrationPriority: 'high'
      }
    });
    
    // Register MAIA legacy components
    this.registerLegacyComponent({
      id: 'insights-tab',
      type: 'tab',
      name: 'Insights',
      component: React.lazy(() => import('../components/legacy/InsightsTab')),
      metadata: {
        originalPath: 'components/insights/InsightsTab.tsx',
        pluginCandidate: 'maia',
        migrationPriority: 'high'
      }
    });
    
    this.registerLegacyComponent({
      id: 'recommendations-panel',
      type: 'widget',
      name: 'Recommendations',
      component: React.lazy(() => import('../components/legacy/RecommendationsPanel')),
      metadata: {
        originalPath: 'components/recommendations/RecommendationsPanel.tsx',
        pluginCandidate: 'maia',
        migrationPriority: 'high',
        dependencies: ['insights-tab']
      }
    });
    
    this.registerLegacyComponent({
      id: 'insight-badge',
      type: 'widget',
      name: 'Insight Badge',
      component: React.lazy(() => import('../components/legacy/InsightBadge')),
      metadata: {
        originalPath: 'components/insights/InsightBadge.tsx',
        pluginCandidate: 'maia',
        migrationPriority: 'medium'
      }
    });
    
    this.registerLegacyComponent({
      id: 'memory-browser',
      type: 'widget',
      name: 'Memory Browser',
      component: React.lazy(() => import('../components/legacy/MemoryBrowser')),
      metadata: {
        originalPath: 'components/memory/MemoryBrowser.tsx',
        pluginCandidate: 'maia',
        migrationPriority: 'low'
      }
    });
    
    // All components default to legacy mode
    Array.from(this.legacyComponents.keys()).forEach(id => {
      this.migrationFlags.set(id, false);
    });
  }
  
  registerLegacyComponent(component: LegacyComponent): void {
    this.legacyComponents.set(component.id, component);
    this.migrationFlags.set(component.id, false); // Default to legacy
  }
  
  // Enhanced component resolution - prefer plugin, fallback to legacy
  getComponent(id: string, type: 'tab' | 'widget'): React.ComponentType<any> | null {
    const usePlugin = this.migrationFlags.get(id) ?? false;
    
    if (usePlugin) {
      // Try plugin first
      const pluginComponent = this.getPluginComponent(id, type);
      if (pluginComponent) {
        return this.wrapPluginComponent(pluginComponent, id, type);
      }
      
      // Plugin unavailable, log warning and fall back to legacy
      console.warn(`Migration flag enabled for ${id} but plugin component not found, falling back to legacy`);
    }
    
    // Use legacy component
    const legacy = this.legacyComponents.get(id);
    if (legacy && legacy.type === type) {
      return this.wrapLegacyComponent(legacy, id);
    }
    
    return null;
  }
  
  // Get tab with proper typing
  getTab(id: string): ExtendedTabDef | null {
    const usePlugin = this.migrationFlags.get(id) ?? false;
    
    if (usePlugin) {
      const pluginTab = this.pluginManager.getRegisteredTabs().find(t => t.id === id);
      if (pluginTab) {
        return {
          ...pluginTab,
          isLegacy: false,
          migrationSource: 'plugin'
        };
      }
    }
    
    const legacy = this.legacyComponents.get(id);
    if (legacy && legacy.type === 'tab') {
      return {
        id,
        label: legacy.name,
        component: legacy.component,
        pluginId: 'legacy',
        isLegacy: true,
        migrationSource: 'legacy',
        metadata: legacy.metadata
      };
    }
    
    return null;
  }
  
  // Get widget with proper typing
  getWidget(id: string): ExtendedWidgetDef | null {
    const usePlugin = this.migrationFlags.get(id) ?? false;
    
    if (usePlugin) {
      const pluginWidget = this.pluginManager.getRegisteredWidgets().find(w => w.id === id);
      if (pluginWidget) {
        return {
          ...pluginWidget,
          isLegacy: false,
          migrationSource: 'plugin'
        };
      }
    }
    
    const legacy = this.legacyComponents.get(id);
    if (legacy && legacy.type === 'widget') {
      return {
        id,
        title: legacy.name,
        component: legacy.component,
        pluginId: 'legacy',
        sizeHints: { defaultWidth: 400, defaultHeight: 300 },
        isLegacy: true,
        migrationSource: 'legacy',
        metadata: legacy.metadata
      };
    }
    
    return null;
  }
  
  // Get all available tabs (plugin + legacy)
  getAllTabs(): ExtendedTabDef[] {
    const pluginTabs = this.pluginManager.getRegisteredTabs().map(tab => ({
      ...tab,
      isLegacy: false as const,
      migrationSource: 'plugin' as const
    }));
    
    const legacyTabs = Array.from(this.legacyComponents.entries())
      .filter(([id, component]) => {
        const usePlugin = this.migrationFlags.get(id) ?? false;
        return component.type === 'tab' && !usePlugin;
      })
      .map(([id, component]) => ({
        id,
        label: component.name,
        component: component.component,
        pluginId: 'legacy' as any,
        isLegacy: true as const,
        migrationSource: 'legacy' as const,
        metadata: component.metadata
      }));
    
    return [...pluginTabs, ...legacyTabs];
  }
  
  // Get all available widgets (plugin + legacy)
  getAllWidgets(): ExtendedWidgetDef[] {
    const pluginWidgets = this.pluginManager.getRegisteredWidgets().map(widget => ({
      ...widget,
      isLegacy: false as const,
      migrationSource: 'plugin' as const
    }));
    
    const legacyWidgets = Array.from(this.legacyComponents.entries())
      .filter(([id, component]) => {
        const usePlugin = this.migrationFlags.get(id) ?? false;
        return component.type === 'widget' && !usePlugin;
      })
      .map(([id, component]) => ({
        id,
        title: component.name,
        component: component.component,
        pluginId: 'legacy' as any,
        sizeHints: { defaultWidth: 400, defaultHeight: 300 },
        isLegacy: true as const,
        migrationSource: 'legacy' as const,
        metadata: component.metadata
      }));
    
    return [...pluginWidgets, ...legacyWidgets];
  }
  
  // Enhanced migration status with tabs + widgets
  getMigrationStatus(): MigrationStatus {
    const components = Array.from(this.legacyComponents.entries()).map(([id, component]) => {
      const flagEnabled = this.migrationFlags.get(id) ?? false;
      const actuallyMigrated = this.isActuallyMigrated(id, component.type);
      let pluginId: string | undefined;
      
      if (actuallyMigrated) {
        const tabs = this.pluginManager.getRegisteredTabs();
        const widgets = this.pluginManager.getRegisteredWidgets();
        const tab = tabs.find(t => t.id === id);
        const widget = widgets.find(w => w.id === id);
        pluginId = tab?.pluginId || widget?.pluginId;
      }
      
      return {
        id,
        type: component.type,
        name: component.name,
        migrated: actuallyMigrated,
        pluginId,
        flagEnabled
      };
    });
    
    const total = components.length;
    const migrated = components.filter(c => c.migrated).length;
    
    const tabs = components.filter(c => c.type === 'tab');
    const widgets = components.filter(c => c.type === 'widget');
    
    return {
      total,
      migrated,
      remaining: total - migrated,
      percentage: total > 0 ? Math.round((migrated / total) * 100) : 100,
      components,
      byType: {
        tabs: {
          total: tabs.length,
          migrated: tabs.filter(t => t.migrated).length
        },
        widgets: {
          total: widgets.length,
          migrated: widgets.filter(w => w.migrated).length
        }
      }
    };
  }
  
  // Migration control methods
  setMigrationFlag(id: string, usePlugin: boolean): void {
    this.migrationFlags.set(id, usePlugin);
  }
  
  migrateComponent(id: string): boolean {
    const component = this.legacyComponents.get(id);
    if (!component) return false;
    
    // Check if plugin actually provides this component
    if (this.isPluginComponentAvailable(id, component.type)) {
      this.setMigrationFlag(id, true);
      return true;
    }
    
    console.warn(`Cannot migrate ${id}: plugin component not available`);
    return false;
  }
  
  migrateByPlugin(pluginId: string): string[] {
    const migrated: string[] = [];
    
    Array.from(this.legacyComponents.entries()).forEach(([id, component]) => {
      if (component.metadata?.pluginCandidate === pluginId) {
        if (this.migrateComponent(id)) {
          migrated.push(id);
        }
      }
    });
    
    return migrated;
  }
  
  revertToLegacy(ids: string[]): void {
    ids.forEach(id => this.setMigrationFlag(id, false));
  }
  
  // Helper methods
  private getPluginComponent(id: string, type: 'tab' | 'widget'): React.ComponentType<any> | null {
    if (type === 'tab') {
      const tab = this.pluginManager.getRegisteredTabs().find(t => t.id === id);
      return tab?.component || null;
    } else {
      const widget = this.pluginManager.getRegisteredWidgets().find(w => w.id === id);
      return widget?.component || null;
    }
  }
  
  private isPluginComponentAvailable(id: string, type: 'tab' | 'widget'): boolean {
    return this.getPluginComponent(id, type) !== null;
  }
  
  private isActuallyMigrated(id: string, type: 'tab' | 'widget'): boolean {
    const flagEnabled = this.migrationFlags.get(id) ?? false;
    if (!flagEnabled) return false;
    
    return this.isPluginComponentAvailable(id, type);
  }
  
  private wrapPluginComponent(
    Component: React.ComponentType<any>,
    id: string,
    type: 'tab' | 'widget'
  ): React.ComponentType<any> {
    return React.forwardRef<any, any>((props, ref) => (
      <div data-plugin-component={id} data-component-type={type}>
        <Component {...props} ref={ref} />
      </div>
    ));
  }
  
  private wrapLegacyComponent(
    component: LegacyComponent,
    id: string
  ): React.ComponentType<any> {
    const Component = component.component;
    
    return React.forwardRef<any, any>((props, ref) => (
      <div data-legacy-component={id} data-component-type={component.type}>
        <React.Suspense 
          fallback={
            <div className="p-4 text-gray-500 animate-pulse">
              Loading {component.name}...
            </div>
          }
        >
          <Component {...props} ref={ref} />
        </React.Suspense>
      </div>
    ));
  }
  
  // Export/import migration configuration
  exportMigrationConfig(): Record<string, boolean> {
    return Object.fromEntries(this.migrationFlags);
  }
  
  importMigrationConfig(config: Record<string, boolean>): void {
    Object.entries(config).forEach(([id, usePlugin]) => {
      if (this.legacyComponents.has(id)) {
        this.setMigrationFlag(id, usePlugin);
      }
    });
  }
}

// Enhanced type definitions
export interface ExtendedTabDef extends TabDef {
  isLegacy: boolean;
  migrationSource: 'plugin' | 'legacy';
  metadata?: any;
}

export interface ExtendedWidgetDef extends WidgetDef {
  isLegacy: boolean;
  migrationSource: 'plugin' | 'legacy';  
  metadata?: any;
}

// Integration helpers for AppRegistry.ts and WidgetApp.jsx
export const createTabResolver = (bridge: LegacyBridge) => {
  return (tabId: string) => {
    const tab = bridge.getTab(tabId);
    if (!tab) return null;
    
    return {
      id: tab.id,
      name: tab.label,
      component: tab.component,
      icon: (tab as any).icon,
      isLegacy: tab.isLegacy,
      pluginId: tab.pluginId
    };
  };
};

export const createWidgetResolver = (bridge: LegacyBridge) => {
  return (widgetId: string) => {
    const widget = bridge.getWidget(widgetId);
    if (!widget) return null;
    
    return {
      id: widget.id,
      title: widget.title,
      component: widget.component,
      defaultSize: {
        width: widget.sizeHints?.defaultWidth || 400,
        height: widget.sizeHints?.defaultHeight || 300
      },
      isLegacy: widget.isLegacy,
      pluginId: widget.pluginId
    };
  };
};