// src/plugins/aida/index.tsx
import * as React from "react";
import type { HostContext, PluginManifest } from "../../Types/plugin";
import mockServerData, { getServersByDatacenter } from "../../data/mockserverdata";
import { createDynamicEnterpriseSystem } from "../../data/dynamicServerEvolution";

// Example AIDA tab/widget components (replace with your real ones)
const AidaInfrastructure = React.lazy(() => import("./views/InfrastructureTab"));
const AidaPlanner = React.lazy(() => import("./views/SimulationPlannerWidget"));

// AIDA plugin manifest
const manifest: PluginManifest = {
  id: "aida",
  name: "AIDA Infrastructure Intelligence",
  version: "1.0.0",
  permissions: [
    "events:publish",
    "events:subscribe",
    "data:metrics.read",
    "ui:window"
  ],
  tabs: [
    {
      id: "infrastructure-tab",
      label: "Infrastructure",
      order: 10,
      component: AidaInfrastructure
    }
  ],
  widgets: [
    {
      id: "simulation-planner",
      title: "Simulation Planner",
      component: AidaPlanner,
      sizeHints: { defaultWidth: 520, defaultHeight: 360 },
      category: "infrastructure"
    }
  ]
};

export default function register(host: HostContext) {
  let system: ReturnType<typeof createDynamicEnterpriseSystem> | null = null;
  let started = false;
  let unsubscribeList: Array<() => void> = [];

  function setup() {
    // Register any custom events your widgets/tabs need (example)
    // With the new EventBusImpl, duplicates will be ignored across instances.
    host.eventBus.registerSchema?.({
      name: "simulation.complete",
      version: "1.0",
      schema: {
        type: "object",
        properties: {
          runId: { type: "string" },
          result: { type: "string" },
          startedAt: { type: "number" },
          finishedAt: { type: "number" }
        },
        required: ["runId", "result"]
      }
    });

    // Initialize the evolved mock system once
    if (!system) {
      system = createDynamicEnterpriseSystem(mockServerData);
    }
    if (!started && system) {
      // You can pass a callback for UI updates here if desired
      system.startEvolution(3000);
      started = true;
    }

    // Example: subscribe to an event (unsubscribe on dispose)
    const un = host.eventBus.subscribe("threshold.breach", (payload) => {
      // handle the event or route to widgets
      // console.log("AIDA received threshold.breach", payload);
    });
    unsubscribeList.push(un);
  }

  function dispose() {
    // Stop evolution/timers and clear subscriptions
    if (system) {
      system.stopEvolution(); // clears its setInterval internally
    }
    unsubscribeList.forEach((fn) => {
      try { fn(); } catch {}
    });
    unsubscribeList = [];
    started = false;
  }

  return {
    manifest,
    setup,
    dispose
  };
}
