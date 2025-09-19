import { z } from 'zod'
import {
	createSecureStringSchema,
	createSecureTextareaSchema,
	createSecureUrlSchema
} from '../form-validation'

// Enums mejorados para categorías y dificultades
export const exerciseCategoryEnum = z.enum([
	'STRENGTH',
	'CARDIO',
	'FLEXIBILITY',
	'HIIT',
	'FUNCTIONAL',
	'REHABILITATION'
], {
	errorMap: () => ({ message: 'Selecciona una categoría válida' })
})

export const exerciseDifficultyEnum = z.enum([
	'BEGINNER',
	'INTERMEDIATE',
	'ADVANCED',
	'EXPERT'
], {
	errorMap: () => ({ message: 'Selecciona una dificultad válida' })
})

// Grupos musculares válidos
export const muscleGroupEnum = z.enum([
	'CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'FOREARMS',
	'ABS', 'OBLIQUES', 'LOWER_BACK', 'QUADRICEPS', 'HAMSTRINGS',
	'GLUTES', 'CALVES', 'FULL_BODY', 'CORE'
], {
	errorMap: () => ({ message: 'Grupo muscular no válido' })
})

// Equipamiento válido
export const equipmentEnum = z.enum([
	'BODYWEIGHT', 'DUMBBELLS', 'BARBELL', 'KETTLEBELL', 'RESISTANCE_BANDS',
	'PULL_UP_BAR', 'BENCH', 'CABLE_MACHINE', 'SMITH_MACHINE', 'TREADMILL',
	'STATIONARY_BIKE', 'ROWING_MACHINE', 'MEDICINE_BALL', 'FOAM_ROLLER'
], {
	errorMap: () => ({ message: 'Equipamiento no válido' })
})

// Validación mejorada para ejercicios con seguridad
export const exerciseSchema = z.object({
  name: createSecureStringSchema({
		fieldName: 'El nombre del ejercicio',
		minLength: 2,
		maxLength: 100,
		pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-\.\(\)]+$/,
		patternError: 'El nombre solo puede contener letras, números, espacios y algunos símbolos básicos'
	}),
  description: createSecureTextareaSchema({
		fieldName: 'La descripción',
		required: false,
		maxLength: 2000,
		allowHtml: false
	}),
  category: exerciseCategoryEnum,
  difficulty: exerciseDifficultyEnum,
  duration: z
    .number()
    .min(1, 'La duración debe ser mayor a 0 minutos')
    .max(300, 'La duración no puede ser mayor a 300 minutos')
    .optional(),
  calories: z
    .number()
    .min(1, 'Las calorías deben ser mayor a 0')
    .max(2000, 'Las calorías no pueden ser mayor a 2000')
    .optional(),
  equipment: z
    .string()
    .max(500, 'El equipo necesario es demasiado largo')
    .optional(),
  instructions: createSecureTextareaSchema({
		fieldName: 'Las instrucciones',
		required: false,
		maxLength: 1000,
		allowHtml: false
	}),
  tips: createSecureTextareaSchema({
		fieldName: 'Los consejos',
		required: false,
		maxLength: 500,
		allowHtml: false
	}),
  videoUrl: createSecureUrlSchema({
		required: false
	}),
  imageUrl: createSecureUrlSchema({
		required: false
	}),
  gifUrl: createSecureUrlSchema({
		required: false
	}),
  muscleGroups: z.array(muscleGroupEnum)
		.min(1, 'Selecciona al menos un grupo muscular')
		.max(8, 'Máximo 8 grupos musculares'),
  equipments: z.array(equipmentEnum)
		.min(1, 'Selecciona al menos un tipo de equipamiento')
		.max(5, 'Máximo 5 tipos de equipamiento'),
  tags: z
    .array(z.string())
    .max(10, 'No puede haber más de 10 etiquetas')
    .optional(),
  isPublic: z.boolean().default(true),
  repsRange: z
    .object({
      min: z.number().min(1).max(100),
      max: z.number().min(1).max(100)
    })
    .optional()
    .refine((data) => {
      if (!data) return true
      return data.min <= data.max
    }, 'El mínimo no puede ser mayor al máximo'),
  setsRange: z
    .object({
      min: z.number().min(1).max(10),
      max: z.number().min(1).max(10)
    })
    .optional()
    .refine((data) => {
      if (!data) return true
      return data.min <= data.max
    }, 'El mínimo no puede ser mayor al máximo'),
  restTime: z
    .number()
    .min(15, 'El descanso debe ser al menos 15 segundos')
    .max(600, 'El descanso no puede ser mayor a 10 minutos')
    .optional()
})

