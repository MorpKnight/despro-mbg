import { api } from './api';

export interface HealthStatus {
  status: string;
  db_status: string;
}

export async function fetchHealthStatus(): Promise<HealthStatus> {
  const data = await api('health', { method: 'GET', auth: false });
  return data as HealthStatus;
}
