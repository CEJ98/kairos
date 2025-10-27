'use server';

import { cacheGet, cacheSet } from '@/lib/cache/selective-cache';
import { prisma } from '@/lib/clients/prisma';
import { authLimiter, actionLimiter } from '@/lib/cache/rate-limit';
import { planPreferencesSchema, progressionRuleSchema, rescheduleSchema } from '@/lib/validation/plan';
import { workoutEntrySchema } from '@/lib/validation/workout';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getRedisClient } from '@/lib/clients/redis';
import { computeProgressionAdjustments } from '@/server/services/progression';
import { trackServer } from '@/lib/analytics/server';
import * as Sentry from '@sentry/nextjs';
import { getClientIp, hashIp } from '@/lib/security/privacy';
import { randomUUID } from 'crypto';
import { logRequest } from '@/lib/logging';
import type { Prisma, Exercise } from '@prisma/client';

type ExerciseLite = { id: Exercise['id'] };
type WorkoutHistoryEntry = z.infer<typeof workoutHistorySchema>[number];
type ProgressionAdjustment = { exerciseId: string; targetWeight: number; targetReps: number; adherence: number };
type DayTemplate = { title: string; groups: string[] };

const workoutHistorySchema = z.array(
  z.object({
    date: z.string().datetime(),
    exerciseId: z.string().cuid(),
    weight: z.number().min(0),
    reps: z.number().int().min(1),
    rpe: z.number().min(5).max(10).nullable(),
    adherence: z.number().min(0).max(1)
  })
);

const draftSetSchema = z.object({
  exerciseId: z.string().cuid(),
  weight: z.number().nullable().optional(),
  reps: z.number().int().nullable().optional(),
  rpe: z.number().min(5).max(10).nullable().optional(),
  rir: z.number().min(0).max(5).nullable().optional(),
  restSeconds: z.number().int().min(30).max(600).nullable().optional(),
  notes: z.string().max(280).nullable().optional()
});

const workoutDraftSchema = z.object({
  workoutId: z.string().cuid(),
  planId: z.string().cuid(),
  sets: z.array(draftSetSchema).optional()
});

function getSafeRedis() {
  try {
    return getRedisClient();
  } catch {
    return null;
  }
}

