// core/PermissionManager.ts
import { PermissionChecker, PermissionError, PermissionScope } from '../types/plugin';

export class PermissionManager {
  private pluginPermissions = new Map<string, Set<string>>();
  private permissionPolicies = new Map<string, boolean>(); // For policy overrides
  
  validatePermissions(pluginId: string, permissions: string[]): void {
    // Validate permission format
    permissions.forEach(permission => {
      if (!this.isValidPermission(permission)) {
        throw new PermissionError(permission, pluginId);
      }
    });
    
    // Check if plugin is allowed these permissions (policy check)
    const deniedPermissions = permissions.filter(p => !this.isPolicyAllowed(pluginId, p));
    if (deniedPermissions.length > 0) {
      throw new PermissionError(deniedPermissions[0], pluginId);
    }
    
    this.pluginPermissions.set(pluginId, new Set(permissions));
  }
  
  createChecker(pluginId: string, permissions: string[]): PermissionChecker {
    const permissionSet = new Set(permissions);
    
    return {
      hasPermission: (scope: string) => permissionSet.has(scope),
      
      checkPermission: (scope: string) => {
        if (!permissionSet.has(scope)) {
          throw new PermissionError(scope, pluginId);
        }
      },
      
      getPermissions: () => Array.from(permissionSet)
    };
  }
  
  revokePermission(pluginId: string, permission: string): void {
    const permissions = this.pluginPermissions.get(pluginId);
    if (permissions) {
      permissions.delete(permission);
    }
  }
  
  grantPermission(pluginId: string, permission: string): void {
    if (!this.isValidPermission(permission)) {
      throw new Error(`Invalid permission: ${permission}`);
    }
    
    let permissions = this.pluginPermissions.get(pluginId);
    if (!permissions) {
      permissions = new Set();
      this.pluginPermissions.set(pluginId, permissions);
    }
    permissions.add(permission);
  }
  
  getPluginPermissions(pluginId: string): string[] {
    const permissions = this.pluginPermissions.get(pluginId);
    return permissions ? Array.from(permissions) : [];
  }
  
  private isValidPermission(permission: string): boolean {
    // Validate permission format: category:action or category:resource.action
    const permissionRegex = /^[a-z]+:[a-z]+(\.[a-z]+)?$/;
    return permissionRegex.test(permission);
  }
  
  private isPolicyAllowed(pluginId: string, permission: string): boolean {
    // Check policy overrides
    const policyKey = `${pluginId}:${permission}`;
    const policyOverride = this.permissionPolicies.get(policyKey);
    if (policyOverride !== undefined) {
      return policyOverride;
    }
    
    // Default policies - can be configured
    const dangerousPermissions = [
      'actions:system.restart',
      'data:config.write',
      'events:system'
    ];
    
    return !dangerousPermissions.includes(permission);
  }
  
  setPermissionPolicy(pluginId: string, permission: string, allowed: boolean): void {
    const policyKey = `${pluginId}:${permission}`;
    this.permissionPolicies.set(policyKey, allowed);
  }
}

// core/Storage.ts
import { StorageAPI } from '../types/plugin';

export class StorageImpl implements StorageAPI {
  private prefix: string;
  private memoryStore = new Map<string, any>(); // Fallback for non-browser environments
  
  constructor(namespace: string) {
    this.prefix = `kestrel:${namespace}:`;
  }
  
  get<T = any>(key: string): T | null {
    const fullKey = this.prefix + key;
    
    try {
      if (typeof localStorage !== 'undefined') {
        const value = localStorage.getItem(fullKey);
        return value ? JSON.parse(value) : null;
      } else {
        return this.memoryStore.get(fullKey) || null;
      }
    } catch (error) {
      console.error(`Storage get error for key ${key}:`, error);
      return null;
    }
  }
  
