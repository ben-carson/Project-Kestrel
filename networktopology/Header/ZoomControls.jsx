// src/components/widgets/NetworkTopology/Header/ZoomControls.jsx
import React from "react";

export default function ZoomControls({ zoom }) {
  if (!zoom) return null;
  const pct = Math.round((zoom.viewport?.k ?? 1) * 100);

  return (
    <div className="rounded-lg border bg-white/70 backdrop-blur p-2 flex items-center gap-2">
      <button onClick={() => zoom.zoomOut?.()} aria-label="Zoom out">−</button>
      <div className="min-w-[3ch] text-center tabular-nums">{pct}%</div>
      <button onClick={() => zoom.zoomIn?.()} aria-label="Zoom in">+</button>
      <div className="w-px h-5 bg-black/10 mx-1" />
      <button onClick={() => zoom.center?.()} aria-label="Center">Center</button>
      <button onClick={() => zoom.reset?.()} aria-label="Reset">Reset</button>
    </div>
  );
}
