export interface ApiOptions extends RequestInit {
  baseURL?: string;
}

const DEFAULT_BASE_URL = 'https://example.com/api';

export async function api(path: string, options: ApiOptions = {}) {
  const { baseURL = DEFAULT_BASE_URL, headers, ...rest } = options;
  const url = baseURL.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    ...rest,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text}`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  return res.text();
}