export async function createPlan(raw: z.input<typeof planPreferencesSchema>) {
  try {
    const requestId = randomUUID();
    const ip = getClientIp();
    const ipHash = hashIp(ip);
    logRequest('create_plan_start', requestId, { ipHash });

    const input = planPreferencesSchema.parse(raw);

    const rl = await actionLimiter.limit(`createPlan:${input.userId}`);
    if (!rl.success) {
      logRequest('create_plan_blocked', requestId, { ipHash, userId: input.userId });
      throw new Error('Rate limit excedido');
    }

    const user = await prisma.user.findUnique({ where: { id: input.userId }, include: { profile: true } });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Cargar biblioteca de ejercicios
    const allExercises: Exercise[] = await prisma.exercise.findMany({ orderBy: { createdAt: 'asc' } });

    // Filtrar por equipo disponible
    const equipmentPref = (input.availableEquipment || []).map((e) => e.toLowerCase());
    const allowAll = equipmentPref.includes('gym completo');
    const allowedEquipment = new Set<string>(
      allowAll
        ? []
        : equipmentPref.includes('mancuernas')
        ? ['mancuernas', 'kettlebell', 'banda', 'peso corporal', 'caja pliométrica']
        : equipmentPref.includes('bodyweight')
        ? ['peso corporal', 'banda']
        : []
    );

    const filtered: Exercise[] = allowAll
      ? allExercises
      : allExercises.filter((e: Exercise) => allowedEquipment.has((e.equipment || '').toLowerCase()));

    // Utilidades para selección
    const byGroup: Record<string, ExerciseLite[]> = filtered.reduce((acc, e: Exercise) => {
      const key = (e.muscleGroup || 'Otros').toLowerCase();
      (acc[key] ||= []).push({ id: e.id });
      return acc;
    }, {} as Record<string, ExerciseLite[]>);

    function pick(groupKeys: string[], count: number) {
      const pool: ExerciseLite[] = [];
      for (const k of groupKeys) {
        const g = byGroup[k.toLowerCase()] || [];
        pool.push(...g);
      }
      if (pool.length === 0) return [];
      const selected: ExerciseLite[] = [];
      const seen = new Set<string>();
      for (let i = 0; i < count && pool.length > 0; i += 1) {
        const idx = Math.floor(Math.random() * pool.length);
        const item = pool[idx] ?? pool[i % pool.length];
        if (item && !seen.has(item.id)) {
          selected.push(item);
          seen.add(item.id);
        }
      }
      return selected;
    }

    // Definir splits por frecuencia
    let dayTemplates: DayTemplate[] = [];
    switch (input.frequency) {
      case 3:
        dayTemplates = [
          { title: 'Push', groups: ['pectoral', 'hombros', 'tríceps'] },
          { title: 'Pull', groups: ['espalda', 'bíceps', 'brazos'] },
          { title: 'Piernas', groups: ['piernas', 'glúteos', 'isquiotibiales', 'cadera'] }
        ];
        break;
      case 4:
        dayTemplates = [
          { title: 'Upper A', groups: ['pectoral', 'hombros', 'tríceps', 'espalda'] },
          { title: 'Lower A', groups: ['piernas', 'glúteos', 'isquiotibiales', 'cadera'] },
          { title: 'Upper B', groups: ['pectoral', 'hombros', 'bíceps', 'espalda'] },
          { title: 'Lower B', groups: ['piernas', 'glúteos', 'isquiotibiales', 'cadera'] }
        ];
        break;
      case 5:
        dayTemplates = [
          { title: 'Push', groups: ['pectoral', 'hombros', 'tríceps'] },
          { title: 'Pull', groups: ['espalda', 'bíceps', 'brazos'] },
          { title: 'Piernas', groups: ['piernas', 'glúteos', 'isquiotibiales', 'cadera'] },
          { title: 'Upper', groups: ['pectoral', 'hombros', 'espalda'] },
          { title: 'Metabólico/Core', groups: ['cardio', 'core', 'full body'] }
        ];
        break;
      case 6:
      default:
        dayTemplates = [
          { title: 'Push A', groups: ['pectoral', 'hombros', 'tríceps'] },
          { title: 'Pull A', groups: ['espalda', 'bíceps', 'brazos'] },
          { title: 'Legs A', groups: ['piernas', 'glúteos', 'isquiotibiales', 'cadera'] },
          { title: 'Push B', groups: ['pectoral', 'hombros', 'tríceps'] },
          { title: 'Pull B', groups: ['espalda', 'bíceps', 'brazos'] },
          { title: 'Legs B', groups: ['piernas', 'glúteos', 'isquiotibiales', 'cadera'] }
        ];
        break;
    }

    // Parámetros según objetivo
    const isStrength = input.goal === 'fuerza';
    const isHypertrophy = input.goal === 'hipertrofia';
    const isEndurance = input.goal === 'resistencia';

    const baseSets = isStrength ? 5 : isHypertrophy ? 4 : 3;
    const baseReps = isStrength ? 4 : isHypertrophy ? 10 : 15;
    const baseRest = isStrength ? 180 : isHypertrophy ? 90 : 60;
    const baseRpe = isStrength ? 7.5 : isHypertrophy ? 8 : 6.5;

    const mesoWeeks = 4; // microciclos de 4 semanas

    const workoutsCreate: Prisma.WorkoutCreateWithoutPlanInput[] = [];
    const startDate = new Date();
    for (let week = 0; week < mesoWeeks; week += 1) {
      for (let day = 0; day < dayTemplates.length; day += 1) {
        const tpl = dayTemplates[day];
        const scheduledAt = new Date(startDate.getTime() + (week * 7 + day) * 24 * 60 * 60 * 1000);

        // Progresión: volumen incrementa reps, intensidad incrementa RPE
        const weekVolumeBump = isHypertrophy || isEndurance ? Math.min(2, Math.floor(week / 2)) : 0;
        const weekIntensityBump = isStrength ? Math.min(1.5, week * 0.25) : 0;

        const exercisesForDay = pick(tpl.groups, isEndurance ? 4 : 3);

        // Construir historial de desempeño para ajustar progresión
        const historyEntries: WorkoutHistoryEntry[] = [];
        for (const ex of exercisesForDay) {
          const recent = await prisma.workoutSet.findMany({
            where: {
              exerciseId: ex.id,
              workout: { userId: input.userId }
            },
            orderBy: { createdAt: 'desc' },
            take: 6
          });
          for (const set of recent) {
            historyEntries.push({
              date: new Date().toISOString(),
              exerciseId: ex.id,
              weight: set.weight,
              reps: set.reps,
              rpe: set.rpe ?? null,
              adherence: 0.9
            });
          }
        }

        const adjustments = computeProgressionAdjustments(historyEntries, isStrength ? 'INTENSITY' : 'VOLUME');
        const adjustMap = new Map<string, { targetReps: number }>(
          (adjustments as ProgressionAdjustment[]).map((a) => [a.exerciseId, { targetReps: a.targetReps }])
        );

        const exerciseCreates: Prisma.WorkoutExerciseCreateWithoutWorkoutInput[] = exercisesForDay.map((ex, order) => ({
          exercise: { connect: { id: ex.id } },
          order,
          targetSets: baseSets,
          targetReps: adjustMap.get(ex.id)?.targetReps ?? baseReps + weekVolumeBump,
          restSeconds: Math.max(45, baseRest - (isEndurance ? week * 5 : 0)),
          rpeTarget: Math.min(9.5, baseRpe + weekIntensityBump),
          microcycle: (week % input.frequency) + 1,
          mesocycle: Math.floor(week / input.frequency) + 1
        }));

        // Para resistencia, añade 1 ejercicio de cardio/core si hay disponible
        if (isEndurance) {
          const extra = pick(['cardio', 'core', 'full body'], 1);
          extra.forEach((ex) =>
            exerciseCreates.push({
              exercise: { connect: { id: ex.id } },
              order: exerciseCreates.length,
              targetSets: Math.max(2, baseSets - 1),
              targetReps: Math.max(12, baseReps + weekVolumeBump + 2),
              restSeconds: Math.max(30, baseRest - 30),
              rpeTarget: Math.max(6, baseRpe - 0.5),
              microcycle: (week % input.frequency) + 1,
              mesocycle: Math.floor(week / input.frequency) + 1
            })
          );
        }

        workoutsCreate.push({
          title: `${tpl.title} - Semana ${week + 1}`,
          description: isStrength
            ? 'Sesión orientada a fuerza (baja rep, alta intensidad)'
            : isHypertrophy
            ? 'Sesión orientada a hipertrofia (volumen moderado)'
            : 'Sesión orientada a resistencia/metabólico',
          scheduledAt,
          microcycle: (week % input.frequency) + 1,
          mesocycle: Math.floor(week / input.frequency) + 1,
          rpeTarget: Math.min(9.5, baseRpe + weekIntensityBump),
          restSeconds: Math.max(45, baseRest - (isEndurance ? week * 5 : 0)),
          exercises: { create: exerciseCreates }
        });
      }
    }

    const plan = await prisma.plan.create({
      data: {
        userId: input.userId,
        goal: input.goal,
        microcycleLength: input.frequency,
        mesocycleWeeks: mesoWeeks,
        progressionRule: isStrength ? 'INTENSITY' : 'VOLUME',
        trainingMax: user.profile?.trainingMax ?? undefined,
        workouts: { create: workoutsCreate }
      },
      include: {
        workouts: { include: { exercises: true } }
      }
    });

    await cacheSet(`plan:${plan.id}`, plan, 300);
    revalidatePath('/progress');
    revalidatePath('/workout');
    await trackServer('create_plan', { requestId, ipHash });
    logRequest('create_plan_done', requestId, { ipHash, planId: plan.id });
    return plan;
  } catch (err) {
    Sentry.captureException(err);
    throw err;
  }
}
export async function nextWorkout(userId: string) {
  try {
    await authLimiter.limit(`next-workout:${userId}`);

    const cached = await cacheGet<{ planId: string; workoutId: string }>(`next:${userId}`);
    if (cached) {
      return cached;
    }

    const workout = await prisma.workout.findFirst({
      where: {
        plan: { userId },
        completedAt: null
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        plan: true,
        exercises: {
          include: { exercise: true }
        }
      }
    });

    if (!workout) {
      return null;
    }

    const payload = { planId: workout.planId, workoutId: workout.id };
    await cacheSet(`next:${userId}`, payload, 120);
    await trackServer('start_workout');
    return payload;
  } catch (err) {
    Sentry.captureException(err);
    throw err;
  }
}

