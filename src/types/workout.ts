/**
 * Consolidated workout-related types and interfaces
 * Eliminates duplication across components and services
 */

export interface RoutineSet {
	id?: string
	exerciseId: string
	exerciseName?: string
	order: number
	sets?: number
	reps?: number
	weight?: number
	duration?: number
	distance?: number
	restTime?: number
	notes?: string
	completed?: boolean
	performance?: {
		actualReps?: number
		actualWeight?: number
		actualDuration?: number
		difficulty?: number
		notes?: string
	}
}

export interface RoutineBlock {
	id?: string
	name: string
	order: number
	rounds: number
	restBetweenRounds?: number
	notes?: string
	sets: RoutineSet[]
	completed?: boolean
	currentRound?: number
}

export interface Routine {
	id?: string
	name: string
	description?: string
	category?: string
	difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
	estimatedDuration?: number
	isTemplate: boolean
	isActive: boolean
	isPublic?: boolean
	creatorId?: string
	blocks: RoutineBlock[]
	createdAt?: Date
	updatedAt?: Date
	tags?: string[]
	equipment?: string[]
	muscleGroups?: string[]
}

export interface Exercise {
	id: string
	name: string
	description?: string
	category: string
	muscleGroups: string[]
	equipment?: string[]
	difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
	instructions?: string[]
	tips?: string[]
	videoUrl?: string
	imageUrl?: string
	isCustom?: boolean
	creatorId?: string
	createdAt?: Date
	updatedAt?: Date
}

export interface WorkoutExercise {
	id?: string
	exerciseId: string
	exercise?: Exercise
	workoutId?: string
	order: number
	sets?: number
	reps?: number
	weight?: number
	duration?: number
	distance?: number
	restTime?: number
	notes?: string
	performance?: {
		actualSets?: number
		actualReps?: number
		actualWeight?: number
		actualDuration?: number
		actualDistance?: number
		difficulty?: number
		notes?: string
	}
}

export interface Workout {
	id?: string
	name: string
	description?: string
	category?: string
	difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
	estimatedDuration?: number
	isTemplate: boolean
	isPublic?: boolean
	creatorId?: string
	exercises: WorkoutExercise[]
	createdAt?: Date
	updatedAt?: Date
	tags?: string[]
	equipment?: string[]
	muscleGroups?: string[]
}

export interface WorkoutSession {
	id?: string
	workoutId: string
	workout?: Workout
	userId: string
	startedAt: Date
	completedAt?: Date
	duration?: number
	caloriesBurned?: number
	notes?: string
	performance: WorkoutExercise[]
	status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
	difficulty?: number
	overallRating?: number
}

// Workout creation and update types
export interface CreateWorkoutInput {
	name: string
	description?: string
	category?: string
	difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
	estimatedDuration?: number
	isTemplate?: boolean
	isPublic?: boolean
	exercises: Omit<WorkoutExercise, 'id' | 'workoutId'>[]
	tags?: string[]
	equipment?: string[]
	muscleGroups?: string[]
}

export interface UpdateWorkoutInput extends Partial<CreateWorkoutInput> {
	id: string
}

export interface CreateWorkoutSessionInput {
	workoutId: string
	notes?: string
}

export interface UpdateWorkoutSessionInput {
	id: string
	duration?: number
	caloriesBurned?: number
	notes?: string
	performance?: WorkoutExercise[]
	status?: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
	difficulty?: number
	overallRating?: number
}

// Filter and search types
export interface ExerciseFilterInput {
	category?: string
	muscleGroups?: string[]
	equipment?: string[]
	difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
	isCustom?: boolean
	search?: string
	page?: number
	limit?: number
	sortBy?: 'name' | 'createdAt' | 'difficulty'
	sortOrder?: 'asc' | 'desc'
}

export interface WorkoutFilterInput {
	category?: string
	difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
	isTemplate?: boolean
	isPublic?: boolean
	creatorId?: string
	search?: string
	page?: number
	limit?: number
	sortBy?: 'name' | 'createdAt' | 'duration'
	sortOrder?: 'asc' | 'desc'
}

// Progress and analytics types
export interface WorkoutProgress {
	exerciseId: string
	exerciseName: string
	history: {
		date: Date
		weight?: number
		reps?: number
		sets?: number
		duration?: number
		distance?: number
		volume?: number
	}[]
	trend: 'IMPROVING' | 'STABLE' | 'DECLINING'
	bestPerformance: {
		weight?: number
		reps?: number
		sets?: number
		duration?: number
		distance?: number
		volume?: number
		date: Date
	}
}

export interface WorkoutAnalytics {
	totalSessions: number
	totalDuration: number
	averageDuration: number
	totalCaloriesBurned: number
	averageCaloriesBurned: number
	muscleGroupDistribution: Record<string, number>
	difficultyProgression: Array<{ date: string; avgDifficulty: number }>
	consistencyScore: number
	strengthProgression: Record<string, number[]>
	favoriteExercises: Array<{ exerciseId: string; name: string; count: number }>
	weeklyStats: Array<{ week: string; sessions: number; duration: number }>
}

// Drag and drop types
export interface DragEndResult {
	destination?: {
		droppableId: string
		index: number
	}
	source: {
		droppableId: string
		index: number
	}
	type: string
	draggableId: string
}

// Workout player types
export interface WorkoutPlayerState {
	currentBlockIndex: number
	currentSetIndex: number
	currentRound: number
	isPlaying: boolean
	isPaused: boolean
	isCompleted: boolean
	startTime?: Date
	elapsedTime: number
	restTime: number
	isResting: boolean
}

export interface WorkoutPlayerActions {
	start: () => void
	pause: () => void
	resume: () => void
	stop: () => void
	nextSet: () => void
	previousSet: () => void
	completeSet: (performance?: Partial<RoutineSet['performance']>) => void
	skipRest: () => void
	addRestTime: (seconds: number) => void
}

// Equipment and muscle group constants
export const MUSCLE_GROUPS = [
	'CHEST',
	'BACK',
	'SHOULDERS',
	'BICEPS',
	'TRICEPS',
	'FOREARMS',
	'ABS',
	'OBLIQUES',
	'LOWER_BACK',
	'QUADRICEPS',
	'HAMSTRINGS',
	'GLUTES',
	'CALVES',
	'CARDIO',
	'FULL_BODY'
] as const

export const EQUIPMENT_TYPES = [
	'BODYWEIGHT',
	'DUMBBELLS',
	'BARBELL',
	'KETTLEBELL',
	'RESISTANCE_BANDS',
	'PULL_UP_BAR',
	'BENCH',
	'CABLE_MACHINE',
	'SMITH_MACHINE',
	'CARDIO_MACHINE',
	'MEDICINE_BALL',
	'FOAM_ROLLER',
	'OTHER'
] as const

export const WORKOUT_CATEGORIES = [
	'STRENGTH',
	'CARDIO',
	'FLEXIBILITY',
	'SPORTS',
	'REHABILITATION',
	'FUNCTIONAL',
	'BODYBUILDING',
	'POWERLIFTING',
	'CROSSFIT',
	'YOGA',
	'PILATES',
	'MARTIAL_ARTS',
	'DANCE',
	'OTHER'
] as const

export type MuscleGroup = typeof MUSCLE_GROUPS[number]
export type EquipmentType = typeof EQUIPMENT_TYPES[number]
export type WorkoutCategory = typeof WORKOUT_CATEGORIES[number]
export type WorkoutDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
export type WorkoutStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'