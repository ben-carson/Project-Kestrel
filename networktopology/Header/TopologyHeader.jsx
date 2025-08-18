// src/components/widgets/NetworkTopology/Header/TopologyHeader.jsx
import React from "react";

export default function TopologyHeader({ meta, onFit }) {
  const ok = meta?.ok ?? 0, degraded = meta?.degraded ?? 0, down = meta?.down ?? 0, total = meta?.total ?? 0;
  return (
    <header className="flex items-center justify-between border-b px-3 py-2">
      <div className="flex items-center gap-3">
        <div className="font-semibold">Network Topology</div>
        <div className="text-xs opacity-70">Total: {total} · OK: {ok} · Degraded: {degraded} · Down: {down}</div>
      </div>
      <div className="flex items-center gap-2">
        <button className="border px-2 py-1 rounded" onClick={onFit}>Fit</button>
      </div>
    </header>
  );
}
