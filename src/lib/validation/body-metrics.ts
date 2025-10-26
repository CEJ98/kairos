import { z } from 'zod';

export const bodyMetricSchema = z.object({
  date: z.date().optional(),
  weightKg: z.number().min(20).max(400).optional(),
  bodyFat: z.number().min(2).max(75).optional(),
  neckCm: z.number().min(20).max(60).optional(),
  waistCm: z.number().min(40).max(180).optional(),
  hipCm: z.number().min(40).max(180).optional(),
}).refine((data) => Object.keys(data).some((k) => (data as any)[k] !== undefined), {
  message: 'Debe ingresar al menos una métrica',
});

export const progressPhotosSchema = z.object({
  date: z.date().optional(),
  note: z.string().max(200).optional(),
});

export type BodyMetricInput = z.infer<typeof bodyMetricSchema>;
export type ProgressPhotosInput = z.infer<typeof progressPhotosSchema>;