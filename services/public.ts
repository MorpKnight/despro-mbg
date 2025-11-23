import { api } from './api';

export type PublicSchool = {
    id: string;
    name: string;
    alamat: string | null;
};

export type PublicCatering = {
    id: string;
    name: string;
    alamat: string | null;
};

export type PublicHealthOffice = {
    id: string;
    name: string;
    code: string | null;
};

export const publicService = {
    getSchools: async (): Promise<PublicSchool[]> => {
        const response = await api('/public/sekolah', { auth: false });
        // api function returns parsed JSON directly if content-type is json
        return response;
    },

    getCaterings: async (): Promise<PublicCatering[]> => {
        const response = await api('/public/catering', { auth: false });
        return response;
    },

    getHealthOffices: async (): Promise<PublicHealthOffice[]> => {
        const response = await api('/public/health-offices', { auth: false });
        return response;
    },
};
