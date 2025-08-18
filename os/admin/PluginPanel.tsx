//src/components/os/admin/PluginPanel.tsx
import React, { useMemo, useState, useCallback } from 'react';
import { Plug, RefreshCcw, Power, Flag, Search, Wrench } from 'lucide-react';
import { usePluginStore, selectTabsByPlugin, selectWidgetsByPlugin, selectMigrationProgress } from '../../../store/usePluginStore';
import { usePluginSystem } from '../PluginProvider';
import { LegacyBridge } from '../../../core/LegacyBridge';

type StatusBadgeProps = { status?: string };
const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const s = (status || 'unknown').toLowerCase();
  const color =
    s === 'active' || s === 'loaded' ? 'bg-green-100 text-green-800 border-green-200' :
    s === 'error'  ? 'bg-red-100 text-red-800 border-red-200' :
    s === 'disabled' ? 'bg-gray-100 text-gray-700 border-gray-200' :
    'bg-amber-100 text-amber-800 border-amber-200';
  return <span className={`px-2 py-0.5 rounded border text-xs ${color}`}>{s}</span>;
};

export default function PluginPanel() {
  const { pluginManager, pluginLoader } = usePluginSystem();
  const { enabled, tabs, widgets, statuses, flags } = usePluginStore(s => ({
    enabled: s.enabled,
    tabs: s.tabs,
    widgets: s.widgets,
    statuses: s.statuses,
    flags: s.flags,
  }));
  const progress = usePluginStore(selectMigrationProgress);

  const [query, setQuery] = useState('');

  const bridge = useMemo(() => new LegacyBridge(pluginManager), [pluginManager]);

  const pluginIds = useMemo(() => {
    const ids = new Set<string>();
    tabs.forEach(t => ids.add(t.pluginId));
    widgets.forEach(w => ids.add(w.pluginId));
    Object.keys(statuses).forEach(id => ids.add(id));
    return Array.from(ids).sort();
  }, [tabs, widgets, statuses]);

  const filteredPluginIds = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pluginIds;
    return pluginIds.filter(id =>
      id.toLowerCase().includes(q) ||
      (statuses[id]?.name || '').toLowerCase().includes(q)
    );
  }, [pluginIds, statuses, query]);

  const byPlugin = useMemo(() => {
    const map = new Map<string, { tabs: typeof tabs; widgets: typeof widgets }>();
    for (const id of pluginIds) {
      map.set(id, {
        tabs: tabs.filter(t => t.pluginId === id),
        widgets: widgets.filter(w => w.pluginId === id),
      });
    }
    return map;
  }, [pluginIds, tabs, widgets]);

  const kill = useCallback(async (id: string) => {
    try {
      // prefer explicit kill switch if available
      if (typeof (pluginManager as any).killSwitch === 'function') {
        await (pluginManager as any).killSwitch(id);
      } else if (typeof (pluginManager as any).disable === 'function') {
        await (pluginManager as any).disable(id);
      } else {
        console.warn('No kill/disable method on pluginManager');
      }
    } catch (e) {
      console.error('Kill failed', e);
    }
  }, [pluginManager]);

  const reload = useCallback(async (id: string) => {
    try {
      if (typeof (pluginManager as any).reload === 'function') {
        await (pluginManager as any).reload(id);
        return;
      }
      // fallback: if we have a source registry on the manager/loader, attempt re-load
      if (typeof (pluginLoader as any).reload === 'function') {
        await (pluginLoader as any).reload(id);
      } else {
        console.warn('No reload method on pluginManager/pluginLoader');
      }
    } catch (e) {
      console.error('Reload failed', e);
    }
  }, [pluginManager, pluginLoader]);

  const toggleFlag = useCallback((key: string, value: boolean) => {
    try {
      bridge.setMigrationFlag(key, value);
    } catch (e) {
      console.warn('setMigrationFlag not available on LegacyBridge', e);
    }
  }, [bridge]);

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center gap-3">
        <Plug className="w-5 h-5" />
        <h2 className="text-xl font-semibold">Plugin Diagnostics</h2>
        <div className="ml-auto text-sm text-gray-600 dark:text-gray-300">
          System: <b>{enabled ? 'Enabled' : 'Disabled'}</b> • Migration progress: <b>{progress}%</b>
        </div>
      </header>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/50"
            placeholder="Search plugins by id or name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          title="Hard refresh"
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredPluginIds.map((id) => {
          const info = statuses[id] || { status: 'unknown', name: id };
          const group = byPlugin.get(id)!;
          const tabsFor = selectTabsByPlugin(id)({ enabled, flags, tabs, widgets, statuses });
          const widgetsFor = selectWidgetsByPlugin(id)({ enabled, flags, tabs, widgets, statuses });

          return (
            <div key={id} className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm bg-white/70 dark:bg-gray-900/40">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-sm font-semibold">{info.name || id}</div>
                <StatusBadge status={info.status} />
                <span className="ml-auto text-xs text-gray-500">{id}</span>
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                <div>Tabs: <b>{tabsFor.length}</b> • Widgets: <b>{widgetsFor.length}</b></div>
              </div>

              {tabsFor.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-medium mb-1">Tabs</div>
                  <ul className="space-y-1">
                    {tabsFor.map(t => (
                      <li key={t.id} className="flex items-center justify-between text-xs">
                        <span className="truncate">{t.label} <span className="text-gray-400">({t.id})</span></span>
                        <div className="flex items-center gap-1">
                          <button
                            title="Prefer plugin for this tab"
                            onClick={() => toggleFlag(t.id, true)}
                            className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {widgetsFor.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-medium mb-1">Widgets</div>
                  <ul className="space-y-1">
                    {widgetsFor.map(w => (
                      <li key={w.id} className="flex items-center justify-between text-xs">
                        <span className="truncate">{w.title} <span className="text-gray-400">({w.id})</span></span>
                        <div className="flex items-center gap-1">
                          <button
                            title="Prefer plugin for this widget"
                            onClick={() => toggleFlag(w.id, true)}
                            className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => reload(id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  Reload
                </button>
                <button
                  onClick={() => kill(id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-900/20 text-xs"
                >
                  <Power className="w-3.5 h-3.5" />
                  Disable
                </button>
                <div className="ml-auto text-xs text-gray-500 inline-flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5" /> migration flags via bridge
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPluginIds.length === 0 && (
        <div className="text-sm text-gray-500">No plugins match “{query}”.</div>
      )}
    </div>
  );
}
