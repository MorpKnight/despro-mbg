import { api } from './api';

export type ReportStatus = 'menunggu' | 'proses' | 'selesai';

export interface EmergencyFollowUp {
  at: string;
  note: string;
  userName?: string;
  userRole?: string;
}

export interface EmergencyReport {
  id: string;
  date: string;
  status: ReportStatus;
  title: string;
  description?: string | null;
  symptoms?: string[];
  studentsAffected?: number | null;
  studentsAffectedDescription?: string | null;
  suspectedFood?: string | null;
  schoolId?: string;
  schoolName: string;
  schoolAddress?: string | null;
  reportedBy?: string | null;
  followUps: EmergencyFollowUp[];
}

type RawEmergencyReport = {
  id: string;
  status: string;
  title: string;
  description?: string | null;
  gejala?: unknown;
  students_affected_count?: number | null;
  students_affected_description?: string | null;
  suspected_menu?: string | null;
  created_at: string;
  updated_at: string;
  school?: {
    id: string;
    name: string;
    address_line?: string | null;
  } | null;
  reported_by?: {
    full_name?: string | null;
    role?: string | null;
  } | null;
  follow_ups?: {
    id: string;
    created_at: string;
    deskripsi: string;
    user?: {
      full_name?: string | null;
      role?: string | null;
    } | null;
  }[];
};

function coerceSymptoms(gejala: unknown): string[] | undefined {
  if (!gejala) return undefined;
  if (Array.isArray(gejala)) {
    return gejala
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'label' in item) {
          return String((item as { label: unknown }).label);
        }
        return typeof item === 'object' ? JSON.stringify(item) : String(item);
      })
      .filter(Boolean);
  }
  if (typeof gejala === 'string') {
    return gejala.split(/[,;\n]/).map((part) => part.trim()).filter(Boolean);
  }
  try {
    const parsed = JSON.parse(String(gejala));
    return coerceSymptoms(parsed);
  } catch {
    return [String(gejala)];
  }
}

function normalizeStatus(value: string | undefined | null): ReportStatus {
  const normalized = (value || '').toLowerCase();
  if (normalized === 'proses' || normalized === 'selesai') return normalized;
  return 'menunggu';
}

function humanizeRole(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  return value
    .split('_')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function mapEmergencyReport(raw: RawEmergencyReport): EmergencyReport {
  return {
    id: raw.id,
    status: normalizeStatus(raw.status),
    title: raw.title,
    description: raw.description ?? null,
    symptoms: coerceSymptoms(raw.gejala),
    studentsAffected: raw.students_affected_count ?? null,
    studentsAffectedDescription: raw.students_affected_description ?? null,
    suspectedFood: raw.suspected_menu ?? null,
    date: raw.created_at,
    schoolId: raw.school?.id,
    schoolName: raw.school?.name ?? 'Sekolah tidak dikenal',
    schoolAddress: raw.school?.address_line ?? null,
    reportedBy: raw.reported_by?.full_name ?? null,
    followUps:
      raw.follow_ups?.map((fu) => ({
        at: fu.created_at,
        note: fu.deskripsi,
        userName: fu.user?.full_name ?? undefined,
        userRole: humanizeRole(fu.user?.role ?? undefined),
      })) ?? [],
  };
}

export interface EmergencyReportParams {
  status?: ReportStatus;
  schoolId?: string;
}

export async function fetchEmergencyReports(params: EmergencyReportParams = {}): Promise<EmergencyReport[]> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.schoolId) search.set('school_id', params.schoolId);
  const path = `emergency/reports${search.toString() ? `?${search.toString()}` : ''}`;
  const data = await api(path, { method: 'GET' });
  return (Array.isArray(data) ? data : [])
    .map((item) => mapEmergencyReport(item as RawEmergencyReport));
}

export async function fetchEmergencyReport(id: string): Promise<EmergencyReport | null> {
  try {
    const data = await api(`emergency/reports/${id}`, { method: 'GET' });
    return mapEmergencyReport(data as RawEmergencyReport);
  } catch (err) {
    console.error('[emergency] fetch report failed', err);
    return null;
  }
}

export async function updateEmergencyStatus(
  id: string,
  status: ReportStatus,
  note?: string,
): Promise<EmergencyReport | null> {
  try {
    const data = await api(`emergency/reports/${id}/followup`, {
      method: 'POST',
      body: { status, deskripsi: note || 'Status update' },
    });
    return mapEmergencyReport(data as RawEmergencyReport);
  } catch (err) {
    console.warn('[emergency] update failed, queueing', err);
    const { storage } = await import('./storage');
    const key = 'emergency_updates_queue';
    const existing = (await storage.get<any[]>(key)) || [];
    existing.push({ id, status, note, at: new Date().toISOString() });
    await storage.set(key, existing);
    return null;
  }
}
