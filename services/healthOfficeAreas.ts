import { api } from './api';

export interface HealthOfficeAreaItem {
  id: string;
  name: string;
  code?: string | null;
  coverageNotes?: string | null;
}

interface RawHealthOfficeArea {
  id?: string;
  name?: string;
  code?: string | null;
  coverage_notes?: string | null;
}

export interface FetchHealthOfficeAreasParams {
  skip?: number;
  limit?: number;
  search?: string;
}

export interface HealthOfficeAreaPayload {
  name: string;
  code?: string | null;
  coverageNotes?: string | null;
}

function mapHealthOfficeArea(raw: RawHealthOfficeArea): HealthOfficeAreaItem | null {
  if (!raw.id || !raw.name) return null;
  return {
    id: raw.id,
    name: raw.name,
    code: raw.code ?? null,
    coverageNotes: raw.coverage_notes ?? null,
  };
}

function serializeCreatePayload(payload: HealthOfficeAreaPayload) {
  return {
    name: payload.name,
    code: payload.code ?? null,
    coverage_notes: payload.coverageNotes ?? null,
  };
}

function serializeUpdatePayload(payload: Partial<HealthOfficeAreaPayload>) {
  const body: Record<string, unknown> = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.code !== undefined) body.code = payload.code ?? null;
  if (payload.coverageNotes !== undefined) body.coverage_notes = payload.coverageNotes ?? null;
  return body;
}

export async function fetchHealthOfficeAreas(params: FetchHealthOfficeAreasParams = {}): Promise<HealthOfficeAreaItem[]> {
  const searchParams = new URLSearchParams();
  if (typeof params.skip === 'number') searchParams.set('skip', String(params.skip));
  if (typeof params.limit === 'number') searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);
  const path = `health-areas${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const data = await api(path, { method: 'GET' });
  return (Array.isArray(data) ? data : [])
    .map((item) => mapHealthOfficeArea(item as RawHealthOfficeArea))
    .filter((item): item is HealthOfficeAreaItem => Boolean(item));
}

export async function createHealthOfficeArea(payload: HealthOfficeAreaPayload): Promise<HealthOfficeAreaItem> {
  const response = await api('health-areas/', {
    method: 'POST',
    body: serializeCreatePayload(payload),
  });
  const mapped = mapHealthOfficeArea(response as RawHealthOfficeArea);
  if (!mapped) {
    throw new Error('Invalid health office area response');
  }
  return mapped;
}

export async function updateHealthOfficeArea(id: string, payload: Partial<HealthOfficeAreaPayload>): Promise<HealthOfficeAreaItem> {
  const response = await api(`health-areas/${id}`, {
    method: 'PATCH',
    body: serializeUpdatePayload(payload),
  });
  const mapped = mapHealthOfficeArea(response as RawHealthOfficeArea);
  if (!mapped) {
    throw new Error('Invalid health office area response');
  }
  return mapped;
}

export async function deleteHealthOfficeArea(id: string): Promise<void> {
  await api(`health-areas/${id}`, { method: 'DELETE' });
}
