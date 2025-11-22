import { z } from 'zod';

const RelatedEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const UserRoleSchema = z.enum([
  'super_admin',
  'admin_sekolah',
  'admin_catering',
  'admin_dinkes',
  'siswa',
]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserAccountStatusSchema = z.enum([
  'active',
  'inactive',
  'pending_confirmation',
  'suspended',
]);
export type UserAccountStatus = z.infer<typeof UserAccountStatusSchema>;

export const RawUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  full_name: z.string().nullable(),
  role: UserRoleSchema,
  account_status: UserAccountStatusSchema,
  school_id: z.string().nullable(),
  catering_id: z.string().nullable(),
  health_office_area_id: z.string().nullable(),
  health_office_area: z.string().nullable(),
  nfc_tag: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  sekolah: RelatedEntitySchema.nullable().optional(),
  catering: RelatedEntitySchema.nullable().optional(),
});
export type RawUser = z.infer<typeof RawUserSchema>;

export const UserSchema = RawUserSchema.transform((raw) => ({
  id: raw.id,
  username: raw.username,
  fullName: raw.full_name,
  role: raw.role,
  accountStatus: raw.account_status,
  schoolId: raw.school_id,
  cateringId: raw.catering_id,
  healthOfficeAreaId: raw.health_office_area_id,
  healthOfficeArea: raw.health_office_area,
  nfcTag: raw.nfc_tag,
  createdAt: raw.created_at,
  updatedAt: raw.updated_at,
  sekolah: raw.sekolah ?? null,
  catering: raw.catering ?? null,
}));
export type User = z.infer<typeof UserSchema>;

export const CreateUserPayloadSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  full_name: z.string().optional(),
  role: UserRoleSchema,
  account_status: UserAccountStatusSchema.optional(),
  school_id: z.string().optional(),
  catering_id: z.string().optional(),
  health_office_area: z.string().optional(),
  health_office_area_id: z.string().optional(),
});
export type CreateUserPayload = z.infer<typeof CreateUserPayloadSchema>;

export const UpdateUserPayloadSchema = z.object({
  username: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
  full_name: z.string().optional(),
  role: UserRoleSchema.optional(),
  account_status: UserAccountStatusSchema.optional(),
  school_id: z.union([z.string(), z.null()]).optional(),
  catering_id: z.union([z.string(), z.null()]).optional(),
  health_office_area: z.union([z.string(), z.null()]).optional(),
  health_office_area_id: z.union([z.string(), z.null()]).optional(),
});
export type UpdateUserPayload = z.infer<typeof UpdateUserPayloadSchema>;

export const FetchUsersParamsSchema = z.object({
  skip: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().optional(),
  search: z.string().min(1).optional(),
  role: UserRoleSchema.optional(),
});
export type FetchUsersParams = z.infer<typeof FetchUsersParamsSchema>;
