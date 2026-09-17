import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});
