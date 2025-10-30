import type { Workout, Exercise, ProgressDataPoint, CalendarEvent } from '@/types/workout';
import { addDays, subDays } from 'date-fns';

// Ejercicios de ejemplo
export const DUMMY_EXERCISES: Exercise[] = [
  { id: '1', name: 'Back Squat', muscleGroup: 'Piernas', equipment: 'Barra' },
  { id: '2', name: 'Press Banca', muscleGroup: 'Pectoral', equipment: 'Barra' },
  { id: '3', name: 'Peso Muerto', muscleGroup: 'Espalda', equipment: 'Barra' },
  { id: '4', name: 'Press Militar', muscleGroup: 'Hombros', equipment: 'Barra' },
  { id: '5', name: 'Remo con Barra', muscleGroup: 'Espalda', equipment: 'Barra' },
  { id: '6', name: 'Dominadas', muscleGroup: 'Espalda', equipment: 'Peso corporal' },
  { id: '7', name: 'Fondos', muscleGroup: 'Tríceps', equipment: 'Peso corporal' },
  { id: '8', name: 'Curl con Barra', muscleGroup: 'Bíceps', equipment: 'Barra' }
];

// Workout actual para editar
export const DUMMY_CURRENT_WORKOUT: Workout = {
  id: 'w1',
  title: 'Empuje Superior A',
  description: 'Enfoque en pecho, hombros y tríceps',
  scheduledAt: new Date(),
  exercises: [
    {
      id: 'we1',
      exercise: DUMMY_EXERCISES[1], // Press Banca
      targetSets: 4,
      targetReps: 8,
      restSeconds: 120,
      sets: [
        { id: 's1', exerciseId: '2', setNumber: 1, weight: 80, reps: 8, rpe: 7, completed: true },
        { id: 's2', exerciseId: '2', setNumber: 2, weight: 80, reps: 8, rpe: 7.5, completed: true },
        { id: 's3', exerciseId: '2', setNumber: 3, weight: 80, reps: 7, rpe: 8, completed: true },
        { id: 's4', exerciseId: '2', setNumber: 4, weight: 80, reps: 7, rpe: 8.5, completed: false }
      ]
    },
    {
      id: 'we2',
      exercise: DUMMY_EXERCISES[3], // Press Militar
      targetSets: 3,
      targetReps: 10,
      restSeconds: 90,
      sets: [
        { id: 's5', exerciseId: '4', setNumber: 1, weight: 50, reps: 10, rpe: 7, completed: true },
        { id: 's6', exerciseId: '4', setNumber: 2, weight: 50, reps: 9, rpe: 8, completed: false },
        { id: 's7', exerciseId: '4', setNumber: 3, weight: 50, reps: 0, rpe: 0, completed: false }
      ]
    },
    {
      id: 'we3',
      exercise: DUMMY_EXERCISES[6], // Fondos
      targetSets: 3,
      targetReps: 12,
      restSeconds: 60,
      sets: [
        { id: 's8', exerciseId: '7', setNumber: 1, weight: 0, reps: 0, rpe: 0, completed: false },
        { id: 's9', exerciseId: '7', setNumber: 2, weight: 0, reps: 0, rpe: 0, completed: false },
        { id: 's10', exerciseId: '7', setNumber: 3, weight: 0, reps: 0, rpe: 0, completed: false }
      ]
    }
  ]
};

// Datos de progreso
export const DUMMY_PROGRESS_DATA: Record<string, ProgressDataPoint[]> = {
  weight: [
    { date: '1 Ene', value: 82 },
    { date: '8 Ene', value: 81.5 },
    { date: '15 Ene', value: 81.2 },
    { date: '22 Ene', value: 80.8 },
    { date: '29 Ene', value: 80.3 },
    { date: '5 Feb', value: 79.9 },
    { date: '12 Feb', value: 79.5 },
    { date: '19 Feb', value: 79.1 },
    { date: '26 Feb', value: 78.8 },
    { date: '5 Mar', value: 78.4 },
    { date: '12 Mar', value: 78.0 },
    { date: '19 Mar', value: 77.6 }
  ],
  bodyFat: [
    { date: '1 Ene', value: 18 },
    { date: '8 Ene', value: 17.8 },
    { date: '15 Ene', value: 17.5 },
    { date: '22 Ene', value: 17.2 },
    { date: '29 Ene', value: 17.0 },
    { date: '5 Feb', value: 16.7 },
    { date: '12 Feb', value: 16.5 },
    { date: '19 Feb', value: 16.2 },
    { date: '26 Feb', value: 16.0 },
    { date: '5 Mar', value: 15.7 },
    { date: '12 Mar', value: 15.5 },
    { date: '19 Mar', value: 15.2 }
  ],
  squat: [
    { date: 'Sem 1', value: 120 },
    { date: 'Sem 2', value: 122.5 },
    { date: 'Sem 3', value: 125 },
    { date: 'Sem 4', value: 127.5 },
    { date: 'Sem 5', value: 130 },
    { date: 'Sem 6', value: 132.5 },
    { date: 'Sem 7', value: 135 },
    { date: 'Sem 8', value: 137.5 }
  ],
  bench: [
    { date: 'Sem 1', value: 85 },
    { date: 'Sem 2', value: 87.5 },
    { date: 'Sem 3', value: 90 },
    { date: 'Sem 4', value: 92.5 },
    { date: 'Sem 5', value: 95 },
    { date: 'Sem 6', value: 97.5 },
    { date: 'Sem 7', value: 100 },
    { date: 'Sem 8', value: 102.5 }
  ],
  volume: [
    { date: 'Sem 1', value: 8500 },
    { date: 'Sem 2', value: 9200 },
    { date: 'Sem 3', value: 9800 },
    { date: 'Sem 4', value: 7500 }, // Deload
    { date: 'Sem 5', value: 10500 },
    { date: 'Sem 6', value: 11200 },
    { date: 'Sem 7', value: 11800 },
    { date: 'Sem 8', value: 12450 }
  ]
};

// Eventos del calendario
export const DUMMY_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'e1',
    title: 'Piernas A',
    date: subDays(new Date(), 3),
    completed: true,
    workoutId: 'w1'
  },
  {
    id: 'e2',
    title: 'Empuje Superior',
    date: subDays(new Date(), 1),
    completed: true,
    workoutId: 'w2'
  },
  {
    id: 'e3',
    title: 'Tracción Superior',
    date: new Date(),
    completed: false,
    workoutId: 'w3'
  },
  {
    id: 'e4',
    title: 'Piernas B',
    date: addDays(new Date(), 2),
    completed: false,
    workoutId: 'w4'
  },
  {
    id: 'e5',
    title: 'Empuje + Acondicionamiento',
    date: addDays(new Date(), 4),
    completed: false,
    workoutId: 'w5'
  },
  {
    id: 'e6',
    title: 'Tracción + Core',
    date: addDays(new Date(), 6),
    completed: false,
    workoutId: 'w6'
  }
];
