//src/plugins/infrastructure/data/liveSource.ts

import type { InfraDataSource, InfraSnapshot, InfraEvent } from './types';

export class LiveInfraSource implements InfraDataSource {
  private snapshot: InfraSnapshot = { servers: [], topology: [] };
  private abort?: AbortController;

  async start() {
    this.abort = new AbortController();
    // TODO: replace with your real endpoints or sim-engine selectors
    const res = await fetch('/api/infra/snapshot', { signal: this.abort.signal });
    if (res.ok) this.snapshot = await res.json();
    // Optionally open SSE/websocket for events and update snapshot on the fly
  }

  async stop() {
    this.abort?.abort();
  }

  getSnapshot(): InfraSnapshot {
    return this.snapshot;
  }

  onEvent(cb: (evt: InfraEvent) => void) {
    // TODO: wire to SSE or EventBus subscription; return unsubscribe
    return () => {};
  }
}