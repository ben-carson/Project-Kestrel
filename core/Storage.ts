// src/core/Storage.ts
import type { StorageAPI } from "../types/plugin";

export class StorageImpl implements StorageAPI {
  private prefix: string;
  private memoryStore = new Map<string, unknown>(); // Fallback for non-browser environments

  constructor(namespace: string) {
    this.prefix = `kestrel:${namespace}:`;
  }

  get<T = any>(key: string): T | undefined {
    const fullKey = this.prefix + key;
    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(fullKey);
        return raw ? (JSON.parse(raw) as T) : undefined;
      }
      return this.memoryStore.get(fullKey) as T | undefined;
    } catch (err) {
      console.error(`Storage get error for key ${key}:`, err);
      return undefined;
    }
  }

  set<T = any>(key: string, value: T): void {
    const fullKey = this.prefix + key;
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(fullKey, JSON.stringify(value));
      } else {
        this.memoryStore.set(fullKey, value);
      }
    } catch (err) {
      console.error(`Storage set error for key ${key}:`, err);
    }
  }

  remove(key: string): void {
    const fullKey = this.prefix + key;
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(fullKey);
      } else {
        this.memoryStore.delete(fullKey);
      }
    } catch (err) {
      console.error(`Storage remove error for key ${key}:`, err);
    }
  }

  clear(): void {
    try {
      if (typeof localStorage !== "undefined") {
        const toRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(this.prefix)) toRemove.push(k);
        }
        toRemove.forEach((k) => localStorage.removeItem(k));
      } else {
        for (const k of Array.from(this.memoryStore.keys())) {
          if (k.startsWith(this.prefix)) this.memoryStore.delete(k);
        }
      }
    } catch (err) {
      console.error("Storage clear error:", err);
    }
  }

  keys(): string[] {
    try {
      if (typeof localStorage !== "undefined") {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(this.prefix)) {
            keys.push(k.substring(this.prefix.length));
          }
        }
        return keys;
      } else {
        return Array.from(this.memoryStore.keys())
          .filter((k) => k.startsWith(this.prefix))
          .map((k) => k.substring(this.prefix.length));
      }
    } catch (err) {
      console.error("Storage keys error:", err);
      return [];
    }
  }

  size(): number {
    return this.keys().length;
  }
}
