import { z } from 'zod'

// Minimal, API-focused schemas aligned to current DB fields

export const exerciseCreateSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(2000).optional().default(''),
  instructions: z.string().max(1000).optional(),
  tips: z.string().max(500).optional(),
  category: z.string().min(1),
  difficulty: z.string().min(1),
  muscleGroups: z.array(z.string()).min(1),
  equipments: z.array(z.string()).optional().default([]),
  imageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  gifUrl: z.string().url().optional(),
  isPublic: z.boolean().optional().default(true)
})

export type ExerciseCreateInput = z.infer<typeof exerciseCreateSchema>

export const workoutExerciseItemSchema = z.object({
  exerciseId: z.string().min(1),
  sets: z.number().int().min(1).max(10).optional(),
  reps: z.number().int().min(1).max(100).optional(),
  weight: z.number().min(0).max(1000).optional(),
  duration: z.number().int().min(1).max(7200).optional(),
  distance: z.number().min(0).max(1000).optional(),
  restTime: z.number().int().min(0).max(600).optional(),
  notes: z.string().max(500).optional()
})

export const workoutCreateSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(2000).optional().default(''),
  category: z.string().min(1),
  isTemplate: z.boolean().optional().default(false),
  isPublic: z.boolean().optional().default(false),
  assignedToId: z.string().optional(),
  exercises: z.array(workoutExerciseItemSchema).min(1, 'Debe haber al menos un ejercicio')
    .optional()
})

export type WorkoutCreateInput = z.infer<typeof workoutCreateSchema>
export const workoutPatchSchema = workoutCreateSchema.partial()
export type WorkoutPatchInput = z.infer<typeof workoutPatchSchema>

