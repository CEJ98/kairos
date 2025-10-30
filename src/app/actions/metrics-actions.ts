'use server';

import { logger } from "@/lib/logging";

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { subMonths, format } from 'date-fns';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/clients/prisma';

// Validation schemas
const bodyWeightSchema = z.object({
  weight: z.number().min(30).max(300),
  bodyFat: z.number().min(3).max(60).optional(),
  muscleMass: z.number().min(10).max(200).optional(),
  date: z.string().optional(),
});

const bodyMeasurementsSchema = z.object({
  chest: z.number().min(50).max(200).optional(),
  waist: z.number().min(40).max(200).optional(),
  hips: z.number().min(50).max(200).optional(),
  leftArm: z.number().min(15).max(80).optional(),
  rightArm: z.number().min(15).max(80).optional(),
  leftThigh: z.number().min(30).max(120).optional(),
  rightThigh: z.number().min(30).max(120).optional(),
  shoulders: z.number().min(70).max(200).optional(),
  date: z.string().optional(),
});

export type BodyWeightInput = z.infer<typeof bodyWeightSchema>;
export type BodyMeasurementsInput = z.infer<typeof bodyMeasurementsSchema>;

// Types for returned data
import type { BodyWeightData, BodyMeasurementsData, ProgressPhotoData, MetricsSummary } from '@/types/metrics';

/**
 * Save body weight entry
 */
export async function saveBodyWeight(
  data: BodyWeightInput
): Promise<{ success: boolean; error?: string; data?: BodyWeightData }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'No autorizado' };
  }

  try {
    const validated = bodyWeightSchema.parse(data);
    const userId = session.user.id;
    const recordDate = validated.date ? new Date(validated.date) : new Date();

    const bodyMetric = await prisma.bodyMetric.create({
      data: {
        userId,
        date: recordDate,
        weight: validated.weight,
        bodyFat: validated.bodyFat ?? null,
        muscleMass: validated.muscleMass ?? null,
      },
    });

    revalidatePath('/metrics');
    revalidatePath('/progress-new');

    return {
      success: true,
      data: {
        id: bodyMetric.id,
        date: bodyMetric.date,
        weight: validated.weight,
        bodyFat: bodyMetric.bodyFat,
        muscleMass: bodyMetric.muscleMass,
      },
    };
  } catch (error) {
    logger.error('Error saving body weight:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Datos inválidos' };
    }
    return { success: false, error: 'Error al guardar el peso' };
  }
}

/**
 * Save body measurements
 */
export async function saveBodyMeasurements(
  data: BodyMeasurementsInput
): Promise<{ success: boolean; error?: string; data?: BodyMeasurementsData }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'No autorizado' };
  }

  try {
    const validated = bodyMeasurementsSchema.parse(data);
    const userId = session.user.id;
    const recordDate = validated.date ? new Date(validated.date) : new Date();

    // Create a body metric entry for measurements
    const bodyMetric = await prisma.bodyMetric.create({
      data: {
        userId,
        date: recordDate,
        chest: validated.chest ?? null,
        waist: validated.waist ?? null,
        hips: validated.hips ?? null,
        leftArm: validated.leftArm ?? null,
        rightArm: validated.rightArm ?? null,
        leftThigh: validated.leftThigh ?? null,
        rightThigh: validated.rightThigh ?? null,
        shoulders: validated.shoulders ?? null,
      },
    });

    revalidatePath('/metrics');

    return {
      success: true,
      data: {
        id: bodyMetric.id,
        date: bodyMetric.date,
        chest: bodyMetric.chest,
        waist: bodyMetric.waist,
        hips: bodyMetric.hips,
        leftArm: bodyMetric.leftArm,
        rightArm: bodyMetric.rightArm,
        leftThigh: bodyMetric.leftThigh,
        rightThigh: bodyMetric.rightThigh,
        shoulders: bodyMetric.shoulders,
      },
    };
  } catch (error) {
    logger.error('Error saving body measurements:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Datos inválidos' };
    }
    return { success: false, error: 'Error al guardar las medidas' };
  }
}

/**
 * Get body weight history
 */
export async function getBodyWeightHistory(
  months: number = 6
): Promise<BodyWeightData[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const userId = session.user.id;
  const startDate = subMonths(new Date(), months);

  const metrics = await prisma.bodyMetric.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
      },
    },
    orderBy: {
      date: 'asc',
    },
  });

  return metrics
    .filter((m) => m.weight != null)
    .map((m) => ({
      id: m.id,
      date: m.date,
      weight: (m.weight ?? 0) as number,
      bodyFat: m.bodyFat ?? null,
      muscleMass: m.muscleMass ?? null,
    }));
}

/**
 * Get body measurements history
 */
