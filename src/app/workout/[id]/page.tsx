import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';

import { prisma } from '@/lib/clients/prisma';
import { AppShell } from '@/components/layout/app-shell';
import { WorkoutEditor } from '@/components/dashboard/workout-editor';
import { authSession } from '@/lib/auth/session';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface WorkoutPageProps {
  params: { id: string };
}

export default async function WorkoutPage({ params }: WorkoutPageProps) {
  const session = await authSession();
  let userId = session?.user?.id;
  // Permitir flujo demo sin NextAuth si existe cookie de demo
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
    notFound();
  }

  const workout = await prisma.workout.findUnique({
    where: { id: params.id },
    include: {
      plan: true,
      exercises: {
        include: {
          exercise: true
        }
      }
    }
  });

  if (!workout || workout.plan.userId !== userId) {
    notFound();
  }

  const totalSets = workout.exercises.reduce((acc, exercise) => acc + exercise.targetSets, 0);
  const focusMuscles = new Set(
    workout.exercises.map((exercise) => exercise.exercise.muscleGroup || '–')
  );

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-accent-teal">
            Sesión programada
          </span>
          <h1 className="font-display text-3xl font-bold text-foreground">{workout.title}</h1>
          <p className="text-sm text-neutral-500">
            {workout.scheduledAt
              ? format(workout.scheduledAt, "EEEE d 'de' MMMM • HH:mm", { locale: es })
              : 'Sesión sin fecha asignada'}
          </p>
        </header>

        <Card className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white/90 p-6 shadow-soft">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-neutral-500">Microciclo</span>
            <p className="text-sm font-semibold text-foreground">
              Semana {workout.microcycle ?? '—'} · Mesociclo {workout.mesocycle ?? '—'}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-neutral-500">
              Objetivo de la sesión
            </span>
            <p className="text-sm font-semibold text-foreground">
              {focusMuscles.size ? Array.from(focusMuscles).join(' · ') : 'Full body'}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-neutral-500">
              Sets planificados
            </span>
            <p className="text-sm font-semibold text-foreground">{totalSets} sets totales</p>
          </div>
          <Button asChild variant="accent" className="rounded-full px-6">
            <a href="#sesion">Comenzar</a>
          </Button>
        </Card>

        <section className="rounded-3xl bg-white/90 p-6 shadow-soft">
          <h2 className="mb-4 font-display text-xl font-semibold text-foreground">Briefing</h2>
          <div className="flex flex-wrap gap-3 text-sm text-neutral-600">
            <Badge variant="outline">
              RPE objetivo: {workout.rpeTarget ? workout.rpeTarget.toFixed(1) : 'NA'}
            </Badge>
            <Badge variant="outline">
              Descanso estándar: {workout.restSeconds ? `${workout.restSeconds}s` : '120s'}
            </Badge>
            <span>
              {workout.description ??
                'Mantén la técnica impecable y ajusta las cargas basándote en tu percepción de esfuerzo.'}
            </span>
          </div>
        </section>

        <section id="sesion">
          <WorkoutEditor
            planId={workout.planId}
            workout={{
              id: workout.id,
              title: workout.title,
              description: workout.description,
              scheduledAt: workout.scheduledAt?.toISOString() ?? new Date().toISOString(),
              exercises: workout.exercises.map((exercise) => ({
                id: exercise.id,
                exercise: {
                  id: exercise.exercise.id,
                  name: exercise.exercise.name,
                  videoUrl: exercise.exercise.videoUrl,
                  muscleGroup: exercise.exercise.muscleGroup,
                  equipment: exercise.exercise.equipment
                },
                targetSets: exercise.targetSets,
                targetReps: exercise.targetReps,
                restSeconds: exercise.restSeconds,
                rpeTarget: exercise.rpeTarget
              }))
            }}
          />
        </section>
      </div>
    </AppShell>
  );
}
