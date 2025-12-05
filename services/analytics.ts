import { api } from './api';

export interface GlobalKpi {
  total_sekolah: number;
  total_katering: number;
  total_siswa: number;
  total_laporan_darurat_aktif: number;
}

export interface TrendParams {
  health_office_area_id?: string;
  school_id?: string;
  catering_id?: string;
}

export interface TrendPoint {
  label: string;
  value: number;
}

export interface SatisfactionTrend {
  data: TrendPoint[];
}

export interface DinkesKpi {
  total_laporan_diproses: number;
  rata_rata_rating_global: number;
  total_sekolah_terpantau: number;
}

export interface CateringMenuRank {
  menu_id?: string | null;
  nama_menu?: string | null;
  rata_rata_rating: number;
}

export interface CateringKpi {
  rata_rata_rating_katering: number;
  total_feedback_diterima: number;
  menu_rating_terbaik: CateringMenuRank | null;
  menu_rating_terburuk: CateringMenuRank | null;
}

export interface SatisfactionTrendPoint {
  label: string;
  value: number;
}

export interface SatisfactionTrend {
  data: SatisfactionTrendPoint[];
}

export async function fetchGlobalKpi(): Promise<GlobalKpi> {
  const data = await api('analytics/kpi/global', { method: 'GET' });
  return data as GlobalKpi;
}

export async function fetchDinkesKpi(): Promise<DinkesKpi> {
  const data = await api('analytics/kpi/dinkes', { method: 'GET' });
  return data as DinkesKpi;
}

export async function fetchCateringKpi(cateringId: string): Promise<CateringKpi> {
  const data = await api(`analytics/kpi/catering/${cateringId}`, { method: 'GET' });
  return data as CateringKpi;
}

export async function fetchSatisfactionTrend(params?: TrendParams): Promise<SatisfactionTrend> {
  // Buat query string berdasarkan parameter yang ada
  const query = new URLSearchParams();
  
  if (params?.health_office_area_id) query.append('health_office_area_id', params.health_office_area_id);
  if (params?.school_id) query.append('school_id', params.school_id);
  if (params?.catering_id) query.append('catering_id', params.catering_id);

  const queryString = query.toString();
  const path = `analytics/trends/satisfaction${queryString ? `?${queryString}` : ''}`;
  const data = await api(path, { method: 'GET' });
  return data as SatisfactionTrend;
}

export async function fetchDinkesAreas(): Promise<string[]> {
  const data = await api('analytics/dinkes/areas', { method: 'GET' });
  return Array.isArray(data) ? (data as string[]).filter((area) => typeof area === 'string' && area.trim().length > 0) : [];
}
