import { z } from 'zod';

export const createCreativeSchema = z.object({
  name: z.string().min(2).max(200),
  mediaType: z.enum(['IMAGE', 'VIDEO']),
  storageKey: z.string(), // This would typically come from an S3 upload endpoint
  headline: z.string().optional(),
  description: z.string().optional(),
  ctaText: z.string().optional(),
  destinationUrl: z.string().url().optional()
});
