//src/plugins/infrastructure/data/types.ts
export type ServerId = string;

export interface InfraEvent {
  type: 'threshold.breach' | 'simulation.complete' | 'insight.generated';
  ts: number;
  payload: any;
}

export interface InfraSnapshot {
  servers: Array<{ id: ServerId; name: string; health: number; cpu: number }>;
  topology: Array<{ from: ServerId; to: ServerId; weight?: number }>;
}

export interface InfraDataSource {
  start(): Promise<void> | void;
  stop(): Promise<void> | void;
  getSnapshot(): Promise<InfraSnapshot> | InfraSnapshot;
  onEvent?(cb: (evt: InfraEvent) => void): () => void; // returns unsubscribe
}
