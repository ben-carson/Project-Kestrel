// src/plugins/depGraph.ts
export function topo(manifests: Record<string, any>): string[] {
  const indeg = new Map<string, number>(); const g = new Map<string,string[]>();
  for (const id in manifests) { indeg.set(id,0); g.set(id,[]); }
  for (const id in manifests) for (const d of Object.keys(manifests[id].dependencies||{})) {
    if (!indeg.has(d)) throw new Error(`Unknown dependency: ${d}`);
    indeg.set(d, (indeg.get(d)||0)+1); g.get(id)!.push(d);
  }
  const q=[...indeg.keys()].filter(k=>(indeg.get(k)||0)===0); const out:string[]=[];
  while(q.length){ const n=q.shift()!; out.push(n); for(const m of g.get(n)!) {
    indeg.set(m,(indeg.get(m)||1)-1); if((indeg.get(m)||0)===0) q.push(m); } }
  if (out.length!==indeg.size) throw new Error("Dependency cycle");
  return out;
}
