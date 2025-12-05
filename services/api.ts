import { USER_ROLES } from '../constants/roles';
import { getSession, setSession, type Role, type Session } from './session';
import {
  getCentralApiKey,
  getLocalIp,
  getNetworkMode,
  getServerUrl,
} from './storage';

export interface ApiOptions extends Omit<RequestInit, 'body'> {
  baseURL?: string;
  body?: any;
  auth?: boolean;
}



let refreshPromise: Promise<Session | null> | null = null;

async function performRefresh(
  session: Session,
  baseURL: string,
): Promise<Session | null> {
  if (!session.refresh_token) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshUrl = baseURL.replace(/\/$/, '') + '/auth/refresh';
      try {
        const response = await fetch(refreshUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: session.refresh_token }),
        });
        if (!response.ok) {
          await setSession(null);
          return null;
        }
        const data = await response.json();
        const nextSession: Session = {
          ...session,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          role: data.role ?? session.role,
          account_status: data.account_status ?? session.account_status,
        };
        await setSession(nextSession);
        return nextSession;
      } catch (err) {
        console.warn('[api] refresh token failed', err);
        await setSession(null);
        return null;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

function buildUrl(baseURL: string, path: string) {
  return baseURL.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
}

function normalizeHeaders(input: HeadersInit | undefined): Record<string, string> {
  if (!input) return {};
  if (input instanceof Headers) {
    const entries: Record<string, string> = {};
    input.forEach((value, key) => {
      entries[key] = value;
    });
    return entries;
  }
  if (Array.isArray(input)) {
    return input.reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = String(value);
      return acc;
    }, {});
  }
  return { ...(input as Record<string, string>) };
}

type RequestOptions = Omit<ApiOptions, 'baseURL' | 'body' | 'auth'>;

async function makeRequest(
  url: string,
  options: RequestOptions,
  token: string | undefined,
  body: any,
  isFormData: boolean,
) {
  // --- TAMBAHKAN INI UNTUK DEBUGGING ---
  console.log("------------------------------------------");
  console.log("Trying to fetch URL:", url);
  console.log("------------------------------------------");
  // ---------------------------------------
  const { headers, ...rest } = options;
  const finalHeaders = normalizeHeaders(headers);

  if (!isFormData && !('Content-Type' in finalHeaders)) {
    finalHeaders['Content-Type'] = 'application/json';
  }
  if (!('Accept' in finalHeaders)) {
    finalHeaders.Accept = 'application/json';
  }
  if (token && !('Authorization' in finalHeaders)) {
    finalHeaders.Authorization = `Bearer ${token}`;
    console.log('[api] attached token:', token.slice(0, 10) + '...');
  } else {
    console.warn('[api] no token attached or already present');
  }

  // Inject Central API Key for Edge Mode if configured
  const centralApiKey = await getCentralApiKey();
  if (centralApiKey && !('X-School-Token' in finalHeaders)) {
    finalHeaders['X-School-Token'] = centralApiKey;
  }

  return fetch(url, {
    headers: finalHeaders,
    body,
    ...rest,
  });
}

const LOCAL_ELIGIBLE_ROLES = new Set<Role>([
  USER_ROLES.ADMIN_SEKOLAH,
  USER_ROLES.ADMIN_CATERING,
]);

function buildLocalBaseUrl(localIp: string | null): string | null {
  if (!localIp) return null;
  const trimmed = localIp.trim();
  if (!trimmed) return null;
  const sanitized = trimmed.replace(/\/+$/, '');
  const withoutSuffix = sanitized.replace(/\/api\/v1$/i, '');
  if (/^https?:\/\//i.test(withoutSuffix)) {
    return `${withoutSuffix}/api/v1`;
  }
  const needsPort = !/:[0-9]+$/.test(withoutSuffix);
  const hostWithPort = needsPort ? `${withoutSuffix}:8000` : withoutSuffix;
  return `http://${hostWithPort}/api/v1`;
}

async function determineBaseUrl(override: string | undefined, role: Role | null): Promise<string> {
  if (override) {
    return override;
  }

  const cloudBase = await getServerUrl();
  const roleAllowsLocal = role ? LOCAL_ELIGIBLE_ROLES.has(role) : true;
  if (role && !roleAllowsLocal) {
    return cloudBase;
  }

  const [mode, localIp] = await Promise.all([getNetworkMode(), getLocalIp()]);
  if (mode === 'LOCAL' && roleAllowsLocal) {
    const localBase = buildLocalBaseUrl(localIp);
    if (localBase) {
      return localBase;
    }
  }

  return cloudBase;
}

export async function api(path: string, options: ApiOptions = {}) {
  const {
    baseURL,
    body,
    auth = true,
    ...requestOptions
  } = options;

  const session = await getSession();
  const resolvedBaseURL = await determineBaseUrl(baseURL, session?.role ?? null);
  const url = buildUrl(resolvedBaseURL, path);

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  let requestBody: any = body;
  if (!isFormData && body && typeof body !== 'string') {
    try {
      requestBody = JSON.stringify(body);
    } catch {
      requestBody = body;
    }
  }

  let authSession = auth ? session : null;

  const attempt = async (token?: string) =>
    makeRequest(
      url,
      requestOptions,
      token,
      requestBody,
      isFormData,
    );

  let response;
  try {
    response = await attempt(authSession?.access_token);
  } catch (err: any) {
    // Check for network error (fetch failure)
    if (err.message === 'Network request failed' || err.name === 'TypeError') {
      throw new Error('Gagal terhubung ke Server Sekolah. Pastikan Anda terhubung ke jaringan lokal sekolah.');
    }
    throw err;
  }

  if (response.status === 401 && auth) {
    if (authSession) {
      const refreshed = await performRefresh(authSession, resolvedBaseURL);
      if (refreshed?.access_token) {
        authSession = refreshed;
        response = await attempt(refreshed.access_token);
      }
    }

    if (response.status === 401) {
      await setSession(null);
      const text = await response.text().catch(() => '');
      throw new Error(`Unauthorized: ${text || 'authentication required'}`);
    }
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`API ${response.status}: ${text}`);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  const text = await response.text();
  return text;
}