export async function applyProgression(rawHistory: unknown, rawRule: unknown) {
  const history = workoutHistorySchema.parse(rawHistory);
  const rule = progressionRuleSchema.parse(rawRule);
  return computeProgressionAdjustments(history, rule);
}

export async function rescheduleWorkout(raw: unknown) {
  try {
    const requestId = randomUUID();
    const ip = getClientIp();
    const ipHash = hashIp(ip);
    logRequest('reschedule_workout_start', requestId, { ipHash });

    const input = rescheduleSchema.parse(raw);

    const existing = await prisma.workout.findUnique({
      where: { id: input.workoutId },
      include: { plan: true }
    });
    if (!existing) throw new Error('Sesión no encontrada');

    const rl = await actionLimiter.limit(`rescheduleWorkout:${existing.plan.userId}`);
    if (!rl.success) {
      logRequest('reschedule_workout_blocked', requestId, { ipHash, workoutId: input.workoutId });
      throw new Error('Rate limit excedido');
    }

    const updated = await prisma.workout.update({
      where: { id: input.workoutId },
      data: { scheduledAt: new Date(input.date) },
      include: {
        plan: true
      }
    });

    await cacheSet(`next:${updated.plan.userId}`, null, 0);
    revalidatePath('/workout');
    await trackServer('reschedule_workout', { requestId, ipHash });
    logRequest('reschedule_workout_done', requestId, { ipHash, workoutId: updated.id });
    return updated;
  } catch (err) {
    Sentry.captureException(err);
    throw err;
  }
}

