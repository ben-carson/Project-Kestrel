// src/core/eventBusSingleton.ts
// Resolves whatever src/core/EventBus.ts exports into a real instance with on/subscribe.

import * as EB from "./EventBus";

function instantiate(Ctor: any) {
  try {
    const inst = new Ctor();
    return inst && (typeof inst.on === "function" || typeof inst.subscribe === "function") ? inst : null;
  } catch {
    return null;
  }
}

function resolveBus(mod: any) {
  // 1) named singleton
  if (mod?.eventBus && (mod.eventBus.on || mod.eventBus.subscribe)) return mod.eventBus;

  // 2) default export
  const d = mod?.default;
  if (d) {
    if (typeof d === "object" && (d.on || d.subscribe)) return d;
    if (typeof d === "function") {
      const maybe = instantiate(d);
      if (maybe) return maybe;
    }
  }

  // 3) class exports
  const Ctors = [mod?.EventBusImpl, mod?.EventBus];
  for (const C of Ctors) {
    if (typeof C === "function") {
      const maybe = instantiate(C);
      if (maybe) return maybe;
    }
  }

  return null;
}

const eventBus = resolveBus(EB);

export { eventBus };
export default eventBus;
