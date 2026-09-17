import { z } from 'zod';

export const targetingSchema = z.object({
  campaignId: z.string(),
  minAge: z.number().min(18).optional(),
  maxAge: z.number().max(100).optional(),
  locations: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  genders: z.array(z.string()).optional(),
  devices: z.array(z.string()).optional()
});
