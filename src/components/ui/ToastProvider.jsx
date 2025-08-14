import React from 'react';
import { createPortal } from 'react-dom';

const ToastCtx = React.createContext(null);
let idCounter = 0;

export function useToast(){
  const ctx = React.useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

export default function ToastProvider({ children }){
  const [toasts, setToasts] = React.useState([]);

  const push = React.useCallback((t) => {
    const id = ++idCounter;
    const toast = { id, duration: 5000, actions: [], ...t };
    setToasts(v => [...v, toast]);
    if (toast.duration) setTimeout(() => setToasts(v => v.filter(x => x.id !== id)), toast.duration);
  }, []);

  const remove = (id) => setToasts(v => v.filter(t => t.id !== id));

  return (
    <ToastCtx.Provider value={{ push, remove }}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
          {toasts.map(t => (
            <div key={t.id}
                 className={`min-w-[260px] max-w-[420px] rounded-lg border p-3 shadow-xl bg-neutral-900/95 border-neutral-700
                             ${t.variant==='critical' ? 'border-red-500/70' : t.variant==='warning' ? 'border-amber-500/70' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  {t.title && <div className="font-medium">{t.title}</div>}
                  {t.description && <div className="text-sm opacity-80">{t.description}</div>}
                  {!!t.actions?.length && (
                    <div className="mt-2 flex gap-2">
                      {t.actions.map((a,i) => (
                        <button key={i} className="px-2 py-1 text-xs rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700"
                                onClick={() => { a.onClick?.(); remove(t.id); }}>
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button className="text-sm opacity-70 hover:opacity-100" onClick={() => remove(t.id)}>×</button>
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastCtx.Provider>
  );
}
