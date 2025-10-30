'use server';

import { z } from 'zod';

import { prisma } from '@/lib/clients/prisma';
import { authLimiter } from '@/lib/cache/rate-limit';
import { authSession } from '@/lib/auth/session';
import { toCsv } from '@/lib/utils/csv';
import { getRangeStart } from '@/lib/utils/date-range';

type BodyMetricLite = { date: Date; weight: number | null; bodyFat: number | null };
type AdherenceMetricLite = { createdAt: Date; adherence: number };

const rangeSchema = z.enum(['8w', '12w', '24w']);

export async function exportProgressCsv(rawRange: unknown = '8w') {
  const session = await authSession();
  if (!session?.user?.id) {
    throw new Error('No autenticado');
  }

  await authLimiter.limit(`progress-export:${session.user.id}`);

  const range = rangeSchema.parse(rawRange ?? '8w');
  const startDate = getRangeStart(range);

  const [metrics, adherence]: [BodyMetricLite[], AdherenceMetricLite[]] = await Promise.all([
    prisma.bodyMetric.findMany({
      where: {
        userId: session.user.id,
        date: { gte: startDate }
      },
      orderBy: { date: 'asc' }
    }),
    prisma.adherenceMetric.findMany({
      where: {
        plan: { userId: session.user.id },
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'asc' }
    })
  ]);

  const rows = metrics.map((metric) => ({
    fecha: metric.date.toISOString().split('T')[0],
    pesoKg: metric.weight ?? '',
    grasaCorporal: metric.bodyFat ?? ''
  }));

  adherence.forEach((entry) => {
    rows.push({
      fecha: entry.createdAt.toISOString().split('T')[0],
      pesoKg: 'Adherencia',
      grasaCorporal: entry.adherence
    });
  });

  return toCsv(rows);
}
