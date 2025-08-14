// === File: src/store/useMAIAStore.ts ===

import { create } from 'zustand';

export const useMAIAStore = create((set, get) => ({
  // --- Existing State ---
  selectedAssets: [],
  insightMemory: [],
  activeInsight: null,
  memoryVersion: 1,
  changeHistory: [],
  recommendationLog: [],
  simulationContext: {
    assets: [],
    type: null,
    scope: null,
    impactSummary: null,
    humanRationale: '',
  },
  activePlan: null,
  debateLog: [],

  // === FIX #1: Add the missing 'initialize' action ===
  // This was causing the "useMAIAStore.getState(...).initialize is not a function" error.
  initialize: () => {
    console.log('MAIA store is being initialized.');
    set({
      selectedAssets: [],
      insightMemory: [],
      activeInsight: null,
      changeHistory: [],
      recommendationLog: [],
      debateLog: [],
      activePlan: null,
      simulationContext: {
        assets: [],
        type: null,
        scope: null,
        impactSummary: null,
        humanRationale: '',
      },
    });
  },

  // --- Existing Actions ---
  addDebateEntry: (entry) =>
    set((state) => ({
      debateLog: [...state.debateLog, entry].slice(-20),
    })),

  clearDebateLog: () => set({ debateLog: [] }),

  setSelectedAssets: (assets) => set({ selectedAssets: assets }),

  pushInsight: (insight) =>
    set((state) => ({
      insightMemory: [...state.insightMemory, insight],
      activeInsight: insight,
    })),

  pushRecommendation: (rec) =>
    set((state) => ({
      recommendationLog: [...state.recommendationLog, rec],
    })),

  pushChange: (change) =>
    set((state) => ({
      changeHistory: [...state.changeHistory, change],
    })),

  clearMemory: () =>
    set({
      insightMemory: [],
      activeInsight: null,
      memoryVersion: get().memoryVersion + 1,
    }),

  setActivePlan: (plan) => set({ activePlan: plan }),

  updateSimulationContext: (contextPatch) =>
    set((state) => ({
      simulationContext: {
        ...state.simulationContext,
        ...contextPatch,
      },
    })),
}));


// === FIX #2: Add the missing named export 'ingestInsightFromMAIA' ===
// This was causing the "does not provide an export named 'ingestInsightFromMAIA'" syntax error.
// It allows other modules to push insights into this store.
export const ingestInsightFromMAIA = (insight) => {
  useMAIAStore.getState().pushInsight(insight);
};