export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN_SEKOLAH: 'admin_sekolah',
  ADMIN_CATERING: 'admin_catering',
  ADMIN_DINKES: 'admin_dinkes',
  SISWA: 'siswa',
} as const;

export type UserRoleValue = typeof USER_ROLES[keyof typeof USER_ROLES];

export const ROLE_LABEL_ID: Record<UserRoleValue, string> = {
  [USER_ROLES.SUPER_ADMIN]: 'Super Admin',
  [USER_ROLES.ADMIN_SEKOLAH]: 'Admin Sekolah',
  [USER_ROLES.ADMIN_CATERING]: 'Admin Catering',
  [USER_ROLES.ADMIN_DINKES]: 'Admin Dinkes',
  [USER_ROLES.SISWA]: 'Siswa',
};

export const ROLE_LABEL_EN: Record<UserRoleValue, string> = {
  [USER_ROLES.SUPER_ADMIN]: 'Super Admin',
  [USER_ROLES.ADMIN_SEKOLAH]: 'School Admin',
  [USER_ROLES.ADMIN_CATERING]: 'Catering Admin',
  [USER_ROLES.ADMIN_DINKES]: 'Health Office Admin',
  [USER_ROLES.SISWA]: 'Student',
};
