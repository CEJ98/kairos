// @ts-nocheck
/**
 * Consolidated validation schemas
 * Eliminates duplication and provides reusable validation patterns
 */

import { z } from 'zod'
import { 
	MUSCLE_GROUPS, 
	EQUIPMENT_TYPES, 
	WORKOUT_CATEGORIES,
	type WorkoutDifficulty,
	type WorkoutStatus
} from '@/types/workout'

// =================== BASE SCHEMAS ===================

// Common validation patterns
export const idSchema = z.string().cuid('Invalid ID format')
export const emailSchema = z.string().email('Invalid email format').max(255)
export const passwordSchema = z.string()
	.min(8, 'Password must be at least 8 characters')
	.max(128, 'Password is too long')
	.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase and number')

export const phoneSchema = z.string()
	.regex(/^[+]?[1-9]\d{1,14}$/, 'Invalid phone number format')

export const urlSchema = z.string().url('Invalid URL format').optional()

export const nameSchema = z.string()
	.min(1, 'Name is required')
	.max(100, 'Name is too long')
	.regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]+$/, 'Name contains invalid characters')

export const descriptionSchema = z.string()
	.max(1000, 'Description is too long')
	.optional()

export const notesSchema = z.string()
	.max(500, 'Notes are too long')
	.optional()

// Pagination and sorting
export const paginationSchema = z.object({
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(20)
})

export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc')

// =================== WORKOUT SCHEMAS ===================

