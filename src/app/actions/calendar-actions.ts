import { logger } from "@/lib/logging";

'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, parseISO, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/clients/prisma';

export interface WorkoutCardData {
  id: string;
  title: string;
  scheduledAt: Date;
  completedAt: Date | null;
  duration: number; // minutes
  muscleGroups: string[];
  exerciseCount: number;
  status: 'completed' | 'today' | 'pending' | 'overdue';
}

export interface DayData {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  workouts: WorkoutCardData[];
}

export interface WeekCalendarData {
  days: DayData[];
  weekStart: Date;
  weekEnd: Date;
}

/**
 * Get weekly calendar data with all workouts for the current week
 */
export async function getWeekCalendarData(weekOffset: number = 0): Promise<WeekCalendarData | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const userId = session.user.id;
  const today = new Date();

  // Calculate week boundaries
  const referenceDate = new Date(today);
  referenceDate.setDate(referenceDate.getDate() + (weekOffset * 7));

  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 }); // Sunday

  // Get active plan
  const activePlan = await prisma.plan.findFirst({
    where: {
      userId,
      // isActive no existe en el esquema actual
    },
    include: {
      workouts: {
        where: {
          scheduledAt: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
        include: {
          sets: {
            include: {
              exercise: true,
            },
          },
        },
        orderBy: {
          scheduledAt: 'asc',
        },
      },
    },
  });

  if (!activePlan) return null;

  // Generate days array
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const days: DayData[] = daysInWeek.map((date) => {
    const isToday = isSameDay(date, today);

    // Get workouts for this day
    const dayWorkouts = (activePlan as any).workouts.filter((workout: any) =>
      isSameDay(workout.scheduledAt, date)
    );

    // Process workout data
    const workouts: WorkoutCardData[] = dayWorkouts.map((workout: any) => {
      // Extract muscle groups from exercises
      const muscleGroups = Array.from(
        new Set(
          workout.sets
            .filter((set: any) => set.exercise?.muscleGroup)
            .map((set: any) => set.exercise!.muscleGroup)
        )
      );

      // Calculate duration (estimate: 10 mins per exercise)
      const exerciseCount = new Set(workout.sets.map((set: any) => set.exerciseId)).size;
      const duration = exerciseCount * 10;

      // Determine status
      let status: WorkoutCardData['status'];
      if (workout.completedAt) {
        status = 'completed';
      } else if (isToday) {
        status = 'today';
      } else if (date < today) {
        status = 'overdue';
      } else {
        status = 'pending';
      }

      return {
        id: workout.id,
        title: workout.title,
        scheduledAt: workout.scheduledAt,
        completedAt: workout.completedAt,
        duration,
        muscleGroups,
        exerciseCount,
        status,
      };
    });

    return {
      date,
      dayName: format(date, 'EEEE', { locale: es }),
      dayNumber: date.getDate(),
      isToday,
      workouts,
    };
  });

  return {
    days,
    weekStart,
    weekEnd,
  };
}

/**
 * Reschedule a workout to a new date
 */
export async function rescheduleWorkout(
  workoutId: string,
  newDate: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'No autorizado' };
  }

  try {
    const userId = session.user.id;
    const parsedDate = parseISO(newDate);

    // Verify workout belongs to user
    const workout = await prisma.workout.findFirst({
      where: {
        id: workoutId,
        plan: {
          userId,
        },
      },
    });

    if (!workout) {
      return { success: false, error: 'Entrenamiento no encontrado' };
    }

    // Don't allow rescheduling completed workouts
    if (workout.completedAt) {
      return { success: false, error: 'No puedes reprogramar un entrenamiento completado' };
    }

    // Update the workout
    await prisma.workout.update({
      where: {
        id: workoutId,
      },
      data: {
        scheduledAt: parsedDate,
      },
    });

    revalidatePath('/calendar');
    return { success: true };
  } catch (error) {
    logger.error('Error rescheduling workout:', error);
    return { success: false, error: 'Error al reprogramar el entrenamiento' };
  }
}

/**
 * Mark a workout as completed
 */
export async function markWorkoutComplete(
  workoutId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'No autorizado' };
  }

  try {
    const userId = session.user.id;

    // Verify workout belongs to user
    const workout = await prisma.workout.findFirst({
      where: {
        id: workoutId,
        plan: {
          userId,
        },
      },
    });

    if (!workout) {
      return { success: false, error: 'Entrenamiento no encontrado' };
    }

    // Update the workout
    await prisma.workout.update({
      where: {
        id: workoutId,
      },
      data: {
        completedAt: new Date(),
      },
    });

    revalidatePath('/calendar');
    return { success: true };
  } catch (error) {
    logger.error('Error marking workout complete:', error);
    return { success: false, error: 'Error al marcar el entrenamiento como completado' };
  }
}
