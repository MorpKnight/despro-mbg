import { api } from './api';

export interface ApiKey {
    id: string;
    name: string;
    prefix: string;
    status: string;
    created_at: string;
    last_used_at: string | null;
}

export interface ApiKeyCreate {
    name: string;
}

export interface ApiKeyResponse extends ApiKey {
    key: string; // Only returned on creation
}

export async function fetchApiKeys(): Promise<ApiKey[]> {
    return api('api-keys/');
}

export async function createApiKey(data: ApiKeyCreate): Promise<ApiKeyResponse> {
    return api('api-keys/', {
        method: 'POST',
        body: data,
    });
}

export async function revokeApiKey(id: string): Promise<void> {
    return api(`api-keys/${id}`, {
        method: 'DELETE',
    });
}
