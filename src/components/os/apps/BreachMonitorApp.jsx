import React from 'react';
import { eventBus } from '../../../lib/eventBus';
import { useToast } from '../../ui/ToastProvider.jsx';

export default function BreachMonitorApp(){
  const { push } = useToast();
  const [events, setEvents] = React.useState([]);

  React.useEffect(() => {
    const unsub = eventBus.subscribe('threshold.breach', (e) => {
      const rec = { id: `${e.metric}-${e.at}`, metric: e.metric, value: e.value, threshold: e.threshold, at: e.at || Date.now() };
      setEvents(v => [rec, ...v].slice(0, 50));
      const variant = (e.value >= (e.threshold+10)) ? 'critical' : 'warning';
      push({ title: variant==='critical' ? 'CRITICAL Threshold Breach' : 'Threshold Breach',
             description: `${e.metric?.toUpperCase?.() || 'metric'} ${e.value}% (≥ ${e.threshold}%)`, variant });
    });
    return () => unsub && unsub();
  }, [push]);

  return (
    <div className="h-full w-full p-3 overflow-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Threshold Breach Monitor</h2>
        <div className="text-xs opacity-70">Listening for <code>threshold.breach</code></div>
      </div>

      {events.length === 0 ? (
        <div className="text-sm opacity-70">No breaches yet. Trigger one via <code>POST /api/metrics/emit-breach</code> or the button below.</div>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left opacity-70">
            <tr><th className="py-1">Time</th><th>Metric</th><th>Value</th><th>Threshold</th></tr>
          </thead>
          <tbody>
            {events.map(e => (
              <tr key={e.id} className="border-t border-neutral-800">
                <td className="py-1">{new Date(e.at).toLocaleTimeString()}</td>
                <td className="uppercase">{e.metric}</td>
                <td className={e.value >= e.threshold+10 ? 'text-red-400' : 'text-amber-300'}>{e.value}</td>
                <td>{e.threshold}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="mt-4 flex gap-2">
        <button className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700"
          onClick={async () => {
            await fetch('/api/metrics/emit-breach', { method: 'POST', headers: {
              'X-App-ID': 'kestrel-breach-monitor', 'Authorization': 'Bearer demo'
            }});
          }}>
          Emit demo breach (API)
        </button>
        <button className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700"
          onClick={() => { window.__kestrelBus?.emit('threshold.breach', { version:'1.0', metric:'cpu', value: 92, threshold: 85, at: Date.now() }); }}>
          Local test (no API)
        </button>
      </div>
    </div>
  );
}
