import { api } from './api';

export type AttendanceMethod = 'nfc' | 'qr' | 'manual' | 'assisted';

export interface AttendanceStudent {
  id: string;
  fullName?: string | null;
  username: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  method: AttendanceMethod;
  createdAt: string;
  student: AttendanceStudent;
}

export interface AttendanceSummary {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
}

export interface AttendanceListParams {
  date?: string;
  schoolId?: string;
  method?: AttendanceMethod;
  limit?: number;
  offset?: number;
}

export interface AttendanceSearchParams {
  query?: string;
  limit?: number;
  schoolId?: string;
}

export interface RecordAttendanceResult {
  record: AttendanceRecord | null;
  queued: boolean;
}

interface RawAttendanceStudent {
  id?: string;
  full_name?: string | null;
  username?: string;
}

interface RawAttendanceRecord {
  id?: string;
  student_id?: string;
  method?: string;
  created_at?: string;
  student?: RawAttendanceStudent | null;
}

interface RawAttendanceSummary {
  total_students?: number;
  present_today?: number;
  absent_today?: number;
}

interface RawAttendanceNfcResponse {
  student?: RawAttendanceStudent | null;
  last_attendance_at?: string | null;
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (error instanceof Error) {
    return /Network request failed|Failed to fetch|NetworkError/i.test(error.message);
  }
  return false;
}

function toStudent(raw: RawAttendanceStudent | null | undefined): AttendanceStudent {
  return {
    id: raw?.id ?? '',
    fullName: raw?.full_name ?? null,
    username: raw?.username ?? '',
  };
}

function toAttendanceRecord(raw: RawAttendanceRecord): AttendanceRecord {
  return {
    id: raw.id ?? '',
    studentId: raw.student_id ?? '',
    method: (raw.method as AttendanceMethod) ?? 'manual',
    createdAt: raw.created_at ?? new Date().toISOString(),
    student: toStudent(raw.student),
  };
}

function toAttendanceSummary(raw: RawAttendanceSummary): AttendanceSummary {
  return {
    totalStudents: typeof raw.total_students === 'number' ? raw.total_students : 0,
    presentToday: typeof raw.present_today === 'number' ? raw.present_today : 0,
    absentToday: typeof raw.absent_today === 'number' ? raw.absent_today : 0,
  };
}

export async function fetchAttendanceSummary(params: { schoolId?: string } = {}): Promise<AttendanceSummary> {
  const search = new URLSearchParams();
  if (params.schoolId) search.set('school_id', params.schoolId);
  const path = `attendance/summary${search.toString() ? `?${search.toString()}` : ''}`;
  const data = await api(path, { method: 'GET' });
  return toAttendanceSummary(data as RawAttendanceSummary);
}

export async function fetchAttendanceList(params: AttendanceListParams = {}): Promise<AttendanceRecord[]> {
  const search = new URLSearchParams();
  if (params.date) search.set('date_filter', params.date);
  if (params.schoolId) search.set('school_id', params.schoolId);
  if (params.method) search.set('method', params.method);
  if (typeof params.limit === 'number') search.set('limit', String(params.limit));
  if (typeof params.offset === 'number') search.set('offset', String(params.offset));
  const path = `attendance/list${search.toString() ? `?${search.toString()}` : ''}`;
  const data = await api(path, { method: 'GET' });
  const list = Array.isArray(data) ? data : [];
  return list.map((item) => toAttendanceRecord(item as RawAttendanceRecord));
}

export async function searchAttendanceStudents(params: AttendanceSearchParams = {}): Promise<AttendanceStudent[]> {
  const search = new URLSearchParams();
  if (params.query) search.set('query', params.query);
  if (typeof params.limit === 'number') search.set('limit', String(params.limit));
  if (params.schoolId) search.set('school_id', params.schoolId);
  const path = `attendance/students${search.toString() ? `?${search.toString()}` : ''}`;
  const data = await api(path, { method: 'GET' });
  const list = Array.isArray(data) ? data : [];
  return list.map((item) => toStudent(item as RawAttendanceStudent));
}

export interface AttendanceNfcLookup {
  student: AttendanceStudent;
  lastAttendanceAt: string | null;
}

export async function lookupStudentByNfcTag(nfcTag: string, schoolId?: string): Promise<AttendanceNfcLookup> {
  const search = new URLSearchParams();
  if (schoolId) search.set('school_id', schoolId);
  const path = `attendance/nfc/${encodeURIComponent(nfcTag)}${search.toString() ? `?${search.toString()}` : ''}`;
  const data = await api(path, { method: 'GET' });
  const raw = data as RawAttendanceNfcResponse;
  return {
    student: toStudent(raw.student),
    lastAttendanceAt: raw.last_attendance_at ?? null,
  };
}

export async function recordAttendance(studentId: string, method: AttendanceMethod): Promise<RecordAttendanceResult> {
  const payload = { student_id: studentId, method };
  try {
    const data = await api('attendance/', { method: 'POST', body: payload });
    return { record: toAttendanceRecord(data as RawAttendanceRecord), queued: false };
  } catch (error) {
    throw error;
  }
}

export async function recordAttendanceViaNfc(nfcTagId: string): Promise<RecordAttendanceResult> {
  const payload = { nfc_tag_id: nfcTagId };
  try {
    const data = await api('attendance/nfc', { method: 'POST', body: payload });
    return { record: toAttendanceRecord(data as RawAttendanceRecord), queued: false };
  } catch (error) {
    throw error;
  }
}
