import { redirect } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { WeeklyDndCalendar } from "@/components/calendar/weekly-dnd-calendar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RescheduleControl } from "@/components/forms/reschedule-control";
import { prisma } from "@/lib/clients/prisma";
import { authSession } from "@/lib/auth/session";

type CalendarWorkout = {
  id: string;
  title: string;
  scheduledAt: Date;
  completedAt: Date | null;
};

export default async function CalendarPage() {
  const session = await authSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const workouts = await prisma.workout.findMany({
    where: { plan: { userId } },
    orderBy: { scheduledAt: "asc" },
    include: {
      exercises: {
        include: { exercise: true }
      }
    }
  });
  const typedWorkouts = workouts as CalendarWorkout[];
  const upcoming = typedWorkouts.filter((workout) => workout.scheduledAt > new Date());
  const nextSevenDays = upcoming.filter(
    (workout) =>
      workout.scheduledAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 &&
      workout.scheduledAt >= new Date()
  );

  const calendarEvents = typedWorkouts.map((workout) => ({
    id: workout.id,
    title: workout.title,
    scheduledAt: workout.scheduledAt
  }));

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-accent-teal">
            Organización
          </span>
          <h1 className="font-display text-3xl font-bold text-foreground">Calendario inteligente</h1>
          <p className="text-sm text-neutral-500">
            Visualiza tus próximas sesiones, ajusta microciclos y evita choques con tu agenda personal.
          </p>
        </header>
      <WeeklyDndCalendar sessions={typedWorkouts} referenceDate={new Date()} />

        {/* Replaced by dnd-kit calendar above */}

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card className="rounded-3xl bg-white/90 p-6 shadow-soft">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Próximos 7 días
            </h2>
            <div className="mt-4 space-y-3">
              {nextSevenDays.length ? (
                nextSevenDays.map((workout) => (
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
                    <div className="flex items-center gap-3">
                      <Button asChild size="sm" variant="outline" className="rounded-full">
                        <Link href={`/workout/${workout.id}`}>Abrir sesión</Link>
                      </Button>
                      <RescheduleControl workoutId={workout.id} scheduledAt={workout.scheduledAt} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-neutral-200 p-8 text-center text-sm text-neutral-500">
                  Aún no tienes sesiones programadas esta semana. Genera nuevas en tu plan activo.
                </div>
              )}
            </div>
          </Card>

          <Card className="rounded-3xl bg-white/90 p-6 shadow-soft">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Sesiones completadas
            </h2>
            <div className="mt-4 space-y-3">
              {typedWorkouts
                .filter((workout) => workout.completedAt)
                .slice(0, 4)
                .map((workout) => (
                  <div key={workout.id} className="rounded-2xl bg-surface px-4 py-3 text-sm">
                    <p className="font-semibold text-foreground">{workout.title}</p>
                    <p className="text-xs text-neutral-500">
                      Completado el{" "}
                      {workout.completedAt
                        ? format(workout.completedAt, "d MMM • HH:mm", { locale: es })
                        : "Pendiente"}
                    </p>
                  </div>
                ))}
              {!typedWorkouts.some((workout) => workout.completedAt) ? (
                <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500">
                  Todavía no registras sesiones completadas. Suma tu primera sesión para ver progresos.
                </div>
              ) : null}
            </div>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
