// src/plugins/telemetry.ts
type Meter = { calls:number; errors:number; bytes:number; avgMs:number; lastTs:number };
const meters = new Map<string, Meter>();

export function instrument(pluginId:string, fn:(m:string,a:any)=>Promise<any>) {
  return async (m:string, a:any) => {
    const t0 = performance.now(); const enc = new TextEncoder().encode(JSON.stringify(a));
    let ok = true; try { return await fn(m,a); } catch(e){ ok=false; throw e; }
    finally {
      const ms = performance.now() - t0; const mm = meters.get(pluginId) ?? {calls:0,errors:0,bytes:0,avgMs:0,lastTs:0};
      mm.calls++; if (!ok) mm.errors++; mm.bytes += enc.byteLength; mm.avgMs = mm.avgMs ? (mm.avgMs*0.9 + ms*0.1) : ms; mm.lastTs = Date.now();
      meters.set(pluginId, mm);
      // Soft guards
      if (mm.avgMs > 150 || mm.calls > 1000 && mm.bytes > 5e6) { /* flag, rate harder, or suspend */ }
    }
  };
}
