// src/core/boot.ts
import { PluginLoader } from "./PluginLoader";

export async function boot() {
  const ctx = {
    env: import.meta.env,
    logger: console,
    bus: undefined,
    hasPermission: (id: string) => true, // plug in your RBAC
    getService: () => undefined,
  };

  const loader = new PluginLoader(
    ctx,
    (perm) => ctx.hasPermission?.(perm) ?? true,
    (flag) => (flag ? Boolean(((import.meta) as any).env[flag]) : true)
  );

  await loader.discover();
  await loader.initializeAll();
  await loader.startServices();

  return loader; // expose tabs/widgets/services to UI layer
}
// src/core/boot.ts
import { PluginLoader } from "./PluginLoader";

export async function boot() {
  const ctx = {
    env: import.meta.env,
    logger: console,
    bus: undefined,
    hasPermission: (id: string) => true, // plug in your RBAC
    getService: () => undefined,
  };

  const loader = new PluginLoader(
    ctx,
    (perm) => ctx.hasPermission?.(perm) ?? true,
    (flag) => (flag ? Boolean(((import.meta) as any).env[flag]) : true)
  );

  await loader.discover();
  await loader.initializeAll();
  await loader.startServices();

  return loader; // expose tabs/widgets/services to UI layer
}
