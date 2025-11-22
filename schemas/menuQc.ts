import { z } from 'zod';

export const IngredientInputSchema = z.object({
  name: z.string().trim().min(1, 'Nama bahan wajib diisi'),
  quantity: z
    .string()
    .trim()
    .refine((val) => val.length > 0, 'Jumlah wajib diisi')
    .refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, 'Jumlah harus berupa angka lebih dari 0'),
  unit: z.string().trim().min(1, 'Satuan wajib diisi'),
});
export type IngredientInput = z.infer<typeof IngredientInputSchema>;

export const MenuQCFormSchema = z.object({
  date: z.string().regex(/\d{4}-\d{2}-\d{2}/, 'Tanggal tidak valid'),
  menuName: z.string().trim().min(3, 'Nama menu minimal 3 karakter'),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  ingredients: z.array(IngredientInputSchema).min(1, 'Minimal satu bahan diisi'),
});
export type MenuQCFormValues = z.infer<typeof MenuQCFormSchema>;

export const MenuQCIngredientPayloadSchema = z.object({
  name: z.string(),
  quantity: z.number().positive(),
  unit: z.string(),
});
export type MenuQCIngredientPayload = z.infer<typeof MenuQCIngredientPayloadSchema>;

export const MenuQCEntrySchema = z.object({
  date: z.string(),
  menuName: z.string(),
  ingredients: z.array(MenuQCIngredientPayloadSchema),
  notes: z.string().optional(),
  photos: z.array(
    z.object({
      uri: z.string(),
      name: z.string().optional(),
      type: z.string().optional(),
    }),
  ),
});
export type MenuQCEntry = z.infer<typeof MenuQCEntrySchema>;
