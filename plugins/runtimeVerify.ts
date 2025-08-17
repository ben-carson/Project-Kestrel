//src/plugins/runtimeVerify.ts
const worker = new Worker(new URL("../security/verify.worker.ts", import.meta.url), { type:"module" });
const cacheKey = (id:string,ver:string,hash:string)=>`plg:${id}:${ver}:${hash}`;

export function verifyPlugin(publicKeyDerB64:string, id:string, version:string, buf:ArrayBuffer, integrity:{hash:string, signature:string}) {
  const key = cacheKey(id, version, integrity.hash);
  if (sessionStorage.getItem(key) === "ok") return Promise.resolve(true);

  return new Promise<boolean>((resolve) => {
    worker.onmessage = (e:any)=>{ const ok=!!e.data.ok; if(ok) sessionStorage.setItem(key,"ok"); resolve(ok); };
    worker.postMessage({ publicKeyDerB64, codeBuf: buf, integrity });
  });
}
