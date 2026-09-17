import { z } from 'zod';

export const createAdSchema = z.object({
  campaignId: z.string(),
  creativeId: z.string(),
  name: z.string().min(2).max(100),
  placements: z.array(z.enum(['FEED', 'EXPLORE', 'MATCHING']))
});

export const adRequestSchema = z.object({
  userId: z.string().optional(),
  placementType: z.enum(['FEED', 'EXPLORE', 'MATCHING']),
  userAge: z.number().optional(),
  userGender: z.string().optional(),
  userLocation: z.string().optional(),
  userInterests: z.array(z.string()).optional()
});
