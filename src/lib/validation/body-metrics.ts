import { z } from 'zod';

export const bodyMetricSchema = z.object({
  date: z.date().optional(),
  weight: z.number().min(20).max(400).optional(),
  bodyFat: z.number().min(2).max(75).optional(),
  neckCm: z.number().min(20).max(60).optional(),
  waist: z.number().min(40).max(180).optional(),
  hips: z.number().min(40).max(180).optional(),
}).refine((data) => (['date','weight','bodyFat','neckCm','waist','hips'] as const).some((k) => data[k] !== undefined), {
  message: 'Debe ingresar al menos una métrica',
});

export const progressPhotosSchema = z.object({
  date: z.date().optional(),
  note: z.string().max(200).optional(),
});

export type BodyMetricInput = z.infer<typeof bodyMetricSchema>;
export type ProgressPhotosInput = z.infer<typeof progressPhotosSchema>;