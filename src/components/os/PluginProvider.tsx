// src/components/os/PluginProvider.tsx - Fixed per-plugin isolation
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { PluginManager } from '../../core/PluginManager';
import { PluginLoader } from '../../core/PluginLoader';
import { EventBusImpl } from '../../core/EventBus';
import { GatewayImpl } from '../../lib/gateway';
import { PermissionManager } from '../../core/PermissionManager';
import { StorageImpl } from '../../core/Storage';
import { ThemeManager, DEFAULT_THEME_TOKENS } from '../../core/ThemeManager';
import { HostContext, PluginManifest } from '../../Types/plugin';
import { usePluginStore } from '../../store/usePluginStore';
import { AppErrorBoundary } from './AppErrorBoundary';
import { sanitizeTabs, sanitizeWidgets, deepStripComponents } from '../../store/pluginSanitizers';

interface PluginContextValue {
  pluginManager: PluginManager;
  pluginLoader: PluginLoader;
  isPluginSystemEnabled: boolean;
  togglePluginSystem: () => void;
  loadPlugin: (pluginId: string, source?: any) => Promise<void>;
  unloadPlugin: (pluginId: string) => Promise<void>;
}

const PluginContext = createContext<PluginContextValue | null>(null);

export const usePluginSystem = () => {
  const context = useContext(PluginContext);
  if (!context) {
    throw new Error('usePluginSystem must be used within PluginProvider');
  }
  return context;
};

interface PluginProviderProps {
  children: React.ReactNode;
  enabledByDefault?: boolean;
}

// Gateway proxy that adds plugin ID header
class PluginGatewayProxy {
  constructor(
    private gateway: GatewayImpl,
    private pluginId: string
  ) {}
  
  async request<T = any>(endpoint: string, options: any = {}): Promise<T> {
    const headers = {
      'X-Kestrel-Plugin': this.pluginId,
      ...options.headers
    };
    
    return this.gateway.request(endpoint, { ...options, headers });
  }
  
  setAuthToken(token: string): void {
    this.gateway.setAuthToken(token);
  }
  
  setRateLimit(requestsPerMinute: number): void {
    this.gateway.setRateLimit(requestsPerMinute);
  }
}

