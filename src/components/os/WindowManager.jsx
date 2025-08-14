import React, { useMemo } from 'react';
import Window from './Window.jsx';
import { useUIStore } from '../../store/useUIStore.ts';
import { AppErrorBoundary } from './AppErrorBoundary';

export default function WindowManager(){
  const { osWindows, osFocusedId, activeWorkspace } = useUIStore(s => s);

  const visibleWindows = useMemo(() => {
    return osWindows
      .filter(w => w.workspace === activeWorkspace && !w.minimized && w.Component) // ← Add w.Component check
      .sort((a, b) => a.z - b.z);
  }, [osWindows, activeWorkspace]);

  return (
    <>
      {visibleWindows.map(w => (
        <Window key={w.id} win={w} focused={w.id===osFocusedId}>
          <AppErrorBoundary appId={w.appId}>
            {w.Component ? <w.Component /> : (
              <div className="h-full w-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading app...</p>
                </div>
              </div>
            )}
          </AppErrorBoundary>
        </Window>
      ))}
    </>
  );
}