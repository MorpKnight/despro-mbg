import { api } from './api';

export interface CateringListItem {
  id: string;
  name: string;
  addressLine?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
  administrativeAreaLevel1?: string | null;
  administrativeAreaLevel2?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  contactPhone?: string | null;
}

interface RawCatering {
  id?: string;
  name?: string;
  address_line?: string | null;
  postal_code?: string | null;
  country_code?: string | null;
  administrative_area_level_1?: string | null;
  administrative_area_level_2?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  contact_phone?: string | null;
}

export interface FetchCateringsParams {
  skip?: number;
  limit?: number;
  search?: string;
}

export interface CateringPayload {
  name: string;
  addressLine?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
  administrativeAreaLevel1?: string | null;
  administrativeAreaLevel2?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  contactPhone?: string | null;
}

function mapCatering(raw: RawCatering): CateringListItem | null {
  if (!raw.id || !raw.name) return null;
  return {
    id: raw.id,
    name: raw.name,
    addressLine: raw.address_line ?? null,
    postalCode: raw.postal_code ?? null,
    countryCode: raw.country_code ?? null,
    administrativeAreaLevel1: raw.administrative_area_level_1 ?? null,
    administrativeAreaLevel2: raw.administrative_area_level_2 ?? null,
    latitude: raw.latitude ?? null,
    longitude: raw.longitude ?? null,
    contactPhone: raw.contact_phone ?? null,
  };
}

function serializeCreatePayload(payload: CateringPayload) {
  return {
    name: payload.name,
    address_line: payload.addressLine ?? null,
    postal_code: payload.postalCode ?? null,
    country_code: payload.countryCode ?? null,
    administrative_area_level_1: payload.administrativeAreaLevel1 ?? null,
    administrative_area_level_2: payload.administrativeAreaLevel2 ?? null,
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    contact_phone: payload.contactPhone ?? null,
  };
}

function serializeUpdatePayload(payload: Partial<CateringPayload>) {
  const body: Record<string, unknown> = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.addressLine !== undefined) body.address_line = payload.addressLine ?? null;
  if (payload.postalCode !== undefined) body.postal_code = payload.postalCode ?? null;
  if (payload.countryCode !== undefined) body.country_code = payload.countryCode ?? null;
  if (payload.administrativeAreaLevel1 !== undefined) body.administrative_area_level_1 = payload.administrativeAreaLevel1 ?? null;
  if (payload.administrativeAreaLevel2 !== undefined) body.administrative_area_level_2 = payload.administrativeAreaLevel2 ?? null;
  if (payload.latitude !== undefined) body.latitude = payload.latitude ?? null;
  if (payload.longitude !== undefined) body.longitude = payload.longitude ?? null;
  if (payload.contactPhone !== undefined) body.contact_phone = payload.contactPhone ?? null;
  return body;
}

export async function fetchCaterings(params: FetchCateringsParams = {}): Promise<CateringListItem[]> {
  const searchParams = new URLSearchParams();
  if (typeof params.skip === 'number') searchParams.set('skip', String(params.skip));
  if (typeof params.limit === 'number') searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);
  const path = `caterings/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
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
