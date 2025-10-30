'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/clients/prisma';
import { subWeeks, format } from 'date-fns';
import { logger } from '@/lib/logging';
import type {
  BodyWeightData,
  StrengthData,
  VolumeData,
  AdherenceData,
  PersonalRecords,
  ProgressMetrics,
} from '@/types/progress';

export async function getProgressData(): Promise<ProgressMetrics | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return null;
    }

    const userId = session.user.id;
    const twelveWeeksAgo = subWeeks(new Date(), 12);

    // Obtener métricas corporales
    const bodyMetrics = await prisma.bodyMetric.findMany({
      where: {
        userId,
        date: { gte: twelveWeeksAgo }
      },
      orderBy: { date: 'asc' }
    });

    // No existe StrengthMetric en el esquema actual, dejamos datos vacíos por ahora
    const strengthMetrics: Array<{ date: Date; exercise: { name: string }; oneRepMax: number }> = [];

    // Calcular PRs y stats básicos a partir de métricas corporales
    const latestBodyMetric = bodyMetrics[bodyMetrics.length - 1];
    const currentWeight = latestBodyMetric?.weight || 0;
    const currentBodyFat = latestBodyMetric?.bodyFat || 0;

    // Formatear datos para el frontend
    const bodyWeight: BodyWeightData[] = bodyMetrics.map(m => ({
      date: format(new Date(m.date), 'MMM dd'),
      weight: m.weight ?? 0,
      bodyFat: m.bodyFat || undefined,
    }));

    const strength: StrengthData[] = strengthMetrics.map(m => ({
      date: format(new Date(m.date), 'MMM dd'),
      exercise: m.exercise.name,
      oneRepMax: m.oneRepMax
    }));

    // Dejar volumen y adherencia vacíos por ahora
    const volume: VolumeData[] = [];
    const adherence: AdherenceData[] = [];

    return {
      bodyWeight,
      strength,
      volume,
      adherence,
      personalRecords: {
        squat: 0,
        bench: 0,
        deadlift: 0,
        totalVolume: 0,
        longestStreak: 0
      },
      currentStats: {
        weight: Math.round(currentWeight * 10) / 10,
        bodyFat: Math.round(currentBodyFat * 10) / 10,
        adherenceRate: 0,
        weeklyVolume: 0
      }
    };
  } catch (error) {
    logger.error('Error getting progress data:', error);
    return null;
  }
}

/**
 * Obtiene solo las métricas corporales
 */
export async function getBodyMetrics(weeks: number = 12): Promise<BodyWeightData[]> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    const startDate = subWeeks(new Date(), weeks);
    const metrics = await prisma.bodyMetric.findMany({
      where: {
        userId: session.user.id,
        date: { gte: startDate }
      },
      orderBy: { date: 'asc' }
    });

    return metrics.map(m => ({
      date: format(new Date(m.date), 'MMM dd'),
      weight: m.weight ?? 0,
      bodyFat: m.bodyFat || undefined,
    }));
  } catch (error) {
    logger.error('Error getting body metrics:', error);
    return [];
  }
}
