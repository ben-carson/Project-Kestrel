//src/plugins/infrastructure/data/mockSource.ts

import type { InfraDataSource, InfraSnapshot, InfraEvent } from './types';

// These are the files currently spamming your console:
import * as evo from '../../../data/dynamicServerEvolution'; // <-- existing file
// If the mocks expose start/stop/subscribe, use them; otherwise simulate here.

export class MockInfraSource implements InfraDataSource {
  private unsub: null | (() => void) = null;
  private snapshot: InfraSnapshot = { servers: [], topology: [] };

  async start() {
    // If evo has a start() use it; otherwise, initialize your timers here.
    if (typeof (evo as any).start === 'function') (evo as any).start();
    // Derive initial snapshot if the mock exposes it; else synthesize
    this.snapshot = (evo as any).getSnapshot?.() ?? this.snapshot;

    if (typeof (evo as any).onEvent === 'function') {
      this.unsub = (evo as any).onEvent((evt: InfraEvent) => {
        // update local snapshot if your mock emits state deltas
        if ((evo as any).getSnapshot) this.snapshot = (evo as any).getSnapshot();
      });
    }
  }

  async stop() {
    if (typeof (evo as any).stop === 'function') (evo as any).stop();
    this.unsub?.(); this.unsub = null;
  }

  getSnapshot(): InfraSnapshot {
    return this.snapshot;
  }

  onEvent(cb: (evt: InfraEvent) => void) {
    if (typeof (evo as any).onEvent === 'function') {
      return (evo as any).onEvent(cb);
    }
    return () => {};
  }
}