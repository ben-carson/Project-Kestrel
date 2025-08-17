// src/core/busShim.js
export function busPublish(bus, topic, data) {
  if (!bus) return;
  try {
    if (typeof bus.publish     === "function") return bus.publish(topic, data);
    if (typeof bus.emit        === "function") return bus.emit(topic, data);
    if (typeof bus.dispatch    === "function") return bus.dispatch(topic, data);
    if (typeof bus.postMessage === "function") return bus.postMessage({ topic, data });
    if (typeof bus.next        === "function") return bus.next({ topic, data });
    console.warn("[eventBus] no publish-like method; skipped", topic);
  } catch (e) {
    console.warn("[eventBus] publish failed:", e);
  }
}
