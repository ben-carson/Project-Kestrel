// Legacy shim: keep old imports working, but render the new modular widget.
import React from "react";
import { NetworkTopology } from "./NetworkTopology";

export default function EnterpriseNetworkTopology() {
  return <NetworkTopology />;
}
