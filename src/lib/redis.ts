import { Redis } from '@upstash/redis';

// Initialize Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Redis key patterns
export const REDIS_KEYS = {
  workout: (userId: string, workoutId: string) => `workout:${userId}:${workoutId}`,
  userWorkouts: (userId: string) => `workouts:${userId}`,
  workoutSession: (userId: string, sessionId: string) => `session:${userId}:${sessionId}`,
} as const;

// Types for Redis data
export interface RedisWorkoutData {
  id: string;
  title: string;
  description?: string;
  scheduledAt: string; // ISO string
  exercises: {
    id: string;
    name: string;
    muscleGroup: string;
    equipment: string;
    sets: {
      id: string;
      exerciseId: string;
      setNumber: number;
      weight: number;
      reps: number;
      rpe?: number;
      rir?: number;
      completed: boolean;
      notes?: string;
    }[];
  }[];
  lastModified: string; // ISO string
  userId: string;
}

export interface SaveWorkoutResult {
  success: boolean;
  error?: string;
  lastModified?: string;
}
