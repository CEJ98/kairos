'use server';

import { prisma } from '@/lib/clients/prisma';
import { logWorkout as _logWorkout, rescheduleWorkout as _rescheduleWorkout, autosaveWorkoutDraft as _autosaveWorkoutDraft } from '@/server/actions/plan';
import * as Sentry from '@sentry/nextjs';

export type LoggedSet = {
  exerciseId: string;
  weight: number;
  reps: number;
  rpe: number | null;
  rir: number | null;
  restSeconds: number;
  notes?: string | null;
};

export type WorkoutSummary = {
  id: string;
  planId: string;
  completedAt: Date;
  setsCount: number;
};

export async function logWorkout(input: { workoutId: string; sets: LoggedSet[] }): Promise<void> {
  try {
    const workout = await prisma.workout.findUnique({ where: { id: input.workoutId } });
    if (!workout) throw new Error('Sesión no encontrada');

  // Heurística simple de adherencia basada en RPE, sustituible por lógica más rica
  const adherence = Number(
    (
      input.sets.reduce((acc, s) => acc + (s.rpe && s.rpe >= 8 ? 1 : 0.8), 0) /
      Math.max(1, input.sets.length)
    ).toFixed(2)
  );

    await _logWorkout({
      planId: workout.planId,
      workoutId: input.workoutId,
      adherence,
      sets: input.sets
    });
  } catch (err) {
    Sentry.captureException(err);
    throw err;
  }
}

export async function rescheduleWorkout(workoutId: string, newDate: string): Promise<void> {
  try {
    await _rescheduleWorkout({ workoutId, date: new Date(newDate).toISOString() });
  } catch (err) {
    Sentry.captureException(err);
    throw err;
  }
}

export async function autosaveWorkoutDraft(input: { planId: string; workoutId: string; sets: LoggedSet[] }) {
  try {
    await _autosaveWorkoutDraft(input);
    return { ok: true };
  } catch (err) {
    Sentry.captureException(err);
    throw err;
  }
}