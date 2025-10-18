export type Role = 'admin' | 'staff' | 'viewer';

export interface User {
  id: string;
  name: string;
  role: Role;
}

export interface Feedback {
  id: string;
  userId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string; // ISO
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  timestamp: string; // ISO
  method: 'qr' | 'nfc' | 'manual';
}

export interface Meal {
  id: string;
  name: string;
  calories?: number;
}