export async function logWorkout(raw: unknown) {
  try {
    const requestId = randomUUID();
    const ip = getClientIp();
    const ipHash = hashIp(ip);
    logRequest('commit_session_start', requestId, { ipHash });

    const input = workoutEntrySchema.parse(raw);

    const workoutTarget = await prisma.workout.findUnique({
      where: { id: input.workoutId },
      include: { plan: true }
    });
    if (!workoutTarget) throw new Error('Sesión no encontrada');

    const rl = await actionLimiter.limit(`logWorkout:${workoutTarget.plan.userId}`);
    if (!rl.success) {
      logRequest('commit_session_blocked', requestId, { ipHash, workoutId: input.workoutId });
      throw new Error('Rate limit excedido');
    }

    const workout = await prisma.workout.update({
      where: { id: input.workoutId },
      data: {
        completedAt: new Date(),
        sets: {
          create: input.sets.map((set) => ({
            exerciseId: set.exerciseId,
            weight: set.weight,
            reps: set.reps,
            rpe: set.rpe,
            rir: set.rir,
            restSeconds: set.restSeconds,
            notes: set.notes ?? null
          }))
        }
      },
      include: {
        plan: true
      }
    });

    await prisma.adherenceMetric.create({
      data: {
        workoutId: workout.id,
        planId: input.planId,
        adherence: input.adherence
      }
    });

    await cacheSet(`next:${workout.plan.userId}`, null, 0);
    const redis = getSafeRedis();
    if (redis) {
      await redis.del(`workout:draft:${workout.id}`);
    }
    revalidatePath('/progress');
    revalidatePath(`/workout/${workout.id}`);
    await trackServer('commit_session', { requestId, ipHash });
    logRequest('commit_session_done', requestId, { ipHash, workoutId: workout.id });
    return workout;
  } catch (err) {
    Sentry.captureException(err);
    throw err;
  }
}

export async function autosaveWorkoutDraft(raw: unknown) {
  const input = workoutDraftSchema.parse(raw);
  const redis = getSafeRedis();
  if (redis) {
    await redis.set(`workout:draft:${input.workoutId}`, JSON.stringify(input), { ex: 300 });
  }
  return { ok: true };
}
