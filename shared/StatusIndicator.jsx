// src/components/shared/StatusIndicator.jsx
import React from "react";
export default function StatusIndicator({ status = 'ok' }){
  const color = status === 'ok' ? 'bg-emerald-500'
    : status === 'warn' || status === 'degraded' ? 'bg-amber-500'
    : status === 'error' || status === 'down' ? 'bg-red-500'
    : 'bg-gray-400';
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />;
}
