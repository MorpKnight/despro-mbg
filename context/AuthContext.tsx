import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { loadSession, signIn, signOut, type Role as LocalRole } from '../services/auth';
import { fetchMyProfile, type Profile } from '../services/profile';
import { subscribeSession, type Session } from '../services/session';

export type Role = LocalRole;
export interface User {
  id: string;
  username: string;
  role: Role;
  fullName: string | null;
  accountStatus: string;
  schoolId: string | null;
  cateringId: string | null;
  healthOfficeArea: string | null;
  sekolah: Profile['sekolah'];
  catering: Profile['catering'];
}

function profileToUser(profile: Profile): User {
  return {
    id: profile.id,
    username: profile.username,
    role: profile.role,
    fullName: profile.fullName,
    accountStatus: profile.accountStatus,
    schoolId: profile.schoolId,
    cateringId: profile.cateringId,
    healthOfficeArea: profile.healthOfficeArea,
    sekolah: profile.sekolah,
    catering: profile.catering,
  };
}

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isEdgeMode: boolean;
  signIn: (username: string, password: string, endpoint?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  checkServerMode: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEdgeMode, setIsEdgeMode] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => (
    () => {
      isMounted.current = false;
    }
  ), []);

  const checkServerMode = useCallback(async () => {
    try {
      const { getServerUrl } = await import('../services/storage');
      const url = await getServerUrl();

      // Logic 1: Try to fetch health/mode endpoint if available
      try {
        const response = await fetch(`${url.replace(/\/$/, "")}/health`);
        if (response.ok) {
          const data = await response.json();
          if (isMounted.current && data.deployment_mode) {
            setIsEdgeMode(data.deployment_mode === 'EDGE');
            return;
          }
        }
      } catch (e) {
        // Ignore fetch error, fall back to IP check
      }

      // Logic 2: Check IP address
      // Simple regex for private IP ranges: 192.168.x.x, 10.x.x.x, 172.16.x.x - 172.31.x.x, localhost, 127.0.0.1
      const isLocal = /^(?:https?:\/\/)?(?:localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(?::\d+)?/.test(url);

      if (isMounted.current) {
        setIsEdgeMode(isLocal);
      }
    } catch (err) {
      console.warn('[auth] checkServerMode failed', err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const profile = await fetchMyProfile();
    if (isMounted.current) {
      setUser(profileToUser(profile));
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await checkServerMode();
        const loadedSession = await loadSession();
        if (isMounted.current) {
          setSession(loadedSession);
        }
        if (!loadedSession) {
          if (isMounted.current) {
            setUser(null);
            setLoading(false);
          }
          return;
        }
        await refreshProfile();
      } catch (err) {
        console.warn('[auth] bootstrap gagal', err);
        if (isMounted.current) {
          setUser(null);
        }
      } finally {
        if (isMounted.current) setLoading(false);
      }
    })();

    const unsubscribe = subscribeSession((newSession: Session | null) => {
      if (isMounted.current) {
        setSession(newSession);
      }
      if (!newSession) {
        if (isMounted.current) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      if (isMounted.current) {
        setLoading(true);
      }
      refreshProfile()
        .catch((err) => {
          console.warn('[auth] refresh profile failed', err);
        })
        .finally(() => {
          if (isMounted.current) setLoading(false);
        });
    });

    return () => {
      unsubscribe();
    };
  }, [refreshProfile, checkServerMode]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      session,
      loading,
      isEdgeMode,
      signIn: async (username: string, password: string, endpoint?: string) => {
        await checkServerMode();
        const newSession = await signIn(username, password, endpoint);

        // NEW: Use basic user data from session immediately if available
        if (newSession.user) {
          setUser({
            id: newSession.user.id,
            username: newSession.username,
            role: newSession.role,
            fullName: newSession.user.fullName,
            accountStatus: newSession.account_status,
            schoolId: newSession.user.schoolId,
            cateringId: newSession.user.cateringId,
            healthOfficeArea: newSession.user.healthOfficeArea,
            sekolah: null, // Will be fetched in background
            catering: null, // Will be fetched in background
          });
        }

        // OPTIMIZED: Fetch full profile in background (non-blocking)
        // This includes sekolah and catering relationships
        refreshProfile().catch((err) => {
          console.warn('[auth] gagal mengambil profil lengkap sesudah login', err);
          // User already set above, so UI is not blocked
        });
      },
      signOut: async () => {
        await signOut();
        setUser(null);
      },
      refreshProfile: async () => {
        try {
          await refreshProfile();
        } catch (err) {
          console.warn('[auth] manual refresh failed', err);
          throw err;
        }
      },
      checkServerMode,
    }),
    [user, session, loading, isEdgeMode, refreshProfile, checkServerMode]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
