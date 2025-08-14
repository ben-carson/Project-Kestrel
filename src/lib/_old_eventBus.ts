import { AppRegistry } from '../components/os/apps/AppRegistry';

type Handler = (payload: any) => void;
type Schema = { version: string; required: string[] };

const EVENT_SCHEMAS: Record<string, Schema> = {
  'simulation.complete': { version: '1.0', required: ['id','result'] },
  'threshold.breach':    { version: '1.0', required: ['metric','value','threshold'] },
  'recommendation.new':  { version: '1.0', required: ['id','confidence','text'] },
};

function validatePayload(payload: any, schema: Schema) {
  if (!payload || payload.version !== schema.version) return false;
  return schema.required.every(k => payload[k] !== undefined);
}

class EventBus {
  private listeners = new Map<string, Set<Handler>>();

  private has(appId: string, perm: 'events:publish'|'events:subscribe') {
    const m = AppRegistry[appId];
    return !!m && m.permissions.includes(perm);
  }

  subscribe(appId: string, eventType: string, handler: Handler) {
    if (!this.has(appId, 'events:subscribe')) throw new Error(`App ${appId} lacks subscribe permission`);
    if (!this.listeners.has(eventType)) this.listeners.set(eventType, new Set());
    this.listeners.get(eventType)!.add(handler);
    return () => this.listeners.get(eventType)?.delete(handler);
  }

  emit(appId: string, eventType: string, payload: unknown) {
    if (!this.has(appId, 'events:publish')) throw new Error(`App ${appId} lacks publish permission`);
    const schema = EVENT_SCHEMAS[eventType];
    if (schema && !validatePayload(payload, schema)) throw new Error(`Invalid payload for ${eventType}`);
    const set = this.listeners.get(eventType);
    if (!set) return;
    for (const h of set) { try { h(payload); } catch(e) { console.error('[EventBus]', e); } }
  }
}

export const eventBus = new EventBus();
