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