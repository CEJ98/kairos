import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { WorkoutEngine } from '@/lib/workout-engine'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const AdaptiveWorkoutRequestSchema = z.object({
	targetDuration: z.number().min(10).max(180).optional().default(45),
	focusAreas: z.array(z.string()).optional().default([]),
	difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
	equipment: z.array(z.string()).optional().default([])
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
		const validatedData = AdaptiveWorkoutRequestSchema.parse(body)

		// Inicializar el motor de workouts
		const workoutEngine = new WorkoutEngine()

		// Generar workout adaptativo
		const adaptiveWorkout = await workoutEngine.createAdaptiveWorkout(
			session.user.id,
			validatedData.targetDuration,
			validatedData.focusAreas
		)

		if (!adaptiveWorkout) {
			return NextResponse.json(
				{ error: 'No se pudo generar un workout adaptativo. Intenta con diferentes parámetros.' },
				{ status: 400 }
			)
		}

		// Obtener sugerencias de progresión
		const progressionSuggestions = await workoutEngine.generateProgressionSuggestions(
			session.user.id
		)

		logger.debug(`Generated adaptive workout for user ${session.user.id}`, {
			targetDuration: validatedData.targetDuration,
			focusAreas: validatedData.focusAreas,
			exerciseCount: adaptiveWorkout.exercises.length
		})

		return NextResponse.json({
			workout: adaptiveWorkout,
			progressionSuggestions: progressionSuggestions.slice(0, 5), // Top 5 sugerencias
			aiInsights: generateAdaptiveInsights(
				adaptiveWorkout,
				progressionSuggestions,
				validatedData
			)
		})

	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Datos de entrada inválidos', details: error.errors },
				{ status: 400 }
			)
		}

		logger.error('Error generating adaptive workout', error, 'API')
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}

// Función auxiliar para generar insights sobre el workout adaptativo
function generateAdaptiveInsights(
	workout: any,
	progressionSuggestions: any[],
	params: any
): string {
	const insights = []

	// Análisis del workout generado
	if (workout.exercises.length >= 6) {
		insights.push('Workout completo con variedad de ejercicios')
	} else if (workout.exercises.length >= 4) {
		insights.push('Workout enfocado y eficiente')
	} else {
		insights.push('Workout concentrado en movimientos clave')
	}

	// Análisis de progresión
	if (progressionSuggestions.length > 0) {
		insights.push(`Incluye ${progressionSuggestions.length} oportunidades de progresión identificadas por la IA`)
	}

	// Análisis de duración
	if (params.targetDuration <= 30) {
		insights.push('Optimizado para sesiones rápidas y efectivas')
	} else if (params.targetDuration >= 60) {
		insights.push('Diseñado para una sesión completa y desafiante')
	}

	// Análisis de áreas de enfoque
	if (params.focusAreas.length > 0) {
		insights.push(`Personalizado para trabajar: ${params.focusAreas.join(', ')}`)
	} else {
		insights.push('Entrenamiento balanceado para desarrollo integral')
	}

	return insights.join('. ') + '.'
}