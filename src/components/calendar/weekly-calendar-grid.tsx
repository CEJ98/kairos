'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayData, WorkoutCardData, rescheduleWorkout, markWorkoutComplete } from '@/app/actions/calendar-actions';
import { WorkoutCard } from './workout-card';
import { RescheduleModal } from './reschedule-modal';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface WeeklyCalendarGridProps {
  days: DayData[];
  weekStart: Date;
  weekEnd: Date;
  onWeekChange: (offset: number) => void;
  currentWeekOffset: number;
}

interface PendingReschedule {
  workoutId: string;
  workoutTitle: string;
  fromDate: Date;
  toDate: Date;
}

export function WeeklyCalendarGrid({
  days,
  weekStart,
  weekEnd,
  onWeekChange,
  currentWeekOffset,
}: WeeklyCalendarGridProps) {
  const router = useRouter();
  const [activeWorkout, setActiveWorkout] = useState<WorkoutCardData | null>(null);
  const [pendingReschedule, setPendingReschedule] = useState<PendingReschedule | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    // Find the workout being dragged
    for (const day of days) {
      const workout = day.workouts.find((w) => w.id === active.id);
      if (workout) {
        setActiveWorkout(workout);
        break;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveWorkout(null);

    if (!over || active.id === over.id) return;

    // Find source workout and target day
    let sourceWorkout: WorkoutCardData | null = null;
    let sourceDayDate: Date | null = null;

    for (const day of days) {
      const workout = day.workouts.find((w) => w.id === active.id);
      if (workout) {
        sourceWorkout = workout;
        sourceDayDate = day.date;
        break;
      }
    }

    if (!sourceWorkout || !sourceDayDate) return;

    // Find target day
    const targetDay = days.find((day) => `day-${format(day.date, 'yyyy-MM-dd')}` === over.id);

    if (!targetDay) return;

    // Don't allow rescheduling to the same day
    if (format(sourceDayDate, 'yyyy-MM-dd') === format(targetDay.date, 'yyyy-MM-dd')) {
      return;
    }

    // Show confirmation modal
    setPendingReschedule({
      workoutId: sourceWorkout.id,
      workoutTitle: sourceWorkout.title,
      fromDate: sourceDayDate,
      toDate: targetDay.date,
    });
  };

  const handleConfirmReschedule = async () => {
    if (!pendingReschedule) return;

    const result = await rescheduleWorkout(
      pendingReschedule.workoutId,
      format(pendingReschedule.toDate, 'yyyy-MM-dd')
    );

    if (result.success) {
      toast.success('Entrenamiento reprogramado exitosamente');
      router.refresh();
    } else {
      toast.error(result.error || 'Error al reprogramar el entrenamiento');
    }

    setPendingReschedule(null);
  };

  const handleCompleteWorkout = async (workoutId: string) => {
    const result = await markWorkoutComplete(workoutId);

    if (result.success) {
      toast.success('¡Entrenamiento completado!');
      router.refresh();
    } else {
      toast.error(result.error || 'Error al marcar como completado');
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4">
          {/* Week Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => onWeekChange(currentWeekOffset - 1)}
              className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50 transition-colors"
              aria-label="Semana anterior"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>

            <div className="text-center">
              <h2 className="text-2xl font-bold font-poppins text-gray-900">
                {format(weekStart, "d 'de' MMMM", { locale: es })} -{' '}
                {format(weekEnd, "d 'de' MMMM yyyy", { locale: es })}
              </h2>
              {currentWeekOffset === 0 && (
                <p className="text-sm text-gray-600 mt-1">Semana actual</p>
              )}
            </div>

            <button
              onClick={() => onWeekChange(currentWeekOffset + 1)}
              className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50 transition-colors"
              aria-label="Semana siguiente"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {days.map((day) => {
              const dayId = `day-${format(day.date, 'yyyy-MM-dd')}`;

              return (
                <SortableContext
                  key={dayId}
                  id={dayId}
                  items={day.workouts.map((w) => w.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      'min-h-[200px] rounded-xl p-4 border-2 transition-all',
                      day.isToday
                        ? 'border-cyan-400 bg-gradient-to-br from-cyan-50 to-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    )}
                    id={dayId}
                  >
                    {/* Day Header */}
                    <div className="mb-3">
                      <p
                        className={cn(
                          'text-xs font-semibold uppercase tracking-wide',
                          day.isToday ? 'text-cyan-600' : 'text-gray-500'
                        )}
                      >
                        {day.dayName}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <p
                          className={cn(
                            'text-2xl font-bold',
                            day.isToday ? 'text-cyan-700' : 'text-gray-900'
                          )}
                        >
                          {day.dayNumber}
                        </p>
                        {day.isToday && (
                          <span className="inline-flex items-center rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-medium text-cyan-700">
                            Hoy
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Workouts */}
                    <div className="space-y-2">
                      <AnimatePresence>
                        {day.workouts.length === 0 ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-center h-24 text-sm text-gray-400"
                          >
                            Sin entrenamientos
                          </motion.div>
                        ) : (
                          day.workouts.map((workout) => (
                            <WorkoutCard
                              key={workout.id}
                              workout={workout}
                              onComplete={handleCompleteWorkout}
                            />
                          ))
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </SortableContext>
              );
            })}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeWorkout ? (
            <div className="rotate-3 scale-105">
              <WorkoutCard workout={activeWorkout} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Reschedule Confirmation Modal */}
      {pendingReschedule && (
        <RescheduleModal
          isOpen={!!pendingReschedule}
          onClose={() => setPendingReschedule(null)}
          onConfirm={handleConfirmReschedule}
          workoutTitle={pendingReschedule.workoutTitle}
          fromDate={pendingReschedule.fromDate}
          toDate={pendingReschedule.toDate}
        />
      )}
    </>
  );
}
