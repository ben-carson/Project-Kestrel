// src/hooks/usePerformanceMetrics.js
import { useEffect, useReducer } from 'react';

export const DEFAULT_SAMPLE_CAP = 600; // 60s @ 10Hz by default

export const METRICS_CONFIG = {
  cpu: { label: 'CPU', unit: '%' },
  mem: { label: 'Memory', unit: '%' },
  net: { label: 'Network', unit: 'mbps' },
  io: { label: 'Storage I/O', unit: 'ops' },
  resp: { label: 'Response', unit: 'ms' },
};

function ringPush(arr, value, cap) {
  if (arr.length >= cap) {
    return [...arr.slice(1), value];
  }
  return [...arr, value];
}

function makeInitial(cap) {
  return {
    latest: { ts: 0, cpu: 0, mem: 0, net: 0, io: 0, resp: 0 },
    history: { ts: [], cpu: [], mem: [], net: [], io: [], resp: [] },
    cap,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_SAMPLE': {
      const sample = action.payload;
      const cap = state.cap;
      return {
        ...state,
        latest: sample,
        history: {
          ts: ringPush(state.history.ts, sample.ts, cap),
          cpu: ringPush(state.history.cpu, sample.cpu, cap),
          mem: ringPush(state.history.mem, sample.mem, cap),
          net: ringPush(state.history.net, sample.net, cap),
          io: ringPush(state.history.io, sample.io, cap),
          resp: ringPush(state.history.resp, sample.resp, cap),
        },
      };
    }
    case 'UPDATE_CAP': {
      const newCap = action.payload;
      if (newCap === state.cap) return state;
      
      // Trim existing history if new cap is smaller
      const trimArray = (arr) => arr.length > newCap ? arr.slice(-newCap) : arr;
      
      return {
        ...state,
        cap: newCap,
        history: {
          ts: trimArray(state.history.ts),
          cpu: trimArray(state.history.cpu),
          mem: trimArray(state.history.mem),
          net: trimArray(state.history.net),
          io: trimArray(state.history.io),
          resp: trimArray(state.history.resp),
        },
      };
    }
    default:
      return state;
  }
}

export function usePerformanceMetrics(subscribe, cap = DEFAULT_SAMPLE_CAP) {
  const [state, dispatch] = useReducer(reducer, cap, makeInitial);

  // Update cap if it changes
  useEffect(() => {
    dispatch({ type: 'UPDATE_CAP', payload: cap });
  }, [cap]);

  useEffect(() => {
    const unsubscribe = subscribe((sample) => {
      dispatch({ type: 'ADD_SAMPLE', payload: sample });
    });
    
    return () => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn('Error unsubscribing from metrics:', error);
      }
    };
  }, [subscribe]);

  return {
    latest: state.latest,
    history: state.history,
    cap: state.cap,
  };
}