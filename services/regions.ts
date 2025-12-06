import { api } from './api';
import { DropdownOption } from '../components/ui/Dropdown';

export interface Region {
    code: string;
    name: string;
    province_code?: string;
}

export type { DropdownOption }; // Re-export if needed, or just use the imported one

export const PROVINCES: DropdownOption[] = []; // Deprecated, use fetchProvinces

export const fetchProvinces = async (): Promise<DropdownOption[]> => {
    try {
        const data = await api('/regions/provinces', { method: 'GET' });
        return (data as Region[]).map((p) => ({
            label: p.name,
            value: p.name, // Use name as value for consistent storage
        }));
    } catch (error) {
        console.warn('[regions] failed to fetch provinces', error);
        return [];
    }
};

export const fetchCities = async (provinceName: string): Promise<DropdownOption[]> => {
    try {
        // Backend expects province name
        const params = new URLSearchParams({ province_name: provinceName });
        const data = await api(`/regions/cities?${params.toString()}`, { method: 'GET' });
        return (data as Region[]).map((c) => ({
            label: c.name,
            value: c.name,
        }));
    } catch (error) {
        console.warn('[regions] failed to fetch cities', error);
        return [];
    }
};

export const getCities = (province: string | null | undefined): DropdownOption[] => {
    // Deprecated synchronous helper.
    // Return empty array as we need async fetching now.
    // Components should migrate to fetchCities.
    return [];
};
