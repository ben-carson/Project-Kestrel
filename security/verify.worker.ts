//src/security/verify.worker.ts
self.onmessage = async (e) => {
  const { publicKeyDerB64, codeBuf, integrity } = e.data;
  const hash = await crypto.subtle.digest("SHA-256", codeBuf);
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  if (hashB64 !== integrity.hash) return postMessage({ ok:false, error:"hash mismatch" });

  const key = await crypto.subtle.importKey(
    "spki",
    Uint8Array.from(atob(publicKeyDerB64), c=>c.charCodeAt(0)),
    { name:"ECDSA", namedCurve:"P-256" }, false, ["verify"]
  );
  const sig = Uint8Array.from(atob(integrity.signature), c=>c.charCodeAt(0));
  const ok = await crypto.subtle.verify({ name:"ECDSA", hash:"SHA-256" }, key, sig, Uint8Array.from(atob(integrity.hash), c=>c.charCodeAt(0)));
  postMessage({ ok });
};
