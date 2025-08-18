// Simple app wrapper that renders the modular widget
import React from "react";
import { NetworkTopology } from "../../widgets/NetworkTopology";

export default function NetworkTopologyApp() {
  return <div className="h-full w-full"><NetworkTopology /></div>;
}
