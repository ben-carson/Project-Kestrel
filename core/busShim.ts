// src/core/busShim.ts
// Thin wrapper so call sites can do: busPublish(eventBus, "metrics", payload)

import { eventBus as _eventBus } from "./EventBus";
import type { IEventBus } from "./EventBus";

// Re-export the singleton as a named export
export const eventBus: IEventBus = _eventBus;
export type { IEventBus };

export const busPublish = <T = unknown>(
  bus: IEventBus,
  topic: string,
  payload: T
) => bus.publish(topic, payload);

export const busSubscribe = <T = unknown>(
  bus: IEventBus,
  pattern: string,
  handler: (p: T) => void,
  opts?: { replayLatest?: boolean }
) => bus.subscribe<T>(pattern, handler, opts);

export const busOnce = <T = unknown>(
  bus: IEventBus,
  pattern: string,
  handler: (p: T) => void
) => bus.once<T>(pattern, handler);

export const busRequest = <TReq = unknown, TRes = unknown>(
  bus: IEventBus,
  topic: string,
  req: TReq,
  timeoutMs?: number
) => bus.request<TReq, TRes>(topic, req, timeoutMs);

export const busRespond = <TReq = unknown, TRes = unknown>(
  bus: IEventBus,
  pattern: string,
  fn: (req: TReq) => Promise<TRes> | TRes
) => bus.respond<TReq, TRes>(pattern, fn);
