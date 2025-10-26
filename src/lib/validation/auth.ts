import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z.string().min(2).max(50),
    email: z.string().email(),
    password: z.string().min(8).max(64),
    confirmPassword: z.string().min(8).max(64)
  })
  .refine((val) => val.password === val.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword']
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
