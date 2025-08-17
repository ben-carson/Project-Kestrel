// src/plugins/core/bus.ts
const subs = new Map<string, Set<string>>(); // topic -> pluginIds
const allow = new Map<string, Set<string>>(); // pluginId -> topics allowed

export function allowTopics(pluginId:string, topics:string[]) { allow.set(pluginId, new Set(topics)); }
export function subscribe(pluginId:string, topic:string) {
  if (!topic.startsWith("public:")) throw new Error("topic not allowed");
  const allowed = allow.get(pluginId); if (allowed && !allowed.has(topic)) throw new Error("topic denied");
  const s=subs.get(topic)??new Set(); s.add(pluginId); subs.set(topic,s);
}
export function unsubscribe(pluginId:string, topic:string) { subs.get(topic)?.delete(pluginId); }
export function publish(fromId:string, topic:string, payload:any) {
  if (!topic.startsWith("public:")) throw new Error("topic not allowed");
  for (const pid of subs.get(topic)??[]) { if (pid===fromId) continue; deliver(pid,{ type:"bus:event", topic, payload }); }
}
function deliver(pid:string, msg:any) { /* find pid port in sandboxRegistry and postMessage */ }
