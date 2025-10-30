import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { AppShell } from '@/components/layout/app-shell';
import { ChartCard } from '@/components/charts/chart-card';
import { WeeklyCalendar } from '@/components/dashboard/weekly-calendar';
import { RangeFilter } from '@/components/forms/range-filter';
import { ExportCsvButton } from '@/components/forms/export-csv-button';
import { exportProgressCsv } from '@/server/actions/progress';
import { getRangeStart } from '@/lib/utils/date-range';
import { prisma } from '@/lib/clients/prisma';
import { authSession } from '@/lib/auth/session';
import { cookies } from 'next/headers';
import { ProgressGraph } from '@/components/charts/progress-graph';
import { OneRmBars } from '@/components/charts/one-rm-bars';
import { VolumeStackedArea } from '@/components/charts/volume-stacked-area';
import { AdherenceRing } from '@/components/charts/adherence-ring';
import { MetricsCards } from '@/components/progress/metrics-cards';

interface ProgressPageProps {
  searchParams: { range?: string };
}

type WorkoutSetWithWorkout = {
  weight: number;
  reps: number;
  workout: {
    completedAt: Date | null;
  };
  exercise?: { id: string; name: string; muscleGroup: string | null };
};

 type CalendarEvent = {
   id: string;
   title: string;
   scheduledAt: Date;
 };

 export default async function ProgressPage({ searchParams }: ProgressPageProps) {
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
     redirect('/login');
   }

   const range = searchParams.range ?? '8w';
   const startDate = getRangeStart(range);

   const [metrics, sets, adherence, upcoming] = await Promise.all([
     prisma.bodyMetric.findMany({
       where: {
         userId,
         date: { gte: startDate }
       },
       orderBy: { date: 'asc' }
     }),
    prisma.workoutSet.findMany({
       where: {
         workout: {
           plan: { userId },
           completedAt: { not: null, gte: startDate }
         }
       },
       include: {
        workout: true,
        exercise: true
       }
     }),
     prisma.adherenceMetric.findMany({
       where: {
         plan: { userId },
         createdAt: { gte: startDate }
       },
       orderBy: { createdAt: 'asc' }
     }),
     prisma.workout.findMany({
       where: {
         plan: { userId },
         completedAt: null,
         scheduledAt: { gte: new Date() }
       },
       orderBy: { scheduledAt: 'asc' }
     })
   ]);

  const weightData = metrics.map((metric) => ({
    label: format(metric.date, "d MMM", { locale: es }),
    value: metric.weight ?? 0
  }));

  const oneRmDataByExercise = computeOneRmByExercise(sets as WorkoutSetWithWorkout[]);
   const topOneRm = oneRmDataByExercise
     .sort((a, b) => b.value - a.value)
     .slice(0, 6);

  const { stackedVolume, seriesKeys } = computeStackedWeeklyVolume(sets as WorkoutSetWithWorkout[]);
  const adherenceData = adherence.map((entry) => ({
    label: format(entry.createdAt, "d MMM", { locale: es }),
    value: Number((entry.adherence * 100).toFixed(1))
  }));

   const meanAdherence = adherenceData.length
     ? adherenceData.reduce((acc, cur) => acc + cur.value, 0) / adherenceData.length
     : 0;

  const daysCompleted = new Set(
    (sets as WorkoutSetWithWorkout[])
       .map(s => s.workout.completedAt ? format(s.workout.completedAt, 'yyyy-MM-dd') : null)
       .filter(Boolean)
  ).size;
  const totalVolume = (sets as WorkoutSetWithWorkout[])
     .reduce((acc, s) => acc + s.weight * s.reps, 0);
  const prsCount = computePrsCount(sets as WorkoutSetWithWorkout[]);

  const calendarEvents: CalendarEvent[] = upcoming.map(
    (workout) => ({
    id: workout.id,
    title: workout.title,
    scheduledAt: workout.scheduledAt
  })
  );

   return (
     <AppShell>
       <div className="flex flex-col gap-8">
         <header className="flex flex-wrap items-center justify-between gap-4">
           <div>
             <span className="text-xs font-semibold uppercase tracking-wide text-accent-teal">
               Analítica personal
             </span>
             <h1 className="font-display text-3xl font-bold text-foreground">Panel de progreso</h1>
             <p className="text-sm text-neutral-500">
               Visualiza tus tendencias de peso, fuerza estimada, volumen semanal y adherencia para
               ajustar el plan.
             </p>
           </div>
           <div className="flex items-center gap-3">
             <RangeFilter />
             <ExportCsvButton action={exportProgressCsv} range={range} />
           </div>
         </header>
         <MetricsCards prsCount={prsCount} daysCompleted={daysCompleted} totalVolume={totalVolume} />
         {metrics.length === 0 && sets.length === 0 && adherence.length === 0 ? (
           <section className="rounded-3xl bg-white/90 p-6 text-center shadow-soft">
             <h2 className="font-display text-xl font-semibold text-foreground">Sin datos aún</h2>
             <p className="mt-2 text-sm text-neutral-500">Registra tu primera sesión para ver tu progreso.</p>
             <a href="/workout/next" className="mt-4 inline-block rounded-full bg-foreground px-4 py-2 text-background">Log your first session</a>
           </section>
         ) : (
         <section className="grid gap-6 md:grid-cols-2">
           <ChartCard
             title="Peso corporal"
             description="Línea temporal de peso"
             data={weightData}
             accent="teal"
           />
          <OneRmBars
            title="1RM estimado"
            description="Top ejercicios (Epley)"
            data={topOneRm}
          />
          <VolumeStackedArea
            title="Volumen semanal"
            description="Carga total por grupo muscular"
            data={stackedVolume}
            series={seriesKeys}
          />
          <AdherenceRing value={meanAdherence} />
         </section>
         )}
         <WeeklyCalendar events={calendarEvents} />
       </div>
     </AppShell>
   );
 }

 function toOneRmPoint(set: WorkoutSetWithWorkout) {
   const completedAt = set.workout.completedAt ?? new Date();
   const estimate = set.weight * (1 + set.reps / 30);
   return {
     label: format(completedAt, "w'ª'"),
     value: Number(estimate.toFixed(1))
   };
 }

 function toVolumePoint(set: WorkoutSetWithWorkout) {
   const completedAt = set.workout.completedAt ?? new Date();
   return {
     label: format(completedAt, "w'ª'"),
     value: set.weight * set.reps
   };
 }

 function aggregateByWeek(points: Array<{ label: string; value: number }>) {
   const map = new Map<string, number>();
   points.forEach((point) => {
     map.set(point.label, (map.get(point.label) ?? 0) + point.value);
   });
   return Array.from(map.entries()).map(([label, value]) => ({ label, value: Number(value.toFixed(1)) }));
 }

 function computeOneRmByExercise(sets: WorkoutSetWithWorkout[]) {
   const map = new Map<string, { name: string; value: number }>();
   for (const s of sets) {
     const exId = s.exercise?.id ?? 'unknown';
     const exName = s.exercise?.name ?? 'Desconocido';
     const estimate = s.weight * (1 + s.reps / 30);
     const current = map.get(exId);
     if (!current || estimate > current.value) {
       map.set(exId, { name: exName, value: Number(estimate.toFixed(1)) });
     }
   }
   return Array.from(map.values()).map((e) => ({ label: e.name, value: e.value }));
 }

 function computeStackedWeeklyVolume(sets: WorkoutSetWithWorkout[]) {
   const weekMap = new Map<string, Map<string, number>>();
   const groups = new Set<string>();
   for (const s of sets) {
     const completedAt = s.workout.completedAt ?? new Date();
     const weekLabel = format(completedAt, "w'ª'", { locale: es });
     const group = s.exercise?.muscleGroup ?? 'Otros';
     groups.add(group);
     const vol = s.weight * s.reps;
     if (!weekMap.has(weekLabel)) weekMap.set(weekLabel, new Map<string, number>());
     const inner = weekMap.get(weekLabel)!;
     inner.set(group, (inner.get(group) ?? 0) + vol);
   }
   const seriesKeys = Array.from(groups.values());
   const stackedVolume = Array.from(weekMap.values()).map((entry, idx) => {
     const label = Array.from(weekMap.keys())[idx];
     const obj: Record<string, number | string> = { label };
     for (const key of seriesKeys) {
       obj[key] = entry.get(key) ?? 0;
     }
     return obj;
   });
   return { stackedVolume, seriesKeys };
 }

 function computePrsCount(sets: WorkoutSetWithWorkout[]) {
   const byExercise = new Map<string, number>();
   let prs = 0;
   const ordered = [...sets].sort((a, b) => {
     const ad = a.workout.completedAt?.getTime() ?? 0;
     const bd = b.workout.completedAt?.getTime() ?? 0;
     return ad - bd;
   });
   for (const s of ordered) {
     const exId = s.exercise?.id ?? 'unknown';
     const vol = s.weight; // PR de peso levantado máximo por ejercicio
     const prev = byExercise.get(exId) ?? -Infinity;
     if (vol > prev) {
       prs += 1;
       byExercise.set(exId, vol);
     }
   }
   return prs;
 }
