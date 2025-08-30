/**
 * Comprehensive Validation Schemas for Kairos Fitness
 * Uses Zod for type-safe validation across the application
 */

import { z } from 'zod'

// =================== BASE VALIDATIONS ===================

export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(1, 'Email is required')
  .max(255, 'Email is too long')
  .toLowerCase()
  .trim()

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  )

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name is too long')
  .trim()
  .regex(/^[a-zA-Z\s\u00C0-\u017F]+$/, 'Name can only contain letters and spaces')

export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-\(\)]{10,20}$/, 'Invalid phone number format')
  .optional()

// =================== USER VALIDATIONS ===================

export const userRoleSchema = z.enum(['CLIENT', 'TRAINER', 'ADMIN'])

export const createUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: userRoleSchema.default('CLIENT'),
})

export const updateUserProfileSchema = z.object({
  name: nameSchema.optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
  phone: phoneSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// =================== CLIENT PROFILE VALIDATIONS ===================

export const genderSchema = z.enum(['MALE', 'FEMALE', 'OTHER'])

export const fitnessGoalSchema = z.enum([
  'WEIGHT_LOSS',
  'MUSCLE_GAIN',
  'STRENGTH',
  'ENDURANCE',
  'FLEXIBILITY',
  'GENERAL_FITNESS'
])

export const activityLevelSchema = z.enum([
  'SEDENTARY',
  'LIGHT',
  'MODERATE',
  'ACTIVE',
  'VERY_ACTIVE'
])

export const clientProfileSchema = z.object({
  age: z.number().int().min(13, 'Must be at least 13 years old').max(120, 'Invalid age').optional(),
  weight: z.number().min(20, 'Weight must be at least 20kg').max(500, 'Invalid weight').optional(),
  height: z.number().min(100, 'Height must be at least 100cm').max(250, 'Invalid height').optional(),
  gender: genderSchema.optional(),
  fitnessGoal: fitnessGoalSchema.optional(),
  activityLevel: activityLevelSchema.optional(),
})

// =================== TRAINER PROFILE VALIDATIONS ===================

export const trainerProfileSchema = z.object({
  bio: z.string().max(1000, 'Bio is too long').optional(),
  experience: z.number().int().min(0, 'Experience cannot be negative').max(50, 'Invalid experience').optional(),
  specialties: z.array(z.string().min(1).max(50)).max(10, 'Too many specialties').optional(),
  hourlyRate: z.number().min(0, 'Rate cannot be negative').max(1000, 'Rate is too high').optional(),
  maxClients: z.number().int().min(1, 'Must allow at least 1 client').max(1000, 'Too many clients').default(50),
})

// =================== EXERCISE VALIDATIONS ===================

export const exerciseCategorySchema = z.enum([
  'STRENGTH',
  'CARDIO',
  'FLEXIBILITY',
  'BALANCE',
  'PLYOMETRIC',
  'FUNCTIONAL'
])

export const difficultySchema = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])

export const createExerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required').max(100, 'Name is too long').trim(),
  description: z.string().max(500, 'Description is too long').optional(),
  category: exerciseCategorySchema,
  muscleGroups: z.array(z.string().min(1).max(30)).min(1, 'At least one muscle group is required').max(10),
  equipments: z.array(z.string().min(1).max(30)).max(10).default([]),
  difficulty: difficultySchema,
  instructions: z.string().max(2000, 'Instructions are too long').optional(),
  tips: z.string().max(1000, 'Tips are too long').optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  videoUrl: z.string().url('Invalid video URL').optional(),
  gifUrl: z.string().url('Invalid GIF URL').optional(),
})

export const updateExerciseSchema = createExerciseSchema.partial()

// =================== WORKOUT VALIDATIONS ===================

export const workoutCategorySchema = z.enum([
  'STRENGTH',
  'CARDIO',
  'HIIT',
  'YOGA',
  'PILATES',
  'FUNCTIONAL',
  'STRETCHING'
])

export const workoutExerciseSchema = z.object({
  exerciseId: z.string().cuid('Invalid exercise ID'),
  order: z.number().int().min(1, 'Order must be at least 1'),
  sets: z.number().int().min(1, 'Must have at least 1 set').max(20, 'Too many sets').optional(),
  reps: z.number().int().min(1, 'Must have at least 1 rep').max(1000, 'Too many reps').optional(),
  weight: z.number().min(0, 'Weight cannot be negative').max(1000, 'Weight is too high').optional(),
  duration: z.number().int().min(1, 'Duration must be at least 1 second').max(3600, 'Duration too long').optional(),
  distance: z.number().min(0, 'Distance cannot be negative').max(1000, 'Distance too far').optional(),
  restTime: z.number().int().min(0, 'Rest time cannot be negative').max(600, 'Rest time too long').optional(),
  notes: z.string().max(500, 'Notes are too long').optional(),
})

export const createWorkoutSchema = z.object({
  name: z.string().min(1, 'Workout name is required').max(100, 'Name is too long').trim(),
  description: z.string().max(500, 'Description is too long').optional(),
  category: workoutCategorySchema.optional(),
  duration: z.number().int().min(1, 'Duration must be at least 1 minute').max(480, 'Duration too long').optional(),
  isTemplate: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  exercises: z.array(workoutExerciseSchema).min(1, 'Workout must have at least one exercise').max(50, 'Too many exercises'),
})

export const updateWorkoutSchema = createWorkoutSchema.partial().extend({
  exercises: z.array(workoutExerciseSchema).max(50, 'Too many exercises').optional(),
})

