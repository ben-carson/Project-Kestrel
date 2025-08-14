import { useMemo } from 'react';
import { usePluginSystem } from '../components/os/PluginProvider';
import { resolveWidgetWithManager, ResolvedWidget } from '../lib/resolveWidget';

export function useResolvedWidget(widgetId: string): ResolvedWidget {
  const { pluginManager } = usePluginSystem();
  return useMemo(() => resolveWidgetWithManager(widgetId, pluginManager), [widgetId, pluginManager]);
}
