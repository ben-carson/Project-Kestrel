// src/core/eventBusMetrics.ts
import type { IEventBus } from "./EventBus";
import { getMetricsSource } from "../services/metricsSource";

export interface MetricsAttachOptions {
  /** Bus topic to listen on (defaults to "metrics") */
  topic?: string;
  /** metrics sink key (getMetricsSource(key)) */
  sourceKey?: string;
  /** optional payload filter */
  filter?: (msg: any) => boolean;
  /** whether to replay last metrics on attach */
  replayLatest?: boolean;
}

/**
 * Forwards messages from the bus to a metrics sink.
 * Accepts raw payloads or envelopes like { scope, payload }.
 */
export function attachKestrelMetrics(
  bus: IEventBus | undefined,
  opts: MetricsAttachOptions = {}
): (() => void) | void {
  if (!bus) {
    console.warn("[metrics] event bus unavailable; metrics disabled");
    return;
  }

  const topic = opts.topic ?? "metrics";
  const sinkKey = opts.sourceKey ?? "global";
  const sink = getMetricsSource(sinkKey);

  const unsub = bus.subscribe(topic, (msg: any) => {
    try {
      if (opts.filter && !opts.filter(msg)) return;
      const payload = msg?.payload ?? msg;

      // Try observable-ish or push array-like sinks
      const s: any = sink;
      if (typeof s?.push === "function") s.push(payload);
      else if (typeof s?.next === "function") s.next(payload);
      else s.last = payload; // minimal fallback
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[metrics] sink error:", e);
    }
  }, { replayLatest: !!opts.replayLatest });

  return () => unsub.off();
}
