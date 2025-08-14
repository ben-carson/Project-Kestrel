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
