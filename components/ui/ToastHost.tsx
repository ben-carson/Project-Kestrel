// src/components/ui/ToastHost.tsx
import React from "react";
import { useUIStore } from "../../store/useUIStore";

export default function ToastHost() {
  const { toasts, dismissToast } = useUIStore((s) => ({
    toasts: s.toasts,
    dismissToast: s.dismissToast,
  }));

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-3 py-2 rounded shadow text-sm text-white ${
            t.type === "success" ? "bg-green-600" :
            t.type === "warning" ? "bg-yellow-600" :
            t.type === "error"   ? "bg-red-600" :
                                   "bg-gray-800"
          }`}
        >
          <div className="flex items-center gap-3">
            <span>{t.message}</span>
            <button
              onClick={() => dismissToast(t.id)}
              className="opacity-80 hover:opacity-100"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
