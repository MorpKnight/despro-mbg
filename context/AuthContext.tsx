import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loadSession, signInLocal, signOutLocal, type Role as LocalRole } from '../services/auth';

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
    (async () => {
      const session = await loadSession();
      if (session) setUser({ username: session.username, role: session.role });
      setLoading(false);
    })();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      signIn: async (username: string, password: string) => {
        const session = await signInLocal(username, password);
        setUser({ username: session.username, role: session.role });
      },
      signOut: async () => {
        await signOutLocal();
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
