import React from 'react';
import { eventBus } from '../lib/eventBus';
import { useToast } from '../components/ui/ToastProvider.jsx';
import { useUIStore } from '../store/useUIStore.ts'; // assumes your store path

export default function useBreachToasts(){
  const { push } = useToast();
  const launchApp = useUIStore(s => s.launchApp);

  React.useEffect(() => {
    return eventBus.subscribe('threshold.breach', (e) => {
      const variant = (e.value >= (e.threshold+10)) ? 'critical' : 'warning';
      push({
        title: variant==='critical' ? 'CRITICAL Threshold Breach' : 'Threshold Breach',
        description: `${e.metric?.toUpperCase?.() || 'metric'} ${e.value}% (≥ ${e.threshold}%)`,
        variant,
        actions: [
          { label: 'Open Monitor', onClick: () => launchApp?.('kestrel-breach-monitor') }
        ]
      });
    });
  }, [push, launchApp]);
}
