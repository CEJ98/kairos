'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/clients/prisma';
import { startOfWeek, formatISO, subWeeks } from 'date-fns';

export type InsightType = 'progress' | 'load' | 'recovery' | 'adherence' | 'volume';
export type InsightSeverity = 'info' | 'success' | 'warning' | 'danger';

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  date: Date;
  severity: InsightSeverity;
  icon: string; // simple emoji icon to avoid extra deps
  meta?: Record<string, any>;
}

function epley1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return Number((weight * (1 + reps / 30)).toFixed(1));
}

/**
 * Analiza sets y adherencia histórica para generar insights.
 * Reglas básicas, sin ML:
 * - PR: si 1RM estimada supera el máximo histórico del ejercicio
 * - Aumentar peso: si en las últimas 2 sesiones de un ejercicio se superan reps objetivo y RPE >= 8 o RIR <= 2
 * - Recuperación: si volumen semanal crece >30% o más de 5 días seguidos entrenando
 * - Adherencia baja: si la adherencia semanal media < 0.6
 */
export async function getInsights(): Promise<Insight[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const userId = session.user.id;
  const twelveWeeksAgo = subWeeks(new Date(), 12);

  // Sets completados con ejercicio y fecha
  const sets = await prisma.workoutSet.findMany({
    where: {
      workout: { userId, completedAt: { not: null, gte: twelveWeeksAgo } },
    },
    include: {
      exercise: true,
      workout: { select: { id: true, completedAt: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Ejercicios planificados para extraer reps objetivo
  const workoutExercises = await prisma.workoutExercise.findMany({
    where: {
      workout: { userId, completedAt: { not: null, gte: twelveWeeksAgo } },
    },
    include: { exercise: true, workout: { select: { id: true, completedAt: true } } },
  });

  // Adherencia histórica
  const adherenceMetrics = await prisma.adherenceMetric.findMany({
    where: { plan: { userId }, createdAt: { gte: twelveWeeksAgo } },
    include: { workout: true },
    orderBy: { createdAt: 'asc' },
  });

  const insights: Insight[] = [];

  // Volumen semanal (sum(weight*reps) por semana)
  const weeklyVolume = new Map<string, number>();
  const dayTrainCounts = new Map<string, number>();

  for (const s of sets) {
    const wDate = s.workout.completedAt ?? new Date();
    const wk = formatISO(startOfWeek(wDate, { weekStartsOn: 1 }));
    weeklyVolume.set(wk, (weeklyVolume.get(wk) || 0) + s.weight * s.reps);

    const dayKey = formatISO(new Date(wDate.getFullYear(), wDate.getMonth(), wDate.getDate()));
    dayTrainCounts.set(dayKey, (dayTrainCounts.get(dayKey) || 0) + 1);
  }

  // Regla recuperación por salto de volumen >30%
  const weeksSorted = Array.from(weeklyVolume.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1));
  if (weeksSorted.length >= 2) {
    const last = weeksSorted[weeksSorted.length - 1][1];
    const prev = weeksSorted[weeksSorted.length - 2][1];
    if (prev > 0 && last > prev * 1.3) {
      insights.push({
        id: 'recovery-volume-jump',
        type: 'recovery',
        title: 'Descansa más esta semana',
        description: 'El volumen semanal subió >30% vs la semana anterior. Considera deload o más descanso.',
        date: new Date(),
        severity: 'warning',
        icon: '🛌',
        meta: { prevVolume: prev, lastVolume: last },
      });
    }
  }

  // Regla recuperación por racha de días
  const daysSorted = Array.from(dayTrainCounts.keys()).sort();
  let maxStreak = 0;
  let currentStreak = 0;
  for (let i = 0; i < daysSorted.length; i++) {
    if (i === 0) {
      currentStreak = 1;
      continue;
    }
    const prev = new Date(daysSorted[i - 1]);
    const cur = new Date(daysSorted[i]);
    const diffDays = Math.round((cur.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays === 1) currentStreak += 1;
    else currentStreak = 1;
    maxStreak = Math.max(maxStreak, currentStreak);
  }
  if (maxStreak >= 5) {
    insights.push({
      id: 'recovery-streak',
      type: 'recovery',
      title: 'Descansa más esta semana',
      description: `Has entrenado ${maxStreak} días seguidos. Programa un día de descanso o baja la intensidad.`,
      date: new Date(),
      severity: 'warning',
      icon: '🧘',
      meta: { maxStreak },
    });
  }

  // Adherencia semanal media < 0.6
  const adherenceByWeek = new Map<string, number[]>();
  for (const a of adherenceMetrics) {
    const wk = formatISO(startOfWeek(a.createdAt, { weekStartsOn: 1 }));
    const arr = adherenceByWeek.get(wk) || [];
    arr.push(a.adherence);
    adherenceByWeek.set(wk, arr);
  }
  const adherenceWeeks = Array.from(adherenceByWeek.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1));
  if (adherenceWeeks.length >= 1) {
    const [wk, values] = adherenceWeeks[adherenceWeeks.length - 1];
    const avg = values.reduce((acc, v) => acc + v, 0) / values.length;
    if (avg < 0.6) {
      insights.push({
        id: 'adherence-low',
        type: 'adherence',
        title: 'Mejora la adherencia',
        description: 'Tu adherencia media esta semana está por debajo del 60%. Ajusta objetivos o simplifica sesiones.',
        date: new Date(wk),
        severity: 'info',
        icon: '📅',
        meta: { adherenceAvg: Number(avg.toFixed(2)) },
      });
    }
  }

  // Mapear reps objetivo por (workoutId, exerciseId)
  const targetRepsMap = new Map<string, number>();
  for (const we of workoutExercises) {
    const key = `${we.workout.id}:${we.exerciseId}`;
    targetRepsMap.set(key, we.targetReps ?? 0);
  }

  // PR y ajuste de carga por ejercicio
  const byExercise = new Map<string, { name: string; entries: Array<{ date: Date; set: { weight: number; reps: number; rpe: number | null; rir: number | null }; workoutId: string; targetReps?: number }>; best1RM: number }>();

  for (const s of sets) {
    const key = s.exerciseId;
    const targetKey = `${s.workout.id}:${s.exerciseId}`;
    const targetReps = targetRepsMap.get(targetKey);
    const ex = byExercise.get(key) || { name: s.exercise.name, entries: [], best1RM: 0 };
    ex.entries.push({ date: s.workout.completedAt ?? new Date(), set: { weight: s.weight, reps: s.reps, rpe: s.rpe, rir: s.rir }, workoutId: s.workout.id, targetReps });
    byExercise.set(key, ex);
  }

  // Calcular best histórico y deducir PR y sugerencia de incremento
  for (const [exerciseId, data] of byExercise.entries()) {
    let historicMax = 0;
    for (const e of data.entries) {
      const est = epley1RM(e.set.weight, e.set.reps);
      historicMax = Math.max(historicMax, est);
    }

    // Última semana: si contiene el máximo, marcar PR
    const lastEntries = data.entries.filter(e => e.date >= subWeeks(new Date(), 1));
    let lastMax = 0;
    for (const e of lastEntries) {
      lastMax = Math.max(lastMax, epley1RM(e.set.weight, e.set.reps));
    }
    if (lastMax > 0 && lastMax >= historicMax && lastEntries.length > 0) {
      insights.push({
        id: `pr-${exerciseId}`,
        type: 'progress',
        title: `¡Nuevo PR en ${data.name}!`,
        description: `Mejor 1RM estimada reciente: ${lastMax.toFixed(1)} kg.`,
        date: new Date(),
        severity: 'success',
        icon: '🏆',
        meta: { oneRepMax: lastMax },
      });
    }

    // Ajuste de carga: últimas 2 sesiones
    const entriesSorted = data.entries.sort((a, b) => a.date.getTime() - b.date.getTime());
    const recentByWorkout = new Map<string, { repsAvg: number; rpeAvg: number; rirAvg: number; targetReps?: number }>();
    for (const e of entriesSorted) {
      const key = e.workoutId;
      const cur = recentByWorkout.get(key) || { repsAvg: 0, rpeAvg: 0, rirAvg: 0, targetReps: e.targetReps };
      const count = recentByWorkout.has(key) ? 1 : 0;
      const repsAvg = count ? (cur.repsAvg + e.set.reps) / 2 : e.set.reps;
      const rpeAvg = count ? (cur.rpeAvg + (e.set.rpe ?? 0)) / 2 : e.set.rpe ?? 0;
      const rirAvg = count ? (cur.rirAvg + (e.set.rir ?? 0)) / 2 : e.set.rir ?? 0;
      recentByWorkout.set(key, { repsAvg, rpeAvg, rirAvg, targetReps: cur.targetReps ?? e.targetReps });
    }
    const recent2 = Array.from(recentByWorkout.values()).slice(-2);
    if (recent2.length === 2) {
      const repsOK = recent2.every(r => (r.targetReps ?? 0) > 0 && r.repsAvg >= (r.targetReps ?? 0) + 1);
      const effortHigh = recent2.every(r => r.rpeAvg >= 8 || r.rirAvg <= 2);
      if (repsOK && effortHigh) {
        insights.push({
          id: `load-up-${exerciseId}`,
          type: 'load',
          title: `Aumenta peso en ${data.name}`,
          description: 'Has cumplido y superado las reps objetivo con alto esfuerzo en tus últimas sesiones. Sube 2–5% la carga.',
          date: new Date(),
          severity: 'info',
          icon: '📈',
        });
      }
    }
  }

  // Insight de volumen semanal
  if (weeksSorted.length >= 1) {
    const lastVol = weeksSorted[weeksSorted.length - 1][1];
    insights.push({
      id: 'volume-summary',
      type: 'volume',
      title: 'Volumen semanal',
      description: `Tu volumen acumulado esta semana: ${Math.round(lastVol)} kg·reps.`,
      date: new Date(),
      severity: 'info',
      icon: '🧮',
      meta: { weeklyVolume: Math.round(lastVol) },
    });
  }

  return insights;
}