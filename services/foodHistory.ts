import { api } from './api';

export interface Menu {
    id: string;
    cateringId: string;
    tanggal: string; // YYYY-MM-DD
    namaMenu: string;
    ingredients?: any;
    notes?: string;
    photoUrls?: string[];
    createdAt: string;
}

interface RawMenu {
    id: string;
    catering_id: string;
    tanggal: string;
    nama_menu: string;
    ingredients?: any;
    notes?: string;
    photo_urls?: string[];
    created_at: string;
}

function toMenu(raw: RawMenu): Menu {
    return {
        id: raw.id,
        cateringId: raw.catering_id,
        tanggal: raw.tanggal,
        namaMenu: raw.nama_menu,
        ingredients: raw.ingredients,
        notes: raw.notes,
        photoUrls: raw.photo_urls,
        createdAt: raw.created_at,
    };
}

export async function fetchStudentFoodHistory(params: { startDate?: string; endDate?: string }): Promise<Menu[]> {
    const searchParams = new URLSearchParams();
    if (params.startDate) searchParams.append('start_date', params.startDate);
    if (params.endDate) searchParams.append('end_date', params.endDate);

    const data = await api(`food-history/student?${searchParams.toString()}`, { method: 'GET' });
    const list = Array.isArray(data) ? data : [];
    return list.map((item: any) => toMenu(item));
}

export async function fetchSchoolFoodHistory(params: { startDate?: string; endDate?: string; schoolId?: string }): Promise<Menu[]> {
    const searchParams = new URLSearchParams();
    if (params.startDate) searchParams.append('start_date', params.startDate);
    if (params.endDate) searchParams.append('end_date', params.endDate);
    if (params.schoolId) searchParams.append('school_id', params.schoolId);

    const data = await api(`food-history/school?${searchParams.toString()}`, { method: 'GET' });
    const list = Array.isArray(data) ? data : [];
    return list.map((item: any) => toMenu(item));
}

export async function fetchCateringFoodHistory(params: { startDate?: string; endDate?: string; cateringId?: string }): Promise<Menu[]> {
    const searchParams = new URLSearchParams();
    if (params.startDate) searchParams.append('start_date', params.startDate);
    if (params.endDate) searchParams.append('end_date', params.endDate);
    if (params.cateringId) searchParams.append('catering_id', params.cateringId);

    const data = await api(`food-history/catering?${searchParams.toString()}`, { method: 'GET' });
    const list = Array.isArray(data) ? data : [];
    return list.map((item: any) => toMenu(item));
}
