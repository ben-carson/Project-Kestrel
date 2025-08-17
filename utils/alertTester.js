// src/tools/alertTester.js
import { useAlertStore } from "@/store/useAlertStore";

/**
 * Emit a synthetic alert into the store (for smoke tests / demos)
 * @param {Partial<import("@/store/useAlertStore").Alert>} a
 */
export function emitTestAlert(a = {}) {
  const alert = {
    id:
      a.id ||
      `${a.type || "test"}:${a.sourceId || Math.random().toString(36).slice(2)}`,
    type: a.type || "test_event",
    sourceId: a.sourceId || "test-node",
    title: a.title || "Synthetic alert",
    description: a.description || "",
    severity: a.severity || "warning",
    timestamp: a.timestamp || Date.now(),
    serverInfo: a.serverInfo,
  };
  useAlertStore.getState().recordAlert(alert);
  return alert.id;
}

/**
 * Wait until an alert with id (or predicate) is seen in history within timeout
 */
export async function waitForAlert(match, timeoutMs = 3000, pollMs = 100) {
  const start = Date.now();
  const predicate =
    typeof match === "function"
      ? match
      : (a) => a.id === match || a.type === match;

  return new Promise((resolve, reject) => {
    const tick = () => {
      const hist = useAlertStore.getState().alertHistory;
      if (hist.some(predicate)) return resolve(true);
      if (Date.now() - start > timeoutMs) return reject(new Error("timeout"));
      setTimeout(tick, pollMs);
    };
    tick();
  });
}
