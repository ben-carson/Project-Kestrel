//src/store/usePins.ts
import { useEffect, useState } from "react";

export function usePins() {
  const [pins, setPins] = useState(() => {
    try { return JSON.parse(localStorage.getItem("kestrel:pins") || "[]"); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("kestrel:pins", JSON.stringify(pins));
  }, [pins]);

  return {
    pins, // [{ id, title, icon, openDetail }]
    addPin: (p) => setPins((v) => v.some(x => x.id === p.id) ? v : [...v, p]),
    removePin: (id) => setPins((v) => v.filter(x => x.id !== id)),
    movePin: (from, to) => setPins((v) => {
      const arr = v.slice(); const [x] = arr.splice(from,1); arr.splice(to,0,x); return arr;
    })
  };
}
