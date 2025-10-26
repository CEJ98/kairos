import { z } from 'zod';

export const planPreferencesSchema = z
  .object({
    userId: z.string().cuid(),
    goal: z.enum(['fuerza', 'hipertrofia', 'resistencia']).default('hipertrofia'),
    frequency: z.number().int().min(2).max(6),
    experience: z.enum(['novato', 'intermedio', 'avanzado']).default('intermedio'),
    availableEquipment: z.array(z.string().trim().min(1).max(40)).default([]),
    restrictions: z.array(z.string().trim().min(1).max(100)).default([])
  })
  .superRefine((val, ctx) => {
    // Ensure unique entries for equipment and restrictions
    const dupEq = new Set<string>();
    val.availableEquipment.forEach((e) => {
      const k = e.toLowerCase();
      if (dupEq.has(k)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['availableEquipment'], message: 'Duplicados no permitidos' });
      } else {
        dupEq.add(k);
      }
    });
    const dupRes = new Set<string>();
    val.restrictions.forEach((r) => {
      const k = r.toLowerCase();
      if (dupRes.has(k)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['restrictions'], message: 'Duplicados no permitidos' });
      } else {
        dupRes.add(k);
      }
    });
    // Simple cross-field rule: high frequency with novice triggers a hint (non-blocking)
    if (val.experience === 'novato' && val.frequency > 5) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['frequency'], message: 'Frecuencia alta para novato' });
    }
  });

export type PlanPreferences = z.infer<typeof planPreferencesSchema>;

export const workoutSetSchema = z.object({
  exerciseId: z.string().cuid(),
  weight: z.number().min(0),
  reps: z.number().int().min(1).max(30),
  rpe: z.number().min(5).max(10).nullable(),
  restSeconds: z.number().int().min(30).max(600),
  notes: z.string().max(500).optional()
});

export const progressionRuleSchema = z.enum(['INTENSITY', 'VOLUME']);

export const rescheduleSchema = z
  .object({
    workoutId: z.string().cuid(),
    date: z.string().datetime()
  })
  .refine((val) => {
    const when = new Date(val.date).getTime();
    const now = Date.now();
    return when >= now - 60_000; // allow small clock skew, avoid past dates
  }, { message: 'La nueva fecha debe ser futura' });