// =================== WORKOUT SESSION VALIDATIONS ===================

export const sessionStatusSchema = z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])

export const exerciseLogSchema = z.object({
  exerciseId: z.string().cuid('Invalid exercise ID'),
  order: z.number().int().min(1, 'Order must be at least 1'),
  setsCompleted: z.number().int().min(0, 'Sets completed cannot be negative').max(20, 'Too many sets completed').optional(),
  repsCompleted: z.array(z.number().int().min(0).max(1000)).max(20, 'Too many rep entries').optional(),
  weightUsed: z.array(z.number().min(0).max(1000)).max(20, 'Too many weight entries').optional(),
  durationActual: z.number().int().min(0, 'Duration cannot be negative').max(3600, 'Duration too long').optional(),
  distanceActual: z.number().min(0, 'Distance cannot be negative').max(1000, 'Distance too far').optional(),
  restTimeActual: z.number().int().min(0, 'Rest time cannot be negative').max(600, 'Rest time too long').optional(),
  difficulty: z.number().int().min(1, 'Difficulty must be at least 1').max(10, 'Difficulty cannot exceed 10').optional(),
  notes: z.string().max(500, 'Notes are too long').optional(),
})

export const createWorkoutSessionSchema = z.object({
  workoutId: z.string().cuid('Invalid workout ID'),
  startTime: z.date(),
  endTime: z.date().optional(),
  status: sessionStatusSchema.default('PLANNED'),
  notes: z.string().max(1000, 'Notes are too long').optional(),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5').optional(),
  caloriesBurned: z.number().int().min(0, 'Calories burned cannot be negative').max(5000, 'Calories burned too high').optional(),
})

export const updateWorkoutSessionSchema = createWorkoutSessionSchema.partial().extend({
  exercises: z.array(exerciseLogSchema).max(50, 'Too many exercise logs').optional(),
})

// =================== BODY MEASUREMENTS VALIDATIONS ===================

export const bodyMeasurementSchema = z.object({
  weight: z.number().min(20, 'Weight must be at least 20kg').max(500, 'Invalid weight').optional(),
  bodyFat: z.number().min(0, 'Body fat cannot be negative').max(100, 'Body fat cannot exceed 100%').optional(),
  muscle: z.number().min(0, 'Muscle mass cannot be negative').max(200, 'Invalid muscle mass').optional(),
  chest: z.number().min(50, 'Invalid chest measurement').max(200, 'Invalid chest measurement').optional(),
  waist: z.number().min(40, 'Invalid waist measurement').max(200, 'Invalid waist measurement').optional(),
  hips: z.number().min(50, 'Invalid hip measurement').max(200, 'Invalid hip measurement').optional(),
  arms: z.number().min(15, 'Invalid arm measurement').max(100, 'Invalid arm measurement').optional(),
  thighs: z.number().min(30, 'Invalid thigh measurement').max(150, 'Invalid thigh measurement').optional(),
  measuredAt: z.date(),
  notes: z.string().max(500, 'Notes are too long').optional(),
})

// =================== SUBSCRIPTION VALIDATIONS ===================

export const planTypeSchema = z.enum(['FREE', 'BASIC', 'PRO', 'TRAINER', 'ENTERPRISE'])

export const subscriptionStatusSchema = z.enum([
  'ACTIVE',
  'INACTIVE',
  'CANCELED',
  'PAST_DUE',
  'UNPAID'
])

export const createSubscriptionSchema = z.object({
  planType: planTypeSchema,
  stripePriceId: z.string().min(1, 'Stripe price ID is required'),
})

// =================== SEARCH AND FILTER VALIDATIONS ===================

export const paginationSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
})

export const sortOrderSchema = z.enum(['asc', 'desc'])

export const exerciseFilterSchema = z.object({
  category: exerciseCategorySchema.optional(),
  difficulty: difficultySchema.optional(),
  muscleGroups: z.array(z.string()).optional(),
  search: z.string().max(100, 'Search term is too long').optional(),
}).merge(paginationSchema)

export const workoutFilterSchema = z.object({
  category: workoutCategorySchema.optional(),
  isTemplate: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  creatorId: z.string().cuid().optional(),
  search: z.string().max(100, 'Search term is too long').optional(),
  sortBy: z.enum(['name', 'createdAt', 'duration']).default('createdAt'),
  sortOrder: sortOrderSchema.default('desc'),
}).merge(paginationSchema)

// =================== HELPER FUNCTIONS ===================

/**
 * Sanitize HTML input to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Validate and sanitize search query
 */
export function validateSearchQuery(query: string): string {
  const sanitized = sanitizeHtml(query)
  const schema = z.string().max(100, 'Search query is too long')
  return schema.parse(sanitized)
}

/**
 * Parse and validate JSON strings safely
 */
export function parseJsonString<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T
  } catch {
    return fallback
  }
}

// =================== TYPE EXPORTS ===================

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type ClientProfileInput = z.infer<typeof clientProfileSchema>
export type TrainerProfileInput = z.infer<typeof trainerProfileSchema>
export type CreateExerciseInput = z.infer<typeof createExerciseSchema>
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>
export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>
export type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>
export type CreateWorkoutSessionInput = z.infer<typeof createWorkoutSessionSchema>
export type UpdateWorkoutSessionInput = z.infer<typeof updateWorkoutSessionSchema>
export type BodyMeasurementInput = z.infer<typeof bodyMeasurementSchema>
export type ExerciseFilterInput = z.infer<typeof exerciseFilterSchema>
export type WorkoutFilterInput = z.infer<typeof workoutFilterSchema>