  set(key: string, value: any): void {
    const fullKey = this.prefix + key;
    
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(fullKey, JSON.stringify(value));
      } else {
        this.memoryStore.set(fullKey, value);
      }
    } catch (error) {
      console.error(`Storage set error for key ${key}:`, error);
    }
  }
  
  remove(key: string): void {
    const fullKey = this.prefix + key;
    
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(fullKey);
      } else {
        this.memoryStore.delete(fullKey);
      }
    } catch (error) {
      console.error(`Storage remove error for key ${key}:`, error);
    }
  }
  
  clear(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        // Clear only keys with our prefix
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.prefix)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } else {
        // Clear only keys with our prefix from memory store
        Array.from(this.memoryStore.keys())
          .filter(key => key.startsWith(this.prefix))
          .forEach(key => this.memoryStore.delete(key));
      }
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }
  
  // Utility method to list all keys for this namespace
  keys(): string[] {
    try {
      if (typeof localStorage !== 'undefined') {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.prefix)) {
            keys.push(key.substring(this.prefix.length));
          }
        }
        return keys;
      } else {
        return Array.from(this.memoryStore.keys())
          .filter(key => key.startsWith(this.prefix))
          .map(key => key.substring(this.prefix.length));
      }
    } catch (error) {
      console.error('Storage keys error:', error);
      return [];
    }
  }
  
  // Utility method to get storage size for this namespace
  size(): number {
    return this.keys().length;
  }
}

// core/ThemeProvider.ts
import { ThemeTokens } from '../types/plugin';

export const DEFAULT_THEME_TOKENS: ThemeTokens = {
  colors: {
    primary: '#3b82f6',
    'primary-foreground': '#ffffff',
    secondary: '#6b7280',
    'secondary-foreground': '#ffffff',
    background: '#ffffff',
    foreground: '#1f2937',
    muted: '#f9fafb',
    'muted-foreground': '#6b7280',
    border: '#e5e7eb',
    input: '#ffffff',
    ring: '#3b82f6',
    destructive: '#ef4444',
    'destructive-foreground': '#ffffff',
    warning: '#f59e0b',
    'warning-foreground': '#1f2937',
    success: '#10b981',
    'success-foreground': '#ffffff',
    info: '#3b82f6',
    'info-foreground': '#ffffff'
  },
  spacing: {
    '0': '0px',
    '1': '0.25rem',
    '2': '0.5rem',
    '3': '0.75rem',
    '4': '1rem',
    '5': '1.25rem',
    '6': '1.5rem',
    '8': '2rem',
    '10': '2.5rem',
    '12': '3rem',
    '16': '4rem',
    '20': '5rem',
    '24': '6rem'
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace']
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }]
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    }
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  }
};

export class ThemeManager {
  private currentTheme: ThemeTokens = DEFAULT_THEME_TOKENS;
  private listeners = new Set<(theme: ThemeTokens) => void>();
  
  getTheme(): ThemeTokens {
    return { ...this.currentTheme };
  }
  
  updateTheme(updates: Partial<ThemeTokens>): void {
    this.currentTheme = {
      ...this.currentTheme,
      ...updates,
      colors: { ...this.currentTheme.colors, ...updates.colors },
      spacing: { ...this.currentTheme.spacing, ...updates.spacing },
      typography: { ...this.currentTheme.typography, ...updates.typography },
      breakpoints: { ...this.currentTheme.breakpoints, ...updates.breakpoints }
    };
    
    this.notifyListeners();
  }
  
  subscribe(listener: (theme: ThemeTokens) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getTheme());
      } catch (error) {
        console.error('Theme listener error:', error);
      }
    });
  }
  
  // Apply theme as CSS custom properties
  applyCSSVariables(element: HTMLElement = document.documentElement): void {
    Object.entries(this.currentTheme.colors).forEach(([key, value]) => {
      element.style.setProperty(`--color-${key}`, value);
    });
    
    Object.entries(this.currentTheme.spacing).forEach(([key, value]) => {
      element.style.setProperty(`--spacing-${key}`, value);
    });
  }
}