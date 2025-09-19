/**
 * Form Validation Schemas and Utilities
 * Sistema robusto de validación de formularios con Yup
 */

import * as yup from 'yup'

// Validation messages in Spanish
const messages = {
	required: (field: string) => `${field} es requerido`,
	email: 'Formato de email inválido',
	min: (field: string, min: number) => `${field} debe tener al menos ${min} caracteres`,
	max: (field: string, max: number) => `${field} no puede exceder ${max} caracteres`,
	minValue: (field: string, min: number) => `${field} debe ser mayor a ${min}`,
	maxValue: (field: string, max: number) => `${field} no puede ser mayor a ${max}`,
	positive: (field: string) => `${field} debe ser un número positivo`,
	oneOf: (field: string, values: string[]) => `${field} debe ser uno de: ${values.join(', ')}`,
	url: 'URL inválida',
	password: {
		weak: 'Contraseña muy débil',
		minLength: 'Contraseña debe tener al menos 8 caracteres',
		requiresUppercase: 'Contraseña debe contener al menos una mayúscula',
		requiresLowercase: 'Contraseña debe contener al menos una minúscula',
		requiresNumber: 'Contraseña debe contener al menos un número',
		requiresSpecial: 'Contraseña debe contener al menos un carácter especial'
	}
}

// Custom validation methods
const customValidation = {
	password: (value: string | undefined) => {
		if (!value) return false
		const hasUpperCase = /[A-Z]/.test(value)
		const hasLowerCase = /[a-z]/.test(value)
		const hasNumber = /\d/.test(value)
		const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)
		const minLength = value.length >= 8
		
		return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && minLength
	},
	
	strongPassword: (value: string | undefined) => {
		if (!value) return false
		const score = [
			/[a-z]/.test(value), // lowercase
			/[A-Z]/.test(value), // uppercase
			/[0-9]/.test(value), // numbers
			/[^A-Za-z0-9]/.test(value), // special chars
			value.length >= 12 // length
		].filter(Boolean).length
		
		return score >= 4
	}
}

// Auth schemas
export const loginSchema = yup.object({
	email: yup.string()
		.email(messages.email)
		.required(messages.required('Email')),
	password: yup.string()
		.min(8, messages.min('Contraseña', 8))
		.required(messages.required('Contraseña'))
})

export const registerSchema = yup.object({
	name: yup.string()
		.min(2, messages.min('Nombre', 2))
		.max(50, messages.max('Nombre', 50))
		.required(messages.required('Nombre')),
	email: yup.string()
		.email(messages.email)
		.required(messages.required('Email')),
	password: yup.string()
		.min(8, messages.password.minLength)
		.test('password-strength', messages.password.weak, customValidation.password)
		.required(messages.required('Contraseña')),
	confirmPassword: yup.string()
		.oneOf([yup.ref('password')], 'Las contraseñas no coinciden')
		.required(messages.required('Confirmar contraseña')),
	terms: yup.boolean()
		.oneOf([true], 'Debes aceptar los términos y condiciones')
		.required()
})

export const resetPasswordSchema = yup.object({
	password: yup.string()
		.min(8, messages.password.minLength)
		.test('password-strength', messages.password.weak, customValidation.password)
		.required(messages.required('Nueva contraseña')),
	confirmPassword: yup.string()
		.oneOf([yup.ref('password')], 'Las contraseñas no coinciden')
		.required(messages.required('Confirmar contraseña'))
})

export const forgotPasswordSchema = yup.object({
	email: yup.string()
		.email(messages.email)
		.required(messages.required('Email'))
})

// Profile schemas
export const userProfileSchema = yup.object({
	name: yup.string()
		.min(2, messages.min('Nombre', 2))
		.max(50, messages.max('Nombre', 50))
		.required(messages.required('Nombre')),
	email: yup.string()
		.email(messages.email)
		.required(messages.required('Email')),
	avatar: yup.string()
		.url(messages.url)
		.nullable()
})

