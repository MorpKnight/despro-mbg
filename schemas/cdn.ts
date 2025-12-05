import { z } from 'zod';

/* Single file entry */
export const CdnFileSchema = z.object({
  id: z.string(),
  type: z.string(),
  url: z.string().url(),
  pending: z.boolean().optional(),
});
export type CdnFile = z.infer<typeof CdnFileSchema>;

/* CDN metadata root schema */
export const CdnMetadataSchema = z.object({
  files: z.array(CdnFileSchema),                       // required
  deletesAt: z.string().datetime().optional(),         // optional ISO timestamp
  assumedMimetypes: z.array(z.boolean()).optional(),   // optional
});
export type CdnMetadata = z.infer<typeof CdnMetadataSchema>;