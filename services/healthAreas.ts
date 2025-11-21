import { api } from './api';

export interface HealthOfficeAreaListItem {
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

export interface FetchHealthAreaParams {
  search?: string;
  skip?: number;
  limit?: number;
}

function mapHealthArea(raw: RawHealthOfficeArea): HealthOfficeAreaListItem | null {
  if (!raw.id || !raw.name) {
    return null;
  }
  return {
    id: raw.id,
    name: raw.name,
    code: raw.code ?? null,
    coverageNotes: raw.coverage_notes ?? null,
  };
}

export async function fetchHealthOfficeAreas(
  params: FetchHealthAreaParams = {},
): Promise<HealthOfficeAreaListItem[]> {
  const searchParams = new URLSearchParams();
  if (typeof params.skip === 'number') searchParams.set('skip', String(params.skip));
  if (typeof params.limit === 'number') searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);

  const path = `health-areas${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const data = await api(path, { method: 'GET' });

  return (Array.isArray(data) ? data : [])
    .map((item) => mapHealthArea(item as RawHealthOfficeArea))
    .filter((item): item is HealthOfficeAreaListItem => Boolean(item));
}
