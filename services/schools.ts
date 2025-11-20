import { api } from './api';

export interface SchoolListItem {
    id: string;
    name: string;
    alamat?: string | null;
    provinsi?: string | null;
    kotaKabupaten?: string | null;
    kecamatan?: string | null;
    kelurahan?: string | null;
    contactPhone?: string | null;
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
}

export interface FetchSchoolsParams {
    skip?: number;
    limit?: number;
    search?: string;
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
    };
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
