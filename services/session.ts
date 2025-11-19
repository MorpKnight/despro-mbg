import Constants from 'expo-constants';
import { storage } from './storage';

export type Role = 'super_admin' | 'admin_sekolah' | 'admin_catering' | 'siswa' | 'admin_dinkes';

export interface Session {
  username: string;
  role: Role;
  access_token: string;
  refresh_token: string;
  account_status: string;
}

const EXTRA = (Constants?.expoConfig as any)?.extra || (Constants as any)?.manifest?.extra;
const AUTH = (EXTRA?.auth || { users: [], sessionKey: 'mbg_auth_session' }) as {
  sessionKey: string;
};

const SESSION_STORAGE_KEY = AUTH.sessionKey || 'mbg_auth_session';
let cachedSession: Session | null | undefined;
type SessionListener = (session: Session | null) => void;
const listeners = new Set<SessionListener>();

export function getSessionStorageKey() {
  return SESSION_STORAGE_KEY;
}

export async function getSession(force = false): Promise<Session | null> {
  if (!force && cachedSession !== undefined) {
    return cachedSession;
  }
  const stored = await storage.get<Session>(SESSION_STORAGE_KEY);
  cachedSession = stored || null;
  return cachedSession;
}

export async function setSession(session: Session | null): Promise<void> {
  cachedSession = session;
  if (session) {
    await storage.set(SESSION_STORAGE_KEY, session);
  } else {
    await storage.remove(SESSION_STORAGE_KEY);
  }
  listeners.forEach((listener) => {
    try {
      listener(session);
    } catch (err) {
      console.warn('[session] listener error', err);
    }
  });
}

export function syncSessionCache(session: Session | null) {
  cachedSession = session;
}

export function subscribeSession(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