export const clientProfileSchema = yup.object({
	age: yup.number()
		.positive(messages.positive('Edad'))
		.min(13, messages.minValue('Edad', 13))
		.max(120, messages.maxValue('Edad', 120))
		.nullable(),
	weight: yup.number()
		.positive(messages.positive('Peso'))
		.min(30, messages.minValue('Peso', 30))
		.max(300, messages.maxValue('Peso', 300))
		.nullable(),
	height: yup.number()
		.positive(messages.positive('Altura'))
		.min(100, messages.minValue('Altura', 100))
		.max(250, messages.maxValue('Altura', 250))
		.nullable(),
	gender: yup.string()
		.oneOf(['MALE', 'FEMALE', 'OTHER'], messages.oneOf('Género', ['Masculino', 'Femenino', 'Otro']))
		.nullable(),
	fitnessGoal: yup.string()
		.oneOf(
			['WEIGHT_LOSS', 'MUSCLE_GAIN', 'ENDURANCE', 'STRENGTH', 'GENERAL_FITNESS'],
			messages.oneOf('Objetivo', ['Pérdida de peso', 'Ganar músculo', 'Resistencia', 'Fuerza', 'Fitness general'])
		)
		.nullable(),
	activityLevel: yup.string()
		.oneOf(
			['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE'],
			messages.oneOf('Nivel de actividad', ['Sedentario', 'Ligero', 'Moderado', 'Activo', 'Muy activo'])
		)
		.nullable()
})

export const trainerProfileSchema = yup.object({
	bio: yup.string()
		.max(500, messages.max('Biografía', 500))
		.nullable(),
	experience: yup.number()
		.positive(messages.positive('Años de experiencia'))
		.min(0, messages.minValue('Años de experiencia', 0))
		.max(50, messages.maxValue('Años de experiencia', 50))
		.nullable(),
	hourlyRate: yup.number()
		.positive(messages.positive('Tarifa por hora'))
		.min(1, messages.minValue('Tarifa por hora', 1))
		.max(1000, messages.maxValue('Tarifa por hora', 1000))
		.nullable(),
	maxClients: yup.number()
		.positive(messages.positive('Máximo de clientes'))
		.min(1, messages.minValue('Máximo de clientes', 1))
		.max(200, messages.maxValue('Máximo de clientes', 200))
		.required(messages.required('Máximo de clientes'))
})

// Workout schemas
export const exerciseSchema = yup.object({
	name: yup.string()
		.min(2, messages.min('Nombre del ejercicio', 2))
		.max(100, messages.max('Nombre del ejercicio', 100))
		.required(messages.required('Nombre del ejercicio')),
	description: yup.string()
		.max(500, messages.max('Descripción', 500))
		.nullable(),
	category: yup.string()
		.oneOf(
			['STRENGTH', 'CARDIO', 'FLEXIBILITY', 'BALANCE', 'PLYOMETRIC'],
			messages.oneOf('Categoría', ['Fuerza', 'Cardio', 'Flexibilidad', 'Balance', 'Pliométrico'])
		)
		.required(messages.required('Categoría')),
	difficulty: yup.string()
		.oneOf(
			['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'],
			messages.oneOf('Dificultad', ['Principiante', 'Intermedio', 'Avanzado', 'Experto'])
		)
		.required(messages.required('Dificultad')),
	instructions: yup.string()
		.max(1000, messages.max('Instrucciones', 1000))
		.nullable(),
	tips: yup.string()
		.max(500, messages.max('Consejos', 500))
		.nullable(),
	imageUrl: yup.string()
		.url(messages.url)
		.nullable(),
	videoUrl: yup.string()
		.url(messages.url)
		.nullable()
})

