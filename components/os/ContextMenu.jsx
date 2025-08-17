import React from 'react';

export default function ContextMenu({ x, y, items, onClose }){
  return (
    <div className="fixed inset-0" onClick={onClose} onContextMenu={onClose}>
      <div className="absolute min-w-48 rounded-lg border border-neutral-700 bg-neutral-850 shadow-xl p-1"
           style={{ left: x, top: y }}>
        {items.map((it, i) =>
          it.separator ? <div key={i} className="my-1 h-px bg-neutral-700" /> :
          <button key={i} className="w-full text-left px-3 py-2 rounded hover:bg-neutral-800"
                  onClick={() => { it.action?.(); onClose(); }}>
            {it.label}
          </button>
        )}
      </div>
    </div>
  );
}
