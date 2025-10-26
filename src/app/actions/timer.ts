'use server';

import { getRedisClient } from '@/lib/clients/redis';
import { authSession } from '@/lib/auth/session';

function makeKey(userId: string, workoutId: string) {
  return `rest:user:${userId}:workout:${workoutId}`;
}

export async function saveRestSeconds(workoutId: string, seconds: number): Promise<void> {
  const session = await authSession();
  if (!session?.user?.id) throw new Error('No autenticado');
  const redis = getRedisClient();
  await redis.set(makeKey(session.user.id, workoutId), String(seconds), { ex: 600 });
}

export async function loadRestSeconds(workoutId: string): Promise<number | null> {
  const session = await authSession();
  if (!session?.user?.id) throw new Error('No autenticado');
  const redis = getRedisClient();
  const raw = await redis.get<string>(makeKey(session.user.id, workoutId));
  return raw ? Number(raw) : null;
}