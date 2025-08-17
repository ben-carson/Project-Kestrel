//src/bootstrap/registerLocalShells.js
import { usePluginStore } from "../store/usePluginStore";
import { listLocalWidgetIds } from "../components/framework/localRegistry";

/** Register all trusted local widgets as shells on startup. */
export function registerLocalShells() {
  const ids = listLocalWidgetIds();
  const { registerWidgetShell } = usePluginStore.getState();
  ids.forEach((id) => {
    registerWidgetShell({
      id,
      name: id,           // or a nicer label map later
      mountKind: "local",
      category: "core",
      tags: ["first-party"]
    });
  });
}
