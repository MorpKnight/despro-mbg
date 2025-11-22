import Constants from 'expo-constants';
import { secureStorage, storage } from './storage';

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
const ACCESS_TOKEN_KEY = `${SESSION_STORAGE_KEY}_access_token`;
const REFRESH_TOKEN_KEY = `${SESSION_STORAGE_KEY}_refresh_token`;
let cachedSession: Session | null | undefined;
type SessionListener = (session: Session | null) => void;
const listeners = new Set<SessionListener>();

type StoredSessionMeta = Omit<Session, 'access_token' | 'refresh_token'>;

async function readPersistedSession(): Promise<Session | null> {
  const meta = await storage.get<StoredSessionMeta>(SESSION_STORAGE_KEY);
  if (!meta) {
    return null;
  }

  const [accessToken, refreshToken] = await Promise.all([
    secureStorage.getItem(ACCESS_TOKEN_KEY),
    secureStorage.getItem(REFRESH_TOKEN_KEY),
  ]);

  if (!accessToken || !refreshToken) {
    await Promise.all([
      storage.remove(SESSION_STORAGE_KEY),
      secureStorage.removeItem(ACCESS_TOKEN_KEY),
      secureStorage.removeItem(REFRESH_TOKEN_KEY),
    ]);
    return null;
  }

  return {
    ...meta,
    access_token: accessToken,
    refresh_token: refreshToken,
  };
}

async function persistSession(session: Session | null): Promise<void> {
  if (session) {
    const { access_token, refresh_token, ...meta } = session;
    await Promise.all([
      storage.set(SESSION_STORAGE_KEY, meta),
      secureStorage.setItem(ACCESS_TOKEN_KEY, access_token),
      secureStorage.setItem(REFRESH_TOKEN_KEY, refresh_token),
    ]);
    return;
  }

  await Promise.all([
    storage.remove(SESSION_STORAGE_KEY),
    secureStorage.removeItem(ACCESS_TOKEN_KEY),
    secureStorage.removeItem(REFRESH_TOKEN_KEY),
  ]);
}

export function getSessionStorageKey() {
  return SESSION_STORAGE_KEY;
}

export async function getSession(force = false): Promise<Session | null> {
  if (!force && cachedSession !== undefined) {
    return cachedSession;
  }
  cachedSession = await readPersistedSession();
  return cachedSession;
}

export async function setSession(session: Session | null): Promise<void> {
  cachedSession = session;
  await persistSession(session);
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
