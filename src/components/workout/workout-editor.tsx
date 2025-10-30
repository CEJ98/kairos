'use client';

import React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Circle,
  Plus,
  Minus,
  Clock,
  Weight,
  RotateCcw,
  Save,
  CloudOff,
  Cloud,
  Loader2
} from 'lucide-react';
import type { Workout, WorkoutSet, Exercise } from '@/types/workout';
import { DUMMY_CURRENT_WORKOUT } from '@/lib/dummy-data';
import { saveWorkoutToRedis, loadWorkoutFromRedis } from '@/app/actions/workout-actions';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

type SaveStatus = 'saved' | 'saving' | 'error' | 'offline';

export function WorkoutEditor() {
  const { data: session, status: sessionStatus } = useSession();
  const [workout, setWorkout] = useState<Workout>(DUMMY_CURRENT_WORKOUT);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);

  // Load workout from Redis on mount
  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user?.id) {
      loadWorkoutFromRedis(workout.id).then(result => {
        if (result.success && result.data) {
          // Convert date strings back to Date objects
          const loadedWorkout: Workout = {
            ...result.data,
            scheduledAt: new Date(result.data.scheduledAt),
            exercises: result.data.exercises.map((ex: { id: string; name: string; muscleGroup: string; equipment: string; sets: WorkoutSet[] }) => ({
              ...ex,
              exercise: {
                id: ex.id,
                name: ex.name,
                muscleGroup: ex.muscleGroup,
                equipment: ex.equipment,
              } as Exercise,
              targetSets: ex.sets.length,
              targetReps: ex.sets[0]?.reps || 10,
              restSeconds: 90,
            }))
          };
          setWorkout(loadedWorkout);
          setLastSaved(new Date(result.data.lastModified));
          toast.success('Entrenamiento cargado desde la nube');
        }
      });
    }
  }, [sessionStatus, session?.user?.id, workout.id]);

  // Auto-save workout to Redis with debouncing
  const saveWorkout = useCallback(async (workoutToSave: Workout) => {
    if (sessionStatus !== 'authenticated') {
      setSaveStatus('offline');
      return;
    }

    try {
      setSaveStatus('saving');

      // Transform workout to Redis format
      const workoutData = {
        id: workoutToSave.id,
        title: workoutToSave.title,
        description: workoutToSave.description,
        scheduledAt: workoutToSave.scheduledAt.toISOString(),
        exercises: workoutToSave.exercises.map(ex => ({
          id: ex.id,
          name: ex.exercise.name,
          muscleGroup: ex.exercise.muscleGroup,
          equipment: ex.exercise.equipment,
          sets: ex.sets
        }))
      };

      const result = await saveWorkoutToRedis(workoutData);

      if (result.success) {
        setSaveStatus('saved');
        setLastSaved(new Date(result.lastModified!));
      } else {
        setSaveStatus('error');
        toast.error(result.error || 'Error al guardar');
      }
    } catch (error) {
      setSaveStatus('error');
      toast.error('Error de conexión al guardar');
    }
  }, [sessionStatus]);

  // Debounced auto-save effect
  useEffect(() => {
    // Skip auto-save on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (2 seconds after last change)
    saveTimeoutRef.current = setTimeout(() => {
      saveWorkout(workout);
    }, 2000);

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [workout, saveWorkout]);

  // Manual save function
  const handleManualSave = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await saveWorkout(workout);
    toast.success('Entrenamiento guardado');
  };

  const updateSet = (exerciseIndex: number, setId: string, updates: Partial<WorkoutSet>) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, idx) =>
        idx === exerciseIndex
          ? {
              ...ex,
              sets: ex.sets.map(set =>
                set.id === setId ? { ...set, ...updates } : set
              )
            }
          : ex
      )
    }));
  };

  const toggleSetComplete = (exerciseIndex: number, setId: string) => {
    const currentSet = workout.exercises[exerciseIndex].sets.find(s => s.id === setId);
    updateSet(exerciseIndex, setId, { completed: !currentSet?.completed });
  };

  const adjustWeight = (exerciseIndex: number, setId: string, delta: number) => {
    const currentSet = workout.exercises[exerciseIndex].sets.find(s => s.id === setId);
    if (currentSet) {
      updateSet(exerciseIndex, setId, {
        weight: Math.max(0, currentSet.weight + delta)
      });
    }
  };

  const adjustReps = (exerciseIndex: number, setId: string, delta: number) => {
    const currentSet = workout.exercises[exerciseIndex].sets.find(s => s.id === setId);
    if (currentSet) {
      updateSet(exerciseIndex, setId, {
        reps: Math.max(0, currentSet.reps + delta)
      });
    }
  };

  const adjustRPE = (exerciseIndex: number, setId: string, delta: number) => {
    const currentSet = workout.exercises[exerciseIndex].sets.find(s => s.id === setId);
    if (currentSet) {
      const newRPE = Math.max(0, Math.min(10, (currentSet.rpe || 0) + delta));
      updateSet(exerciseIndex, setId, { rpe: newRPE });
    }
  };

  const startRestTimer = (seconds: number) => {
    setRestTimer(seconds);
    const interval = setInterval(() => {
      setRestTimer(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const activeExercise = workout.exercises[activeExerciseIndex];
  const completedSets = activeExercise.sets.filter(s => s.completed).length;
  const totalSets = activeExercise.sets.length;

  return (
    <div className="space-y-6">
      {/* Workout Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{workout.title}</CardTitle>
              <CardDescription>{workout.description}</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {/* Save Status Indicator */}
              <div className="flex items-center gap-2 text-sm">
                {saveStatus === 'saving' && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-muted-foreground">Guardando...</span>
                  </>
                )}
                {saveStatus === 'saved' && lastSaved && (
                  <>
                    <Cloud className="h-4 w-4 text-green-500" />
                    <span className="text-muted-foreground">
                      Guardado {formatTimeSince(lastSaved)}
                    </span>
                  </>
                )}
                {saveStatus === 'error' && (
                  <>
                    <CloudOff className="h-4 w-4 text-red-500" />
                    <span className="text-red-500">Error al guardar</span>
                  </>
                )}
                {saveStatus === 'offline' && (
                  <>
                    <CloudOff className="h-4 w-4 text-yellow-500" />
                    <span className="text-muted-foreground">Offline</span>
                  </>
                )}
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {completedSets}/{totalSets} series
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Exercise Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {workout.exercises.map((ex, idx) => {
          const completed = ex.sets.filter(s => s.completed).length;
          const total = ex.sets.length;
          const isActive = idx === activeExerciseIndex;

          return (
            <Button
              key={ex.id}
              variant={isActive ? 'default' : 'outline'}
              onClick={() => setActiveExerciseIndex(idx)}
              className="flex-shrink-0"
            >
              <div className="text-left">
                <div className="font-semibold">{ex.exercise.name}</div>
                <div className="text-xs opacity-80">{completed}/{total}</div>
              </div>
            </Button>
          );
        })}
      </div>

      {/* Active Exercise */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{activeExercise.exercise.name}</CardTitle>
              <CardDescription>
                {activeExercise.exercise.muscleGroup} • {activeExercise.exercise.equipment}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Meta</div>
              <div className="font-semibold">
                {activeExercise.targetSets} x {activeExercise.targetReps} reps
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeExercise.sets.map((set, setIdx) => (
            <Card
              key={set.id}
              className={`${set.completed ? 'bg-primary/5 border-primary/20' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Set Number */}
                  <button
                    onClick={() => toggleSetComplete(activeExerciseIndex, set.id)}
                    className="flex-shrink-0"
                  >
                    {set.completed ? (
                      <CheckCircle2 className="h-8 w-8 text-primary" />
                    ) : (
                      <Circle className="h-8 w-8 text-muted-foreground" />
                    )}
                  </button>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Weight Control */}
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Weight className="h-3 w-3" />
                        Peso
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => adjustWeight(activeExerciseIndex, set.id, -2.5)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <div className="flex-1 text-center font-semibold">
                          {set.weight} kg
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => adjustWeight(activeExerciseIndex, set.id, 2.5)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Reps Control */}
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Repeticiones</div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => adjustReps(activeExerciseIndex, set.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <div className="flex-1 text-center font-semibold">
                          {set.reps} reps
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => adjustReps(activeExerciseIndex, set.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* RPE Control */}
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">RPE</div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => adjustRPE(activeExerciseIndex, set.id, -0.5)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <div className="flex-1 text-center font-semibold">
                          {set.rpe?.toFixed(1) || '0.0'}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => adjustRPE(activeExerciseIndex, set.id, 0.5)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rest Timer */}
                {set.completed && setIdx < activeExercise.sets.length - 1 && (
                  <div className="mt-3 pt-3 border-t">
                    {restTimer !== null ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary animate-pulse" />
                          <span className="text-sm font-medium">Descansando...</span>
                        </div>
                        <div className="text-2xl font-bold text-primary">
                          {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRestTimer(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => startRestTimer(activeExercise.restSeconds)}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Iniciar descanso ({activeExercise.restSeconds}s)
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reiniciar
        </Button>
        <Button
          className="flex-1"
          onClick={handleManualSave}
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Entrenamiento
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Helper function to format time since last save
function formatTimeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 10) return 'justo ahora';
  if (seconds < 60) return `hace ${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;

  return `hace ${Math.floor(hours / 24)}d`;
}
