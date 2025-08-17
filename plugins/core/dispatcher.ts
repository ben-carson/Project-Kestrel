// src/plugins/core/dispatcher.ts
const MAX_PAYLOAD = 64 * 1024;
const MAX_CALLS = 20;
const BUCKET = 50;     // tokens
const REFILL = 10;     // tokens/sec
const buckets = new Map<string,{tokens:number,ts:number}>();

function token(pluginId:string) {
  const now=performance.now();
  const b=buckets.get(pluginId) ?? {tokens:BUCKET, ts:now};
  const dt=(now-b.ts)/1000;
  b.tokens=Math.min(BUCKET,b.tokens+dt*REFILL); b.ts=now;
  if (b.tokens<1) { buckets.set(pluginId,b); return false; }
  b.tokens-=1; buckets.set(pluginId,b); return true;
}
const withTimeout = <T>(p:Promise<T>,ms=2000)=>Promise.race([p,new Promise<T>((_,r)=>setTimeout(()=>r(new Error("timeout")),ms))]);
function freeze<T>(o:T):T{ Object.freeze(o as any); for(const k of Object.keys(o as any)){ const v=(o as any)[k]; if(v&&typeof v==="object"&&!Object.isFrozen(v)) freeze(v); } return o; }
function audit(id:string, m:string, ms:number, ok:boolean, err?:string) { /* emit to your log */ }

export async function handleBatch(
  pluginId:string,
  batch:{calls:{method:string,args:any}[]},
  invoke:(method:string,args:any)=>Promise<any>
){
  const bytes=new TextEncoder().encode(JSON.stringify(batch)).byteLength;
  if (bytes>MAX_PAYLOAD) throw new Error("payload too large");
  if (batch.calls.length>MAX_CALLS) throw new Error("too many calls");
  if (!token(pluginId)) throw new Error("rate limited");

  const results=[];
  for(const c of batch.calls){
    const t0=performance.now(); let ok=true, err:string|undefined, res:any;
    try{ res=await withTimeout(invoke(c.method, freeze(c.args))); }
    catch (e:any) { ok=false; err=String(e?.message??e); }
    audit(pluginId, c.method, performance.now()-t0, ok, err);
    results.push({ ok, result: res, error: err });
  }
  return { results };
}
