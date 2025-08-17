// src/main.jsx
import React, { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./setupMetrics.ts";
import App from "./App.jsx";

// Event bus + metrics
import { eventBus, busPublish } from "./core/busShim";
import { attachKestrelMetrics } from "./core/eventBusMetrics";

// Optional metrics helper if you use it elsewhere
// import { getMetricsSource } from "./services/metricsSource";

// Plugin system boot
import { registerLocalShells } from "./bootstrap/registerLocalShells";
import { loadRuntimePlugins } from "./plugins/runtimeLoader";

// Simulation modules
import { mockServerData } from "./data/mockserverdata";
import { createDynamicEnterpriseSystem } from "./data/dynamicServerEvolution";
import { IncidentInjectionAPI, HistoricalReplayManager } from "./data/nextLevelServerFeatures";

// Discovery / topology
import { initializeServiceDiscovery, getDefaultApplications } from "./lib/appInitialization.js";
import { ApplicationTopologyManager, assignServerPersonalities } from "./lib/nextLevelServerFeatures.js";

// Expose a topology manager early for dev dashboards (starts empty; sim will replace it)
const __apps = getDefaultApplications();
const __servers = [];
const __topology = new ApplicationTopologyManager(__apps, __servers);
// @ts-expect-error debug handle
if (typeof window !== "undefined") window.topologyManager = __topology;

/**
 * Initialize live metrics transport:
 *   1) WebSocket push if VITE_WS_URL is set
 *   2) DEV simulation fallback (dynamic evolution + incident API)
 *   3) Else, widgets may fall back to polling
 *
 * Returns: "websocket" | "simulation" | "polling"
 */
function initializeMetrics() {
  const wsUrl = import.meta.env.VITE_WS_URL;

  // --- 1) WebSocket push (stub: add your WS bridge here) ---
  if (wsUrl) {
    console.log("[main] Initializing WebSocket metrics source:", wsUrl);
    // Example sketch (left for your implementation):
    // const ws = new WebSocket(wsUrl);
    // ws.onmessage = (ev) => {
    //   const msg = JSON.parse(ev.data);
    //   busPublish(eventBus, "metrics", msg); // { scope, payload }
    // };
    return "websocket";
  }

  // --- 2) Development fallback: dynamic simulation ---
  if (import.meta.env.DEV) {
    console.log("[main] Initializing DYNAMIC SIMULATION as metrics source");

    // Seed world with personalities
    const seededServers = assignServerPersonalities(mockServerData.serverOverview);
    const seedData = { ...mockServerData, serverOverview: seededServers };

    // Fresh topology + dynamic system
    const topologyManager = new ApplicationTopologyManager(seedData.applications, seedData.serverOverview);
    const dynamicSystem = createDynamicEnterpriseSystem(seedData);
    const incidentApi = new IncidentInjectionAPI(dynamicSystem);

    // Replace the debug handle so tools can inspect live state
    // @ts-expect-error debug handle
    if (typeof window !== "undefined") window.topologyManager = topologyManager;

    // Wire bus → sinks
    attachKestrelMetrics(eventBus, { sourceKey: "global", topic: "metrics" });
    attachKestrelMetrics(eventBus, {
      sourceKey: "system-health",
      topic: "metrics",
      filter: (m) => m?.scope === "system",
    });

    // Evolution tick → publish both streams
    const onEvolutionTick = (evolvedServers, systemHealth, _unused, context) => {
      const liveAppHealthEntries = topologyManager.getAllApplicationHealth(evolvedServers);
      const liveAppHealth = Object.fromEntries(liveAppHealthEntries);

      busPublish(eventBus, "metrics", {
        scope: "system",
        payload: { systemHealth, applicationHealth: liveAppHealth },
      });

      busPublish(eventBus, "metrics", {
        scope: "global",
        payload: { servers: evolvedServers, ...context },
      });
    };

    dynamicSystem.setEvolutionCallback(onEvolutionTick);
    dynamicSystem.startEvolution(3000); // every 3s

    // Demo incident after 15s (safe-guarded)
    setTimeout(() => {
      try {
        const target = seedData.serverOverview.find((s) => s.name === "app-dotnet-01");
        if (target) {
          console.warn(`[sim] Injecting 'memory_exhaustion' into ${target.name}`);
          incidentApi.injectIncident(target.id, "memory_exhaustion", { duration: 30000 });
        }
      } catch (e) {
        console.error("[sim] incident injection failed:", e);
      }
    }, 15000);

    return "simulation";
  }

  // --- 3) No push configured → polling fallback at widget level ---
  console.warn("[main] No push source; widgets may use polling");
  return "polling";
}

function Boot() {
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    try {
      const mode = initializeMetrics();
      console.log(`[main] Metrics initialized: ${mode}`);

      // Optional: mark boot in the metrics stream
      busPublish(eventBus, "metrics", { scope: "app", payload: { bootTs: Date.now(), mode } });

      // Start discovery if you need it (no-op if fn returns a disposer)
      try {
        const disposeDiscovery = initializeServiceDiscovery?.();
        // You can store disposer if needed: disposeDiscovery?.();
      } catch (e) {
        console.warn("[discovery] init error:", e);
      }

      // Register local shells (tabs/widgets/services)
      registerLocalShells();

      // Load runtime plugins (remote or local bundles)
      loadRuntimePlugins().catch((e) => console.error("[plugins] runtime loader failed:", e));
    } catch (e) {
      console.error("[boot] failed:", e);
    }
  }, []);

  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");
createRoot(root).render(<Boot />);
