// Wires /api/events (SSE) into the frontend EventBus.
// Requires AppRegistry to contain an app with id 'kestrel-core' that has 'events:publish' permission.
// If AppRegistry isn't present, we no-op safely.
let es: EventSource | null = null;

export function startSSEBridge(url: string = '/api/events', emitterId: string = 'kestrel-core') {
  if (typeof window === 'undefined') return;
  if (es) return; // already started
  
  try {
    es = new EventSource(url);
  } catch (e) {
    console.warn('[SSE] EventSource unsupported?', e);
    return;
  }
  
  const forward = async (type: string, data: any) => {
    try {
      const mod = await import('./eventBus');
      const { eventBus } = mod as any;
      eventBus.emit(emitterId, type, data);
    } catch (e) {
      // If your eventBus lives elsewhere (e.g., '../lib/eventBus'), adjust this import path.
      console.warn('[SSE] eventBus not found; event dropped:', type, data);
    }
  };
  
  es.addEventListener('open', () => console.log('[SSE] connected'));
  es.addEventListener('error', (e) => console.warn('[SSE] error', e));
  es.addEventListener('message', (e: MessageEvent) => {
    // default channel
    try { 
      const data = JSON.parse(e.data); 
      forward('events.message', data); 
    } catch {}
  });
  
  // Explicit channels we broadcast from the server
  ['simulation.complete', 'threshold.breach'].forEach((evt) => {
    es!.addEventListener(evt, (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        forward(evt, data);
      } catch {}
    });
  });
}