export async function getBodyMeasurementsHistory(
  months: number = 6
): Promise<BodyMeasurementsData[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const userId = session.user.id;
  const startDate = subMonths(new Date(), months);

  const metrics = await prisma.bodyMetric.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
      },
    },
    orderBy: {
      date: 'asc',
    },
  });

  return metrics.map((m) => ({
    id: m.id,
    date: m.date,
    chest: m.chest ?? null,
    waist: m.waist ?? null,
    hips: m.hips ?? null,
    leftArm: m.leftArm ?? null,
    rightArm: m.rightArm ?? null,
    leftThigh: m.leftThigh ?? null,
    rightThigh: m.rightThigh ?? null,
    shoulders: m.shoulders ?? null,
  }));
}

/**
 * Get latest body measurements for radar chart
 */
export async function getLatestMeasurements(): Promise<BodyMeasurementsData | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  const latest = await prisma.bodyMetric.findFirst({
    where: {
      userId,
    },
    orderBy: {
      date: 'desc',
    },
  });

  if (!latest) return null;
  return {
    id: latest.id,
    date: latest.date,
    chest: latest.chest ?? null,
    waist: latest.waist ?? null,
    hips: latest.hips ?? null,
    leftArm: latest.leftArm ?? null,
    rightArm: latest.rightArm ?? null,
    leftThigh: latest.leftThigh ?? null,
    rightThigh: latest.rightThigh ?? null,
    shoulders: latest.shoulders ?? null,
  };
}

/**
 * Get progress photos
 */
export async function getProgressPhotos(): Promise<ProgressPhotoData[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const userId = session.user.id;

  const photos = await prisma.progressPhoto.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      url: true,
      createdAt: true,
      notes: true,
    },
  });

  return photos;
}

/**
 * Save progress photo URL (after upload to storage)
 */
export async function saveProgressPhoto(
  url: string,
  notes?: string
): Promise<{ success: boolean; error?: string; data?: ProgressPhotoData }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'No autorizado' };
  }

  try {
    const userId = session.user.id;

    const photo = await prisma.progressPhoto.create({
      data: {
        userId,
        url,
        notes: notes ?? null,
      },
    });

    revalidatePath('/metrics');

    return {
      success: true,
      data: {
        id: photo.id,
        url: photo.url,
        createdAt: photo.createdAt,
        notes: photo.notes,
      },
    };
  } catch (error) {
    logger.error('Error saving progress photo:', error);
    return { success: false, error: 'Error al guardar la foto' };
  }
}

/**
 * Delete progress photo
 */
export async function deleteProgressPhoto(
  photoId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'No autorizado' };
  }

  try {
    const userId = session.user.id;

    // Verify ownership
    const photo = await prisma.progressPhoto.findFirst({
      where: {
        id: photoId,
        userId,
      },
    });

    if (!photo) {
      return { success: false, error: 'Foto no encontrada' };
    }

    await prisma.progressPhoto.delete({
      where: {
        id: photoId,
      },
    });

    revalidatePath('/metrics');
    return { success: true };
  } catch (error) {
    logger.error('Error deleting progress photo:', error);
    return { success: false, error: 'Error al eliminar la foto' };
  }
}

/**
 * Get metrics summary
 */
export async function getMetricsSummary(): Promise<MetricsSummary | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  // Get latest weight entry
  const latestWeight = await prisma.bodyMetric.findFirst({
    where: {
      userId,
    },
    orderBy: { date: 'desc' },
  });

  // Get weight from 30 days ago
  const thirtyDaysAgo = subMonths(new Date(), 1);
  const previousWeight = await prisma.bodyMetric.findFirst({
    where: {
      userId,
      date: { lte: thirtyDaysAgo },
    },
    orderBy: { date: 'desc' },
  });

  // Count measurements
  const measurementsCount = await prisma.bodyMetric.count({
    where: { userId },
  });

  // Count photos
  const photosCount = await prisma.progressPhoto.count({
    where: { userId },
  });

  const latestWeightVal = latestWeight?.weight ?? null;
  const previousWeightVal = previousWeight?.weight ?? null;
  const weightChange =
    latestWeightVal != null && previousWeightVal != null
      ? Number(((latestWeightVal as number) - (previousWeightVal as number)).toFixed(1))
      : null;

  const latestBodyFat = latestWeight?.bodyFat ?? null;
  const previousBodyFat = previousWeight?.bodyFat ?? null;
  const bodyFatChange =
    latestBodyFat != null && previousBodyFat != null
      ? Number(((latestBodyFat as number) - (previousBodyFat as number)).toFixed(1))
      : null;

  return {
    currentWeight: latestWeightVal ?? null,
    weightChange,
    currentBodyFat: latestBodyFat ?? null,
    bodyFatChange,
    totalMeasurements: measurementsCount,
    totalPhotos: photosCount,
  };
}
