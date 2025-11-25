import { api } from './api';
import { getSession, setSession, type Role, type Session } from './session';

export async function signIn(username: string, password: string, endpoint: string = 'auth/login'): Promise<Session> {
  const res = await api(endpoint, {
    method: 'POST',
    body: { username, password },
    auth: false,
  });

  const session: Session = {
    username,
    role: res.role as Role,
    access_token: res.access_token,
    refresh_token: res.refresh_token,
    account_status: res.account_status,
    // NEW: Store user data from login response
    user: res.user ? {
      id: res.user.id,
      fullName: res.user.full_name,
      schoolId: res.user.school_id,
      cateringId: res.user.catering_id,
      healthOfficeArea: res.user.health_office_area,
    } : undefined,
  };

  await setSession(session);
  return session;
}

export async function signOut(): Promise<void> {
  try {
    await api('auth/logout', { method: 'POST' });
  } catch (err) {
    console.warn('[auth] logout failed', err);
  } finally {
    await setSession(null);
  }
}

export async function loadSession(): Promise<Session | null> {
  return getSession();
}

export async function updateStoredSession(session: Session | null): Promise<void> {
  await setSession(session);
}

export type { Role, Session } from './session';
