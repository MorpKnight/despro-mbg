import { z } from 'zod';

export const RoleSchema = z.enum(['admin', 'staff', 'viewer']);
export type Role = z.infer<typeof RoleSchema>;

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: RoleSchema,
});
export type User = z.infer<typeof UserSchema>;

export const FeedbackSchema = z.object({
  id: z.string(),
  userId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  createdAt: z.string(),
});
export type Feedback = z.infer<typeof FeedbackSchema>;

export const AttendanceRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  timestamp: z.string(),
  method: z.enum(['qr', 'nfc', 'manual']),
});
export type AttendanceRecord = z.infer<typeof AttendanceRecordSchema>;

export const MealSchema = z.object({
  id: z.string(),
  name: z.string(),
  calories: z.number().optional(),
});
export type Meal = z.infer<typeof MealSchema>;