export const workoutSchema = yup.object({
	name: yup.string()
		.min(2, messages.min('Nombre de la rutina', 2))
		.max(100, messages.max('Nombre de la rutina', 100))
		.required(messages.required('Nombre de la rutina')),
	description: yup.string()
		.max(500, messages.max('Descripción', 500))
		.nullable(),
	category: yup.string()
		.oneOf(
			['STRENGTH', 'CARDIO', 'HIIT', 'FLEXIBILITY', 'CROSSTRAINING'],
			messages.oneOf('Categoría', ['Fuerza', 'Cardio', 'HIIT', 'Flexibilidad', 'Cross Training'])
		)
		.nullable(),
	duration: yup.number()
		.positive(messages.positive('Duración'))
		.min(5, messages.minValue('Duración', 5))
		.max(300, messages.maxValue('Duración', 300))
		.nullable(),
	isTemplate: yup.boolean(),
	isPublic: yup.boolean()
})

export const workoutExerciseSchema = yup.object({
	exerciseId: yup.string()
		.required(messages.required('Ejercicio')),
	order: yup.number()
		.positive(messages.positive('Orden'))
		.required(messages.required('Orden')),
	sets: yup.number()
		.positive(messages.positive('Series'))
		.min(1, messages.minValue('Series', 1))
		.max(20, messages.maxValue('Series', 20))
		.nullable(),
	reps: yup.number()
		.positive(messages.positive('Repeticiones'))
		.min(1, messages.minValue('Repeticiones', 1))
		.max(1000, messages.maxValue('Repeticiones', 1000))
		.nullable(),
	weight: yup.number()
		.positive(messages.positive('Peso'))
		.min(0.5, messages.minValue('Peso', 0.5))
		.max(500, messages.maxValue('Peso', 500))
		.nullable(),
	duration: yup.number()
		.positive(messages.positive('Duración'))
		.min(1, messages.minValue('Duración', 1))
		.max(3600, messages.maxValue('Duración', 3600))
		.nullable(),
	distance: yup.number()
		.positive(messages.positive('Distancia'))
		.min(0.01, messages.minValue('Distancia', 0.01))
		.max(100, messages.maxValue('Distancia', 100))
		.nullable(),
	restTime: yup.number()
		.positive(messages.positive('Descanso'))
		.min(5, messages.minValue('Descanso', 5))
		.max(600, messages.maxValue('Descanso', 600))
		.nullable(),
	notes: yup.string()
		.max(200, messages.max('Notas', 200))
		.nullable()
})

// Subscription and payment schemas
export const subscriptionSchema = yup.object({
	planType: yup.string()
		.oneOf(
			['FREE', 'BASIC', 'PRO', 'TRAINER', 'ENTERPRISE'],
			messages.oneOf('Tipo de plan', ['Gratuito', 'Básico', 'Pro', 'Entrenador', 'Empresa'])
		)
		.required(messages.required('Tipo de plan'))
})

// Contact and communication schemas
export const contactSchema = yup.object({
	name: yup.string()
		.min(2, messages.min('Nombre', 2))
		.max(50, messages.max('Nombre', 50))
		.required(messages.required('Nombre')),
	email: yup.string()
		.email(messages.email)
		.required(messages.required('Email')),
	subject: yup.string()
		.min(5, messages.min('Asunto', 5))
		.max(100, messages.max('Asunto', 100))
		.required(messages.required('Asunto')),
	message: yup.string()
		.min(10, messages.min('Mensaje', 10))
		.max(1000, messages.max('Mensaje', 1000))
		.required(messages.required('Mensaje'))
})

export const messageSchema = yup.object({
	content: yup.string()
		.min(1, messages.min('Mensaje', 1))
		.max(500, messages.max('Mensaje', 500))
		.required(messages.required('Mensaje')),
	type: yup.string()
		.oneOf(['TEXT', 'WORKOUT_ASSIGNMENT', 'IMAGE', 'FILE'], 'Tipo de mensaje inválido')
		.required(messages.required('Tipo de mensaje'))
})

