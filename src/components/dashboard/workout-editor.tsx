'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { autosaveWorkoutDraft, logWorkout } from '@/app/actions/workout';
import { toast } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
// import { useRouter } from 'next/navigation';
import { KTimer } from '@/components/ui/k-timer';
import { useTrack } from '@/lib/hooks/use-track';
import { saveWorkoutSession } from '@/app/actions/workout-actions';
import { CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkoutEditorProps {
  planId: string;
  workout: {
    id: string;
    title: string;
    description?: string | null;
    scheduledAt?: string;
    exercises: Array<{
      id: string;
      exercise: {
        id: string;
        name: string;
        videoUrl?: string | null;
        muscleGroup?: string;
        equipment?: string;
      };
      targetSets: number;
      targetReps: number;
      restSeconds: number;
      rpeTarget?: number | null;
    }>;
  };
}

type EditableSet = {
  exerciseId: string;
  weight: number;
  reps: number;
  rpe: number | null;
  rir: number | null;
  restSeconds: number;
  completed: boolean;
  notes?: string;
};

export function WorkoutEditor({ planId, workout }: WorkoutEditorProps) {
  // const router = useRouter();
  const track = useTrack();
  const [sets, setSets] = useState<EditableSet[]>(() => buildEditableSetsFromWorkout(workout));
  const [substitutions, setSubstitutions] = useState<Record<string, string>>({});
  const [isSaving, startTransition] = useTransition();
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [hasPendingOfflineSync, setHasPendingOfflineSync] = useState(false);
  const offlineNoticeShownRef = useRef(false);

  const offlineDraftKey = `kairos:workout:${workout.id}:draft`;
  const offlineCacheKey = `kairos:workout:${workout.id}:cache`;
  const offlineMetaKey = `kairos:workout:${workout.id}:meta`;

  const offlineExercises = useMemo(
    () =>
      workout.exercises.map((exercise) => ({
        exerciseId: exercise.exercise.id,
        name: exercise.exercise.name,
        targetSets: exercise.targetSets,
        targetReps: exercise.targetReps,
        restSeconds: exercise.restSeconds,
        rpeTarget: exercise.rpeTarget ?? null,
        muscleGroup: exercise.exercise.muscleGroup ?? '—',
        equipment: exercise.exercise.equipment ?? '—'
      })),
    [workout.exercises]
  );

  const offlineMeta = useMemo(
    () => ({
      planId,
      workoutId: workout.id,
      title: workout.title,
      description: workout.description,
      scheduledAt: workout.scheduledAt ?? new Date().toISOString(),
      exercises: offlineExercises
    }),
    [offlineExercises, planId, workout.description, workout.id, workout.title, workout.scheduledAt]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(offlineMetaKey, JSON.stringify(offlineMeta));
  }, [offlineMeta, offlineMetaKey]);

  // Autosave sesión activa en Redis cada 10s
  useEffect(() => {
    const interval = setInterval(() => {
      const grouped = groupSetsByExerciseForRedis(workout, sets);
      void saveWorkoutSession(workout.id, {
        id: workout.id,
        title: workout.title,
        description: workout.description ?? undefined,
        scheduledAt: workout.scheduledAt ?? new Date().toISOString(),
        exercises: grouped
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [sets, workout]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const rawDraft = window.localStorage.getItem(offlineDraftKey);
      const rawCache = window.localStorage.getItem(offlineCacheKey);
      const parsedDraft = rawDraft ? JSON.parse(rawDraft) : null;
      const parsedCache = rawCache ? JSON.parse(rawCache) : null;

      if (parsedDraft) {
        setHasPendingOfflineSync(Boolean(parsedDraft.pending));
      }

      const sourceSets: Partial<StoredSet>[] | null = Array.isArray(parsedDraft?.sets)
        ? parsedDraft.sets
        : Array.isArray(parsedCache?.sets)
          ? parsedCache.sets
          : null;

      if (!Array.isArray(sourceSets)) return;

      setSets((prev) => {
        if (sourceSets.length !== prev.length) {
          return prev;
        }
        return prev.map((current, index) => mergeStoredSet(sourceSets[index], current));
      });
    } catch (error) {
      console.error('No se pudo restaurar el draft offline', error);
    }
  }, [offlineCacheKey, offlineDraftKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      offlineCacheKey,
      JSON.stringify({ sets: serializeSetsForStorage(sets) })
    );
  }, [offlineCacheKey, sets]);

  const autosavePayload = useMemo(
    () => ({
      planId,
      workoutId: workout.id,
      sets: sets.map((set) => ({
        exerciseId: set.exerciseId,
        weight: set.weight,
        reps: set.reps,
        rpe: set.rpe,
        rir: set.rir,
        restSeconds: set.restSeconds,
        notes: set.notes && set.notes.trim().length > 0 ? set.notes : null
      }))
    }),
    [planId, workout.id, sets]
  );

  const syncOfflineDraft = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const rawDraft = window.localStorage.getItem(offlineDraftKey);
    if (!rawDraft) return;

    try {
      const parsed = JSON.parse(rawDraft);
      if (!Array.isArray(parsed.sets)) {
        window.localStorage.removeItem(offlineDraftKey);
        setHasPendingOfflineSync(false);
        return;
      }

      await autosaveWorkoutDraft({
        planId,
        workoutId: workout.id,
        sets: parsed.sets.map((set: any) => ({
          exerciseId: set.exerciseId,
          weight: Number(set.weight) || 0,
          reps: Number(set.reps) || 0,
          rpe: typeof set.rpe === 'number' ? set.rpe : null,
          rir: typeof set.rir === 'number' ? set.rir : null,
          restSeconds: Number(set.restSeconds) || 0,
          notes: set.notes ?? null
        }))
      });

      track('log_set');
      toast({
        title: 'Progreso sincronizado',
        description: 'Actualizamos la sesión desde el guardado offline.'
      });
      window.localStorage.removeItem(offlineDraftKey);
      setHasPendingOfflineSync(false);
      offlineNoticeShownRef.current = false;
    } catch (error) {
      console.error('No se pudo sincronizar el progreso offline', error);
      setHasPendingOfflineSync(true);
    }
  }, [offlineDraftKey, planId, track, workout.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => {
      void syncOfflineDraft();
    };
    window.addEventListener('online', handleOnline);
    if (navigator.onLine) {
      void syncOfflineDraft();
    }
    return () => window.removeEventListener('online', handleOnline);
  }, [syncOfflineDraft]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timeout = window.setTimeout(() => {
      startTransition(async () => {
        const offlineSnapshot = serializeSetsForStorage(sets);
        if (!navigator.onLine) {
          window.localStorage.setItem(
            offlineDraftKey,
            JSON.stringify({ sets: offlineSnapshot, pending: true })
          );
          setHasPendingOfflineSync(true);
          if (!offlineNoticeShownRef.current) {
            toast({
              title: 'Guardado sin conexión',
              description: 'Sincronizaremos tu sesión cuando vuelvas a tener red.'
            });
            offlineNoticeShownRef.current = true;
          }
          return;
        }

        try {
          await autosaveWorkoutDraft(autosavePayload);
          track('log_set');
          toast({ title: 'Progreso guardado', description: 'Draft actualizado en la sesión' });
          window.localStorage.removeItem(offlineDraftKey);
          setHasPendingOfflineSync(false);
          offlineNoticeShownRef.current = false;
        } catch (error) {
          console.error('Error al autoguardar, guardando offline', error);
          window.localStorage.setItem(
            offlineDraftKey,
            JSON.stringify({ sets: offlineSnapshot, pending: true })
          );
          setHasPendingOfflineSync(true);
          if (!offlineNoticeShownRef.current) {
            toast({
              title: 'Guardado sin conexión',
              description: 'Sincronizaremos tu sesión cuando vuelvas a tener red.'
            });
            offlineNoticeShownRef.current = true;
          }
        }
      });
    }, 1500);

    return () => window.clearTimeout(timeout);
  }, [autosavePayload, offlineDraftKey, sets, startTransition, track]);

  const handleSetChange = (index: number, key: keyof EditableSet, value: number | string | null) => {
    setSets((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [key]: typeof value === 'string' ? value : value
      } as EditableSet;
      return next;
    });
  };

  const groupedByExercise = useMemo(() => {
    return workout.exercises.map((exercise) => {
      const exerciseSets = sets.filter((set) => set.exerciseId === exercise.exercise.id);
      return { exercise, sets: exerciseSets };
    });
  }, [sets, workout.exercises]);

  const totalSetsCount = sets.length;
  const completedSetsCount = sets.filter((s) => s.completed).length;
  const progressPct = totalSetsCount ? Math.round((completedSetsCount / totalSetsCount) * 100) : 0;

  const completeWorkout = () => {
    startSubmitTransition(async () => {
      await logWorkout({
        workoutId: workout.id,
        sets: sets.map((set) => ({
          exerciseId: set.exerciseId,
          weight: Number(set.weight),
          reps: Number(set.reps),
          rpe: set.rpe,
          rir: set.rir,
          restSeconds: set.restSeconds,
          notes: set.notes ?? null
        }))
      });
      track('commit_session');
      const totalVolume = sets.reduce((acc, s) => acc + (Number(s.weight) * Number(s.reps) || 0), 0);
      toast({ title: 'Sesión registrada', description: `Sets: ${completedSetsCount}/${totalSetsCount} · Volumen: ${totalVolume} kg` });
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(offlineDraftKey);
        window.localStorage.removeItem(offlineCacheKey);
        window.location.href = '/progress';
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold text-foreground">{workout.title}</h1>
        {workout.description ? (
          <p className="text-sm text-neutral-500">{workout.description}</p>
        ) : null}
        <div className="mt-2 h-2 w-full rounded-full bg-neutral-200">
          <div className="h-2 rounded-full bg-accent-teal" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="text-xs text-neutral-500">Progreso: {completedSetsCount}/{totalSetsCount} sets</p>
      </header>
      <div className="flex flex-col gap-4">
        {groupedByExercise.map(({ exercise, sets: exerciseSets }) => (
          <section key={exercise.exercise.id} className="rounded-3xl bg-white/80 p-6 shadow-soft">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                {exercise.exercise.videoUrl ? (
                  exercise.exercise.videoUrl.endsWith('.mp4') || exercise.exercise.videoUrl.endsWith('.gif') ? (
                    <video src={exercise.exercise.videoUrl || ''} className="h-16 w-16 rounded-xl object-cover" loop muted playsInline />
                  ) : (
                    <img src={exercise.exercise.videoUrl || ''} alt={exercise.exercise.name} className="h-16 w-16 rounded-xl object-cover" />
                  )
                ) : null}
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground">{exercise.exercise.name}</h2>
                  <p className="text-xs text-neutral-500">
                    Objetivo: {exercise.targetSets} x {exercise.targetReps} reps · RPE {exercise.rpeTarget ?? 'N/A'} · descanso {exercise.restSeconds}s
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setSubstitutions((prev) => ({
                    ...prev,
                    [exercise.exercise.id]: prev[exercise.exercise.id] ? '' : 'Alternativa sugerida'
                  }))
                }
              >
                Sustituir
              </Button>
            </div>
            {substitutions[exercise.exercise.id] ? (
              <div className="mb-4 rounded-2xl border border-dashed border-accent-teal/40 p-4">
                <label className="text-xs uppercase tracking-wide text-neutral-500">Ejercicio alterno</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm outline-none focus:border-accent-teal"
                  value={substitutions[exercise.exercise.id]}
                  onChange={(event) =>
                    setSubstitutions((prev) => ({
                      ...prev,
                      [exercise.exercise.id]: event.target.value
                    }))
                  }
                />
              </div>
            ) : null}
            <div className="grid gap-3 md:grid-cols-2">
              {exerciseSets.map((set, setIndex) => (
                <div
                  key={`${exercise.exercise.id}-${setIndex}`}
                  className="relative rounded-2xl border border-neutral-100 bg-white p-4 shadow-inner"
                >
                  <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-wide text-neutral-400">
                    <span>Set {setIndex + 1}</span>
                    <KTimer
                      workoutId={workout.id}
                      defaultSeconds={set.restSeconds}
                      onTick={(sec) =>
                        handleSetChange(
                          findSetIndex(exercise.exercise.id, setIndex, sets),
                          'restSeconds',
                          sec
                        )
                      }
                      onStop={(sec) => {
                        handleSetChange(
                          findSetIndex(exercise.exercise.id, setIndex, sets),
                          'restSeconds',
                          sec
                        );
                        if (sec === 0) {
                          toast({ title: 'Descanso terminado', description: '¡Vamos con el siguiente set!' });
                        }
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1 text-sm text-neutral-500">
                      Peso (kg)
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={set.weight}
                        onChange={(event) =>
                          handleSetChange(
                            findSetIndex(exercise.exercise.id, setIndex, sets),
                            'weight',
                            Number(event.target.value)
                          )
                        }
                        className={cn('rounded-2xl border bg-white px-3 py-2 text-sm outline-none focus:border-accent-teal',
                          Number(set.weight) < 0 ? 'border-red-300' : 'border-neutral-200')}
                        disabled={set.completed}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-neutral-500">
                      Reps
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={set.reps}
                        onChange={(event) =>
                          handleSetChange(
                            findSetIndex(exercise.exercise.id, setIndex, sets),
                            'reps',
                            Number(event.target.value)
                          )
                        }
                        className={cn('rounded-2xl border bg-white px-3 py-2 text-sm outline-none focus:border-accent-teal',
                          Number(set.reps) < 1 ? 'border-red-300' : 'border-neutral-200')}
                        disabled={set.completed}
                      />
                    </label>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1 text-sm text-neutral-500">
                      RPE
                      <input
                        type="number"
                        step={0.5}
                        min={5}
                        max={10}
                        value={set.rpe ?? 8}
                        onChange={(event) =>
                          handleSetChange(
                            findSetIndex(exercise.exercise.id, setIndex, sets),
                            'rpe',
                            Number(event.target.value)
                          )
                        }
                        className="rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent-teal"
                        disabled={set.completed}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-neutral-500">
                      RIR
                      <input
                        type="number"
                        step={0.5}
                        min={0}
                        max={5}
                        value={set.rir ?? 2}
                        onChange={(event) =>
                          handleSetChange(
                            findSetIndex(exercise.exercise.id, setIndex, sets),
                            'rir',
                            Number(event.target.value)
                          )
                        }
                        className="rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent-teal"
                        disabled={set.completed}
                      />
                    </label>
                  </div>
                  <textarea
                    placeholder="Notas"
                    value={set.notes ?? ''}
                    onChange={(event) =>
                      handleSetChange(
                        findSetIndex(exercise.exercise.id, setIndex, sets),
                        'notes',
                        event.target.value
                      )
                    }
                    className="mt-3 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent-teal"
                    disabled={set.completed}
                  />
                  <div className="mt-3 flex items-center justify-end">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        const idx = findSetIndex(exercise.exercise.id, setIndex, sets);
                        if (idx >= 0) {
                          setSets((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], completed: true };
                            return next;
                          });
                          toast({ title: 'Set completado', description: 'Buen trabajo. Ajusta carga si fue muy fácil.' });
                        }
                      }}
                      disabled={Number(set.reps) < 1 || Number(set.weight) < 0 || set.completed}
                      className="rounded-full bg-accent-teal text-white hover:opacity-90"
                    >
                      Completar set
                    </Button>
                  </div>
                  <AnimatePresence>
                    {set.completed ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center rounded-2xl bg-accent-teal/10"
                      >
                        <CheckCircle2 className="h-10 w-10 text-accent-teal" />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3">
        <span
          className={cn('text-sm text-neutral-500', {
            'text-accent-teal': isSaving,
            'text-accent-coral': !isSaving && hasPendingOfflineSync
          })}
        >
          {isSaving
            ? 'Guardando progreso...'
            : hasPendingOfflineSync
              ? 'Modo offline: sincronizaremos al reconectar'
              : 'Autoguardado habilitado'}
        </span>
        <Button size="lg" onClick={completeWorkout} disabled={isSubmitting} className="bg-accent-coral text-white hover:opacity-90">
          {isSubmitting ? 'Registrando...' : 'Finalizar entrenamiento'}
        </Button>
      </footer>
    </div>
  );
}

function findSetIndex(exerciseId: string, setPosition: number, sets: EditableSet[]) {
  let occurrence = -1;
  for (let i = 0; i < sets.length; i += 1) {
    if (sets[i].exerciseId === exerciseId) {
      occurrence += 1;
      if (occurrence === setPosition) {
        return i;
      }
    }
  }
  return -1;
}

function buildEditableSetsFromWorkout(workout: WorkoutEditorProps['workout']): EditableSet[] {
  return workout.exercises.flatMap((item) =>
    Array.from({ length: item.targetSets }).map(() => ({
      exerciseId: item.exercise.id,
      weight: 0,
      reps: item.targetReps,
      rpe: item.rpeTarget ?? null,
      rir: item.rpeTarget ? Math.max(0, 10 - item.rpeTarget) : null,
      restSeconds: item.restSeconds,
      completed: false,
      notes: ''
    }))
  );
}

type StoredSet = {
  exerciseId: string;
  weight?: number;
  reps?: number;
  rpe?: number | null;
  rir?: number | null;
  restSeconds?: number;
  notes?: string | null;
  pending?: boolean;
};

function serializeSetsForStorage(sets: EditableSet[]) {
  return sets.map((set) => ({
    exerciseId: set.exerciseId,
    weight: Number.isFinite(Number(set.weight)) ? Number(set.weight) : 0,
    reps: Number.isFinite(Number(set.reps)) ? Number(set.reps) : 0,
    rpe: typeof set.rpe === 'number' && Number.isFinite(set.rpe) ? set.rpe : null,
    rir: typeof set.rir === 'number' && Number.isFinite(set.rir) ? set.rir : null,
    restSeconds: Number.isFinite(Number(set.restSeconds)) ? Number(set.restSeconds) : 0,
    notes: set.notes ?? '',
    completed: Boolean(set.completed)
  }));
}

function mergeStoredSet(stored: Partial<StoredSet> | undefined, fallback: EditableSet): EditableSet {
  if (!stored) return fallback;
  return {
    ...fallback,
    weight: Number.isFinite(Number(stored.weight)) ? Number(stored.weight) : fallback.weight,
    reps: Number.isFinite(Number(stored.reps)) ? Number(stored.reps) : fallback.reps,
    rpe:
      typeof stored.rpe === 'number' && Number.isFinite(stored.rpe) ? stored.rpe : fallback.rpe,
    rir:
      typeof stored.rir === 'number' && Number.isFinite(stored.rir) ? stored.rir : fallback.rir,
    restSeconds: Number.isFinite(Number(stored.restSeconds))
      ? Number(stored.restSeconds)
      : fallback.restSeconds,
    notes: typeof stored.notes === 'string' ? stored.notes : fallback.notes,
    completed: 'completed' in stored ? Boolean(stored.completed) : fallback.completed
  };
}

function groupSetsByExerciseForRedis(
  workout: WorkoutEditorProps['workout'],
  sets: EditableSet[]
): {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  sets: {
    id: string;
    exerciseId: string;
    setNumber: number;
    weight: number;
    reps: number;
    rpe?: number;
    rir?: number;
    completed: boolean;
    notes?: string;
  }[];
}[] {
  const grouped: Record<string, {
    id: string;
    name: string;
    muscleGroup: string;
    equipment: string;
    sets: any[];
  }> = {};

  workout.exercises.forEach((ex) => {
    grouped[ex.exercise.id] = {
      id: ex.exercise.id,
      name: ex.exercise.name,
      muscleGroup: ex.exercise.muscleGroup ?? '—',
      equipment: ex.exercise.equipment ?? '—',
      sets: []
    };
  });

  const counters: Record<string, number> = {};
  sets.forEach((s) => {
    const key = s.exerciseId;
    counters[key] = (counters[key] ?? 0) + 1;
    const setNumber = counters[key];
    grouped[key]?.sets.push({
      id: `${key}-${setNumber}`,
      exerciseId: key,
      setNumber,
      weight: Number(s.weight) || 0,
      reps: Number(s.reps) || 0,
      rpe: typeof s.rpe === 'number' ? s.rpe : undefined,
      rir: typeof s.rir === 'number' ? s.rir : undefined,
      completed: Boolean(s.completed),
      notes: s.notes && s.notes.trim().length > 0 ? s.notes : undefined
    });
  });

  return Object.values(grouped);
}
