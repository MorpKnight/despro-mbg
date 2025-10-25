import NetInfo from '@react-native-community/netinfo';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { syncOfflineData } from '../services/sync';

interface OfflineState {
  isOnline: boolean;
}

const OfflineContext = createContext<OfflineState | undefined>(undefined);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setOnline] = useState<boolean>(true);
  const prevOnlineRef = useRef<boolean>(true);

  useEffect(() => {
    console.log('[offline] subscribing NetInfo');
    const unsub = NetInfo.addEventListener(state => {
      // Prefer isInternetReachable when available; fallback to isConnected
      const reachable = state.isInternetReachable ?? state.isConnected ?? false;
      setOnline(!!reachable);
    });

    // Initial fetch
    NetInfo.fetch().then(state => {
      const reachable = state.isInternetReachable ?? state.isConnected ?? false;
      setOnline(!!reachable);
    });

    // Web fallback in case NetInfo is not reliable on web
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    if (typeof window !== 'undefined' && typeof (window as any).addEventListener === 'function') {
      (window as any).addEventListener('online', handleOnline);
      (window as any).addEventListener('offline', handleOffline);
      const onLine = (typeof navigator !== 'undefined' && (navigator as any).onLine) as boolean | undefined;
      if (typeof onLine === 'boolean') setOnline(onLine);
    }

    return () => {
      unsub && unsub();
      if (typeof window !== 'undefined' && typeof (window as any).removeEventListener === 'function') {
        (window as any).removeEventListener('online', handleOnline);
        (window as any).removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  // Trigger sync when transitioning from offline -> online
  useEffect(() => {
    const prev = prevOnlineRef.current;
    if (!prev && isOnline) {
      console.log('[offline] back online, triggering sync');
      syncOfflineData().catch(err => console.log('[offline] sync error', err));
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline]);

  const value = useMemo(() => ({ isOnline }), [isOnline]);

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOfflineContext() {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error('useOfflineContext must be used within OfflineProvider');
  return ctx;
}
