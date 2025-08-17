//src/components/plugins/PluginsWindow.jsx
import React from "react";
// import PluginsPullout from "./PluginsPullout";
 // COMMENTED OUT BY IMPORT FIXER

// same list UI, just without backdrop + anchored positioning
export default function PluginsWindowBody() {
  return (
    <div className="h-full w-full bg-neutral-850 text-white p-3">
      <PluginsPullout onClose={() => { /* window has its own close */ }} />
    </div>
  );
}

