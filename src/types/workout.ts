// Tipos para los componentes de workout
export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
}

export interface WorkoutSet {
  id: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  rir?: number;
  completed: boolean;
  notes?: string;
}

export interface WorkoutExercise {
  id: string;
  exercise: Exercise;
  targetSets: number;
  targetReps: number;
  restSeconds: number;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  completedAt?: Date;
  exercises: WorkoutExercise[];
}

export interface ProgressDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  completed: boolean;
  workoutId: string;
}
