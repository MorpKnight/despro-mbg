export interface ApiOptions extends RequestInit {
  baseURL?: string;
}

const DEFAULT_BASE_URL = 'https://example.com/api';

export async function api(path: string, options: ApiOptions = {}) {
  const { baseURL = DEFAULT_BASE_URL, headers = {}, body, ...rest } = options;
  const url = baseURL.replace(/\/$/, '') + '/' + path.replace(/^\//, '');

  // Detect FormData to avoid setting Content-Type manually (let fetch set boundary)
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  // Prepare headers
  const finalHeaders: Record<string, string> = { ...(headers as any) };
  if (!isFormData && !('Content-Type' in finalHeaders)) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  // Prepare body
  let finalBody: any = body;
  if (!isFormData && body && typeof body !== 'string') {
    try {
      finalBody = JSON.stringify(body);
    } catch {
      finalBody = body;
    }
  }

  const res = await fetch(url, {
    headers: finalHeaders,
    body: finalBody,
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
