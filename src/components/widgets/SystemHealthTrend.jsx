// src/components/widgets/SystemHealthTrend.jsx
import React, { useMemo, useEffect, useReducer } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
// Corrected import paths to be relative
import { getMetricsSource } from "../../services/metricsSource";

// --- Helper functions and local state management ---

/** Immutable ring push: returns a *new* array bounded to max */
function ringPushImmutable(arr, value, max) {
  const next = arr.length >= max ? arr.slice(1) : arr.slice(0);
  next.push(value);
  return next;
}

/** Reducer to manage the component's local history buffer */
function historyReducer(state, action) {
  if (action.type === 'ADD_SAMPLE') {
    const sample = action.payload;
    const cap = action.cap;
    
    // Create the next state immutably
    const nextHistory = { ...state };
    for (const key in sample) {
      if (state.hasOwnProperty(key)) {
        nextHistory[key] = ringPushImmutable(state[key], sample[key], cap);
      }
    }
    return nextHistory;
  }
  return state;
}

// Define the shape of our history object
const initialHistory = { ts: [], cpu: [], mem: [], net: [], io: [], resp: [] };

/**
 * SystemHealthTrend
 * - Live data from named metrics source (default: "system-health")
 * - Uses a local, bounded history buffer (no memory leaks)
 * - Subscribes directly to the source instead of misusing the polling hook
 */
export default function SystemHealthTrend({
  sourceKey = "system-health",
  windowPoints = 120, // show last N points
  cap = 720,          // keep up to N samples in memory
}) {
  // 1) Get the named metrics source
  const source = useMemo(() => getMetricsSource(sourceKey), [sourceKey]);

  // 2) Use a reducer to manage this widget's local history
  const [history, dispatch] = useReducer(historyReducer, initialHistory);

  // 3) Subscribe to the source and dispatch samples to our local state
  useEffect(() => {
    // The subscribe method returns an `unsubscribe` function for cleanup
    const unsubscribe = source.subscribe((sample) => {
      dispatch({ type: 'ADD_SAMPLE', payload: sample, cap });
    });

    // On unmount, call the cleanup function
    return () => unsubscribe();
  }, [source, cap]); // Re-subscribe only if the source or cap changes

  // 4) Adapt our history arrays into recharts-friendly objects
  const data = useMemo(() => {
    const n = history.ts.length;
    if (!n) return [];
    const start = Math.max(0, n - windowPoints);
    const out = [];
    for (let i = start; i < n; i++) {
      const ts = history.ts[i];
      const cpu = history.cpu[i] ?? 0;
      const mem = history.mem[i] ?? 0;
      const net = history.net[i] ?? 0;
      const io  = history.io[i]  ?? 0;
      const resp= history.resp[i]?? 0;

      // Derived values for convenience
      const latency = resp;
      const storageIO = io;
      // Crude "health" heuristic (tweak later): higher CPU/Mem/Latency -> lower health
      const health = Math.max(0, Math.min(100, 100 - 0.4 * cpu - 0.4 * mem - 0.2 * (resp / 10)));

      out.push({
        time: new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        cpu: round(cpu),
        mem: round(mem),
        latency: round(latency),
        storageIO: round(storageIO),
        net: round(net),
        health: round(health),
      });
    }
    return out;
  // only recompute when the time axis changes (cheap & reliable)
  }, [history.ts, windowPoints]);

  const hasData = data.length > 0;

  return (
    <div className="p-4">
      <div className="mb-2 text-sm text-gray-300">
        System Health Trend {hasData ? null : <span className="text-yellow-400/80">· waiting for samples…</span>}
      </div>

      <div className="h-64 w-full rounded-xl border border-white/10 bg-white/5">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis dataKey="time" strokeOpacity={0.5} fontSize={12} />
            {/* Left axis for % metrics */}
            <YAxis yAxisId="left" domain={[0, 100]} strokeOpacity={0.5} fontSize={12} />
            {/* Right axis for absolute metrics */}
            <YAxis yAxisId="right" orientation="right" strokeOpacity={0.5} fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(20, 20, 20, 0.8)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '0.75rem',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Line yAxisId="left"  type="monotone" dataKey="cpu"     name="CPU %"     stroke="#8884d8" strokeWidth={2} dot={false} />
            <Line yAxisId="left"  type="monotone" dataKey="mem"     name="Memory %"  stroke="#82ca9d" strokeWidth={2} dot={false} />
            <Line yAxisId="left"  type="monotone" dataKey="health"  name="Health %"  stroke="#ffc658" strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="latency" name="Latency (ms)" stroke="#ff8042" strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="storageIO" name="Storage (ops)" stroke="#00C49F" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function round(n) {
  return Math.round((Number(n) || 0) * 10) / 10;
}