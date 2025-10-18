import Constants from 'expo-constants';
import { storage } from './storage';

export type Role = 'super admin' | 'admin sekolah' | 'admin catering' | 'siswa' | 'admin dinkes';
export interface Session {
  username: string;
  role: Role;
}

const EXTRA = (Constants?.expoConfig as any)?.extra || (Constants as any)?.manifest?.extra;
const AUTH = (EXTRA?.auth || { users: [], sessionKey: 'mbg_auth_session' }) as { users: {username:string;password:string;role:Role}[]; sessionKey: string };

export async function signInLocal(username: string, password: string): Promise<Session> {
  const user = (AUTH.users as {username:string;password:string;role:Role}[]).find(u => u.username === username && u.password === password);
  if (!user) throw new Error('Invalid credentials');
  const session: Session = { username: user.username, role: user.role };
  await storage.set(AUTH.sessionKey, session);
  return session;
}

export async function signOutLocal() {
  await storage.remove(AUTH.sessionKey);
}

export async function loadSession(): Promise<Session | null> {
  return storage.get<Session>(AUTH.sessionKey);
}
