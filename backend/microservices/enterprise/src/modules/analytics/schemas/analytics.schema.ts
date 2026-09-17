import { z } from 'zod';

export const impressionSchema = z.object({
  advertisementId: z.string(),
  placementType: z.enum(['FEED', 'EXPLORE', 'MATCHING']),
  userId: z.string().optional()
});

export const clickSchema = z.object({
  advertisementId: z.string(),
  placementType: z.enum(['FEED', 'EXPLORE', 'MATCHING']),
  userId: z.string().optional()
});
