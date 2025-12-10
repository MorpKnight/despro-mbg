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

    return api(`associations/${queryString}`, {
        method: 'GET',
    });
}

export async function createAssociation(sekolahId: string, cateringId: string): Promise<Association> {
    return api('associations/', {
        method: 'POST',
        body: JSON.stringify({
            sekolah_id: sekolahId,
            catering_id: cateringId,
        }),
    });
}

export async function deleteAssociation(associationId: string): Promise<void> {
    return api(`associations/${associationId}`, {
        method: 'DELETE',
    });
}

/**
 * Fetch associations for Dinkes admin (auto-filtered by logged-in user's area)
 */
export async function fetchDinkesAssociations(): Promise<Association[]> {
    return api('associations/dinkes', {
        method: 'GET',
    });
}


export async function fetchAssociationsByArea(healthOfficeAreaId?: string): Promise<Association[]> {
    const queryParams = new URLSearchParams();
    if (healthOfficeAreaId) queryParams.append('health_office_area_id', healthOfficeAreaId);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    return api(`associations/by-area${queryString}`, {
        method: 'GET',
    });
}

