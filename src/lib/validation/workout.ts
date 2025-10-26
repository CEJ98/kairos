import { z } from 'zod';

export const workoutEntrySchema = z
  .object({
    planId: z.string().cuid(),
    workoutId: z.string().cuid(),
    sets: z
      .array(
        z
          .object({
            setId: z.string().cuid().optional(),
            exerciseId: z.string().cuid(),
            weight: z.number().min(0),
            reps: z.number().int().min(1).max(30),
            rpe: z.number().min(5).max(10).nullable(),
            rir: z.number().min(0).max(5).nullable(),
            restSeconds: z.number().int().min(30).max(600),
            notes: z.string().max(280).optional()
          })
          .refine((s) => s.rpe !== null || s.rir !== null, { message: 'RPE o RIR requerido' })
      )
      .min(1)
      .max(100),
    adherence: z.number().min(0).max(1)
  })
  .superRefine((val, ctx) => {
    // Basic consistency: adherence should reflect average effort; prevent pathological values
    if (val.adherence > 1 || val.adherence < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['adherence'], message: 'Adherencia fuera de rango' });
    }
  });

export type WorkoutEntryInput = z.infer<typeof workoutEntrySchema>;
