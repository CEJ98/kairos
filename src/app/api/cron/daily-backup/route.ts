import { logger } from "@/lib/logging";

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/clients/prisma';
import * as Sentry from '@sentry/nextjs';
import { toCsv } from '@/lib/utils/csv';
import { uploadObject } from '@/lib/clients/supabase-storage';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = request.headers.get('authorization') || '';
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET no configurado' }, { status: 500 });
  }
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'backups';

  try {
    const now = new Date();
    const dateStr = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
      .format(now)
      .replaceAll('/', '-'); // YYYY-MM-DD
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`; // HHmm
    const basePath = `daily/${dateStr}/${timeStr}`;

    const [users, profiles, plans, workouts, workoutExercises, workoutSets, bodyMetrics, streaks, subscriptions, exercises, adherenceMetrics] = await Promise.all([
      prisma.user.findMany(),
      prisma.profile.findMany(),
      prisma.plan.findMany(),
      prisma.workout.findMany(),
      prisma.workoutExercise.findMany(),
      prisma.workoutSet.findMany(),
      prisma.bodyMetric.findMany(),
      prisma.streak.findMany(),
      prisma.subscription.findMany(),
      prisma.exercise.findMany(),
      prisma.adherenceMetric.findMany()
    ]);

    const tables: Array<{ name: string; rows: Array<Record<string, any>> }> = [
      { name: 'users', rows: users as any },
      { name: 'profiles', rows: profiles as any },
      { name: 'plans', rows: plans as any },
      { name: 'workouts', rows: workouts as any },
      { name: 'workout_exercises', rows: workoutExercises as any },
      { name: 'workout_sets', rows: workoutSets as any },
      { name: 'body_metrics', rows: bodyMetrics as any },
      { name: 'streaks', rows: streaks as any },
      { name: 'subscriptions', rows: subscriptions as any },
      { name: 'exercises', rows: exercises as any },
      { name: 'adherence_metrics', rows: adherenceMetrics as any }
    ];

    for (const { name, rows } of tables) {
      const jsonPath = `${basePath}/${name}.json`;
      const csvPath = `${basePath}/${name}.csv`;

      await uploadObject({ bucket, path: jsonPath, mime: 'application/json', body: JSON.stringify(rows) });
      const csv = toCsv(rows);
      await uploadObject({ bucket, path: csvPath, mime: 'text/csv', body: csv });
    }

    return NextResponse.json({ ok: true, bucket, pathPrefix: basePath, tables: tables.map((t) => t.name) });
  } catch (err) {
    Sentry.captureException(err);
    logger.error('daily-backup-error', err);
    return NextResponse.json({ error: 'backup_failed' }, { status: 500 });
  }
}