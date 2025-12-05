import { api } from './api';
import { RawHealthOfficeArea } from './healthOfficeAreas';

export interface HealthOfficeAreaLite {
    id: string;
    name: string;
    code?: string | null;
    coverageNotes?: string | null;
}

export interface SchoolListItem {
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
    healthOfficeAreaId?: string | null;
    healthOfficeArea?: HealthOfficeAreaLite | null;
}

interface RawSchool {
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
    health_office_area_id?: string | null;
    health_office_area?: RawHealthOfficeArea | null;
}

export interface FetchSchoolsParams {
    skip?: number;
    limit?: number;
    search?: string;
}

export interface SchoolPayload {
    name: string;
    addressLine?: string | null;
    postalCode?: string | null;
    countryCode?: string | null;
    administrativeAreaLevel1?: string | null;
    administrativeAreaLevel2?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    contactPhone?: string | null;
    healthOfficeAreaId?: string | null;
}

function mapHealthOfficeArea(raw: RawHealthOfficeArea | null | undefined): HealthOfficeAreaLite | null {
    if (!raw?.id || !raw.name) return null;
    return {
        id: raw.id,
        name: raw.name,
        code: raw.code ?? null,
        coverageNotes: raw.coverage_notes ?? null,
    };
}

function mapSchool(raw: RawSchool): SchoolListItem | null {
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
        healthOfficeAreaId: raw.health_office_area_id ?? raw.health_office_area?.id ?? null,
        healthOfficeArea: mapHealthOfficeArea(raw.health_office_area),
    };
}

function serializeCreatePayload(payload: SchoolPayload) {
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
        health_office_area_id: payload.healthOfficeAreaId ?? null,
    };
}

function serializeUpdatePayload(payload: Partial<SchoolPayload>) {
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
    if (payload.healthOfficeAreaId !== undefined) body.health_office_area_id = payload.healthOfficeAreaId ?? null;
    return body;
}

export async function fetchSchools(params: FetchSchoolsParams = {}): Promise<SchoolListItem[]> {
    const searchParams = new URLSearchParams();
    if (typeof params.skip === 'number') searchParams.set('skip', String(params.skip));
    if (typeof params.limit === 'number') searchParams.set('limit', String(params.limit));
    if (params.search) searchParams.set('search', params.search);

    const path = `schools/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const data = await api(path, { method: 'GET' });

    return (Array.isArray(data) ? data : [])
        .map((item) => mapSchool(item as RawSchool))
        .filter((item): item is SchoolListItem => Boolean(item));
}

export async function createSchool(payload: SchoolPayload): Promise<SchoolListItem> {
    const response = await api('schools/', {
        method: 'POST',
        body: serializeCreatePayload(payload),
    });
    const mapped = mapSchool(response as RawSchool);
    if (!mapped) {
        throw new Error('Invalid school response');
    }
    return mapped;
}

export async function updateSchool(id: string, payload: Partial<SchoolPayload>): Promise<SchoolListItem> {
    const response = await api(`schools/${id}`, {
        method: 'PATCH',
        body: serializeUpdatePayload(payload),
    });
    const mapped = mapSchool(response as RawSchool);
    if (!mapped) {
        throw new Error('Invalid school response');
    }
    return mapped;
}

export async function deleteSchool(id: string): Promise<void> {
    await api(`schools/${id}`, { method: 'DELETE' });
}
