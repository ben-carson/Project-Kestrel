// src/plugins/core/bridge.ts
import { handleBatch } from "./dispatcher";

export function attachBridge(pluginId:string, port:MessagePort, invoke:(m:string,a:any)=>Promise<any>) {
  port.onmessage = async (e) => {
    if (e.data?.type !== "api:batch") return;
    const { id, calls } = e.data;
    try {
      const result = await handleBatch(pluginId, { calls }, invoke);
      port.postMessage({ rid: id, result });
    } catch (err:any) {
      port.postMessage({ rid: id, error: String(err?.message ?? err) });
    }
  };
}
