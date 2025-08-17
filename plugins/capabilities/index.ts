//src/plugins/capabilities/index.ts
import Ajv from "ajv";
import { usePluginStore } from "../../store/usePluginStore";
import { useDashboardStore } from "../../store/useDashboardStore";

const ajv = new Ajv({ allErrors: true, removeAdditional: "failing" });

const schemas = {
  "metrics.read.getSeries": {
    type: "object",
    properties: {
      id: { type: "string" },
      from: { type: "number" },
      to: { type: "number" },
      step: { type: "number", minimum: 1 }
    },
    required: ["id","from","to","step"],
    additionalProperties: false
  },
  "alerts.write.raise": {
    type: "object",
    properties: {
      severity: { enum: ["info","warning","error","critical"] },
      title: { type: "string", minLength: 1 },
      details: { type: "string" }
    },
    required: ["severity","title"],
    additionalProperties: false
  },
  "plugins.registerWidget": {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      size: { type: "object", properties: { w:{type:"number"}, h:{type:"number"} }, additionalProperties:false }
    },
    required: ["id","name"],
    additionalProperties: false
  },
  "bus.subscribe": { type:"object", properties:{ topic:{type:"string"} }, required:["topic"], additionalProperties:false },
  "bus.publish":  { type:"object", properties:{ topic:{type:"string"}, payload:{} }, required:["topic"], additionalProperties:true },
  "bus.unsubscribe": { type:"object", properties:{ topic:{type:"string"} }, required:["topic"], additionalProperties:false }
};

const validators: Record<string, any> = {};
Object.keys(schemas).forEach(k => validators[k] = ajv.compile((schemas as any)[k]));

const allowTopic = (pluginId:string, topic:string) => topic.startsWith("public:");

const subs = new Map<string, Set<string>>(); // topic -> set(pluginId)
function deliver(pluginId:string, msg:any) {
  const port = usePluginStore.getState().getRuntimePort(pluginId);
  if (port) port.postMessage(msg);
}

export async function invokeCapability(pluginId:string, method:string, args:any) {
  const v = validators[method];
  if (v && !v(args)) throw new Error(`invalid args: ${ajv.errorsText(v.errors)}`);

  switch (method) {
    case "metrics.read.getSeries": {
      const { id, from, to, step } = args;
      const { getMetricSeries } = useDashboardStore.getState();
      return await getMetricSeries?.(id, { from, to, step });
    }
    case "alerts.write.raise": {
      const { severity, title, details } = args;
      const { raisePluginAlert } = useDashboardStore.getState();
      return await raisePluginAlert?.({ severity, title, details, source: pluginId });
    }
    case "plugins.registerWidget": {
      const { registerWidgetShell } = usePluginStore.getState();
      registerWidgetShell({
        id: args.id,
        name: args.name,
        mountKind: "iframe",
        pluginId,
        size: args.size,
        category: "plugin"
      });
      return { ok: true };
    }
    case "bus.subscribe": {
      const t = String(args.topic);
      if (!allowTopic(pluginId, t)) throw new Error("topic denied");
      const s = subs.get(t) ?? new Set<string>(); s.add(pluginId); subs.set(t, s);
      return { ok: true };
    }
    case "bus.unsubscribe": {
      subs.get(String(args.topic))?.delete(pluginId);
      return { ok: true };
    }
    case "bus.publish": {
      const t = String(args.topic);
      if (!allowTopic(pluginId, t)) throw new Error("topic denied");
      for (const pid of subs.get(t) ?? []) if (pid !== pluginId) deliver(pid, { type:"bus:event", topic:t, payload: args.payload });
      return { ok: true };
    }
    default: throw new Error(`unknown method: ${method}`);
  }
}

