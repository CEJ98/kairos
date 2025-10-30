export const dynamic = 'force-dynamic';

import { AppShell } from '@/components/layout/app-shell';
import { prisma } from '@/lib/clients/prisma';
import { ExerciseFilters } from '@/components/forms/exercise-filters';
import { AvailabilityToggle } from '@/components/dashboard/availability-toggle';
import { Badge } from '@/components/ui/badge';

interface ExercisesPageProps {
  searchParams: { muscle?: string; equipment?: string };
}

type ExerciseItem = {
  id: string;
  name: string;
  description: string | null;
  videoUrl: string | null;
  muscleGroup: string;
  equipment: string;
  cues: string;
};

export default async function ExercisesPage({ searchParams }: ExercisesPageProps) {
  let allExercises: ExerciseItem[] = [];
  let muscles: { muscleGroup: string | null }[] = [];
  let equipment: { equipment: string | null }[] = [];

  try {
    [allExercises, muscles, equipment] = await Promise.all([
      prisma.exercise.findMany({ orderBy: { name: 'asc' } }),
      prisma.exercise.findMany({
        distinct: ['muscleGroup'],
        select: { muscleGroup: true }
      }),
      prisma.exercise.findMany({
        distinct: ['equipment'],
        select: { equipment: true }
      })
    ]);
  } catch {
    // Entorno sin DB; mostrar página vacía sin bloquear build
    allExercises = [];
    muscles = [];
    equipment = [];
  }

  const uniqueMuscles = muscles
    .map((item) => item.muscleGroup)
    .filter((m): m is string => Boolean(m));
  const uniqueEquipment = equipment
    .map((item) => item.equipment)
    .filter((e): e is string => Boolean(e));

  const filtered = allExercises.filter((exercise) => {
    const muscleMatch = searchParams.muscle ? exercise.muscleGroup === searchParams.muscle : true;
    const equipmentMatch = searchParams.equipment ? exercise.equipment === searchParams.equipment : true;
    return muscleMatch && equipmentMatch;
  });

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-accent-teal">
            Biblioteca inteligente
          </span>
          <h1 className="font-display text-3xl font-bold text-foreground">Ejercicios guiados</h1>
          <p className="text-sm text-neutral-500">
            Filtra por grupo muscular o equipo, revisa cues técnicos y marca alternativas cuando un ejercicio no está disponible.
          </p>
        </header>
        <ExerciseFilters muscles={uniqueMuscles} equipment={uniqueEquipment} />
        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map((exercise: ExerciseItem) => {
            const alternatives = allExercises
              .filter((item) => item.id !== exercise.id && item.muscleGroup === exercise.muscleGroup)
              .slice(0, 2);

            return (
              <article key={exercise.id} className="rounded-3xl bg-white/80 p-6 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-foreground">
                      {exercise.name}
                    </h2>
                    <div className="mt-1 flex gap-2 text-xs uppercase tracking-wide text-neutral-500">
                      <Badge variant="outline">{exercise.muscleGroup}</Badge>
                      <Badge variant="outline">{exercise.equipment}</Badge>
                    </div>
                  </div>
                  <AvailabilityToggle exerciseId={exercise.id} />
                </div>
                {exercise.videoUrl ? (
                  <video
                    controls
                    src={exercise.videoUrl}
                    className="mt-4 h-48 w-full rounded-2xl object-cover"
                  />
                ) : null}
                {exercise.description ? (
                  <p className="mt-4 text-sm text-neutral-600">{exercise.description}</p>
                ) : null}
                <div className="mt-4 rounded-2xl bg-surface p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Cues claves
                  </h3>
                  <p className="mt-2 text-sm text-foreground">{exercise.cues}</p>
                </div>
                {alternatives.length ? (
                  <div className="mt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Alternativas sugeridas
                    </h3>
                    <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-neutral-600">
                      {alternatives.map((alt) => (
                        <li key={alt.id}>{alt.name}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
