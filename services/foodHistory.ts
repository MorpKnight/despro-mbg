import { api } from './api';

export interface Menu {
    id: string;
    cateringId: string;
    cateringName?: string;
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
    catering_name?: string;
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
        cateringName: raw.catering_name,
        tanggal: raw.tanggal,
        namaMenu: raw.nama_menu,
        ingredients: raw.ingredients,
        notes: raw.notes,
        photoUrls: raw.photo_urls,
        createdAt: raw.created_at,
    };
}

export interface FoodHistoryParams {
    startDate?: string;
    endDate?: string;
    month?: number;
    year?: number;
    search?: string;
    schoolId?: string;   // For Super Admin/School Admin to view specific school history
    cateringId?: string; // For Super Admin/Catering Admin to view specific catering history
}

export const fetchStudentFoodHistory = async ({
    startDate,
    endDate,
    month,
    year,
    search
}: FoodHistoryParams = {}): Promise<Menu[]> => {
    const params = new URLSearchParams();

    if (startDate && startDate === endDate) {
        params.append('date', startDate);
    } else {
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
    }

    if (month && year) {
        params.append('month', month.toString());
        params.append('year', year.toString());
    }

    if (search) params.append('search', search);

    const response = await api(`food-history/student?${params.toString()}`, { method: 'GET' });
    const list = Array.isArray(response) ? response : [];
    return list.map((item: RawMenu) => toMenu(item));
};

export const fetchSchoolFoodHistory = async ({
    startDate,
    endDate,
    month,
    year,
    search,
    schoolId
}: FoodHistoryParams = {}): Promise<Menu[]> => {
    const params = new URLSearchParams();

    if (startDate && startDate === endDate) {
        params.append('date', startDate);
    } else {
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
    }

    if (month && year) {
        params.append('month', month.toString());
        params.append('year', year.toString());
    }

    if (search) params.append('search', search);
    if (schoolId) params.append('school_id', schoolId);

    const response = await api(`food-history/school?${params.toString()}`, { method: 'GET' });
    const list = Array.isArray(response) ? response : [];
    return list.map((item: RawMenu) => toMenu(item));
};

export const fetchCateringFoodHistory = async ({
    startDate,
    endDate,
    month,
    year,
    search,
    cateringId
}: FoodHistoryParams = {}): Promise<Menu[]> => {
    const params = new URLSearchParams();

    if (startDate && startDate === endDate) {
        params.append('date', startDate);
    } else {
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
    }

    if (month && year) {
        params.append('month', month.toString());
        params.append('year', year.toString());
    }

    if (search) params.append('search', search);
    if (cateringId) params.append('catering_id', cateringId);

    const response = await api(`food-history/catering?${params.toString()}`, { method: 'GET' });
    const list = Array.isArray(response) ? response : [];
    return list.map((item: RawMenu) => toMenu(item));
};
