// Tipos y enums para el sistema de usuarios

export enum UserRole {
	CLIENT = 'CLIENT',
	TRAINER = 'TRAINER',
	ADMIN = 'ADMIN'
}

export interface UserWithRole {
	id: string
	email: string
	name?: string | null
	avatar?: string | null
	role: UserRole
	isVerified: boolean
	isOnline: boolean
	lastSeen: Date
	createdAt: Date
	updatedAt: Date
}

export interface ClientUser extends UserWithRole {
	role: UserRole.CLIENT
	clientProfile?: {
		id: string
		age?: number | null
		weight?: number | null
		height?: number | null
		gender?: string | null
		fitnessGoal?: string | null
		activityLevel?: string | null
		trainerId?: string | null
	}
}

export interface TrainerUser extends UserWithRole {
	role: UserRole.TRAINER
	trainerProfile?: {
		id: string
		bio?: string | null
		experience?: number | null
		specialties?: string | null
		hourlyRate?: number | null
		isActive: boolean
		maxClients: number
	}
}

export interface TrainerClient {
	id: string
	email: string
	name?: string | null
	avatar?: string | null
	clientProfile?: {
		id: string
		age?: number | null
		weight?: number | null
		height?: number | null
		gender?: string | null
		fitnessGoal?: string | null
		activityLevel?: string | null
	}
	workouts?: {
		id: string
		name: string
		description?: string | null
		createdAt: Date
		updatedAt: Date
	}[]
	progressMetrics?: {
		id: string
		metricType: string
		value: number
		unit: string
		recordedAt: Date
	}[]
}

export interface WorkoutAssignment {
	id: string
	name: string
	description?: string | null
	category?: string | null
	duration?: number | null
	createdAt: Date
	updatedAt: Date
	assignedTo?: {
		id: string
		name?: string | null
		email: string
	}
	exercises?: {
		id: string
		order: number
		sets?: number | null
		reps?: number | null
		weight?: number | null
		duration?: number | null
		exercise: {
			id: string
			name: string
			category: string
			difficulty: string
		}
	}[]
}

// Utilidades para validación de roles
export const isClient = (user: UserWithRole): user is ClientUser => {
	return user.role === UserRole.CLIENT
}

export const isTrainer = (user: UserWithRole): user is TrainerUser => {
	return user.role === UserRole.TRAINER
}

export const isAdmin = (user: UserWithRole): boolean => {
	return user.role === UserRole.ADMIN
}

export const hasTrainerAccess = (user: UserWithRole): boolean => {
	return user.role === UserRole.TRAINER || user.role === UserRole.ADMIN
}

export const hasAdminAccess = (user: UserWithRole): boolean => {
	return user.role === UserRole.ADMIN
}

// Constantes para validación
export const VALID_ROLES = Object.values(UserRole)

export const validateUserRole = (role: string): role is UserRole => {
	return VALID_ROLES.includes(role as UserRole)
}