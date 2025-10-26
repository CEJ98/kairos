import { redirect } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { Stat } from "@/components/dashboard/stat";
import { prisma } from "@/lib/clients/prisma";
import { cookies } from 'next/headers';
import { authSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreatePlanButton } from "@/components/forms/create-plan-button";
import { StartNextWorkoutButton } from "@/components/forms/start-next-workout-button";

type AdherenceMetric = { adherence: number };
type WorkoutSet = { weight: number; reps: number };
type UpcomingWorkout = { id: string; title: string; scheduledAt: Date };
type RecentWorkout = { id: string; title: string; completedAt: Date | null; sets: WorkoutSet[] };
type BodyMetric = { id: string; date: Date; weightKg: number | null; bodyFat: number | null };

export default async function DashboardPage() {
  const session = await authSession();
  let userId = session?.user?.id;

  // Allow demo flow to render without strict auth if cookie is set
  if (!userId) {
    const demoCookie = cookies().get('x-demo');
    if (demoCookie) {
      const demoUser = await prisma.user.findUnique({ where: { email: 'demo@kairos.test' } });
      if (demoUser) {
        userId = demoUser.id;
      }
    }
  }

  if (!userId) {
    redirect("/login");
  }
  const [plan, adherenceSeries, upcomingWorkouts, recentWorkouts, bodyMetrics] = await Promise.all([
    prisma.plan.findFirst({
      where: { userId },
      include: {
        workouts: {
          orderBy: { scheduledAt: "asc" },
          take: 4
        }
      }
    }),
    prisma.adherenceMetric.findMany({
      where: { plan: { userId } },
      orderBy: { createdAt: "asc" },
      take: 6
    }),
    prisma.workout.findMany({
      where: {
        plan: { userId },
        scheduledAt: { gte: new Date() }
      },
      orderBy: { scheduledAt: "asc" },
      take: 3
    }),
    prisma.workout.findMany({
      where: {
        plan: { userId },
        completedAt: { not: null }
      },
      orderBy: { completedAt: "desc" },
      take: 3,
      include: { sets: true }
    }),
    prisma.bodyMetric.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 4
    })
  ]);

  const typedAdherenceSeries = adherenceSeries as AdherenceMetric[];
  const adherence =
    typedAdherenceSeries.length === 0
      ? 0
      : typedAdherenceSeries.reduce((acc: number, metric: AdherenceMetric) => acc + metric.adherence, 0) /
        typedAdherenceSeries.length;

  const typedBodyMetrics = bodyMetrics as BodyMetric[];
  const latestMetric = typedBodyMetrics.at(0);
  const typedRecentWorkouts = recentWorkouts as RecentWorkout[];
  const lastWorkout = typedRecentWorkouts.at(0);
  const totalVolume = lastWorkout
    ? lastWorkout.sets.reduce((acc: number, set: WorkoutSet) => acc + set.weight * set.reps, 0)
    : 0;

  const stats = [
    { label: "Adherencia 6 semanas", value: `${Math.round(adherence * 100)}%` },
    {
      label: "Siguiente sesión",
      value: upcomingWorkouts[0]
        ? format(upcomingWorkouts[0].scheduledAt, "EEE d MMM", { locale: es })
        : "Sin programar"
    },
    {
      label: "Peso actual",
      value: latestMetric?.weightKg ? `${latestMetric.weightKg.toFixed(1)} kg` : "Sin datos"
    },
    {
      label: "Volumen última sesión",
      value: totalVolume ? `${Math.round(totalVolume)} kg totales` : "Pendiente"
    }
  ];

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-accent-teal">
            Hola de nuevo
          </span>
          <h1 className="font-display text-4xl font-bold text-foreground">Tu semana en Kairos</h1>
          <p className="text-sm text-neutral-500">
            Revisa tu adherencia, prepara la siguiente sesión y ajusta el plan según tus métricas
            recientes.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="rounded-3xl bg-white/90 p-5 shadow-soft">
              <Stat label={stat.label} value={stat.value} />
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card className="flex flex-col gap-5 rounded-3xl bg-white/95 p-6 shadow-soft">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  Próximas sesiones
                </h2>
                <p className="text-sm text-neutral-500">
                  Mantén al día tu microciclo y ajusta según disponibilidad.
                </p>
              </div>
              <Button asChild variant="accent" className="rounded-full px-4">
                <Link href="/calendar">Ver calendario</Link>
              </Button>
            </header>
            <div className="space-y-3">
              {upcomingWorkouts.length ? (
                (upcomingWorkouts as UpcomingWorkout[]).map((workout: UpcomingWorkout) => (
                  <div
                    key={workout.id}
                    className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{workout.title}</p>
                      <p className="text-xs text-neutral-500">
                        {format(workout.scheduledAt, "EEEE d 'de' MMMM • HH:mm", { locale: es })}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline" className="rounded-full">
                      <Link href={`/workout/${workout.id}`}>Abrir</Link>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500">
                  Agenda una nueva sesión desde el plan para mantener la adherencia.
                </div>
              )}
            </div>
          </Card>

          <Card className="flex flex-col justify-between gap-4 rounded-3xl bg-foreground text-background p-6 shadow-soft">
            <div>
              <h2 className="font-display text-2xl font-semibold">Estado del plan</h2>
              {plan ? (
                <>
                  <p className="mt-2 text-sm opacity-80">
                    Objetivo <strong>{plan.goal}</strong> · {plan.microcycleLength} sesiones por
                    microciclo
                  </p>
                  <p className="text-sm opacity-80">
                    Regla de progresión <strong>{plan.progressionRule.toLowerCase()}</strong>
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm opacity-80">
                  Aún no tienes un plan activo. Crea uno para desbloquear recomendaciones.
                </p>
              )}
            </div>
            {plan ? (
              <StartNextWorkoutButton userId={userId} />
            ) : (
              <CreatePlanButton userId={userId} />
            )}
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-3xl bg-white/95 p-6 shadow-soft">
            <h3 className="font-display text-xl font-semibold text-foreground">Actividad reciente</h3>
            <ul className="mt-4 space-y-3">
              {typedRecentWorkouts.length ? (
                typedRecentWorkouts.map((workout: RecentWorkout) => (
                  <li key={workout.id} className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{workout.title}</p>
                      <p className="text-xs text-neutral-500">
                        {workout.completedAt
                          ? format(workout.completedAt, "d MMM • HH:mm", { locale: es })
                          : "Sin completar"}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-neutral-500">
                      {workout.sets.length} sets
                    </span>
                  </li>
                ))
              ) : (
                <li className="rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500">
                  Todavía no registras sesiones completadas esta semana.
                </li>
              )}
            </ul>
          </Card>
          <Card className="rounded-3xl bg-white/95 p-6 shadow-soft">
            <h3 className="font-display text-xl font-semibold text-foreground">Métricas corporales</h3>
            <ul className="mt-4 space-y-3">
              {typedBodyMetrics.length ? (
                typedBodyMetrics.map((metric: BodyMetric) => (
                  <li
                    key={metric.id}
                    className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3 text-sm text-neutral-600"
                  >
                    <span>{format(metric.date, "d MMM", { locale: es })}</span>
                    <span className="font-semibold text-foreground">
                      {metric.weightKg ? `${metric.weightKg.toFixed(1)} kg` : "--"}
                    </span>
                    <span>
                      {metric.bodyFat ? `${metric.bodyFat.toFixed(1)}% grasa` : "Sin lectura"}
                    </span>
                  </li>
                ))
              ) : (
                <li className="rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500">
                  Registra tus medidas para desbloquear insights personalizados.
                </li>
              )}
            </ul>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
