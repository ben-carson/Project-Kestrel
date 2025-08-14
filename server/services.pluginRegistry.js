const registry = new Map();
export const listServices = () => Array.from(registry).map(([name, data]) => ({ name, ...data }));
export const registerService = (name, url, meta = {}) => {
  registry.set(name, { url, meta, ts: Date.now() });
  return { name, url, meta };
};
export const getService = (name) => {
  const v = registry.get(name);
  if (!v) return null;
  return { name, ...v };
};
