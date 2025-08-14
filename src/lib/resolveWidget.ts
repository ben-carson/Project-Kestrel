// src/lib/resolveWidget.ts
import type React from 'react';
import { LegacyBridge } from '../core/LegacyBridge';
import type { PluginManager } from '../core/PluginManager';

export type ResolvedWidget<P = {}> = {
  id: string;
  title: string;
  component: React.ComponentType<P>;
  sizeHints?: { defaultWidth: number; defaultHeight: number };
  isLegacy: boolean;
} | null;

export function resolveWidgetWithManager<P = {}>(
  widgetId: string,
  pluginManager: PluginManager
): ResolvedWidget<P> {
  const bridge = new LegacyBridge(pluginManager);
  const w = bridge.getWidget(widgetId);
  if (!w) return null;
  return {
    id: w.id,
    title: w.title,
    component: w.component as React.ComponentType<P>,
    sizeHints: w.sizeHints,
    isLegacy: !!w.isLegacy,
  };
}
