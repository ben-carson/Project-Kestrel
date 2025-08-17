// src/services/metricsSource.js
// One shared source for performance metrics: supports push (EventBus/WebSocket) or pull (fetch/API)

// Helpers
const coerce = (v, d) => (Number.isFinite(v) ? v : d);
const withDefaults = (p) => ({
  ts: Date.now(),
  cpu: coerce(p?.cpu, 0),
  mem: coerce(p?.mem, 0),
  net: coerce(p?.net, 0),
  io: coerce(p?.io, 0),
  resp: coerce(p?.resp, 0),
});

class MetricsSource {
  constructor() {
    this.listeners = new Set();
    this.timer = null;
    this.hz = 1 / 60; // default: 1 sample per minute
    this.getter = async () => ({});
    this.unsubscribePush = null;
    this.last = { ts: 0, cpu: 0, mem: 0, net: 0, io: 0, resp: 0 };

    // WebSocket fields
    this.ws = undefined;
    this.wsCfg = undefined;
    this.reconnectTimer = null;
    this.reconnectDelay = 0;
  }

  /** PULL MODE (polling) */
  setGetter(getter) {
    this.detachPush();
    this.getter = getter;
    if (this.listeners.size > 0) {
      this.stop();
      this.start(); // restart pull loop
    }
  }

  setRate(hz) {
    this.hz = Math.max(1 / 600, hz); // floor: one per 10 min
    if (!this.unsubscribePush && !this.ws && this.listeners.size > 0) {
      this.stop();
      this.start();
    }
  }

  /** PUSH MODE (EventBus, sockets, etc.) */
  attachPush(register) {
    this.stop(); // stop pull loop
    this.detachPush();
    this.unsubscribePush = register((partial) => {
      const sample = withDefaults(partial);
      this.last = sample;
      for (const l of this.listeners) l(sample);
    });
  }

  /** WebSocket PUSH MODE */
  attachWebSocket(cfg) {
    // stop pull mode; detach any prior push
    this.stop();
    this.detachPush();

    this.wsCfg = cfg;
    this.openWebSocket();
  }

  openWebSocket() {
    if (!this.wsCfg) return;

    // Build URL with query params if provided
    const url = new URL(this.wsCfg.url);
    if (this.wsCfg.query) {
      for (const [k, v] of Object.entries(this.wsCfg.query)) {
        url.searchParams.set(k, v);
      }
    }

    try {
      this.ws = new WebSocket(url.toString(), this.wsCfg.protocols || []);
    } catch (error) {
      console.warn('[MetricsSource] WebSocket creation failed:', error);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      console.log('[MetricsSource] WebSocket connected');
      this.reconnectDelay = 0; // reset backoff
    };

    this.ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(typeof ev.data === "string" ? ev.data : "");
        // Expect { cpu, mem, net, io, resp } (ts optional)
        const sample = withDefaults({
          ts: data.ts || Date.now(),
          cpu: data.cpu,
          mem: data.mem,
          net: data.net,
          io: data.io,
          resp: data.resp,
        });
        this.last = sample;
        for (const l of this.listeners) l(sample);
      } catch (error) {
        console.warn('[MetricsSource] Invalid WebSocket frame:', error);
      }
    };

    this.ws.onclose = (ev) => {
      console.log('[MetricsSource] WebSocket closed:', ev.code, ev.reason);
      // Treat 1008/1011/4001/4401 as auth-ish if you use custom codes
      if (ev.code === 1008 || ev.code === 4001 || ev.code === 4401) {
        this.wsCfg?.onAuthError?.();
      }
      this.ws = undefined;
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.warn('[MetricsSource] WebSocket error:', error);
      // Let onclose handle reconnect
    };
  }

  scheduleReconnect() {
    if (!this.wsCfg) return;
    const base = this.wsCfg.backoff?.baseMs ?? 500;
    const max = this.wsCfg.backoff?.maxMs ?? 15000;
    this.reconnectDelay = this.reconnectDelay
      ? Math.min(this.reconnectDelay * 2, max)
      : base;

    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      console.log('[MetricsSource] Attempting WebSocket reconnect...');
      this.openWebSocket();
    }, this.reconnectDelay);
  }

  detachPush() {
    // Existing EventBus detach
    if (this.unsubscribePush) {
      try { this.unsubscribePush(); } catch {}
      this.unsubscribePush = null;
    }

    // WebSocket detach
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = undefined;
    }
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.reconnectDelay = 0;
    this.wsCfg = undefined;
  }

  /** Consumers */
  subscribe(fn) {
    this.listeners.add(fn);
    if (this.last.ts) fn(this.last);
    // Start loop if in pull mode and not running
    if (!this.unsubscribePush && !this.ws && !this.timer) this.start();
    return () => {
      this.listeners.delete(fn);
      if (this.listeners.size === 0) {
        this.stop();
        // keep push reg active; it's fine to stay attached for future listeners
      }
    };
  }

  getSnapshot() {
    return this.last;
  }

  /** Check current mode */
  getMode() {
    if (this.ws?.readyState === WebSocket.OPEN) return 'websocket';
    if (this.unsubscribePush) return 'eventbus';
    if (this.timer) return 'polling';
    return 'idle';
  }

  /** Internal pull loop (recursive timeout to avoid overlap) */
  start() {
    if (this.unsubscribePush || this.ws) return; // push mode active
    const tickMs = Math.floor(1000 / this.hz);
    const loop = async () => {
      if (this.unsubscribePush || this.ws || this.listeners.size === 0) {
        this.timer = null;
        return;
      }
      try {
        const p = (await Promise.resolve(this.getter())) || {};
        const sample = withDefaults(p);
        this.last = sample;
        for (const l of this.listeners) l(sample);
      } catch (error) {
        console.warn('[MetricsSource] Polling error:', error);
      }
      this.timer = setTimeout(loop, tickMs);
    };
    this.timer = setTimeout(loop, tickMs);
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

export const metricsSource = new MetricsSource();

// ---- Named metrics sources (so each app/widget can have its own feed) ----
export const GLOBAL_SOURCE_KEY = "global";
const _metricsRegistry = new Map();
/**
 * Get (or create) a metrics source by key.
 * - "global" returns the existing `metricsSource` singleton
 * - any other key returns a per-key instance (created on first use)
 */
export function getMetricsSource(key = GLOBAL_SOURCE_KEY) {
  if (key === GLOBAL_SOURCE_KEY) return metricsSource;

  let src = _metricsRegistry.get(key);
  if (!src) {
    src = new MetricsSource();
    _metricsRegistry.set(key, src);
  }
  return src;
}