export const PluginProvider: React.FC<PluginProviderProps> = ({ 
  children, 
  enabledByDefault = import.meta.env.VITE_PLUGINS_ENABLED === 'true'
}) => {
  const [isPluginSystemEnabled, setIsPluginSystemEnabled] = useState(enabledByDefault);
  
  // Initialize core plugin services
  const services = useMemo(() => {
    const eventBus = new EventBusImpl();
    const gateway = new GatewayImpl();
    const permissionManager = new PermissionManager();
    const themeManager = new ThemeManager();
    
    const pluginManager = new PluginManager(
      eventBus,
      gateway, 
      permissionManager,
      themeManager.getTheme()
    );
    
    const pluginLoader = new PluginLoader({
      allowRemotePlugins: import.meta.env.DEV,
      allowUnsignedPlugins: true,
      maxPluginSize: 10 * 1024 * 1024, // 10MB
      timeout: 30000
    });
    
    return {
      eventBus,
      gateway,
      permissionManager, 
      themeManager,
      pluginManager,
      pluginLoader
    };
  }, []);
  
  // Enhanced sync with Zustand - serializable data only
  const updatePluginStore = useDashboardStore(state => state.updatePluginStore);
  
  const syncPluginStateToStore = React.useCallback(() => {
    if (!isPluginSystemEnabled) {
      updatePluginStore({
        enabled: false,
        tabs: [],
        widgets: [],
        statuses: {}
      });
      return;
    }
    
    // Serialize tab data (no components in store)
    const tabs = services.pluginManager.getRegisteredTabs().map(tab => ({
      id: tab.id,
      label: tab.label,
      pluginId: tab.pluginId,
      order: tab.order
    }));
    
    // Serialize widget data (no components in store)
    const widgets = services.pluginManager.getRegisteredWidgets().map(widget => ({
      id: widget.id,
      title: widget.title,
      pluginId: widget.pluginId,
      sizeHints: widget.sizeHints,
      category: widget.category
    }));
    
    // Serialize plugin statuses
    const statusArray = services.pluginManager.getAllPluginStatuses();
    const statuses = statusArray.reduce((acc, { id, name, status }) => {
      acc[id] = { status, name };
      return acc;
    }, {} as Record<string, { status: string; name: string }>);
    
    updatePluginStore({
      enabled: isPluginSystemEnabled,
      tabs,
      widgets,
      statuses
    });
  }, [isPluginSystemEnabled, services, updatePluginStore]);
  
  useEffect(() => {
    if (!isPluginSystemEnabled) return;
    
    // Listen for plugin lifecycle events
    const unsubscribeLoaded = services.eventBus.subscribe('plugin.loaded', syncPluginStateToStore);
    const unsubscribeUnloaded = services.eventBus.subscribe('plugin.unloaded', syncPluginStateToStore);
    const unsubscribeError = services.eventBus.subscribe('plugin.error', syncPluginStateToStore);
    
    // Initial sync
    syncPluginStateToStore();
    
    return () => {
      unsubscribeLoaded();
      unsubscribeUnloaded();
      unsubscribeError();
    };
  }, [isPluginSystemEnabled, services, syncPluginStateToStore]);
  
  // Enhanced plugin loading with per-plugin isolation
  const loadPlugin = async (pluginId: string, source?: any) => {
    if (!isPluginSystemEnabled) {
      throw new Error('Plugin system is disabled');
    }
    
    try {
      const pluginSource = source || {
        type: 'bundled' as const,
        id: pluginId,
        name: `${pluginId} Plugin`,
        version: '1.0.0'
      };
      
      const plugin = await services.pluginLoader.loadPlugin(pluginSource);
      
      // Create per-plugin isolated context
      const pluginStorage = new StorageImpl(`kestrel:${pluginId}`);
      const pluginGateway = new PluginGatewayProxy(services.gateway, pluginId);
      const pluginPermissions = services.permissionManager.createChecker(pluginId, plugin.permissions);
      
      const pluginHostContext: HostContext = {
        eventBus: services.eventBus,
        gateway: pluginGateway,
        storage: pluginStorage,
        theme: services.themeManager.getTheme(),
        permissions: pluginPermissions
      };
      
      // Load plugin with isolated context
      await services.pluginManager.loadPlugin(plugin, pluginHostContext);
      
      console.log(`Plugin ${pluginId} loaded successfully with isolated context`);
    } catch (error) {
      console.error(`Failed to load plugin ${pluginId}:`, error);
      throw error;
    }
  };
  
  const unloadPlugin = async (pluginId: string) => {
    if (!isPluginSystemEnabled) {
      return;
    }
    
    try {
      await services.pluginManager.unloadPlugin(pluginId);
      services.pluginLoader.unloadPlugin(pluginId);
      console.log(`Plugin ${pluginId} unloaded successfully`);
    } catch (error) {
      console.error(`Failed to unload plugin ${pluginId}:`, error);
      throw error;
    }
  };
  
  const togglePluginSystem = () => {
    setIsPluginSystemEnabled(prev => !prev);
  };
  
  // Auto-load development plugins (opt-in via env)
  useEffect(() => {
    if (!isPluginSystemEnabled || !import.meta.env.DEV) return;
    
    const autoloadPlugins = import.meta.env.VITE_AUTOLOAD_PLUGINS?.split(',') || ['dummy'];
    
    const loadDevelopmentPlugins = async () => {
      for (const pluginId of autoloadPlugins) {
        try {
          await loadPlugin(pluginId.trim());
        } catch (error) {
          console.warn(`Failed to auto-load dev plugin ${pluginId}:`, error);
        }
      }
    };
    
    const timer = setTimeout(loadDevelopmentPlugins, 100);
    return () => clearTimeout(timer);
  }, [isPluginSystemEnabled]);
  
  const contextValue: PluginContextValue = {
    pluginManager: services.pluginManager,
    pluginLoader: services.pluginLoader,
    isPluginSystemEnabled,
    togglePluginSystem,
    loadPlugin,
    unloadPlugin
  };
  
  return (
    <PluginContext.Provider value={contextValue}>
      {children}
    </PluginContext.Provider>
  );
};

// Enhanced plugin component wrapper with proper error boundary
export const withPluginErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  pluginId: string,
  componentType: 'tab' | 'widget' = 'widget'
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const { pluginManager } = usePluginSystem();
    
    const handleError = (error: Error, errorInfo: any) => {
      console.error(`Plugin ${pluginId} ${componentType} error:`, error, errorInfo);
      
      // Emit error event
      pluginManager['eventBus'].emit('plugin.component.error', {
        version: '1.0',
        timestamp: Date.now(),
        source: pluginId,
        data: { 
          pluginId, 
          componentType, 
          error: error.message,
          stack: error.stack
        }
      });
    };
    
    const handleRecover = () => {
      // Attempt to recover by reloading the plugin
      console.log(`Attempting to recover plugin ${pluginId}`);
      // Could implement plugin reload logic here
    };
    
    const handleDisable = () => {
      pluginManager.killSwitch(pluginId);
    };
    
    return (
      <AppErrorBoundary
        onError={handleError}
        fallback={({ error, retry }) => (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <h4 className="font-medium text-red-800">Plugin Error</h4>
            </div>
            <p className="text-sm text-red-600 mb-3">
              Plugin "{pluginId}" {componentType} encountered an error: {error.message}
            </p>
            <div className="flex gap-2">
              <button 
                onClick={retry}
                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Retry
              </button>
              <button 
                onClick={handleRecover}
                className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
              >
                Recover
              </button>
              <button 
                onClick={handleDisable}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
              >
                Disable Plugin
              </button>
            </div>
          </div>
        )}
      >
        <div 
          data-plugin-component={pluginId} 
          data-component-type={componentType}
        >
          <WrappedComponent {...props} ref={ref} />
        </div>
      </AppErrorBoundary>
    );
  });
};