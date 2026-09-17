import { z } from 'zod';

export const addFundsSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('INR')
});
