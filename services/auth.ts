import { api } from './api';
import { getSession, setSession, type Role, type Session } from './session';

// 2FA pending state when login requires OTP verification
export interface Pending2FAState {
  requires2FA: true;
  tempToken: string;
  status: '2FA_REQUIRED' | '2FA_SETUP_REQUIRED';
  message: string;
}

export type SignInResult = Session | Pending2FAState;

export function isPending2FA(result: SignInResult): result is Pending2FAState {
  return 'requires2FA' in result && result.requires2FA === true;
}

export async function signIn(username: string, password: string, endpoint: string = 'auth/login'): Promise<SignInResult> {
  const res = await api(endpoint, {
    method: 'POST',
    body: { username, password },
    auth: false,
  });

  // Check if 2FA is required
  if (res.status === '2FA_REQUIRED' || res.status === '2FA_SETUP_REQUIRED') {
    return {
      requires2FA: true,
      tempToken: res.temp_token,
      status: res.status,
      message: res.message || 'Verifikasi 2FA diperlukan',
    };
  }

  const session: Session = {
    username,
    role: res.role as Role,
    access_token: res.access_token,
    refresh_token: res.refresh_token,
    account_status: res.account_status,
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

export async function verify2FA(tempToken: string, otpCode: string): Promise<Session> {
  const res = await api('auth/login/2fa', {
    method: 'POST',
    body: { temp_token: tempToken, otp_code: otpCode },
    auth: false,
  });

  const session: Session = {
    username: res.user.username || '',
    role: res.role as Role,
    access_token: res.access_token,
    refresh_token: res.refresh_token,
    account_status: res.account_status,
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

// --- Initial 2FA Setup (for mandatory roles) ---

export interface TwoFactorSetupResponse {
  secret: string;
  qr_code_uri: string;
}

export async function setup2FAInitial(tempToken: string): Promise<TwoFactorSetupResponse> {
  /**
   * Request initial 2FA setup using temp_token.
   * Use when login returns 2FA_SETUP_REQUIRED status.
   * Returns secret and QR code URI for authenticator app.
   */
  return await api('auth/2fa/setup-initial', {
    method: 'POST',
    body: { temp_token: tempToken },
    auth: false,
  });
}

export async function verify2FAInitial(tempToken: string, otpCode: string): Promise<Session> {
  /**
   * Verify initial 2FA setup and complete login.
   * Use after setup2FAInitial.
   */
  const res = await api('auth/2fa/verify-initial', {
    method: 'POST',
    body: { temp_token: tempToken, otp_code: otpCode },
    auth: false,
  });

  const session: Session = {
    username: res.user.username || '',
    role: res.role as Role,
    access_token: res.access_token,
    refresh_token: res.refresh_token,
    account_status: res.account_status,
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

