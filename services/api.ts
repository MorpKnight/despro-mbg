import Constants from 'expo-constants';
import { getSession, setSession, type Session } from './session';

export interface ApiOptions extends Omit<RequestInit, 'body'> {
  baseURL?: string;
  body?: any;
  auth?: boolean;
}

const extraConfig = (Constants?.expoConfig as any)?.extra || (Constants as any)?.manifest?.extra || {};
const extraApiUrl = typeof extraConfig?.apiUrl === 'string' ? extraConfig.apiUrl : undefined;
const nestedApiUrl = typeof extraConfig?.api?.baseUrl === 'string' ? extraConfig.api.baseUrl : undefined;

const DEFAULT_BASE_URL = process.env.EXPO_PUBLIC_API_URL
  || extraApiUrl
  || nestedApiUrl
  || 'http://10.0.2.2:8000/api/v1';

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
  }

  return fetch(url, {
    headers: finalHeaders,
    body,
    ...rest,
  });
}

export async function api(path: string, options: ApiOptions = {}) {
  const {
    baseURL = DEFAULT_BASE_URL,
    body,
    auth = true,
    ...requestOptions
  } = options;
  const url = buildUrl(baseURL, path);

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  let requestBody: any = body;
  if (!isFormData && body && typeof body !== 'string') {
    try {
      requestBody = JSON.stringify(body);
    } catch {
      requestBody = body;
    }
  }

  let session = auth ? await getSession() : null;

  const attempt = async (token?: string) =>
    makeRequest(
      url,
      requestOptions,
      token,
      requestBody,
      isFormData,
    );

  let response = await attempt(session?.access_token);

  if (response.status === 401 && auth) {
    if (session) {
      const refreshed = await performRefresh(session, baseURL);
      if (refreshed?.access_token) {
        session = refreshed;
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


