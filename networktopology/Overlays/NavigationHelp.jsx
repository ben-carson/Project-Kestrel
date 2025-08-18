// src/components/widgets/NetworkTopology/Overlays/NavigationHelp.jsx

import React, { useState } from 'react';
import { HelpCircle, Mouse, Keyboard, Smartphone, X } from 'lucide-react';

const NavigationHelp = ({ className = "absolute bottom-4 right-4" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const helpSections = [
    {
      icon: <Mouse className="w-4 h-4" />,
      title: "Mouse Controls",
      items: [
        { action: "Left Click", description: "Select node, open sidebar" },
        { action: "Middle Click / Ctrl+Click", description: "Pan around canvas" },
        { action: "Mouse Wheel", description: "Zoom in/out" },
        { action: "Right Click", description: "Context menu (coming soon)" }
      ]
    },
    {
      icon: <Keyboard className="w-4 h-4" />,
      title: "Keyboard Shortcuts",
      items: [
        { action: "Space + Drag", description: "Pan around canvas" },
        { action: "+ / -", description: "Zoom in/out" },
        { action: "0", description: "Reset zoom to 100%" },
        { action: "F", description: "Fit all nodes in view" },
        { action: "Esc", description: "Deselect current node" }
      ]
    },
    {
      icon: <Smartphone className="w-4 h-4" />,
      title: "Touch Controls",
      items: [
        { action: "Tap", description: "Select node" },
        { action: "Pinch", description: "Zoom in/out" },
        { action: "Two-finger drag", description: "Pan around" },
        { action: "Long press", description: "Show node details" }
      ]
    }
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`${className} p-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-200 group`}
        title="Navigation Help"
      >
        <HelpCircle className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
      </button>
    );
  }

  return (
    <div className={`${className} w-80`}>
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Navigation Help</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {helpSections.map((section, index) => (
            <div key={index} className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-blue-600 dark:text-blue-400">{section.icon}</span>
                <h4 className="font-medium text-gray-900 dark:text-white">{section.title}</h4>
              </div>
              
              <div className="space-y-2">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex justify-between items-start gap-3">
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-mono whitespace-nowrap">
                      {item.action}
                    </kbd>
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                      {item.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50/50 dark:bg-gray-900/50 rounded-b-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            💡 Tip: Hold Ctrl while clicking to pan without selecting nodes
          </p>
        </div>
      </div>
    </div>
  );
};

export default NavigationHelp;