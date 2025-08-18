//src/components/os/plugins/PluginsTrayButton.jsx
import React from "react";
import { PlugZap } from "lucide-react";
import PluginsPullout from "./PluginsPullout";

export default function PluginsTrayButton() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-neutral-700/60"
        title="Plugins"
      >
        <PlugZap className="w-4 h-4" />
        <span className="text-xs opacity-80 hidden md:inline">Plugins</span>
      </button>

      {open ? <PluginsPullout onClose={() => setOpen(false)} /> : null}
    </>
  );
}
