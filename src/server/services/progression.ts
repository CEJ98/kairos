import { TRAINING_CONSTANTS } from '@/lib/config/constants';
import { z } from 'zod';

const historySchema = z.array(
  z.object({
    date: z.string().datetime(),
    exerciseId: z.string(),
    weight: z.number().min(0),
    reps: z.number().int().min(1),
    rpe: z.number().min(5).max(10).nullable(),
    adherence: z.number().min(0).max(1)
  })
);

const ruleSchema = z.enum(['INTENSITY', 'VOLUME']);

export type ProgressionHistory = z.infer<typeof historySchema>;
export type ProgressionRule = z.infer<typeof ruleSchema>;

export function computeProgressionAdjustments(rawHistory: unknown, rawRule: unknown) {
  const history = historySchema.parse(rawHistory);
  const rule = ruleSchema.parse(rawRule);

  const grouped = history.reduce<Record<string, { weight: number; reps: number; sessions: number; adherence: number }>>(
    (acc, item) => {
      const entry = acc[item.exerciseId] ?? { weight: 0, reps: 0, sessions: 0, adherence: 0 };
      entry.weight += item.weight;
      entry.reps += item.reps;
      entry.sessions += 1;
      entry.adherence += item.adherence;
      acc[item.exerciseId] = entry;
      return acc;
    },
    {}
  );

  return Object.entries(grouped).map(([exerciseId, data]) => {
    const avgWeight = data.weight / Math.max(data.sessions, 1);
    const avgReps = Math.round(data.reps / Math.max(data.sessions, 1));
    const adherence = data.adherence / Math.max(data.sessions, 1);

    const intensityBump =
      TRAINING_CONSTANTS.minIntensityIncrease +
      (TRAINING_CONSTANTS.maxIntensityIncrease - TRAINING_CONSTANTS.minIntensityIncrease) * adherence;

    const repBump = Math.round(
      TRAINING_CONSTANTS.minRepIncrease +
        (TRAINING_CONSTANTS.maxRepIncrease - TRAINING_CONSTANTS.minRepIncrease) * adherence
    );

    if (rule === 'INTENSITY') {
      return {
        exerciseId,
        targetWeight: Number((avgWeight * (1 + intensityBump)).toFixed(2)),
        targetReps: avgReps,
        adherence
      };
    }

    return {
      exerciseId,
      targetWeight: avgWeight,
      targetReps: avgReps + repBump,
      adherence
    };
  });
}
