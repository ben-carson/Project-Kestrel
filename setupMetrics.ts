// src/setupMetrics.ts
import { metricsSource } from "./services/metricsSource";
import type { IEventBus } from "./core/eventBus";
import { attachKestrelMetrics } from "./core/eventBusMetrics";

export function initializeMetrics(bus: IEventBus | undefined) {
  attachKestrelMetrics(bus);
  bus?.publish("app:boot", { ts: Date.now() });
}
// Example: plug in your existing sampler (sync or async)
metricsSource.setGetter(async () => {
  // Replace with your real source
  // e.g., query a mock server, window.bridge, WebSocket snapshot, etc.
  // Must return partial { cpu, mem, net, io, resp }
  return {
    cpu: Math.random() * 100,
    mem: 40 + Math.random() * 30,
    net: Math.random() * 200,
    io:  Math.random() * 8000,
    resp: 50 + Math.random() * 150,
  };
});

// Optionally change rate:
// metricsSource.setRate(10);
