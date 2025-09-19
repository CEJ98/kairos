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

		const { searchParams } = new URL(request.url)
		const timeRange = searchParams.get('timeRange') || '30d'

		// Calcular fechas basadas en el rango de tiempo
		const endDate = new Date()
		const startDate = new Date()

		switch (timeRange) {
			case '7d':
				startDate.setDate(endDate.getDate() - 7)
				break
			case '30d':
				startDate.setDate(endDate.getDate() - 30)
				break
			case '90d':
				startDate.setDate(endDate.getDate() - 90)
				break
			case '1y':
				startDate.setFullYear(endDate.getFullYear() - 1)
				break
			default:
				startDate.setDate(endDate.getDate() - 30)
		}

		// Obtener datos históricos del entrenador
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
											where: {
												startTime: {
													gte: startDate,
													lte: endDate
												}
											},
											orderBy: { startTime: 'asc' }
										}
									}
								}
							}
						}
					}
				},
				createdWorkouts: {
					where: {
						createdAt: {
							gte: startDate,
							lte: endDate
						}
					}
				},
				subscriptions: {
					where: {
						status: 'ACTIVE',
						createdAt: {
							gte: startDate,
							lte: endDate
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

		// Generar datos históricos por semana
		const historicalData = []
		const weeklyData = new Map<string, any>()

		// Inicializar semanas
		const current = new Date(startDate)
		while (current <= endDate) {
			const weekKey = current.toISOString().split('T')[0]
			weeklyData.set(weekKey, {
				date: weekKey,
				clients: 0,
				workouts: 0,
				revenue: 0,
				engagement: 0
			})
			current.setDate(current.getDate() + 7)
		}

		// Procesar datos de clientes y entrenamientos
		let totalRevenue = 0
		trainer.trainerProfile.clients.forEach(client => {
			client.user.workoutSessions.forEach(session => {
				const sessionDate = new Date(session.startTime)
				const weekStart = new Date(sessionDate)
				weekStart.setDate(sessionDate.getDate() - sessionDate.getDay())
				const weekKey = weekStart.toISOString().split('T')[0]

				if (weeklyData.has(weekKey)) {
					const weekData = weeklyData.get(weekKey)
					weekData.workouts += 1
					weekData.engagement += session.duration || 45
				}
			})
		})

		// Calcular ingresos por suscripciones (estimación basada en tipo de plan)
		const planPrices = {
			'FREE': 0,
			'BASIC': 29,
			'PRO': 59,
			'TRAINER': 99,
			'ENTERPRISE': 199
		}

		trainer.subscriptions.forEach(sub => {
			const subDate = new Date(sub.createdAt)
			const weekStart = new Date(subDate)
			weekStart.setDate(subDate.getDate() - subDate.getDay())
			const weekKey = weekStart.toISOString().split('T')[0]
			const planPrice = planPrices[sub.planType as keyof typeof planPrices] || 0

			if (weeklyData.has(weekKey)) {
				const weekData = weeklyData.get(weekKey)
				weekData.revenue += planPrice
			}
			totalRevenue += planPrice
		})

		// Calcular número de clientes por semana
		let cumulativeClients = 0
		for (const [weekKey, data] of weeklyData.entries()) {
			// Contar clientes activos en esa semana
			const weekDate = new Date(weekKey)
			const activeClientsThisWeek = trainer.trainerProfile.clients.filter(client => {
				// Usar la fecha de creación del usuario como referencia
				const clientCreated = new Date(client.user.createdAt)
				return clientCreated <= weekDate
			}).length

			data.clients = activeClientsThisWeek
			data.engagement = Math.round(data.engagement / Math.max(data.workouts, 1))
			historicalData.push(data)
		}

		// Ordenar por fecha
		historicalData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

		logger.debug(`Generated historical data for trainer ${session.user.id}`, {
			timeRange,
			dataPoints: historicalData.length
		})

		return NextResponse.json(historicalData)

	} catch (error) {
		logger.error('Error fetching trainer historical data', error, 'API')
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}