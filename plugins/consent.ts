//src/plugins/consent.ts
const k = (id:string,v:string,s:string)=>`plg:consent:${id}:${v}:${s}`;
const hashScopes = (scopes:string[]) => {
  const data = new TextEncoder().encode(scopes.slice().sort().join("|"));
  return btoa(String.fromCharCode(...new Uint8Array(data).slice(0,24))); // quick-n-dirty
};
export function hasConsent(id:string, version:string, scopes:string[]) {
  return !!localStorage.getItem(k(id,version,hashScopes(scopes)));
}
export function requestConsentUI(manifest:{id:string;name:string;version:string;scopes:string[]}) {
  const msg = `${manifest.name} (${manifest.id} v${manifest.version}) requests:\n\n` +
              manifest.scopes.map(s=>`• ${s}`).join("\n") + "\n\nAllow?";
  const granted = window.confirm(msg);
  if (granted) localStorage.setItem(k(manifest.id, manifest.version, hashScopes(manifest.scopes)), "1");
  return granted;
}
