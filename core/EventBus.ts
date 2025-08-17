// src/core/EventBus.ts
/**
 * Capable event bus with:
 *  - exact + wildcard topics ("app.*", "*.error")
 *  - subscribe / once / unsubscribe
 *  - last-value replay (exact topic)
 *  - middleware pipeline
 *  - lightweight request/response (RPC) with timeouts
 *  - subscriber counts, clear(), getLast()
 */

export type Handler<T = unknown> = (payload: T) => void;

export interface Subscription {
  readonly pattern: string;
  off(): void;
}

export interface MiddlewareContext<T = unknown> {
  topic: string;
  payload: T;
  next: (topic: string, payload: T) => void;
  stopPropagation: () => void;
}

export type Middleware = <T = unknown>(ctx: MiddlewareContext<T>) => void;

export interface IEventBus {
  publish<T = unknown>(topic: string, payload: T): void;
  subscribe<T = unknown>(
    pattern: string,
    handler: Handler<T>,
    opts?: { replayLatest?: boolean }
  ): Subscription;
  once<T = unknown>(pattern: string, handler: Handler<T>): Subscription;
  request<TReq = unknown, TRes = unknown>(
    topic: string,
    req: TReq,
    timeoutMs?: number
  ): Promise<TRes>;
  respond<TReq = unknown, TRes = unknown>(
    pattern: string,
    fn: (req: TReq) => Promise<TRes> | TRes
  ): Subscription;
  use(mw: Middleware): () => void;
  hasSubscribers(topic: string): boolean;
  subscriberCount(pattern?: string): number;
  clear(pattern?: string): void;
  getLast<T = unknown>(topic: string): T | undefined;
}

type InternalHandler = { handler: Handler<any>; pattern: string };

function matchTopic(pattern: string, topic: string): boolean {
  if (pattern === topic) return true;
  const star = pattern.indexOf("*");
  if (star === -1) return false;
  const pre = pattern.slice(0, star);
  const post = pattern.slice(star + 1);
  return topic.startsWith(pre) && topic.endsWith(post);
}

/** Exported impl class to satisfy existing imports */
export class EventBusImpl implements IEventBus {
  private handlers = new Map<string, Set<InternalHandler>>();
  private middlewares: Middleware[] = [];
  private latest = new Map<string, unknown>();

  publish<T = unknown>(topic: string, payload: T): void {
    this.latest.set(topic, payload);

    const mws = [...this.middlewares];
    let stopped = false;
    const stopPropagation = () => { stopped = true; };

    const run = (i: number, t: string, p: unknown) => {
      if (stopped) return;
      if (i < mws.length) {
        const mw = mws[i];
        mw({
          topic: t,
          payload: p,
          stopPropagation,
          next: (nt, np) => run(i + 1, nt, np),
        });
      } else {
        this.deliver(t, p);
      }
    };

    run(0, topic, payload);
  }

  private deliver(topic: string, payload: unknown) {
    const exact = this.handlers.get(topic);
    if (exact) {
      for (const h of [...exact]) {
        try { h.handler(payload); }
        catch (e) { console.error(`[bus] handler error for "${topic}"`, e); }
      }
    }
    for (const [pattern, set] of this.handlers) {
      if (pattern === topic || !pattern.includes("*")) continue;
      if (!matchTopic(pattern, topic)) continue;
      for (const h of [...set]) {
        try { h.handler(payload); }
        catch (e) { console.error(`[bus] handler error for "${pattern}" -> "${topic}"`, e); }
      }
    }
  }

  subscribe<T = unknown>(
    pattern: string,
    handler: Handler<T>,
    opts?: { replayLatest?: boolean }
  ): Subscription {
    const set = this.handlers.get(pattern) ?? new Set<InternalHandler>();
    this.handlers.set(pattern, set);
    const rec: InternalHandler = { pattern, handler: handler as Handler<any> };
    set.add(rec);

    if (opts?.replayLatest && !pattern.includes("*")) {
      const last = this.latest.get(pattern);
      if (typeof last !== "undefined") {
        queueMicrotask(() => {
          try { handler(last as T); }
          catch (e) { console.error(`[bus] replay handler error for "${pattern}"`, e); }
        });
      }
    }

    return {
      pattern,
      off: () => {
        const s = this.handlers.get(pattern);
        if (!s) return;
        s.delete(rec);
        if (s.size === 0) this.handlers.delete(pattern);
      },
    };
  }

  once<T = unknown>(pattern: string, handler: Handler<T>): Subscription {
    const sub = this.subscribe<T>(pattern, (p) => {
      try { handler(p); } finally { sub.off(); }
    });
    return sub;
  }

  request<TReq = unknown, TRes = unknown>(
    topic: string,
    req: TReq,
    timeoutMs = 5000
  ): Promise<TRes> {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const replyTopic = `${topic}.reply.${id}`;

    return new Promise<TRes>((resolve, reject) => {
      const timer = setTimeout(() => {
        sub.off();
        reject(new Error(`RPC timeout for "${topic}" after ${timeoutMs}ms`));
      }, timeoutMs);

      const sub = this.once<TRes>(replyTopic, (res) => {
        clearTimeout(timer);
        resolve(res);
      });

      this.publish(topic, { __rpc: true, id, replyTo: replyTopic, payload: req } as any);
    });
  }

  respond<TReq = unknown, TRes = unknown>(
    pattern: string,
    fn: (req: TReq) => Promise<TRes> | TRes
  ): Subscription {
    return this.subscribe<any>(pattern, async (msg) => {
      const isRpc = msg && typeof msg === "object" && msg.__rpc && msg.replyTo;
      const payload: TReq = isRpc ? msg.payload : msg;
      try {
        const out = await fn(payload);
        if (isRpc) this.publish<TRes>(msg.replyTo, out);
      } catch (e) {
        if (isRpc) this.publish(msg.replyTo, { error: String(e ?? "unknown") } as any);
        else console.error(`[bus] respond handler error for "${pattern}"`, e);
      }
    });
  }

  use(mw: Middleware): () => void {
    this.middlewares.push(mw);
    return () => {
      const i = this.middlewares.indexOf(mw);
      if (i >= 0) this.middlewares.splice(i, 1);
    };
  }

  hasSubscribers(topic: string): boolean {
    if (this.handlers.has(topic)) return true;
    for (const pattern of this.handlers.keys()) {
      if (pattern.includes("*") && matchTopic(pattern, topic)) return true;
    }
    return false;
  }

  subscriberCount(pattern?: string): number {
    if (!pattern) {
      let n = 0;
      for (const set of this.handlers.values()) n += set.size;
      return n;
    }
    return this.handlers.get(pattern)?.size ?? 0;
  }

  clear(pattern?: string): void {
    if (!pattern) { this.handlers.clear(); return; }
    this.handlers.delete(pattern);
  }

  getLast<T = unknown>(topic: string): T | undefined {
    return this.latest.get(topic) as T | undefined;
  }
}

/** Singleton instance used across the app */
export const eventBus: IEventBus = new EventBusImpl();

/** Optional default export for convenience */
export default eventBus;

// Debug handle
// @ts-expect-error debug-only
if (typeof window !== "undefined") (window as any).__kestrelBus = eventBus;
