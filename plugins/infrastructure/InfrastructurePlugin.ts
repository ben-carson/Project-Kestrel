// src/plugins/infrastructure/InfrastructurePlugin.ts
import { createPlugin } from "../../types/plugin";
import InfrastructureTab from "./InfrastructureTab";

export default createPlugin(
  {
    id: "kestrel.infra",
    name: "Infrastructure",
    version: "0.1.0",
    kind: "tab",
    enabledByDefault: true,
    permissions: [{ id: "infra.view", description: "View Infrastructure tab" }],
  },
  {
    initialize: async ({ logger }) => logger.info("infra init"),
    register: (r) => {
      r.addTab({
        type: "tab",
        id: "infra-tab",
        title: "Infrastructure",
        component: InfrastructureTab,
        requiredPermissions: ["infra.view"],
        featureFlag: "VITE_ENABLE_INFRASTRUCTURE",
      });
    },
  }
);
