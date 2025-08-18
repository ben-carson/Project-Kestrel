//src/components/os/apps/SystemHealthApp.jsx
import React, { Suspense, lazy } from "react";
const SystemHealthTrend = lazy(() => import("../../widgets/SystemHealthTrend.jsx"));

export default function SystemHealthApp() {
  return (
    <Suspense fallback={<div className="p-4 text-xs text-gray-400">Loading…</div>}>
      <SystemHealthTrend
        sourceKey="system-health"     // <- a different feed + settings
      />
    </Suspense>
  );
}
