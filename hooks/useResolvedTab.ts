import { useMemo } from 'react';
import { usePluginSystem } from '../components/os/PluginProvider';
import { resolveTabWithManager, ResolvedTab } from '../lib/resolveTab';

export function useResolvedTab(tabId: string): ResolvedTab {
  const { pluginManager } = usePluginSystem();
  // Stable bridge creation not needed since helper is pure, but memo keeps identity tidy
  return useMemo(() => resolveTabWithManager(tabId, pluginManager), [tabId, pluginManager]);
}
