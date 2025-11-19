import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loadSession, signIn, signOut, type Role as LocalRole } from '../services/auth';
import { subscribeSession, type Session } from '../services/session';

export type Role = LocalRole;
export interface User {
  username: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const session = await loadSession();
        if (active && session) setUser({ username: session.username, role: session.role });
      } catch (err) {
        console.warn('[auth] gagal memuat sesi awal', err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    const unsubscribe = subscribeSession((session: Session | null) => {
      if (!active) return;
      setUser(session ? { username: session.username, role: session.role } : null);
      if (!session) {
        setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      signIn: async (username: string, password: string) => {
        const session = await signIn(username, password);
        setUser({ username: session.username, role: session.role });
      },
      signOut: async () => {
        await signOut();
        setUser(null);
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
