import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/clients/redis';
import { authSession } from '@/lib/auth/session';

function makeKey(userId: string, workoutId: string) {
  return `rest:user:${userId}:workout:${workoutId}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workoutId = searchParams.get('workoutId');
    if (!workoutId) {
      return NextResponse.json({ error: 'workoutId requerido' }, { status: 400 });
    }

    const session = await authSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const redis = getRedisClient();
    const raw = await redis.get<string>(makeKey(session.user.id, workoutId));
    const seconds = raw ? Number(raw) : null;
    return NextResponse.json({ seconds });
  } catch (error) {
    return NextResponse.json({ error: 'Error cargando tiempo de descanso' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { workoutId, seconds } = (await request.json()) as { workoutId?: string; seconds?: number };
    if (!workoutId || typeof seconds !== 'number' || seconds < 0) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const session = await authSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const redis = getRedisClient();
    await redis.set(makeKey(session.user.id, workoutId), String(seconds), { ex: 600 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error guardando tiempo de descanso' }, { status: 500 });
  }
}