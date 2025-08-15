// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './setupMetrics.ts';
import App from './App.jsx';

import { eventBus } from "./core/eventBusSingleton";
import { attachKestrelMetrics } from "./core/eventBusMetrics";
import { getMetricsSource } from "./services/metricsSource"; // <- use named sources

const initializeMetrics = () => {
  const wsUrl = import.meta.env.VITE_WS_URL; // e.g. wss://api.yourdomain/ws/metrics

  // 1) Prefer WebSocket push (attach per source)
  if (wsUrl) {
    console.log('[main] Initializing WebSocket metrics sources:', wsUrl);

    // Global stream
    getMetricsSource('global').attachWebSocket({
      url: wsUrl,
      query: import.meta.env.VITE_WS_TOKEN ? { token: import.meta.env.VITE_WS_TOKEN, stream: 'global' } : { stream: 'global' },
      backoff: { baseMs: 500, maxMs: 15000 },
      onAuthError: () => console.warn('[metrics] WS auth error (global); will keep retrying.'),
    });

    // System Health stream (scoped)
    getMetricsSource('system-health').attachWebSocket({
      url: wsUrl,
      query: import.meta.env.VITE_WS_TOKEN ? { token: import.meta.env.VITE_WS_TOKEN, stream: 'system' } : { stream: 'system' },
      backoff: { baseMs: 500, maxMs: 15000 },
      onAuthError: () => console.warn('[metrics] WS auth error (system-health); will keep retrying.'),
    });

    return 'websocket';
  }

  // 2) Fall back to in-proc EventBus push (dev)
  if (eventBus) {
    console.log('[main] Initializing EventBus metrics sources');

    // Feed the global cards app
    attachKestrelMetrics(eventBus, { sourceKey: 'global' });

    // Feed System Health only when payload has scope === "system"
    attachKestrelMetrics(eventBus, {
      sourceKey: 'system-health',
      filter: (p) => p?.scope === 'system',
    });

    return 'eventbus';
  }

  // 3) No push configured — widgets can choose polling in their settings
  console.warn('[main] No push source available; metrics will use polling if enabled in widgets');
  return 'polling';
};

const metricsMode = initializeMetrics();
console.log(`[main] Metrics initialized in ${metricsMode} mode`);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
