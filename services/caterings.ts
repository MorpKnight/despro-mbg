import { api } from './api';

export interface CateringListItem {
  id: string;
  name: string;
  alamat?: string | null;
  provinsi?: string | null;
  kotaKabupaten?: string | null;
  kecamatan?: string | null;
  kelurahan?: string | null;
  contactPhone?: string | null;
}

interface RawCatering {
  id?: string;
  name?: string;
  alamat?: string | null;
  provinsi?: string | null;
  kota_kabupaten?: string | null;
  kecamatan?: string | null;
  kelurahan?: string | null;
  contact_phone?: string | null;
}

export interface FetchCateringsParams {
  skip?: number;
  limit?: number;
  search?: string;
}

export interface CateringPayload {
  name: string;
  alamat?: string | null;
  provinsi?: string | null;
  kotaKabupaten?: string | null;
  kecamatan?: string | null;
  kelurahan?: string | null;
  contactPhone?: string | null;
}

function mapCatering(raw: RawCatering): CateringListItem | null {
  if (!raw.id || !raw.name) return null;
  return {
    id: raw.id,
    name: raw.name,
    alamat: raw.alamat ?? null,
    provinsi: raw.provinsi ?? null,
    kotaKabupaten: raw.kota_kabupaten ?? null,
    kecamatan: raw.kecamatan ?? null,
    kelurahan: raw.kelurahan ?? null,
    contactPhone: raw.contact_phone ?? null,
  };
}

function serializeCreatePayload(payload: CateringPayload) {
  return {
    name: payload.name,
    alamat: payload.alamat ?? null,
    provinsi: payload.provinsi ?? null,
    kota_kabupaten: payload.kotaKabupaten ?? null,
    kecamatan: payload.kecamatan ?? null,
    kelurahan: payload.kelurahan ?? null,
    contact_phone: payload.contactPhone ?? null,
  };
}

function serializeUpdatePayload(payload: Partial<CateringPayload>) {
  const body: Record<string, unknown> = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.alamat !== undefined) body.alamat = payload.alamat ?? null;
  if (payload.provinsi !== undefined) body.provinsi = payload.provinsi ?? null;
  if (payload.kotaKabupaten !== undefined) body.kota_kabupaten = payload.kotaKabupaten ?? null;
  if (payload.kecamatan !== undefined) body.kecamatan = payload.kecamatan ?? null;
  if (payload.kelurahan !== undefined) body.kelurahan = payload.kelurahan ?? null;
  if (payload.contactPhone !== undefined) body.contact_phone = payload.contactPhone ?? null;
  return body;
}

export async function fetchCaterings(params: FetchCateringsParams = {}): Promise<CateringListItem[]> {
  const searchParams = new URLSearchParams();
  if (typeof params.skip === 'number') searchParams.set('skip', String(params.skip));
  if (typeof params.limit === 'number') searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);
  const path = `caterings${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const data = await api(path, { method: 'GET' });
  return (Array.isArray(data) ? data : [])
    .map((item) => mapCatering(item as RawCatering))
    .filter((item): item is CateringListItem => Boolean(item));
}

export async function createCatering(payload: CateringPayload): Promise<CateringListItem> {
  const response = await api('caterings/', {
    method: 'POST',
    body: serializeCreatePayload(payload),
  });
  const mapped = mapCatering(response as RawCatering);
  if (!mapped) {
    throw new Error('Invalid catering response');
  }
  return mapped;
}

export async function updateCatering(id: string, payload: Partial<CateringPayload>): Promise<CateringListItem> {
  const response = await api(`caterings/${id}`, {
    method: 'PATCH',
    body: serializeUpdatePayload(payload),
  });
  const mapped = mapCatering(response as RawCatering);
  if (!mapped) {
    throw new Error('Invalid catering response');
  }
  return mapped;
}

export async function deleteCatering(id: string): Promise<void> {
  await api(`caterings/${id}`, { method: 'DELETE' });
}
