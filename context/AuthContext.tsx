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
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => (
    () => {
      isMounted.current = false;
    }
  ), []);

  const refreshProfile = useCallback(async () => {
    const profile = await fetchMyProfile();
    if (isMounted.current) {
      setUser(profileToUser(profile));
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
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
  }, [refreshProfile]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      session,
      loading,
      signIn: async (username: string, password: string) => {
        const newSession = await signIn(username, password);
        // Session update is handled by subscription
        try {
          await refreshProfile();
        } catch (err) {
          console.warn('[auth] gagal mengambil profil sesudah login', err);
          setUser({
            id: 'unknown',
            username: newSession.username,
            role: newSession.role,
            fullName: null,
            accountStatus: newSession.account_status,
            schoolId: null,
            cateringId: null,
            healthOfficeArea: null,
            sekolah: null,
            catering: null,
          });
        }
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
    }),
    [user, session, loading, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
