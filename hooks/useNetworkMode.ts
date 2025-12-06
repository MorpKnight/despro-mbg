import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { USER_ROLES, type UserRoleValue } from '../constants/roles';
import { useAuth } from './useAuth';
import {
  getLocalIp,
  getNetworkMode,
  saveLocalIp,
  setNetworkMode,
  type NetworkMode,
} from '../services/storage';

interface NetworkModeContextValue {
  currentMode: NetworkMode;
  localIp: string | null;
  canUseLocal: boolean;
  isReady: boolean;
  toggleMode: () => Promise<void>;
  setLocalIpAddress: (ip: string) => Promise<void>;
}

const NetworkModeContext = createContext<NetworkModeContextValue | undefined>(undefined);

const LOCAL_ELIGIBLE_ROLES = new Set<UserRoleValue>([
  USER_ROLES.ADMIN_SEKOLAH,
  USER_ROLES.ADMIN_CATERING,
]);

export function NetworkModeProvider({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth();
  const rawRole = user?.role ?? session?.role ?? null;
  const resolvedRole = (rawRole ?? null) as UserRoleValue | null;
  const roleAllowsLocal = resolvedRole ? LOCAL_ELIGIBLE_ROLES.has(resolvedRole) : true;
  const roleLocksCloud = Boolean(resolvedRole) && !roleAllowsLocal;

  const [currentMode, setCurrentMode] = useState<NetworkMode>('CLOUD');
  const [localIp, setLocalIp] = useState<string | null>(null);
  const [isReady, setReady] = useState(false);
  const syncingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const syncState = async () => {
      if (syncingRef.current) return;
      syncingRef.current = true;
      try {
        const [storedMode, storedIp] = await Promise.all([getNetworkMode(), getLocalIp()]);
        if (cancelled) return;

        let effectiveMode: NetworkMode = storedMode;
        if (roleLocksCloud && storedMode !== 'CLOUD') {
          effectiveMode = 'CLOUD';
          try {
            await setNetworkMode('CLOUD');
          } catch (err) {
            console.warn('[networkMode] failed to persist enforced CLOUD mode', err);
          }
        }

        setCurrentMode(effectiveMode);
        setLocalIp(storedIp);
        setReady(true);
      } catch (err) {
        console.warn('[networkMode] failed to bootstrap state', err);
        if (!cancelled) {
          setCurrentMode('CLOUD');
          setReady(true);
        }
      } finally {
        syncingRef.current = false;
      }
    };

    syncState();
    return () => {
      cancelled = true;
    };
  }, [roleLocksCloud]);

  const toggleMode = useCallback(async () => {
    if (roleLocksCloud) {
      if (currentMode !== 'CLOUD') {
        setCurrentMode('CLOUD');
        try {
          await setNetworkMode('CLOUD');
        } catch (err) {
          console.warn('[networkMode] failed to persist forced CLOUD mode', err);
        }
      }
      return;
    }

    const previousMode = currentMode;
    const nextMode: NetworkMode = currentMode === 'LOCAL' ? 'CLOUD' : 'LOCAL';
    setCurrentMode(nextMode);
    try {
      await setNetworkMode(nextMode);
    } catch (err) {
      console.warn('[networkMode] failed to toggle mode', err);
      setCurrentMode(previousMode);
    }
  }, [currentMode, roleLocksCloud]);

  const setLocalIpAddress = useCallback(async (ip: string) => {
    const sanitized = (ip ?? '').trim();
    const nextValue = sanitized || null;
    setLocalIp(nextValue);
    try {
      await saveLocalIp(sanitized);
    } catch (err) {
      console.warn('[networkMode] failed to persist local ip', err);
    }
  }, []);

  const value = useMemo<NetworkModeContextValue>(() => ({
    currentMode,
    localIp,
    canUseLocal: !roleLocksCloud,
    isReady,
    toggleMode,
    setLocalIpAddress,
  }), [currentMode, isReady, localIp, roleLocksCloud, setLocalIpAddress, toggleMode]);

  return React.createElement(NetworkModeContext.Provider, { value }, children);
}

export function useNetworkMode() {
  const ctx = useContext(NetworkModeContext);
  if (!ctx) {
    throw new Error('useNetworkMode must be used within NetworkModeProvider');
  }
  return ctx;
}
