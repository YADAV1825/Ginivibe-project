import { z } from 'zod';
import { CampaignStatus } from '@prisma/client';

export const createCampaignSchema = z.object({
  name: z.string().min(2).max(200),
  objective: z.string().optional(),
  budget: z.number().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional()
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(CampaignStatus)
});
