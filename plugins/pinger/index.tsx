import { createPlugin } from "@/types/plugin";
import React from "react";

const PingerButton: React.FC = () => {
  const [n, setN] = React.useState(0);
  return (
    <button
      onClick={() => setN(v => v + 1)}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-neutral-700/60"
      title="Pinger"
    >
      ?? <span className="text-xs opacity-80">{n}</span>
    </button>
  );
};

export default createPlugin(
  { id: "kestrel.pinger", name: "Pinger", version: "0.1.0", kind: "service", enabledByDefault: true },
  {
    register: (r) => r.addSystemItem?.({
      type: "system-item",
      id: "pinger",
      placement: "systemBar.right",
      render: PingerButton
    })
  }
);
