// src/plugins/notes/index.ts
import { createPlugin } from "../../types/plugin";
import NotesWidget from "./NotesWidget";

export default createPlugin(
  {
    id: "kestrel.notes",
    name: "Notes",
    version: "0.1.0",
    kind: "widget",
    enabledByDefault: true,
  },
  {
    register: (r) => {
      r.addWidget({
        type: "widget",
        id: "notes",
        title: "Notes",
        component: NotesWidget,
        defaultSize: { w: 3, h: 2 },
        featureFlag: "VITE_ENABLE_NOTES", // optional
        requiredPermissions: [],          // optional
      });
    },
  }
);
