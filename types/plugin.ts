// src/types/plugin.ts
import type { ComponentType } from "react";

/** Bump when you change public plugin contracts */
export const PLUGIN_CONTRACT_VERSION = "1.0.0";

/** Base plugin error */
export class PluginError extends Error {
  cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "PluginError";
    this.cause = cause;
  }
}

/** Thrown when a permission check fails */
export class PermissionError extends PluginError {
  permission: string;
  constructor(permission: string, message = "Permission denied") {
    super(message);
    this.name = "PermissionError";
    this.permission = permission;
  }
}

/** Optional capability tiers you may reference in permission metadata */
export type Capability =
  | "read"
  | "write"
  | "admin"
  | "observe"
  | "simulate"
  | "control";

/** Minimal event bus shape exposed to plugins */
export interface EventBus {
  publish<T = unknown>(topic: string, payload: T): void;
  subscribe<T = unknown>(topic: string, handler: (payload: T) => void): () => void;
}

/** Context object provided to plugins */
export interface PluginContext {
  env: Record<string, string | boolean | number | undefined>;
  logger: {
    debug: (...args: unknown[]) => void;
    info:  (...args: unknown[]) => void;
    warn:  (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
  };
  bus?: EventBus;
  getService?<T = unknown>(key: string): T | undefined;
  hasPermission?(permId: string): boolean;
}

/** Runtime checker a plugin/util can call to gate behavior */
export type PermissionChecker = (permId: string) => boolean;

/** Storage contract some plugins may rely on */
export interface StorageAPI {
  get(key: string): Promise<string | undefined> | string | undefined;
  set(key: string, value: string): Promise<void> | void;
  remove?(key: string): Promise<void> | void;
  list?(prefix?: string): Promise<string[]> | string[];
}

/** Permission metadata for describing what a plugin needs/defines */
export interface Permission {
  id: string;
  description?: string;
  requiredCapabilities?: Capability[];
}

/** Registry items that place small buttons/icons into a system bar */
export interface SystemItemRegistration {
  type: "system-item";
  id: string;
  /** where it shows on the taskbar/system bar */
  placement: "systemBar.right" | "systemBar.left";
  /** tiny React button/icon; keep it small */
  render: ComponentType<any>;
  featureFlag?: string;
  requiredPermissions?: string[];
}

/** Supported plugin kinds */
export type PluginKind = "tab" | "widget" | "service";

/** Plugin metadata */
export interface PluginMeta {
  id: string;
  name: string;
  version: string;
  kind: PluginKind;
  description?: string;
  author?: string;
  enabledByDefault?: boolean;
  permissions?: Permission[];
  categories?: string[];
}

/** Tab/widget/service registrations */
export interface TabRegistration {
  type: "tab";
  id: string;
  title: string;
  component: ComponentType<any>;
  featureFlag?: string;
  requiredPermissions?: string[];
}

export interface WidgetRegistration {
  type: "widget";
  id: string;
  title: string;
  component: ComponentType<any>;
  defaultSize?: { w: number; h: number };
  category?: string;
  featureFlag?: string;
  requiredPermissions?: string[];
}

export interface ServiceRegistration {
  type: "service";
  id: string;
  start: () => void | Promise<void>;
  stop?: () => void | Promise<void>;
  featureFlag?: string;
  requiredPermissions?: string[];
}

/** Minimal Tab/Widget “definition” shapes some code prefers */
export interface TabDef {
  id: string;
  title: string;
  component: ComponentType<any>;
  featureFlag?: string;
  requiredPermissions?: string[];
}

export interface WidgetDef {
  id: string;
  title: string;
  component: ComponentType<any>;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  refreshSec?: number;
  category?: string;
  featureFlag?: string;
  requiredPermissions?: string[];
}

/** Registrar a plugin uses to register things with the host */
export interface Registrar {
  requirePermission(permId: string): void;
  addTab(reg: TabRegistration): void;
  addWidget(reg: WidgetRegistration): void;
  addService(reg: ServiceRegistration): void;
  addSystemItem?(reg: SystemItemRegistration): void;
}

/** Full plugin contract */
export interface Plugin {
  meta: PluginMeta;
  initialize(ctx: PluginContext): void | Promise<void>;
  start?(): void | Promise<void>;
  stop?(): void | Promise<void>;
  dispose?(): void | Promise<void>;
  register(registrar: Registrar): void;
  setEnabled?(enabled: boolean): void;
  isReady?(): boolean;
}

/** Factory helper */
export type PluginFactory = (metaOverride?: Partial<PluginMeta>) => Plugin;

/** Type guard */
export function isPlugin(value: unknown): value is Plugin {
  return (
    typeof value === "object" &&
    value !== null &&
    "meta" in value &&
    "register" in value &&
    typeof (value as any).register === "function" &&
    "initialize" in value &&
    typeof (value as any).initialize === "function"
  );
}

/** Simple helper to create a plugin from meta + impl */
export function createPlugin(
  baseMeta: PluginMeta,
  impl: {
    initialize?: (ctx: PluginContext) => void | Promise<void>;
    start?: () => void | Promise<void>;
    stop?: () => void | Promise<void>;
    dispose?: () => void | Promise<void>;
    setEnabled?: (enabled: boolean) => void;
    isReady?: () => boolean;
    register: (r: Registrar) => void;
  }
): Plugin {
  const meta: PluginMeta = { ...baseMeta };
  let _ctx: PluginContext | undefined;
  let _enabled = meta.enabledByDefault ?? true;

  const plugin: Plugin = {
    meta,
    initialize: async (ctx: PluginContext) => {
      _ctx = ctx;
      if (impl.initialize) await impl.initialize(ctx);
    },
    async start() { if (impl.start) await impl.start(); },
    async stop() { if (impl.stop) await impl.stop(); },
    async dispose() { if (impl.dispose) await impl.dispose(); },
    register: (registrar: Registrar) => { impl.register(registrar); },
    setEnabled: (enabled: boolean) => {
      _enabled = enabled;
      if (impl.setEnabled) impl.setEnabled(enabled);
      _ctx?.logger?.info?.(`[plugin:${meta.id}] enabled=${_enabled}`);
    },
    isReady() { return impl.isReady ? impl.isReady() : true; },
  };
  return plugin;
}

/** Result helpers */
export type Result<T> = { ok: true; value: T } | { ok: false; error: PluginError };
export const Ok  = <T>(value: T): Result<T> => ({ ok: true, value });
export const Err = (error: PluginError): Result<never> => ({ ok: false, error });

/** Throw a PermissionError if ctx denies the perm */
export function ensurePermission(ctx: PluginContext, permId: string) {
  if (ctx?.hasPermission && !ctx.hasPermission(permId)) {
    throw new PermissionError(permId);
  }
}

/** Canonical permission scope constants (kept as string literals) */
export const PERMISSION_SCOPES = {
  UI: {
    TABS: "ui.tabs",
    WIDGETS: "ui.widgets",
  },
  EVENTS: {
    EMIT: "events.emit",
    SUBSCRIBE: "events.subscribe",
  },
  DATA: {
    METRICS_READ: "data.metrics.read",
  },
} as const;

/** Narrow union of supported scopes */
export type PermissionScope =
  | typeof PERMISSION_SCOPES.UI.TABS
  | typeof PERMISSION_SCOPES.UI.WIDGETS
  | typeof PERMISSION_SCOPES.EVENTS.EMIT
  | typeof PERMISSION_SCOPES.EVENTS.SUBSCRIBE
  | typeof PERMISSION_SCOPES.DATA.METRICS_READ;

/** Design tokens contract used by theming */
export interface ThemeTokens {
  colors: Record<string, string>;
  spacing?: Record<string, number | string>;
  radii?: Record<string, number | string>;
  typography?: {
    fontFamily?: string;
    fontSizes?: Record<string, number | string>;
    lineHeights?: Record<string, number | string>;
    fontWeights?: Record<string, number>;
    letterSpacing?: Record<string, number | string>;
  };
  shadows?: Record<string, string>;
  zIndex?: Record<string, number>;
  [key: string]: unknown;
}

/* IMPORTANT:
   Do NOT add `export * from './plugin'` here.
   This file *is* plugin.ts — re-exporting itself will break bundlers. */
