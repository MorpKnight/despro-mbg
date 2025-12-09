import { api } from './api';

export type FeedbackRating = 1 | 2 | 3 | 4 | 5;

export interface FeedbackStudent {
  id: string;
  fullName?: string | null;
  username: string;
}

export interface FeedbackItem {
  id: string;
  rating: FeedbackRating;
  comment: string | null;
  menuId: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  student: FeedbackStudent;
}

interface RawFeedbackStudent {
  id?: string;
  full_name?: string | null;
  username?: string;
}

interface RawFeedbackItem {
  id?: string;
  rating?: number;
  comment?: string | null;
  menu_id?: string | null;
  photo_url?: string | null;
  created_at?: string;
  updated_at?: string;
  student?: RawFeedbackStudent | null;
}

export interface FeedbackListParams {
  dateFrom?: string;
  dateTo?: string;
  rating?: FeedbackRating;
  schoolId?: string;
}

// [UBAH] Payload sekarang menerima photoUrl string
export interface SubmitFeedbackPayload {
  rating: FeedbackRating;
  comment?: string;
  menuId?: string;
  photoUrl?: string; 
}

function toStudent(raw: RawFeedbackStudent | null | undefined): FeedbackStudent {
  return {
    id: raw?.id ?? '',
    fullName: raw?.full_name ?? null,
    username: raw?.username ?? '',
  };
}

function toFeedbackItem(raw: RawFeedbackItem): FeedbackItem {
  const rating = Math.min(Math.max(Number(raw.rating ?? 0), 1), 5) as FeedbackRating;
  return {
    id: raw.id ?? '',
    rating,
    comment: raw.comment ?? null,
    menuId: raw.menu_id ?? null,
    photoUrl: raw.photo_url ?? null,
    createdAt: raw.created_at ?? new Date().toISOString(),
    updatedAt: raw.updated_at ?? raw.created_at ?? new Date().toISOString(),
    student: toStudent(raw.student),
  };
}

export async function fetchFeedbackList(params: FeedbackListParams = {}): Promise<FeedbackItem[]> {
  const search = new URLSearchParams();
  if (params.dateFrom) search.set('date_from', params.dateFrom);
  if (params.dateTo) search.set('date_to', params.dateTo);
  if (typeof params.rating === 'number') search.set('rating', String(params.rating));
  if (params.schoolId) search.set('school_id', params.schoolId);
  const path = `feedback/${search.toString() ? `?${search.toString()}` : ''}`;
  const data = await api(path, { method: 'GET' });
  const list = Array.isArray(data) ? data : [];
  return list.map((item) => toFeedbackItem(item as RawFeedbackItem));
}

export async function submitFeedback(payload: SubmitFeedbackPayload): Promise<FeedbackItem> {
  const form = new FormData();
  form.append("rating", String(payload.rating));
  if (payload.comment) form.append("comment", payload.comment);
  if (payload.menuId) form.append("menu_id", payload.menuId);
  if (payload.photoUrl) form.append("photo_url", payload.photoUrl);

  const data = await api("feedback/", {
    method: "POST",
    body: form,
    // IMPORTANT: prevent wrapper from adding JSON Content-Type
    headers: {},
  });

  return toFeedbackItem(data as RawFeedbackItem);
}

