import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { WorkoutEngine } from '@/lib/workout-engine'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const RecommendationRequestSchema = z.object({
	userProfile: z.object({
		age: z.number().min(13).max(100),
		fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
		goals: z.array(z.string()),
		availableTime: z.number().min(10).max(180), // minutos
		frequency: z.number().min(1).max(7), // días por semana
		equipment: z.array(z.string()),
		injuries: z.array(z.string()).optional(),
		preferences: z.array(z.string()).optional()
	}),
	limit: z.number().min(1).max(10).optional().default(3)
})

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}

		const body = await request.json()
		const validatedData = RecommendationRequestSchema.parse(body)

		// Obtener datos del usuario
		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			include: {
				clientProfiles: true,
				workoutSessions: {
					where: { status: 'COMPLETED' },
				orderBy: { startTime: 'desc' },
				take: 20,
				include: {
						exercises: {
							include: {
								exercise: true
							}
						}
					}
				}
			}
		})

		if (!user) {
			return NextResponse.json(
				{ error: 'Usuario no encontrado' },
				{ status: 404 }
			)
		}

		// Inicializar el motor de workouts
		const workoutEngine = new WorkoutEngine()

		// Generar recomendaciones usando el motor de IA
		const recommendations = await workoutEngine.generateRecommendations(
			session.user.id || '',
			validatedData.limit
		)

		// Obtener ejercicios disponibles para enriquecer las recomendaciones
		const exercises = await prisma.exercise.findMany({
			where: { isActive: true },
			select: {
				id: true,
				name: true,
				category: true,
				muscleGroups: true,
				equipments: true,
				difficulty: true
			}
		})

		// Transformar recomendaciones a formato de respuesta
		const enrichedRecommendations = await Promise.all(
			recommendations.map(async (rec) => {
				// Obtener detalles del workout recomendado
				const workout = await prisma.workout.findUnique({
					where: { id: rec.workoutId },
					include: {
						exercises: {
							include: {
								exercise: true
							},
							orderBy: { order: 'asc' }
						}
					}
				})

				if (!workout) return null

				// Calcular calorías estimadas
				const estimatedCalories = calculateEstimatedCalories(
					workout.duration || validatedData.userProfile.availableTime,
					validatedData.userProfile.age,
					workout.category || 'general'
				)

				// Generar insights de IA personalizados
				const aiInsights = generateAIInsights(
					validatedData.userProfile,
					user.workoutSessions || [],
					workout,
					rec.adaptations
				)

				return {
					id: workout.id,
					title: workout.name,
					description: workout.description || 'Workout personalizado generado por IA',
						duration: workout.duration || validatedData.userProfile.availableTime,
						difficulty: mapDifficultyLevel(workout.category || 'general', validatedData.userProfile.fitnessLevel),
					category: workout.category,
					targetMuscles: extractTargetMuscles(workout.exercises),
					equipmentNeeded: extractRequiredEquipment(workout.exercises),
					caloriesBurn: estimatedCalories,
					confidenceScore: Math.round(rec.confidence * 100),
					reasons: [rec.reason, ...rec.adaptations],
					exercises: workout.exercises.map(we => ({
						name: we.exercise.name,
						sets: we.sets || 3,
						reps: we.reps ? `${we.reps}` : '10-12',
						rest: we.restTime || 60
					})),
					aiInsights
				}
			})
		)

		// Filtrar recomendaciones nulas
		const validRecommendations = enrichedRecommendations.filter(Boolean)

		logger.debug(`Generated ${validRecommendations.length} AI recommendations for user ${session.user.id}`, {
			userProfile: validatedData.userProfile,
			recommendationCount: validRecommendations.length
		})

		return NextResponse.json({
			recommendations: validRecommendations,
			userProfile: {
				id: user.id || '',
				name: user.name || 'Usuario',
				...validatedData.userProfile
			}
		})

	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Datos de entrada inválidos', details: error.errors },
				{ status: 400 }
			)
		}

		logger.error('Error generating AI recommendations', error, 'API')
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}

// Funciones auxiliares
function calculateEstimatedCalories(
	duration: number,
	age: number,
	category: string
): number {
	// Fórmula básica para estimar calorías quemadas
	const baseRate = getBaseCalorieRate(category)
	const ageMultiplier = age < 30 ? 1.1 : age < 50 ? 1.0 : 0.9
	return Math.round(baseRate * (duration / 60) * ageMultiplier)
}

function getBaseCalorieRate(category: string): number {
	switch (category.toLowerCase()) {
		case 'hiit':
			return 400
		case 'cardio':
			return 350
		case 'strength':
			return 250
		case 'yoga':
			return 180
		case 'pilates':
			return 200
		default:
			return 300
	}
}

function mapDifficultyLevel(
	category: string,
	fitnessLevel: string
): 'easy' | 'medium' | 'hard' {
	if (fitnessLevel === 'beginner') {
		return category === 'HIIT' ? 'medium' : 'easy'
	} else if (fitnessLevel === 'advanced') {
		return category === 'YOGA' ? 'medium' : 'hard'
	}
	return 'medium'
}

function extractTargetMuscles(exercises: any[]): string[] {
	const muscles = new Set<string>()
	exercises.forEach(we => {
		if (we.exercise.muscleGroups) {
			try {
				const groups = JSON.parse(we.exercise.muscleGroups)
				if (Array.isArray(groups)) {
					groups.forEach(group => muscles.add(group.toLowerCase()))
				}
			} catch {
				// Ignorar errores de parsing
			}
		}
	})
	return Array.from(muscles).slice(0, 5) // Máximo 5 grupos musculares
}

function extractRequiredEquipment(exercises: any[]): string[] {
	const equipment = new Set<string>()
	exercises.forEach(we => {
		if (we.exercise.equipments) {
			try {
				const equips = JSON.parse(we.exercise.equipments)
				if (Array.isArray(equips)) {
					equips.forEach(eq => equipment.add(eq.toLowerCase()))
				}
			} catch {
				// Ignorar errores de parsing
			}
		}
	})
	return Array.from(equipment).slice(0, 4) // Máximo 4 equipos
}

function generateAIInsights(
	userProfile: any,
	workoutHistory: any[],
	workout: any,
	adaptations: string[]
): string {
	const insights = []

	// Análisis basado en historial
	if (workoutHistory.length > 0) {
		const recentSessions = workoutHistory.slice(0, 5)
		const avgDuration = recentSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / recentSessions.length
		
		if (avgDuration > 0) {
			if (workout.duration > avgDuration * 1.2) {
				insights.push('Este entrenamiento es más largo que tu promedio reciente')
			} else if (workout.duration < avgDuration * 0.8) {
				insights.push('Entrenamiento más corto, ideal para días ocupados')
			}
		}
	}

	// Análisis basado en objetivos
	if (userProfile.goals.includes('weight_loss')) {
		insights.push('Optimizado para maximizar la quema de calorías')
	}
	if (userProfile.goals.includes('muscle_gain')) {
		insights.push('Enfocado en el desarrollo muscular progresivo')
	}

	// Análisis de adaptaciones
	if (adaptations.length > 0) {
		insights.push('Personalizado según tus preferencias y limitaciones')
	}

	// Insight por defecto
	if (insights.length === 0) {
		insights.push('Entrenamiento balanceado adaptado a tu nivel actual')
	}

	return insights.join('. ') + '.'
}