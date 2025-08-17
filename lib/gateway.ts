// src/lib/gateway.ts
import { AppRegistry } from '../components/os/apps/AppRegistry';

class RateLimiter {
  private buckets = new Map<string, { tokens: number; last: number }>();
  constructor(private capacity = 10, private refillPerSec = 10) {}
  check(key: string) {
    const now = Date.now();
    const b = this.buckets.get(key) ?? { tokens: this.capacity, last: now };
    const elapsed = (now - b.last) / 1000;
    b.tokens = Math.min(this.capacity, b.tokens + elapsed * this.refillPerSec);
    b.last = now;
    if (b.tokens < 1) throw new Error(`Rate limit exceeded: ${key}`);
    b.tokens -= 1;
    this.buckets.set(key, b);
  }
}

class Gateway {
  private tokens = new Map<string, string>();
  private rl = new RateLimiter();

  setToken(appId: string, token: string) {
    this.tokens.set(appId, token);
  }

  clearToken(appId: string) {
    this.tokens.delete(appId);
  }

  // ✅ class field arrow with "=" and trailing ";"
  request = async (appId: string, endpoint: string, options?: RequestInit) => {
    if (!AppRegistry[appId]) throw new Error(`Unknown app ${appId}`);
    const scope = endpoint.split('/')[0] || 'default';
    this.rl.check(`${appId}:${scope}`);
    const token = this.tokens.get(appId);
    return fetch(`/api/${endpoint}`, {
      ...options,
      headers: {
        ...(options?.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'X-App-ID': appId,
      },
    });
  };
}

export const gateway = new Gateway();
