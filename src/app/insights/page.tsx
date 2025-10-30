import Link from 'next/link';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/clients/prisma';
import { authSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { computeProgressionAdjustments } from '@/server/services/progression';
import { getRangeStart } from '@/lib/utils/date-range';

interface InsightCard {
  title: string;
  description: string;
  type: string;
  ctaHref: string;
  ctaLabel: string;
}

export default async function InsightsPage() {
  const session = await authSession();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const plan = await prisma.plan.findFirst({
    where: { userId: session.user.id },
    include: {
      workouts: {
        include: {
          sets: true,
          exercises: {
            include: {
              exercise: true
            }
          }
        }
      }
    }
  });

  if (!plan) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <h1 className="font-display text-3xl font-bold text-foreground">Sin plan activo</h1>
          <p className="text-sm text-neutral-500">Crea un plan para recibir recomendaciones.</p>
          <Button asChild>
            <Link href="/workout/next">Crear plan</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const range = getRangeStart('8w');

  const exerciseNames = new Map<string, string>();
  plan.workouts.forEach(
    (workout: { exercises: Array<{ exerciseId: string; exercise: { name: string } }> }) => {
      workout.exercises.forEach(
        (exercise: { exerciseId: string; exercise: { name: string } }) => {
          exerciseNames.set(exercise.exerciseId, exercise.exercise.name);
        }
      );
    }
  );

  const [adherenceMetrics, bodyMetrics] = await Promise.all([
    prisma.adherenceMetric.findMany({
      where: { planId: plan.id, createdAt: { gte: range } },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.bodyMetric.findMany({
      where: { userId: session.user.id, date: { gte: range } },
      orderBy: { date: 'asc' }
    })
  ]);

  const insights = buildInsights(adherenceMetrics, bodyMetrics);

  const history = plan.workouts
    .flatMap(
      (workout: {
        completedAt: Date | null;
        scheduledAt: Date;
        sets: Array<{
          exerciseId: string;
          weight: number;
          reps: number;
          rpe?: number | null;
        }>;
      }) =>
        workout.sets.map(
          (set: {
            exerciseId: string;
            weight: number;
            reps: number;
            rpe?: number | null;
          }) => ({
            date: (workout.completedAt ?? workout.scheduledAt).toISOString(),
            exerciseId: set.exerciseId,
            weight: set.weight,
            reps: set.reps,
            rpe: set.rpe ?? 7,
            adherence: adherenceMetrics.length
              ? adherenceMetrics.at(-1)?.adherence ?? 0.8
              : 0.8
          })
        )
    )
    .filter((entry: { date: string }) => new Date(entry.date) >= range);

  const adjustments = history.length
    ? computeProgressionAdjustments(history, plan.progressionRule) ?? []
    : [];

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-accent-teal">
            Motor inteligente
          </span>
          <h1 className="font-display text-3xl font-bold text-foreground">Insights del plan</h1>
          <p className="text-sm text-neutral-500">
            Analizamos adherencia, cargas y tendencias para recomendar el siguiente paso de tu mesociclo.
          </p>
        </header>
        {history.length === 0 ? (
          <section className="rounded-3xl bg-white/90 p-6 text-center shadow-soft">
            <h2 className="font-display text-xl font-semibold text-foreground">Need more sessions</h2>
            <p className="mt-2 text-sm text-neutral-500">Registra tu primera sesión para generar insights útiles.</p>
            <Button asChild className="mt-4 rounded-full px-4">
              <Link href="/workout/next">Log your first session</Link>
            </Button>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2">
            {insights.map((insight) => (
              <article key={insight.title} className="rounded-3xl bg-white/80 p-6 shadow-soft">
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="outline">{insight.type}</Badge>
                  <h2 className="font-display text-xl font-semibold text-foreground">{insight.title}</h2>
                </div>
                <p className="text-sm text-neutral-600">{insight.description}</p>
                <Button asChild className="mt-4 rounded-full px-4">
                  <Link href={insight.ctaHref}>{insight.ctaLabel}</Link>
                </Button>
              </article>
            ))}
          </section>
        )}
        {adjustments.length ? (
          <section className="rounded-3xl bg-white/80 p-6 shadow-soft">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Ajustes recomendados
            </h2>
            <p className="text-sm text-neutral-500">
              Basado en la adherencia y esfuerzo reciente, aplica estos ajustes en tu próxima sesión.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {adjustments.map((adjustment) => (
                <div
                  key={adjustment.exerciseId}
                  className="rounded-2xl border border-neutral-100 bg-white p-4"
                >
                  <span className="text-xs uppercase tracking-wide text-neutral-500">
                    Ejercicio
                  </span>
                  <p className="font-display text-lg font-semibold">
                    {exerciseNames.get(adjustment.exerciseId) ?? adjustment.exerciseId}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Nuevo objetivo</span>
                    <span className="font-semibold text-foreground">
                      {adjustment.targetWeight.toFixed(1)} kg · {adjustment.targetReps} reps
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

function buildInsights(
  adherence: { adherence: number }[],
  metrics: { weight: number | null }[]
): InsightCard[] {
  const insights: InsightCard[] = [];

  if (adherence.length) {
    const avgAdherence = adherence.reduce((acc, item) => acc + item.adherence, 0) / adherence.length;
    if (avgAdherence < 0.8) {
      insights.push({
        title: 'Adherencia baja',
        description:
          'La adherencia promedio cayó debajo del 80%. Considera reducir días de entrenamiento o reprogramar sesiones clave.',
        type: 'Adherencia',
        ctaHref: '/calendar',
        ctaLabel: 'Reprogramar agenda'
      });
    }
  }

  if (metrics.length >= 4) {
    const last = metrics.at(-1)?.weight ?? 0;
    const previous = metrics.at(-4)?.weight ?? last;
    if (last > previous) {
      insights.push({
        title: 'Peso ascendente',
        description:
          'El peso corporal ha aumentado en las últimas semanas. Valida si coincide con tus objetivos o ajusta el plan nutricional.',
        type: 'Composición',
        ctaHref: '/progress',
        ctaLabel: 'Revisar métricas'
      });
    }
  }

  if (!insights.length) {
    insights.push({
      title: 'Plan estable',
      description: 'Sin alertas relevantes. Mantén la progresión actual y monitorea la próxima semana.',
      type: 'Estado',
      ctaHref: '/progress',
      ctaLabel: 'Ver dashboard'
    });
  }

  return insights;
}