// Body measurements schema
export const bodyMeasurementSchema = yup.object({
	weight: yup.number()
		.positive(messages.positive('Peso'))
		.min(30, messages.minValue('Peso', 30))
		.max(300, messages.maxValue('Peso', 300))
		.nullable(),
	bodyFat: yup.number()
		.positive(messages.positive('Grasa corporal'))
		.min(1, messages.minValue('Grasa corporal', 1))
		.max(50, messages.maxValue('Grasa corporal', 50))
		.nullable(),
	muscle: yup.number()
		.positive(messages.positive('Masa muscular'))
		.min(10, messages.minValue('Masa muscular', 10))
		.max(100, messages.maxValue('Masa muscular', 100))
		.nullable(),
	chest: yup.number()
		.positive(messages.positive('Pecho'))
		.min(50, messages.minValue('Pecho', 50))
		.max(200, messages.maxValue('Pecho', 200))
		.nullable(),
	waist: yup.number()
		.positive(messages.positive('Cintura'))
		.min(40, messages.minValue('Cintura', 40))
		.max(200, messages.maxValue('Cintura', 200))
		.nullable(),
	hips: yup.number()
		.positive(messages.positive('Cadera'))
		.min(50, messages.minValue('Cadera', 50))
		.max(200, messages.maxValue('Cadera', 200))
		.nullable(),
	arms: yup.number()
		.positive(messages.positive('Brazos'))
		.min(15, messages.minValue('Brazos', 15))
		.max(60, messages.maxValue('Brazos', 60))
		.nullable(),
	thighs: yup.number()
		.positive(messages.positive('Muslos'))
		.min(30, messages.minValue('Muslos', 30))
		.max(100, messages.maxValue('Muslos', 100))
		.nullable(),
	measuredAt: yup.date()
		.required(messages.required('Fecha de medición')),
	notes: yup.string()
		.max(200, messages.max('Notas', 200))
		.nullable()
})

// Export validation utilities
// Utility functions for validation
export const validateEmailFormat = (email: string): boolean => {
	// Check for basic format
	if (!email || typeof email !== 'string') return false
	
	// Check for spaces
	if (email.includes(' ')) return false
	
	// Check for double dots
	if (email.includes('..')) return false
	
	// Check basic email pattern
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	if (!emailRegex.test(email)) return false
	
	// Check that it doesn't end with a dot
	if (email.endsWith('.')) return false
	
	// Check that it doesn't start with @
	if (email.startsWith('@')) return false
	
	// Check that it doesn't end with @
	if (email.endsWith('@')) return false
	
	return true
}

export const validatePassword = (password: string): boolean => {
	if (password.length < 8) return false
	if (!/[A-Z]/.test(password)) return false
	if (!/[a-z]/.test(password)) return false
	if (!/\d/.test(password)) return false
	if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false
	return true
}

export const validatePasswordDetailed = (password: string): { isValid: boolean; errors: string[] } => {
	const errors: string[] = []
	
	if (password.length < 8) {
		errors.push(messages.password.minLength)
	}
	if (!/[A-Z]/.test(password)) {
		errors.push(messages.password.requiresUppercase)
	}
	if (!/[a-z]/.test(password)) {
		errors.push(messages.password.requiresLowercase)
	}
	if (!/\d/.test(password)) {
		errors.push(messages.password.requiresNumber)
	}
	if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
		errors.push(messages.password.requiresSpecial)
	}
	
	return {
		isValid: errors.length === 0,
		errors
	}
}

// Create flexible schemas for tests
const testWorkoutSchema = yup.object({
	name: yup.string().min(1).required(),
	description: yup.string().nullable(),
	exercises: yup.array().of(yup.object({
		id: yup.string().nullable(),
		name: yup.string().min(1).required(),
		sets: yup.number().positive().nullable(),
		reps: yup.number().positive().nullable(),
		weight: yup.number().min(0).nullable()
	})).nullable(),
	duration: yup.number().positive().nullable(),
	difficulty: yup.string().nullable()
})