// Validación para rutina de ejercicios
export const workoutSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre de la rutina es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre es demasiado largo'),
  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(2000, 'La descripción es demasiado larga'),
  category: z.enum(['strength', 'cardio', 'flexibility', 'fullbody', 'custom'], {
    required_error: 'Selecciona una categoría'
  }),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced'], {
    required_error: 'Selecciona un nivel de dificultad'
  }),
  estimatedDuration: z
    .number()
    .min(5, 'La duración estimada debe ser al menos 5 minutos')
    .max(300, 'La duración estimada no puede ser mayor a 300 minutos'),
  exercises: z
    .array(z.object({
      exerciseId: z.string().min(1, 'ID del ejercicio requerido'),
      sets: z.number().min(1).max(10),
      reps: z.number().min(1).max(100).optional(),
      duration: z.number().min(1).max(3600).optional(), // en segundos
      restTime: z.number().min(0).max(600).optional(),
      weight: z.number().min(0).max(1000).optional(),
      notes: z.string().max(500).optional()
    }))
    .min(1, 'Debe haber al menos un ejercicio')
    .max(50, 'No puede haber más de 50 ejercicios'),
  targetCalories: z
    .number()
    .min(1, 'Las calorías objetivo deben ser mayor a 0')
    .max(2000, 'Las calorías objetivo no pueden ser mayor a 2000')
    .optional(),
  tags: z
    .array(z.string())
    .max(10, 'No puede haber más de 10 etiquetas')
    .optional(),
  isPublic: z.boolean().default(false),
  isTemplate: z.boolean().default(false)
})

// Validación para progreso de ejercicio
export const exerciseProgressSchema = z.object({
  exerciseId: z.string().min(1, 'ID del ejercicio requerido'),
  sets: z
    .array(z.object({
      reps: z.number().min(0).max(1000),
      weight: z.number().min(0).max(1000).optional(),
      duration: z.number().min(0).max(7200).optional(), // en segundos
      distance: z.number().min(0).max(1000).optional(), // en km
      notes: z.string().max(200).optional()
    }))
    .min(1, 'Debe haber al menos un set'),
  duration: z
    .number()
    .min(0, 'La duración no puede ser negativa')
    .max(7200, 'La duración no puede ser mayor a 2 horas')
    .optional(),
  calories: z
    .number()
    .min(0, 'Las calorías no pueden ser negativas')
    .max(5000, 'Las calorías no pueden ser mayor a 5000')
    .optional(),
  notes: z
    .string()
    .max(1000, 'Las notas son demasiado largas')
    .optional(),
  rating: z
    .number()
    .min(1, 'La calificación debe ser entre 1 y 5')
    .max(5, 'La calificación debe ser entre 1 y 5')
    .optional()
})

// Tipos TypeScript mejorados
export type ExerciseFormData = z.infer<typeof exerciseSchema>
export type WorkoutFormData = z.infer<typeof workoutSchema>
export type ExerciseProgressFormData = z.infer<typeof exerciseProgressSchema>
export type ExerciseCategory = z.infer<typeof exerciseCategoryEnum>
export type ExerciseDifficulty = z.infer<typeof exerciseDifficultyEnum>
export type MuscleGroup = z.infer<typeof muscleGroupEnum>
export type Equipment = z.infer<typeof equipmentEnum>

// Utilidades de validación
export const exerciseValidationUtils = {
	// Sanitizar datos del formulario
	sanitizeFormData: (data: ExerciseFormData): ExerciseFormData => {
		return {
			...data,
			name: data.name?.trim() || '',
			description: data.description?.trim() || '',
			instructions: data.instructions?.trim() || '',
			tips: data.tips?.trim() || '',
			imageUrl: data.imageUrl?.trim() || '',
			videoUrl: data.videoUrl?.trim() || '',
			gifUrl: data.gifUrl?.trim() || ''
		}
	},
	
	// Validar combinación de grupos musculares y equipamiento
	validateMuscleEquipmentCombination: (muscleGroups: MuscleGroup[], equipments: Equipment[]): boolean => {
		// Validaciones específicas de combinaciones lógicas
		if (muscleGroups.includes('FULL_BODY') && muscleGroups.length > 1) {
			return false // FULL_BODY no debería combinarse con otros grupos
		}
		
		return true
	}
}