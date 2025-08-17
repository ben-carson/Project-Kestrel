// src/store/useAlertStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

// ---- Core alert types (JS docs for clarity)
/**
 * @typedef {"critical"|"warning"|"info"} Severity
 * @typedef {{ id:string, type:string, sourceId?:string, title?:string, description?:string, severity:Severity, timestamp:number, serverInfo?:any }} Alert
 */

const MAX_ALERT_HISTORY = 5000;
const MAX_ACTION_HISTORY = 5000;

export const useAlertStore = create(
  persist(
    (set, get) => ({
      // Active stream (optional; widgets typically render from processed lists)
      alerts: /** @type {Alert[]} */ ([]),

      // History & actions
      alertHistory: /** @type {Alert[]} */ ([]),
      actionsHistory: /** @type {{alertId:string, actionId:string, result?:any, ts:number}[]} */ ([]),

      // Acks (stored as list to serialize)
      acknowledgedIds: /** @type {string[]} */ ([]),

      // --- API ---
      recordAlert: (alert) =>
        set((s) => {
          const alerts = [alert, ...s.alerts].slice(0, 1000);
          const alertHistory = [alert, ...s.alertHistory].slice(0, MAX_ALERT_HISTORY);
          return { alerts, alertHistory };
        }),

      recordAction: (alertId, actionId, result) =>
        set((s) => ({
          actionsHistory: [
            ...s.actionsHistory,
            { alertId, actionId, result, ts: Date.now() },
          ].slice(-MAX_ACTION_HISTORY),
        })),

      acknowledge: (id) =>
        set((s) => {
          if (s.acknowledgedIds.includes(id)) return {};
          return { acknowledgedIds: [...s.acknowledgedIds, id] };
        }),

      isAcknowledged: (id) => get().acknowledgedIds.includes(id),

      // Stats (fixed previous-hour math)
      getAlertStats: () => {
        const now = Date.now();
        const hourAgo = now - 60 * 60 * 1000;
        const twoHoursAgo = now - 2 * 60 * 60 * 1000;

        const lastHour = get().alertHistory.filter((a) => a.timestamp >= hourAgo);
        const prevHour = get().alertHistory.filter(
          (a) => a.timestamp > twoHoursAgo && a.timestamp < hourAgo
        );

        const countBy = (list, sev) => list.filter((a) => a.severity === sev).length;
        return {
          lastHour: {
            total: lastHour.length,
            critical: countBy(lastHour, "critical"),
            warning: countBy(lastHour, "warning"),
            info: countBy(lastHour, "info"),
          },
          previousHour: {
            total: prevHour.length,
            critical: countBy(prevHour, "critical"),
            warning: countBy(prevHour, "warning"),
            info: countBy(prevHour, "info"),
          },
        };
      },
    }),
    { name: "kestrel-alert-store" }
  )
);

// Optional quality monitor (start it once at boot if you want rolling KPIs)
export const alertQualityMonitor = {
  _timer: null,
  start(intervalMs = 60_000) {
    if (this._timer) return;
    this._timer = setInterval(() => {
      const stats = useAlertStore.getState().getAlertStats();
      // eslint-disable-next-line no-console
      console.debug("[alerts] quality tick:", stats);
    }, intervalMs);
  },
  stop() {
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
  },
};
