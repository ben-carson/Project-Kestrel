// src/core/Storage.ts - Missing StorageImpl module
import { StorageAPI } from '../Types/plugin';

export class StorageImpl implements StorageAPI {
  private prefix: string;
  private memoryStore = new Map<string, any>(); // Fallback for non-browser environments
  
  constructor(namespace: string) {
    this.prefix = `${namespace}:`;
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
  
  // Utility methods
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
  
  size(): number {
    return this.keys().length;
  }
}

// src/core/ThemeManager.ts - Missing ThemeManager module
import { ThemeTokens } from '../Types/plugin';

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

// src/core/EventBus.ts - Enhanced with schema validation
import { EventPayload, EventSchema, CORE_EVENT_SCHEMAS } from '../Types/plugin';
import Ajv from 'ajv';

export class EventBusImpl {
  private listeners = new Map<string, Set<(payload: EventPayload) => void>>();
  private schemas = new Map<string, EventSchema>();
  private ajv = new Ajv({ allErrors: true }); // Enhanced error reporting
  private eventLog: Array<{ timestamp: number; event: string; payload: EventPayload }> = [];
  private maxLogSize = 1000; // Keep last 1000 events for debugging
  
  constructor() {
    // Register core schemas
    CORE_EVENT_SCHEMAS.forEach(schema => {
      this.registerSchema(schema);
    });
  }
  
  registerSchema(schema: EventSchema): void {
    const key = `${schema.name}@${schema.version}`;
    this.schemas.set(key, schema);
    
    try {
      this.ajv.addSchema(schema.payloadSchema, key);
      console.log(`Event schema registered: ${key}`);
    } catch (error) {
      console.error(`Failed to register event schema ${key}:`, error);
    }
  }
  
  emit(eventName: string, payload: EventPayload): void {
    const key = `${eventName}@${payload.version}`;
    
    // Validate against schema if available
    if (this.schemas.has(key)) {
      const valid = this.ajv.validate(key, payload.data);
      if (!valid) {
        console.error(`Event validation failed for ${key}:`, {
          errors: this.ajv.errors,
          payload: payload.data
        });
        
        // In development, throw error; in production, just log and continue
        if (import.meta.env.DEV) {
          throw new Error(`Invalid event payload for ${key}: ${this.ajv.errorsText()}`);
        }
        return;
      }
    } else {
      console.warn(`No schema registered for event: ${key}`);
    }
    
    // Log event for debugging
    this.logEvent(eventName, payload);
    
    // Emit to listeners
    const listeners = this.listeners.get(eventName);
    if (listeners && listeners.size > 0) {
      listeners.forEach(listener => {
        try {
          listener(payload);
        } catch (error) {
          console.error(`Error in event listener for ${eventName}:`, error);
        }
      });
    }
  }
  
  subscribe(eventName: string, handler: (payload: EventPayload) => void): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    
    this.listeners.get(eventName)!.add(handler);
    
    return () => this.unsubscribe(eventName, handler);
  }
  
  unsubscribe(eventName: string, handler: (payload: EventPayload) => void): void {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      listeners.delete(handler);
      if (listeners.size === 0) {
        this.listeners.delete(eventName);
      }
    }
  }
  
  private logEvent(eventName: string, payload: EventPayload): void {
    this.eventLog.push({
      timestamp: Date.now(),
      event: eventName,
      payload: { ...payload }
    });
    
    // Keep log size under control
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }
  }
  
  // Debug methods
  getEventLog(): Array<{ timestamp: number; event: string; payload: EventPayload }> {
    return [...this.eventLog];
  }
  
  getRegisteredSchemas(): string[] {
    return Array.from(this.schemas.keys());
  }
  
  getListenerCount(eventName: string): number {
    return this.listeners.get(eventName)?.size || 0;
  }
  
  getAllListenerCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    this.listeners.forEach((listeners, eventName) => {
      counts[eventName] = listeners.size;
    });
    return counts;
  }
  
  clearEventLog(): void {
    this.eventLog = [];
  }
}

// Export all for easy importing
export { StorageImpl, ThemeManager, DEFAULT_THEME_TOKENS, EventBusImpl };