const testExerciseSchema = yup.object({
	name: yup.string().min(1).required(),
	sets: yup.number().positive().nullable(),
	reps: yup.number().positive().nullable(),
	weight: yup.number().min(0).nullable(),
	restTime: yup.number().positive().nullable(),
	category: yup.string().nullable(),
	difficulty: yup.string().nullable(),
	description: yup.string().nullable(),
	instructions: yup.string().nullable()
})

export const validateWorkout = (workout: any): void => {
	testWorkoutSchema.validateSync(workout)
}

export const validateExercise = (exercise: any): void => {
	testExerciseSchema.validateSync(exercise)
}

// Create a flexible user profile schema for tests
const testUserProfileSchema = yup.object({
	email: yup.string().email().required(),
	firstName: yup.string().min(1).nullable(),
	lastName: yup.string().min(1).nullable(),
	name: yup.string().min(1).nullable(),
	age: yup.number().min(13).max(120).nullable(),
	height: yup.number().min(100).max(250).nullable(),
	weight: yup.number().min(30).max(300).nullable(),
	fitnessLevel: yup.string().nullable(),
	goals: yup.array().nullable()
})

export const validateUserProfile = (profile: any): void => {
	testUserProfileSchema.validateSync(profile)
}

// Create a flexible measurement schema for tests
const testMeasurementSchema = yup.object({
	type: yup.string().required(),
	value: yup.number().positive().required(),
	unit: yup.string().required(),
	date: yup.string().nullable(),
	userId: yup.string().nullable(),
	measuredAt: yup.date().nullable()
})

export const validateMeasurement = (measurement: any): void => {
	// Check for future date
	if (measurement.date) {
		const measurementDate = new Date(measurement.date)
		const now = new Date()
		if (measurementDate > now) {
			throw new Error('Measurement date cannot be in the future')
		}
	}
	
	testMeasurementSchema.validateSync(measurement)
}

const sanitizeHtml = (input: string): string => {
	if (!input) return ''
	// Remove dangerous tags but keep safe ones like <b>, <i>, <strong>, <em>
	return input
		.replace(/<script[^>]*>.*?<\/script>/gi, '')
		.replace(/<img[^>]*>/gi, '')
		.replace(/javascript:/gi, '')
		.replace(/on\w+\s*=/gi, '')
		.trim()
}

export const sanitizeWorkoutData = (workout: any): any => {
	return {
		name: sanitizeHtml(workout.name) || '',
		description: sanitizeHtml(workout.description) || '',
		exercises: workout.exercises?.map((ex: any) => ({
			id: ex.id,
			name: sanitizeHtml(ex.name) || '',
			sets: Math.max(0, parseInt(ex.sets) || 0),
			reps: Math.max(0, parseInt(ex.reps) || 0),
			weight: Math.max(0, parseFloat(ex.weight) || 0),
			notes: sanitizeHtml(ex.notes) || ''
		})) || [],
		duration: Math.max(0, parseInt(workout.duration) || 0),
		difficulty: workout.difficulty || 'beginner'
	}
}

export const validationUtils = {
	messages,
	customValidation
}

// Type exports for TypeScript
export type LoginFormData = yup.InferType<typeof loginSchema>
export type RegisterFormData = yup.InferType<typeof registerSchema>
export type ResetPasswordFormData = yup.InferType<typeof resetPasswordSchema>
export type ForgotPasswordFormData = yup.InferType<typeof forgotPasswordSchema>
export type UserProfileFormData = yup.InferType<typeof userProfileSchema>
export type ClientProfileFormData = yup.InferType<typeof clientProfileSchema>
export type TrainerProfileFormData = yup.InferType<typeof trainerProfileSchema>
export type ExerciseFormData = yup.InferType<typeof exerciseSchema>
export type WorkoutFormData = yup.InferType<typeof workoutSchema>
export type WorkoutExerciseFormData = yup.InferType<typeof workoutExerciseSchema>
export type ContactFormData = yup.InferType<typeof contactSchema>
export type MessageFormData = yup.InferType<typeof messageSchema>
export type BodyMeasurementFormData = yup.InferType<typeof bodyMeasurementSchema>