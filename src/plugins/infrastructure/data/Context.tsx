//src/plugins/infrastructure/data/Context.ts
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import type { InfraDataSource } from './types';

const InfraDataCtx = createContext<InfraDataSource | null>(null);

export function useInfraData() {
  const ctx = useContext(InfraDataCtx);
  if (!ctx) throw new Error('useInfraData must be used within InfraDataProvider');
  return ctx;
}

export function InfraDataProvider({
  source,
  children,
}: { source: InfraDataSource; children: React.ReactNode }) {
  useEffect(() => {
    let cleanup: void | (() => void);
    const p = source.start();
    if (typeof (p as any)?.then === 'function') (p as Promise<void>).catch(console.error);
    return () => {
      try { cleanup?.(); } catch {}
      const q = source.stop();
      if (typeof (q as any)?.then === 'function') (q as Promise<void>).catch(console.error);
    };
  }, [source]);

  const value = useMemo(() => source, [source]);
  return <InfraDataCtx.Provider value={value}>{children}</InfraDataCtx.Provider>;
}
