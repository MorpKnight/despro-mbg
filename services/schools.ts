import { api } from './api';

export interface HealthOfficeAreaLite {
    id: string;
    name: string;
    code?: string | null;
    coverageNotes?: string | null;
}

export interface SchoolListItem {
    id: string;
    name: string;
    alamat?: string | null;
    provinsi?: string | null;
    kotaKabupaten?: string | null;
    kecamatan?: string | null;
    kelurahan?: string | null;
    contactPhone?: string | null;
    healthOfficeAreaId?: string | null;
    healthOfficeArea?: HealthOfficeAreaLite | null;
}

interface RawHealthOfficeArea {
    id?: string;
    name?: string;
    code?: string | null;
    coverage_notes?: string | null;
}

interface RawSchool {
    id?: string;
    name?: string;
    alamat?: string | null;
    provinsi?: string | null;
    kota_kabupaten?: string | null;
    kecamatan?: string | null;
    kelurahan?: string | null;
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
    alamat?: string | null;
    provinsi?: string | null;
    kotaKabupaten?: string | null;
    kecamatan?: string | null;
    kelurahan?: string | null;
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
        alamat: raw.alamat ?? null,
        provinsi: raw.provinsi ?? null,
        kotaKabupaten: raw.kota_kabupaten ?? null,
        kecamatan: raw.kecamatan ?? null,
        kelurahan: raw.kelurahan ?? null,
        contactPhone: raw.contact_phone ?? null,
        healthOfficeAreaId: raw.health_office_area_id ?? raw.health_office_area?.id ?? null,
        healthOfficeArea: mapHealthOfficeArea(raw.health_office_area),
    };
}

function serializeCreatePayload(payload: SchoolPayload) {
    return {
        name: payload.name,
        alamat: payload.alamat ?? null,
        provinsi: payload.provinsi ?? null,
        kota_kabupaten: payload.kotaKabupaten ?? null,
        kecamatan: payload.kecamatan ?? null,
        kelurahan: payload.kelurahan ?? null,
        contact_phone: payload.contactPhone ?? null,
        health_office_area_id: payload.healthOfficeAreaId ?? null,
    };
}

function serializeUpdatePayload(payload: Partial<SchoolPayload>) {
    const body: Record<string, unknown> = {};
    if (payload.name !== undefined) body.name = payload.name;
    if (payload.alamat !== undefined) body.alamat = payload.alamat ?? null;
    if (payload.provinsi !== undefined) body.provinsi = payload.provinsi ?? null;
    if (payload.kotaKabupaten !== undefined) body.kota_kabupaten = payload.kotaKabupaten ?? null;
    if (payload.kecamatan !== undefined) body.kecamatan = payload.kecamatan ?? null;
    if (payload.kelurahan !== undefined) body.kelurahan = payload.kelurahan ?? null;
    if (payload.contactPhone !== undefined) body.contact_phone = payload.contactPhone ?? null;
    if (payload.healthOfficeAreaId !== undefined) body.health_office_area_id = payload.healthOfficeAreaId ?? null;
    return body;
}

export async function fetchSchools(params: FetchSchoolsParams = {}): Promise<SchoolListItem[]> {
    const searchParams = new URLSearchParams();
    if (typeof params.skip === 'number') searchParams.set('skip', String(params.skip));
    if (typeof params.limit === 'number') searchParams.set('limit', String(params.limit));
    if (params.search) searchParams.set('search', params.search);

    const path = `schools${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
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
