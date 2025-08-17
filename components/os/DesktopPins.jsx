import React, { useState, useEffect, useCallback } from 'react';
import { X, Pin, Settings, Plus, Trash2 } from 'lucide-react';

export default function DesktopPins() {
  const [pins, setPins] = useState([]);
  const [editMode, setEditMode] = useState(false);

  // Load default pins
  useEffect(() => {
    const defaultPins = [
      {
        id: 'kestrel.terminal',
        title: 'Terminal',
        icon: '💻',
        x: 50,
        y: 50,
        openDetail: { appId: 'kestrel-terminal' }
      },
      {
        id: 'kestrel.files',
        title: 'Files',
        icon: '📁',
        x: 50,
        y: 130,
        openDetail: { appId: 'kestrel-files' }
      }
    ];
    setPins(defaultPins);
  }, []);

  const handlePinClick = useCallback((pin) => {
    if (editMode) return;
    
    try {
      const { openDetail } = pin;
      if (openDetail.appId) {
        window.dispatchEvent(new CustomEvent('kestrel:launchApp', {
          detail: { appId: openDetail.appId }
        }));
      }
    } catch (error) {
      console.error('Failed to open pin:', error);
    }
  }, [editMode]);

  return (
    <>
      <div className="absolute inset-0 pointer-events-none z-[150]">
        {pins.map((pin) => (
          <div
            key={pin.id}
            className="absolute pointer-events-auto"
            style={{ transform: `translate(${pin.x}px, ${pin.y}px)` }}
            onClick={() => handlePinClick(pin)}
          >
            <div className="group flex flex-col items-center cursor-pointer">
              <div className="w-12 h-12 rounded-xl border-2 bg-neutral-800/80 border-neutral-600 hover:border-neutral-500 hover:bg-neutral-700/80 backdrop-blur-sm flex items-center justify-center text-xl transition-all duration-200">
                {pin.icon}
              </div>
              <div className="mt-1 px-2 py-0.5 rounded text-xs font-medium bg-neutral-800/80 text-neutral-100 backdrop-blur-sm max-w-[80px] truncate">
                {pin.title}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setEditMode(!editMode)}
        className="fixed bottom-16 right-4 z-[250] p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg shadow-lg transition-colors"
        title="Edit Desktop Pins"
      >
        <Settings className="w-4 h-4" />
      </button>
    </>
  );
}
