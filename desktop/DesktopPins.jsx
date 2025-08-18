// src/components/os/DesktopPins.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { X, Pin, Settings, Plus, Trash2 } from 'lucide-react';

// IndexedDB utilities for persistent storage
const DB_NAME = 'kestrel-desktop';
const DB_VERSION = 1;
const STORE_NAME = 'pins';

class DesktopPinsDB {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('order', 'order', { unique: false });
        }
      };
    });
  }

  async getAllPins() {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const pins = request.result.sort((a, b) => (a.order || 0) - (b.order || 0));
        resolve(pins);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async savePin(pin) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(pin);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deletePin(id) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

const pinsDB = new DesktopPinsDB();

export default function DesktopPins() {
  const [pins, setPins] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [draggedPin, setDraggedPin] = useState(null);

  // Load pins from IndexedDB on mount
  useEffect(() => {
    const loadPins = async () => {
      try {
        const savedPins = await pinsDB.getAllPins();
        setPins(savedPins);
        
        // Add default pins if none exist
        if (savedPins.length === 0) {
          const defaultPins = [
            {
              id: 'kestrel.terminal',
              title: 'Terminal',
              icon: '💻',
              order: 0,
              openDetail: { appId: 'kestrel-terminal' }
            },
            {
              id: 'kestrel.files',
              title: 'Files',
              icon: '📁',
              order: 1,
              openDetail: { appId: 'kestrel-files' }
            },
            {
              id: 'kestrel.health',
              title: 'System Monitor',
              icon: '📊',
              order: 2,
              openDetail: { appId: 'system-health' }
            }
          ];
          
          for (const pin of defaultPins) {
            await pinsDB.savePin(pin);
          }
          setPins(defaultPins);
        }
      } catch (error) {
        console.error('Failed to load desktop pins:', error);
      }
    };

    loadPins();
  }, []);

  // Global event listeners for pin management
  useEffect(() => {
    const handleAddPin = async (event) => {
      try {
        const pinData = event.detail;
        if (!pinData || !pinData.id) {
          console.warn('Invalid pin data provided to kestrel:addPin');
          return;
        }

        const newPin = {
          id: pinData.id,
          title: pinData.title || pinData.id,
          icon: pinData.icon || '📌',
          order: pinData.order ?? pins.length,
          x: pinData.x ?? 50 + (pins.length % 5) * 80,
          y: pinData.y ?? 50 + Math.floor(pins.length / 5) * 80,
          openDetail: pinData.openDetail || { appId: pinData.id },
          metadata: pinData.metadata || {}
        };

        // Check if pin already exists
        if (pins.find(p => p.id === newPin.id)) {
          console.warn(`Pin with id '${newPin.id}' already exists`);
          return;
        }

        await pinsDB.savePin(newPin);
        setPins(prev => [...prev, newPin]);
      } catch (error) {
        console.error('Failed to add desktop pin:', error);
      }
    };

    const handleRemovePin = async (event) => {
      try {
        const { id } = event.detail || {};
        if (!id) return;

        await pinsDB.deletePin(id);
        setPins(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        console.error('Failed to remove desktop pin:', error);
      }
    };

    window.addEventListener('kestrel:addPin', handleAddPin);
    window.addEventListener('kestrel:removePin', handleRemovePin);

    return () => {
      window.removeEventListener('kestrel:addPin', handleAddPin);
      window.removeEventListener('kestrel:removePin', handleRemovePin);
    };
  }, [pins]);

  const handlePinClick = useCallback((pin) => {
    if (editMode) return;

    try {
      const { openDetail } = pin;
      
      if (openDetail.appId) {
        // Use existing app launcher system
        const event = new CustomEvent('kestrel:launchApp', {
          detail: { appId: openDetail.appId }
        });
        window.dispatchEvent(event);
      } else if (openDetail.component) {
        // Open as dynamic window
        const event = new CustomEvent('kestrel:openWindow', {
          detail: {
            id: openDetail.id || pin.id,
            title: openDetail.title || pin.title,
            width: openDetail.width || 720,
            height: openDetail.height || 520,
            component: openDetail.component,
            props: openDetail.props
          }
        });
        window.dispatchEvent(event);
      } else if (openDetail.url) {
        // Open external URL
        window.open(openDetail.url, '_blank');
      }
    } catch (error) {
      console.error('Failed to open pin:', error);
    }
  }, [editMode]);

  const handlePinDelete = useCallback(async (pinId) => {
    try {
      await pinsDB.deletePin(pinId);
      setPins(prev => prev.filter(p => p.id !== pinId));
    } catch (error) {
      console.error('Failed to delete pin:', error);
    }
  }, []);

  const handlePinMove = useCallback(async (pinId, newX, newY) => {
    try {
      const pin = pins.find(p => p.id === pinId);
      if (!pin) return;

      const updatedPin = { ...pin, x: newX, y: newY };
      await pinsDB.savePin(updatedPin);
      setPins(prev => prev.map(p => p.id === pinId ? updatedPin : p));
    } catch (error) {
      console.error('Failed to move pin:', error);
    }
  }, [pins]);

  const addNewPin = useCallback(() => {
    window.dispatchEvent(new CustomEvent('kestrel:addPin', {
      detail: {
        id: `custom-pin-${Date.now()}`,
        title: 'New Pin',
        icon: '📌',
        openDetail: { appId: 'kestrel-terminal' } // Default action
      }
    }));
  }, []);

  return (
    <>
      {/* Desktop Pins */}
      <div className="absolute inset-0 pointer-events-none z-[150]">
        {pins.map((pin) => (
          <DesktopPin
            key={pin.id}
            pin={pin}
            editMode={editMode}
            onClick={() => handlePinClick(pin)}
            onDelete={() => handlePinDelete(pin.id)}
            onMove={handlePinMove}
          />
        ))}
      </div>

      {/* Edit Mode Controls */}
      {editMode && (
        <div className="fixed top-20 right-4 z-[300] flex flex-col gap-2">
          <button
            onClick={addNewPin}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-colors"
            title="Add New Pin"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setEditMode(false)}
            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg transition-colors"
            title="Exit Edit Mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Edit Mode Toggle (always visible) */}
      <button
        onClick={() => setEditMode(!editMode)}
        className={`fixed bottom-16 right-4 z-[250] p-2 rounded-lg shadow-lg transition-all duration-200 ${
          editMode 
            ? 'bg-orange-600 hover:bg-orange-700 text-white' 
            : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-100'
        }`}
        title={editMode ? 'Exit Edit Mode' : 'Edit Desktop Pins'}
      >
        {editMode ? <X className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
      </button>
    </>
  );
}