export const workoutDifficultySchema = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
export const workoutStatusSchema = z.enum(['IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
export const workoutCategorySchema = z.enum(WORKOUT_CATEGORIES)
export const muscleGroupSchema = z.enum(MUSCLE_GROUPS)
export const equipmentTypeSchema = z.enum(EQUIPMENT_TYPES)

// Exercise validation
export const exerciseSchema = z.object({
	id: idSchema.optional(),
	name: nameSchema,
	description: descriptionSchema,
	category: z.string().min(1, 'Category is required'),
	muscleGroups: z.array(muscleGroupSchema).min(1, 'At least one muscle group required'),
	equipment: z.array(equipmentTypeSchema).optional(),
	difficulty: workoutDifficultySchema.optional(),
	instructions: z.array(z.string()).optional(),
	tips: z.array(z.string()).optional(),
	videoUrl: urlSchema,
	imageUrl: urlSchema,
	isCustom: z.boolean().default(false)
})

export const createExerciseSchema = exerciseSchema.omit({ id: true })
export const updateExerciseSchema = exerciseSchema.partial().extend({
	id: idSchema
})

// Routine set validation
export const routineSetSchema = z.object({
	id: idSchema.optional(),
	exerciseId: idSchema,
	exerciseName: z.string().optional(),
	order: z.number().int().min(0),
	sets: z.number().int().min(1).max(50).optional(),
	reps: z.number().int().min(1).max(1000).optional(),
	weight: z.number().min(0).max(1000).optional(),
	duration: z.number().int().min(1).max(7200).optional(), // Max 2 hours
	distance: z.number().min(0).max(1000).optional(), // Max 1000km
	restTime: z.number().int().min(0).max(600).optional(), // Max 10 minutes
	notes: notesSchema,
	completed: z.boolean().default(false)
})

// Routine block validation
export const routineBlockSchema = z.object({
	id: idSchema.optional(),
	name: nameSchema,
	order: z.number().int().min(0),
	rounds: z.number().int().min(1).max(20),
	restBetweenRounds: z.number().int().min(0).max(600).optional(),
	notes: notesSchema,
	sets: z.array(routineSetSchema).min(1, 'At least one set required')
})

// Routine validation
export const routineSchema = z.object({
	id: idSchema.optional(),
	name: nameSchema,
	description: descriptionSchema,
	category: workoutCategorySchema.optional(),
	difficulty: workoutDifficultySchema.optional(),
	estimatedDuration: z.number().int().min(1).max(480).optional(), // Max 8 hours
	isTemplate: z.boolean().default(false),
	isActive: z.boolean().default(true),
	isPublic: z.boolean().default(false),
	blocks: z.array(routineBlockSchema).min(1, 'At least one block required'),
	tags: z.array(z.string()).optional(),
	equipment: z.array(equipmentTypeSchema).optional(),
	muscleGroups: z.array(muscleGroupSchema).optional()
})

export const createRoutineSchema = routineSchema.omit({ id: true })
export const updateRoutineSchema = routineSchema.partial().extend({
	id: idSchema
})

// Workout exercise validation
export const workoutExerciseSchema = z.object({
	id: idSchema.optional(),
	exerciseId: idSchema,
	workoutId: idSchema.optional(),
	order: z.number().int().min(0),
	sets: z.number().int().min(1).max(50).optional(),
	reps: z.number().int().min(1).max(1000).optional(),
	weight: z.number().min(0).max(1000).optional(),
	duration: z.number().int().min(1).max(7200).optional(),
	distance: z.number().min(0).max(1000).optional(),
	restTime: z.number().int().min(0).max(600).optional(),
	notes: notesSchema
})

// Workout validation
export const workoutSchema = z.object({
	id: idSchema.optional(),
	name: nameSchema,
	description: descriptionSchema,
	category: workoutCategorySchema.optional(),
	difficulty: workoutDifficultySchema.optional(),
	estimatedDuration: z.number().int().min(1).max(480).optional(),
	isTemplate: z.boolean().default(false),
	isPublic: z.boolean().default(false),
	exercises: z.array(workoutExerciseSchema).min(1, 'At least one exercise required'),
	tags: z.array(z.string()).optional(),
	equipment: z.array(equipmentTypeSchema).optional(),
	muscleGroups: z.array(muscleGroupSchema).optional()
})

export const createWorkoutSchema = workoutSchema.omit({ id: true })
export const updateWorkoutSchema = workoutSchema.partial().extend({
	id: idSchema
})

// Workout session validation
export const workoutSessionSchema = z.object({
	id: idSchema.optional(),
	workoutId: idSchema,
	userId: idSchema,
	startedAt: z.date(),
	completedAt: z.date().optional(),
	duration: z.number().int().min(1).optional(),
	caloriesBurned: z.number().min(0).max(10000).optional(),
	notes: notesSchema,
	performance: z.array(workoutExerciseSchema),
	status: workoutStatusSchema.default('IN_PROGRESS'),
	difficulty: z.number().min(1).max(10).optional(),
	overallRating: z.number().min(1).max(5).optional()
})

export const createWorkoutSessionSchema = z.object({
	workoutId: idSchema,
	notes: notesSchema
})

export const updateWorkoutSessionSchema = workoutSessionSchema.partial().extend({
	id: idSchema
})

// =================== USER SCHEMAS ===================

export const userRoleSchema = z.enum(['CLIENT', 'TRAINER', 'ADMIN'])
export const genderSchema = z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'])
export const activityLevelSchema = z.enum(['SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTREMELY_ACTIVE'])

// User profile validation
export const userProfileSchema = z.object({
	id: idSchema.optional(),
	email: emailSchema,
	name: nameSchema,
	phone: phoneSchema,
	dateOfBirth: z.date().optional(),
	gender: genderSchema.optional(),
	height: z.number().min(50).max(300).optional(), // cm
	weight: z.number().min(20).max(500).optional(), // kg
	activityLevel: activityLevelSchema.optional(),
	goals: z.array(z.string()).optional(),
	medicalConditions: z.array(z.string()).optional(),
	emergencyContact: z.object({
		name: nameSchema,
		phone: phoneSchema,
		relationship: z.string().min(1)
	}).optional()
})

export const createUserSchema = z.object({
	email: emailSchema,
	password: passwordSchema,
	name: nameSchema,
	role: userRoleSchema.default('CLIENT')
})

export const updateUserProfileSchema = userProfileSchema.partial().extend({
	id: idSchema
})

export const loginSchema = z.object({
	email: emailSchema,
	password: z.string().min(1, 'Password is required')
})

export const changePasswordSchema = z.object({
	currentPassword: z.string().min(1, 'Current password is required'),
	newPassword: passwordSchema,
	confirmPassword: z.string().min(1, 'Password confirmation is required')
}).refine(data => data.newPassword === data.confirmPassword, {
	message: 'Passwords do not match',
	path: ['confirmPassword']
})

// =================== FILTER SCHEMAS ===================

export const exerciseFilterSchema = z.object({
	category: z.string().optional(),
	muscleGroups: z.array(muscleGroupSchema).optional(),
	equipment: z.array(equipmentTypeSchema).optional(),
	difficulty: workoutDifficultySchema.optional(),
	isCustom: z.boolean().optional(),
	search: z.string().max(100, 'Search term is too long').optional(),
	sortBy: z.enum(['name', 'createdAt', 'difficulty']).default('createdAt'),
	sortOrder: sortOrderSchema
}).merge(paginationSchema)

export const workoutFilterSchema = z.object({
	category: workoutCategorySchema.optional(),
	difficulty: workoutDifficultySchema.optional(),
	isTemplate: z.boolean().optional(),
	isPublic: z.boolean().optional(),
	creatorId: idSchema.optional(),
	search: z.string().max(100, 'Search term is too long').optional(),
	sortBy: z.enum(['name', 'createdAt', 'duration']).default('createdAt'),
	sortOrder: sortOrderSchema
}).merge(paginationSchema)

// =================== SETTINGS SCHEMAS ===================

export const themeSchema = z.enum(['LIGHT', 'DARK', 'SYSTEM'])
export const languageSchema = z.enum(['es', 'en', 'fr'])
export const measurementUnitSchema = z.enum(['METRIC', 'IMPERIAL'])
export const profileVisibilitySchema = z.enum(['PUBLIC', 'PRIVATE', 'FRIENDS_ONLY'])

export const notificationSettingsSchema = z.object({
	email: z.boolean().default(true),
	push: z.boolean().default(true),
	workoutReminders: z.boolean().default(true),
	progressUpdates: z.boolean().default(true),
	marketingEmails: z.boolean().default(false)
})

export const privacySettingsSchema = z.object({
	profileVisibility: profileVisibilitySchema.default('PUBLIC'),
	showProgress: z.boolean().default(true),
	allowMessages: z.boolean().default(true),
	showOnlineStatus: z.boolean().default(true)
})

export const preferenceSettingsSchema = z.object({
	theme: themeSchema.default('SYSTEM'),
	language: languageSchema.default('es'),
	measurementUnit: measurementUnitSchema.default('METRIC'),
	autoSaveWorkouts: z.boolean().default(true),
	showTips: z.boolean().default(true)
})

export const userSettingsSchema = z.object({
	notifications: notificationSettingsSchema,
	privacy: privacySettingsSchema,
	preferences: preferenceSettingsSchema
})

// =================== SECURITY SCHEMAS ===================

export const secureStringSchema = (options: {
	minLength?: number
	maxLength?: number
	allowSpecialChars?: boolean
	required?: boolean
} = {}) => {
	const {
		minLength = 1,
		maxLength = 255,
		allowSpecialChars = true,
		required = true
	} = options

	let schema = z.string()
		.min(minLength, `Must be at least ${minLength} characters`)
		.max(maxLength, `Must be no more than ${maxLength} characters`)

	if (!allowSpecialChars) {
		schema = schema.regex(/^[a-zA-Z0-9\s-_]+$/, 'Contains invalid characters')
	}

	// XSS and injection protection
	schema = schema.refine(
		(val) => !/<script|javascript:|on\w+=/i.test(val),
		{ message: 'Invalid content detected' }
	)

	return required ? schema : schema.optional()
}

export const sanitizedTextSchema = z.string()
	.min(1, 'Cannot be empty')
	.transform((val) => val.trim())
	.refine(
		(val) => !/<script|javascript:|on\w+=/i.test(val),
		{ message: 'Invalid content detected' }
	)

// =================== TYPE EXPORTS ===================

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>
export type CreateRoutineInput = z.infer<typeof createRoutineSchema>
export type UpdateRoutineInput = z.infer<typeof updateRoutineSchema>
export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>
export type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>
export type CreateWorkoutSessionInput = z.infer<typeof createWorkoutSessionSchema>
export type UpdateWorkoutSessionInput = z.infer<typeof updateWorkoutSessionSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type ExerciseFilterInput = z.infer<typeof exerciseFilterSchema>
export type WorkoutFilterInput = z.infer<typeof workoutFilterSchema>
export type UserSettingsInput = z.infer<typeof userSettingsSchema>
export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>
export type PrivacySettingsInput = z.infer<typeof privacySettingsSchema>
export type PreferenceSettingsInput = z.infer<typeof preferenceSettingsSchema>

// =================== VALIDATION UTILITIES ===================

export const validateAndSanitize = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
	try {
		return schema.parse(data)
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`)
		}
		throw error
	}
}

export const safeValidate = <T>(schema: z.ZodSchema<T>, data: unknown): {
	success: boolean
	data?: T
	error?: string
} => {
	try {
		const result = schema.safeParse(data)
		if (result.success) {
			return { success: true, data: result.data }
		} else {
			return {
				success: false,
				error: result.error.errors.map(e => e.message).join(', ')
			}
		}
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown validation error'
		}
	}
}
