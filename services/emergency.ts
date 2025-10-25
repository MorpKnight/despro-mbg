import { api } from './api';

export type ReportStatus = 'MENUNGGU' | 'PROSES' | 'SELESAI';

export interface EmergencyReport {
  id: string;
  date: string; // ISO date
  schoolName: string;
  location?: string;
  title: string; // short summary
  description?: string;
  studentsAffected?: number;
  symptoms?: string[];
  suspectedFood?: string;
  status: ReportStatus;
  followUps?: { at: string; note: string }[];
}

const MOCK: EmergencyReport[] = [
  {
    id: 'r1',
    date: '2025-10-24T08:30:00Z',
    schoolName: 'SDN Melati 03',
    location: 'Tanah Sareal, Bogor',
    title: 'Dugaan Keracunan Makanan',
    description: 'Beberapa siswa mengeluh mual dan pusing setelah makan siang.',
    studentsAffected: 7,
    symptoms: ['mual', 'pusing'],
    suspectedFood: 'Ayam teriyaki',
    status: 'PROSES',
    followUps: [
      { at: '2025-10-24T09:15:00Z', note: 'Koordinasi dengan puskesmas setempat.' },
    ],
  },
  {
    id: 'r2',
    date: '2025-10-22T10:00:00Z',
    schoolName: 'SDN Cibuluh 01',
    title: 'Alergi Kacang - 1 siswa',
    studentsAffected: 1,
    symptoms: ['gatal', 'bengkak ringan'],
    suspectedFood: 'Saus kacang',
    status: 'SELESAI',
    followUps: [
      { at: '2025-10-22T10:20:00Z', note: 'Pemberian antihistamin. Edukasi alergi.' },
    ],
  },
  {
    id: 'r3',
    date: '2025-10-20T07:20:00Z',
    schoolName: 'SDN Cipaku 02',
    title: 'Keluhan Mual Setelah Makan',
    studentsAffected: 3,
    status: 'MENUNGGU',
  },
];

export async function fetchEmergencyReports(): Promise<EmergencyReport[]> {
  try {
    const data = await api('/emergency-reports', { method: 'GET' });
    return data as EmergencyReport[];
  } catch {
    return MOCK;
  }
}

export async function fetchEmergencyReport(id: string): Promise<EmergencyReport | null> {
  try {
    const data = await api(`/emergency-reports/${id}`, { method: 'GET' });
    return data as EmergencyReport;
  } catch {
    return MOCK.find(r => r.id === id) || null;
  }
}

export async function updateEmergencyStatus(id: string, status: ReportStatus, note?: string) {
  try {
    await api(`/emergency-reports/${id}`, { method: 'PATCH', body: { status, note } as any });
    return true;
  } catch {
    // Queue offline update
    const { storage } = await import('./storage');
    const key = 'emergency_updates_queue';
    const existing = (await storage.get<any[]>(key)) || [];
    existing.push({ id, status, note, at: new Date().toISOString() });
    await storage.set(key, existing);
    return false;
  }
}
