type Hook = { onMount?():void; onFocus?():void; onBlur?():void; onDispose?():void };
const lifecycles = new Map<string, Hook>();
export const registerLifecycle = (appId: string, h: Hook) => lifecycles.set(appId, h);
export const callLifecycle = (appId: string, m: keyof Hook) => lifecycles.get(appId)?.[m]?.();
export const unregisterLifecycle = (appId: string) => lifecycles.delete(appId);
