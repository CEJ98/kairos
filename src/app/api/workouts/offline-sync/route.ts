import { logger } from "@/lib/logging";
import { NextResponse } from 'next/server';

import { authSession } from '@/lib/auth/session';
import { autosaveWorkoutDraft } from '@/app/actions/workout';

export async function POST(request: Request) {
  try {
    const session = await authSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await request.json();
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    const { workoutId, planId, sets } = payload as {
      workoutId?: string;
      planId?: string;
      sets?: Array<Record<string, unknown>>;
    };

    if (!workoutId || !planId || !Array.isArray(sets)) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 422 });
    }

    await autosaveWorkoutDraft({
      planId,
      workoutId,
      sets: sets.map((set) => ({
        exerciseId: String(set.exerciseId ?? ''),
        weight: Number(set.weight ?? 0),
        reps: Number(set.reps ?? 0),
        rpe: typeof set.rpe === 'number' ? set.rpe : null,
        rir: typeof set.rir === 'number' ? set.rir : null,
        restSeconds: Number(set.restSeconds ?? 0),
        notes: typeof set.notes === 'string' && set.notes.trim().length > 0 ? set.notes : null
      }))
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error('offline-sync-error', error);
    return NextResponse.json({ error: 'Error sincronizando progreso' }, { status: 500 });
  }
}
