import { api } from './api';

export interface Association {
    id: string;
    sekolah_id: string;
    catering_id: string;
    created_at: string;
    catering?: {
        id: string;
        name: string;
        address_line?: string;
        contact_phone?: string;
    };
    sekolah?: {
        id: string;
        name: string;
    }
}

export async function fetchAssociations(params?: { sekolah_id?: string; catering_id?: string }): Promise<Association[]> {
    const queryParams = new URLSearchParams();
    if (params?.sekolah_id) queryParams.append('sekolah_id', params.sekolah_id);
    if (params?.catering_id) queryParams.append('catering_id', params.catering_id);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    return api(`associations${queryString}`, {
        method: 'GET',
    });
}
