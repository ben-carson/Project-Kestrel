// src/core/eventBusMetrics.ts
import { metricsSource } from "../services/metricsSource";

const EVENT_NAME = "kestrel.metrics";

function makeRegistrar(bus: any) {
  if (!bus) return null;

  // Preferred: on/off
  if (typeof bus.on === "function") {
    return (cb: (p: any) => void) => {
      const ret = bus.on(EVENT_NAME, cb);
      if (typeof ret === "function") return ret;
      // Fallback disposers
      if (typeof bus.off === "function") return () => bus.off(EVENT_NAME, cb);
      if (typeof bus.removeListener === "function") return () => bus.removeListener(EVENT_NAME, cb);
      if (typeof bus.removeEventListener === "function") return () => bus.removeEventListener(EVENT_NAME, cb);
      return () => {};
    };
  }

  // Alternate: subscribe(event, cb) OR subscribe(cb)
  if (typeof bus.subscribe === "function") {
    return (cb: (p: any) => void) => {
      try {
        const ret = bus.subscribe(EVENT_NAME, cb);
        if (typeof ret === "function") return ret;
      } catch {
        /* try cb-only form below */
      }
      const ret2 = bus.subscribe(cb);
      return typeof ret2 === "function" ? ret2 : () => {};
    };
  }

  // DOM-style
  if (typeof bus.addEventListener === "function") {
    return (cb: (p: any) => void) => {
      bus.addEventListener(EVENT_NAME, cb);
      return () => bus.removeEventListener?.(EVENT_NAME, cb);
    };
  }

  return null;
}

export function attachKestrelMetrics(busOrModule: any) {
  const bus = busOrModule?.eventBus || busOrModule?.default || busOrModule;
  const registrar = makeRegistrar(bus);
  if (!registrar) {
    console.warn("[eventBusMetrics] Provided object is not a compatible EventBus; staying in polling mode.");
    return;
  }
  metricsSource.attachPush((cb) => registrar((payload: any) => cb(payload)));
}
