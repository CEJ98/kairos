'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { redis, REDIS_KEYS, RedisWorkoutData, SaveWorkoutResult } from '@/lib/redis';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logging';

/**
 * Save workout to Redis with autosave capability
 * @param workoutData - Complete workout data including sets
 * @returns Result with success status and timestamp
 */
export async function saveWorkoutToRedis(
  workoutData: Omit<RedisWorkoutData, 'userId' | 'lastModified'>
): Promise<SaveWorkoutResult> {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No autenticado. Por favor inicia sesión.',
      };
    }

    const userId = session.user.id;
    const now = new Date().toISOString();

    // Prepare data with metadata
    const dataToSave: RedisWorkoutData = {
      ...workoutData,
      userId,
      lastModified: now,
    };

    // Save to Redis with TTL of 7 days (604800 seconds)
    const key = REDIS_KEYS.workout(userId, workoutData.id);
    await redis.set(key, dataToSave, { ex: 604800 });

    // Also add to user's workout list
    const userWorkoutsKey = REDIS_KEYS.userWorkouts(userId);
    await redis.zadd(userWorkoutsKey, {
      score: Date.now(),
      member: workoutData.id,
    });

    // Set expiry on the sorted set as well
    await redis.expire(userWorkoutsKey, 604800);

    return {
      success: true,
      lastModified: now,
    };
  } catch (error) {
    logger.error('Error saving workout to Redis:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al guardar',
    };
  }
}

/**
 * Load workout from Redis
 * @param workoutId - ID of the workout to load
 * @returns Workout data or null if not found
 */
export async function loadWorkoutFromRedis(
  workoutId: string
): Promise<{ success: boolean; data?: RedisWorkoutData; error?: string }> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No autenticado',
      };
    }

    const userId = session.user.id;
    const key = REDIS_KEYS.workout(userId, workoutId);

    const data = await redis.get<RedisWorkoutData>(key);

    if (!data) {
      return {
        success: false,
        error: 'Entrenamiento no encontrado en caché',
      };
    }

    // Verify ownership
    if (data.userId !== userId) {
      return {
        success: false,
        error: 'No autorizado',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    logger.error('Error loading workout from Redis:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al cargar',
    };
  }
}

/**
 * Get all workout IDs for a user
 * @returns List of workout IDs sorted by last modified
 */
export async function getUserWorkouts(): Promise<{
  success: boolean;
  workoutIds?: string[];
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No autenticado',
      };
    }

    const userId = session.user.id;
    const key = REDIS_KEYS.userWorkouts(userId);

    // Get workout IDs from sorted set (most recent first)
    const workoutIds = await redis.zrange<string[]>(key, 0, -1, { rev: true });

    return {
      success: true,
      workoutIds: workoutIds || [],
    };
  } catch (error) {
    logger.error('Error getting user workouts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Delete workout from Redis
 * @param workoutId - ID of the workout to delete
 */
export async function deleteWorkoutFromRedis(
  workoutId: string
): Promise<SaveWorkoutResult> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No autenticado',
      };
    }

    const userId = session.user.id;
    const key = REDIS_KEYS.workout(userId, workoutId);

    // Delete workout
    await redis.del(key);

    // Remove from user's workout list
    const userWorkoutsKey = REDIS_KEYS.userWorkouts(userId);
    await redis.zrem(userWorkoutsKey, workoutId);

    return {
      success: true,
    };
  } catch (error) {
    logger.error('Error deleting workout from Redis:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al eliminar',
    };
  }
}

/**
 * Save active workout session (for in-progress workouts)
 * @param sessionId - Unique session identifier
 * @param workoutData - Current workout state
 */
export async function saveWorkoutSession(
  sessionId: string,
  workoutData: Omit<RedisWorkoutData, 'userId' | 'lastModified'>
): Promise<SaveWorkoutResult> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No autenticado',
      };
    }

    const userId = session.user.id;
    const now = new Date().toISOString();

    const dataToSave: RedisWorkoutData = {
      ...workoutData,
      userId,
      lastModified: now,
    };

    // Save session with shorter TTL (24 hours)
    const key = REDIS_KEYS.workoutSession(userId, sessionId);
    await redis.set(key, dataToSave, { ex: 86400 });

    return {
      success: true,
      lastModified: now,
    };
  } catch (error) {
    logger.error('Error saving workout session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Load active workout session
 * @param sessionId - Session identifier
 */
export async function loadWorkoutSession(
  sessionId: string
): Promise<{ success: boolean; data?: RedisWorkoutData; error?: string }> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No autenticado',
      };
    }

    const userId = session.user.id;
    const key = REDIS_KEYS.workoutSession(userId, sessionId);

    const data = await redis.get<RedisWorkoutData>(key);

    if (!data) {
      return {
        success: false,
        error: 'Sesión no encontrada',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    logger.error('Error loading workout session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
