import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id || session.user.role !== 'TRAINER') {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}

		// Obtener clientes del entrenador con sus métricas
		const trainer = await prisma.user.findUnique({
			where: { id: session.user.id },
			include: {
				trainerProfile: {
					include: {
						clients: {
							include: {
								user: {
									include: {
										workoutSessions: {
											where: { status: 'COMPLETED' },
											orderBy: { startTime: 'desc' },
											include: {
												exercises: true
											}
										}
									}
								}
							}
						}
					}
				}
			}
		})

		if (!trainer?.trainerProfile) {
			return NextResponse.json(
				{ error: 'Perfil de entrenador no encontrado' },
				{ status: 404 }
			)
		}

		// Procesar métricas de cada cliente
		const clientMetrics = trainer.trainerProfile.clients.map(client => {
			const sessions = client.user.workoutSessions
			const totalWorkouts = sessions.length
			const lastSession = sessions[0]
			const lastActive = lastSession ? lastSession.startTime.toISOString().split('T')[0] : 'N/A'

			// Calcular intensidad promedio basada en duración y ejercicios
			const avgIntensity = calculateAverageIntensity(sessions)

			// Calcular progreso basado en consistencia y mejora
			const progress = calculateProgress(sessions)

			// Determinar estado del cliente
			const status = determineClientStatus(sessions, lastActive)

			return {
				id: client.id,
				name: client.user.name || 'Cliente sin nombre',
				workoutsCompleted: totalWorkouts,
				avgIntensity: Math.round(avgIntensity * 10) / 10,
				progress: Math.round(progress),
				lastActive,
				status
			}
		})

		// Ordenar por progreso descendente
		clientMetrics.sort((a, b) => b.progress - a.progress)

		logger.debug(`Generated client metrics for trainer ${session.user.id}`, {
			clientCount: clientMetrics.length
		})

		return NextResponse.json(clientMetrics)

	} catch (error) {
		logger.error('Error fetching trainer client metrics', error, 'API')
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}

// Función auxiliar para calcular intensidad promedio
function calculateAverageIntensity(sessions: any[]): number {
	if (sessions.length === 0) return 0

	const totalIntensity = sessions.reduce((sum, session) => {
		// Calcular intensidad basada en duración y número de ejercicios
		const duration = session.duration || 0
		const exerciseCount = session.exercises?.length || 0
		
		// Fórmula simple: más ejercicios en menos tiempo = mayor intensidad
		let intensity = 5 // base
		if (duration > 0 && exerciseCount > 0) {
			const exercisesPerMinute = exerciseCount / (duration / 60)
			intensity = Math.min(10, Math.max(1, 3 + exercisesPerMinute * 2))
		}
		
		return sum + intensity
	}, 0)

	return totalIntensity / sessions.length
}

// Función auxiliar para calcular progreso
function calculateProgress(sessions: any[]): number {
	if (sessions.length === 0) return 0
	if (sessions.length === 1) return 25 // Progreso inicial

	// Calcular progreso basado en:
	// 1. Consistencia (frecuencia de entrenamientos)
	// 2. Duración promedio
	// 3. Tendencia de mejora

	const now = new Date()
	const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
	const recentSessions = sessions.filter(s => new Date(s.startTime) >= thirtyDaysAgo)

	// Consistencia: sesiones por semana
	const weeksInPeriod = 4
	const sessionsPerWeek = recentSessions.length / weeksInPeriod
	const consistencyScore = Math.min(100, (sessionsPerWeek / 3) * 100) // 3 sesiones/semana = 100%

	// Duración promedio
	const avgDuration = recentSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / recentSessions.length
	const durationScore = Math.min(100, (avgDuration / 60) * 100) // 60 min = 100%

	// Tendencia (comparar primera mitad vs segunda mitad)
	const midPoint = Math.floor(recentSessions.length / 2)
	const firstHalf = recentSessions.slice(midPoint)
	const secondHalf = recentSessions.slice(0, midPoint)
	
	let trendScore = 50 // neutral
	if (firstHalf.length > 0 && secondHalf.length > 0) {
		const firstAvgDuration = firstHalf.reduce((sum, s) => sum + (s.duration || 0), 0) / firstHalf.length
		const secondAvgDuration = secondHalf.reduce((sum, s) => sum + (s.duration || 0), 0) / secondHalf.length
		
		if (secondAvgDuration > firstAvgDuration) {
			trendScore = 75 // mejorando
		} else if (secondAvgDuration < firstAvgDuration * 0.8) {
			trendScore = 25 // empeorando
		}
	}

	// Promedio ponderado
	return (consistencyScore * 0.4 + durationScore * 0.3 + trendScore * 0.3)
}

// Función auxiliar para determinar estado del cliente
function determineClientStatus(sessions: any[], lastActive: string): 'active' | 'inactive' | 'at-risk' {
	if (sessions.length === 0) return 'inactive'
	
	const now = new Date()
	const lastActiveDate = new Date(lastActive)
	const daysSinceLastActive = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24))

	if (daysSinceLastActive <= 7) {
		return 'active'
	} else if (daysSinceLastActive <= 14) {
		return 'at-risk'
	} else {
		return 'inactive'
	}
}