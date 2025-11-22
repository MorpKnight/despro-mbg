import type {
    CreateUserPayload,
    FetchUsersParams,
    UpdateUserPayload,
    User,
} from '../schemas/users';
import {
    CreateUserPayloadSchema,
    FetchUsersParamsSchema,
    UpdateUserPayloadSchema,
    UserSchema,
} from '../schemas/users';
import { api } from './api';

export async function fetchUsers(params: FetchUsersParams = {}): Promise<User[]> {
    const safeParams = FetchUsersParamsSchema.parse(params);
    const searchParams = new URLSearchParams();
    if (typeof safeParams.skip === 'number') searchParams.set('skip', String(safeParams.skip));
    if (typeof safeParams.limit === 'number') searchParams.set('limit', String(safeParams.limit));
    if (safeParams.search) searchParams.set('search', safeParams.search);
    if (safeParams.role) searchParams.set('role', safeParams.role);

    const qs = searchParams.toString();
    const path = `admin/users/${qs ? `?${qs}` : ''}`;
    const data = await api(path, { method: 'GET' });

    return UserSchema.array().parse(data ?? []);
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
    const safePayload = CreateUserPayloadSchema.parse(payload);
    const data = await api('admin/users/', {
        method: 'POST',
        body: safePayload,
    });
    return UserSchema.parse(data);
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
    const safePayload = UpdateUserPayloadSchema.parse(payload);
    const data = await api(`admin/users/${id}`, {
        method: 'PATCH',
        body: safePayload,
    });
    return UserSchema.parse(data);
}

export async function deleteUser(id: string): Promise<void> {
    await api(`admin/users/${id}`, {
        method: 'DELETE',
    });
}
