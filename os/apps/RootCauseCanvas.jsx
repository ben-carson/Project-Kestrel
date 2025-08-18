// src/components/os/apps/RootCauseCanvas.jsx
import React from "react";
import RootCauseCanvas from "../../widgets/RootCauseCanvas";

export default function RootCause() {
  return (
    <div className="p-4 h-screen bg-slate-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto h-full">
        <RootCauseCanvas />
      </div>
    </div>
  );
}