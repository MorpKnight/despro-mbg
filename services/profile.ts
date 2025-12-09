import { api } from './api';
import type { Role } from './session';

export interface RelatedEntity {
  id: string;
  name: string;
  addressLine?: string | null;
  administrativeAreaLevel1?: string | null;
  administrativeAreaLevel2?: string | null;
}

interface RawRelatedEntity {
  id?: string;
  name?: string;
  address_line?: string | null;
  administrative_area_level_1?: string | null;
  administrative_area_level_2?: string | null;
}

interface RawProfile {
  id?: string;
  username?: string;
  full_name?: string | null;
  role?: string;
  account_status?: string;
  school_id?: string | null;
  catering_id?: string | null;
  health_office_area?: string | null;
  email?: string | null;
  sekolah?: RawRelatedEntity | null;
  catering?: RawRelatedEntity | null;
}

export interface Profile {
  id: string;
  username: string;
  fullName: string | null;
  role: Role;
  accountStatus: string;
  schoolId: string | null;
  cateringId: string | null;
  healthOfficeArea: string | null;
  email: string | null;
  sekolah: RelatedEntity | null;
  catering: RelatedEntity | null;
}

function mapRelated(raw: RawRelatedEntity | null | undefined): RelatedEntity | null {
  if (!raw?.id || !raw.name) return null;
  return {
    id: raw.id,
    name: raw.name,
    addressLine: raw.address_line ?? null,
    administrativeAreaLevel1: raw.administrative_area_level_1 ?? null,
    administrativeAreaLevel2: raw.administrative_area_level_2 ?? null,
  };
}

function mapProfile(raw: RawProfile): Profile {
  const role = (raw.role as Role | undefined) ?? 'siswa';
  return {
    id: raw.id ?? '',
    username: raw.username ?? '',
    fullName: raw.full_name ?? null,
    role,
    accountStatus: raw.account_status ?? 'inactive',
    schoolId: raw.school_id ?? null,
    cateringId: raw.catering_id ?? null,
    healthOfficeArea: raw.health_office_area ?? null,
    email: raw.email ?? null,
    sekolah: mapRelated(raw.sekolah),
    catering: mapRelated(raw.catering),
  };
}

export async function fetchMyProfile(): Promise<Profile> {
  const data = await api('profile/me', { method: 'GET' });
  return mapProfile(data as RawProfile);
}

export interface UpdateProfilePayload {
  fullName?: string | null;
  email?: string | null;
  healthOfficeArea?: string | null;
}

export async function updateMyProfile(updates: UpdateProfilePayload): Promise<Profile> {
  const body: Record<string, string | null> = {};

  if ('fullName' in updates) {
    body.full_name = updates.fullName ?? null;
  }

  if ('email' in updates) {
    body.email = updates.email ?? null;
  }

  if ('healthOfficeArea' in updates) {
    body.health_office_area = updates.healthOfficeArea ?? null;
  }

  const data = await api('profile/me', { method: 'PATCH', body });
  return mapProfile(data as RawProfile);
}

export async function changeMyPassword(oldPassword: string, newPassword: string): Promise<void> {
  await api('profile/change-password', {
    method: 'POST',
    body: {
      old_password: oldPassword,
      new_password: newPassword,
    },
  });
}
