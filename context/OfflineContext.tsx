import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface OfflineState {
  isOnline: boolean;
}

const OfflineContext = createContext<OfflineState | undefined>(undefined);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setOnline] = useState<boolean>(true);

  useEffect(() => {
    // Web support: listen to browser events; on native, fallback to true
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    if (typeof window !== 'undefined' && typeof (window as any).addEventListener === 'function') {
      (window as any).addEventListener('online', handleOnline);
      (window as any).addEventListener('offline', handleOffline);
      const onLine = (typeof navigator !== 'undefined' && (navigator as any).onLine) as boolean | undefined;
      if (typeof onLine === 'boolean') setOnline(onLine);
      return () => {
        (window as any).removeEventListener('online', handleOnline);
        (window as any).removeEventListener('offline', handleOffline);
      };
    }
    // Native: no-op cleanup
    return () => {};
  }, []);

  const value = useMemo(() => ({ isOnline }), [isOnline]);

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOfflineContext() {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error('useOfflineContext must be used within OfflineProvider');
  return ctx;
}
