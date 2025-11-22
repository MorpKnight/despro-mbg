import { api } from './api';

export type UserRole = 'super_admin' | 'admin_sekolah' | 'admin_catering' | 'admin_dinkes' | 'siswa';
export type UserAccountStatus = 'active' | 'inactive' | 'pending_confirmation' | 'suspended';

export interface User {
    id: string;
    username: string;
    fullName: string | null;
    role: UserRole;
    accountStatus: UserAccountStatus;
    schoolId: string | null;
    cateringId: string | null;
    healthOfficeAreaId: string | null;
    healthOfficeArea: string | null;
    nfcTag: string | null;
    createdAt: string;
    updatedAt: string;

    // Expanded relations (optional, depending on backend response)
    sekolah?: { id: string; name: string } | null;
    catering?: { id: string; name: string } | null;
}

interface RawUser {
    id: string;
    username: string;
    full_name: string | null;
    role: UserRole;
    account_status: UserAccountStatus;
    school_id: string | null;
    catering_id: string | null;
    health_office_area_id: string | null;
    health_office_area: string | null;
    nfc_tag: string | null;
    created_at: string;
    updated_at: string;
    sekolah?: { id: string; name: string } | null;
    catering?: { id: string; name: string } | null;
}

export interface CreateUserPayload {
    username: string;
    password: string;
    full_name?: string;
    role: UserRole;
    account_status?: UserAccountStatus;
    school_id?: string;
    catering_id?: string;
    health_office_area?: string;
    health_office_area_id?: string;
}

export interface UpdateUserPayload {
    username?: string;
    password?: string; // Optional for update
    full_name?: string;
    role?: UserRole;
    account_status?: UserAccountStatus;
    school_id?: string | null;
    catering_id?: string | null;
    health_office_area?: string | null;
    health_office_area_id?: string | null;
}

export interface FetchUsersParams {
    skip?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
}

function mapUser(raw: RawUser): User {
    return {
        id: raw.id,
        username: raw.username,
        fullName: raw.full_name,
        role: raw.role,
        accountStatus: raw.account_status,
        schoolId: raw.school_id,
        cateringId: raw.catering_id,
        healthOfficeAreaId: raw.health_office_area_id,
        healthOfficeArea: raw.health_office_area,
        nfcTag: raw.nfc_tag,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
        sekolah: raw.sekolah,
        catering: raw.catering,
    };
}

export async function fetchUsers(params: FetchUsersParams = {}): Promise<User[]> {
    const searchParams = new URLSearchParams();
    if (typeof params.skip === 'number') searchParams.set('skip', String(params.skip));
    if (typeof params.limit === 'number') searchParams.set('limit', String(params.limit));
    if (params.search) searchParams.set('search', params.search);
    if (params.role) searchParams.set('role', params.role);

    const path = `admin/users/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const data = await api(path, { method: 'GET' });

    return (Array.isArray(data) ? data : [])
        .map((item) => mapUser(item as RawUser));
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
    const data = await api('admin/users/', {
        method: 'POST',
        body: payload,
    });
    return mapUser(data as RawUser);
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
    const data = await api(`admin/users/${id}`, {
        method: 'PATCH',
        body: payload,
    });
    return mapUser(data as RawUser);
}

export async function deleteUser(id: string): Promise<void> {
    await api(`admin/users/${id}`, {
        method: 'DELETE',
    });
}
