'use server';

import { z } from 'zod';
import { createPlan as _createPlan, nextWorkout as _nextWorkout } from '@/server/actions/plan';

// Tipos de entrada alineados con validación existente
export type UserPrefs = {
  userId: string;
  goal: 'fuerza' | 'hipertrofia' | 'resistencia';
  frequency: number;
  experience: 'novato' | 'intermedio' | 'avanzado';
  availableEquipment: string[];
  restrictions: string[];
};

const userPrefsSchema = z.object({
  userId: z.string(),
  goal: z.enum(['fuerza', 'hipertrofia', 'resistencia']),
  frequency: z.number().int().min(1).max(7),
  experience: z.enum(['novato', 'intermedio', 'avanzado']),
  availableEquipment: z.array(z.string()),
  restrictions: z.array(z.string())
});

export async function createPlan(prefs?: UserPrefs): Promise<{ planId: string }> {
  const input = prefs ? userPrefsSchema.parse(prefs) : null;
  const plan = await _createPlan(
    input ?? {
      userId: '',
      goal: 'hipertrofia',
      frequency: 4,
      experience: 'intermedio',
      availableEquipment: [],
      restrictions: []
    }
  );
  return { planId: plan.id };
}

export async function nextWorkout(userId: string): Promise<{ workoutId: string }> {
  const next = await _nextWorkout(userId);
  if (!next) {
    throw new Error('No hay próxima sesión programada');
  }
  return { workoutId: next.workoutId };
}