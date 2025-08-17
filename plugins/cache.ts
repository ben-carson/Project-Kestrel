//src/plugins/cache.ts
const CACHE = "kestrel-plugin-bundles-v1";
export async function fetchBundle(url:string):Promise<ArrayBuffer>{
  const cache = await caches.open(CACHE);
  const cached = await cache.match(url);
  if (cached) return await cached.arrayBuffer();
  const res = await fetch(url, { cache:"no-store" });
  if (!res.ok) throw new Error(`fetch failed ${res.status}`);
  const buf = await res.clone().arrayBuffer();
  await cache.put(url, res);
  return buf;
}
export function modulePreload(url:string) {
  const link=document.createElement("link");
  link.rel="modulepreload"; link.href=url; document.head.appendChild(link);
}
