import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

export interface TrainerMetrics {
	totalClients: number
	activeClients: number
	newClientsThisMonth: number
	monthlyRevenue: number
	avgSessionRating: number
	completedWorkouts: number
	upcomingAppointments: number
	adherenceRate: number
}

export interface ClientMetrics {
	id: string
	name: string
	email: string
	avatar?: string
	joinDate: string
	subscription: string
	lastWorkout?: string
	streak: number
	progress: number
	nextSession?: string
	adherenceRate: number
	totalWorkouts: number
	completedWorkouts: number
}

export interface RecentActivity {
	id: string
	type: 'workout_completed' | 'new_client' | 'message' | 'milestone' | 'missed_session'
	client: string
	clientName?: string
	action: string
	description?: string
	time: string
	timestamp?: Date
	rating?: number
	subscription?: string
	preview?: string
	metadata?: {
		workoutName?: string
		rating?: number
		subscription?: string
	}
}

export interface UpcomingSession {
	id: string
	client: string
	type: string
	time: string
	duration: number
	location: string
	status: 'scheduled' | 'confirmed' | 'cancelled'
}

export class TrainerMetricsService {
	static async getTrainerMetrics(trainerId: string): Promise<TrainerMetrics> {
		try {
			const now = new Date()
			const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
			const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
			const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

			// Obtener clientes del trainer
			const clients = await prisma.clientProfile.findMany({
				where: { trainerId },
				include: {
					user: {
						include: {
							subscriptions: true
						}
					}
				}
			})

			const totalClients = clients.length
			const newClientsThisMonth = clients.filter(client => 
				new Date(client.createdAt) >= startOfMonth
			).length

			// Calcular clientes activos (con sesiones en los últimos 30 días)
			const thirtyDaysAgo = new Date()
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

			const activeClientIds = await prisma.workoutSession.findMany({
				where: {
					startTime: { gte: thirtyDaysAgo },
					workout: {
						creatorId: trainerId
					}
				},
				select: { userId: true },
				distinct: ['userId']
			})

			const activeClients = activeClientIds.length

			// Calcular ingresos mensuales (basado en suscripciones activas)
			const monthlyRevenue = clients.reduce((total, client) => {
				const activeSubscription = client.user.subscriptions.find((sub: any) => 
					sub.status === 'ACTIVE'
				)
				if (activeSubscription) {
					// Precio base según el plan (esto debería venir de Stripe)
					const planPrices = {
						'BASIC': 29.99,
						'PRO': 59.99,
						'TRAINER': 99.99
					}
					return total + (planPrices[activeSubscription.planType as keyof typeof planPrices] || 0)
				}
				return total
			}, 0)

			// Obtener entrenamientos completados este mes
			const completedWorkouts = await prisma.workoutSession.count({
				where: {
					startTime: { gte: startOfMonth },
					status: 'COMPLETED',
					workout: {
						creatorId: trainerId
					}
				}
			})

			// Calcular rating promedio (simulado por ahora)
			const avgSessionRating = 4.8

			// Próximas citas (simulado por ahora)
			const upcomingAppointments = 12

			// Calcular tasa de adherencia
			const adherenceRate = await this.calculateAdherenceRate(trainerId)

			return {
				totalClients,
				activeClients,
				newClientsThisMonth,
				monthlyRevenue,
				avgSessionRating,
				completedWorkouts,
				upcomingAppointments,
				adherenceRate
			}

		} catch (error) {
			logger.error('Error getting trainer metrics:', error, 'TrainerMetrics')
			throw error
		}
	}

	static async getClientMetrics(trainerId: string, limit: number = 10): Promise<ClientMetrics[]> {
		try {
			// Obtener clientes del trainer con métricas
		const clients = await prisma.clientProfile.findMany({
			where: { trainerId },
			include: {
				user: {
					include: {
						subscriptions: true
					}
				}
			},
			take: limit,
			orderBy: { createdAt: 'desc' }
		})

			const clientMetrics = await Promise.all(
				clients.map(async (client) => {
					// Obtener última sesión
					const lastSession = await prisma.workoutSession.findFirst({
						where: {
							userId: client.userId,
							workout: { creatorId: trainerId }
						},
						orderBy: { startTime: 'desc' }
					})

					// Calcular racha actual
					const streak = await this.calculateClientStreak(client.userId, trainerId)

					// Calcular adherencia del cliente
					const adherenceRate = await this.calculateClientAdherence(client.userId, trainerId)

					// Obtener total de entrenamientos asignados y completados
					const totalWorkouts = await prisma.workout.count({
						where: {
							creatorId: trainerId,
							assignedToId: client.userId
						}
					})

					const completedWorkouts = await prisma.workoutSession.count({
						where: {
							userId: client.userId,
							status: 'COMPLETED',
							workout: { creatorId: trainerId }
						}
					})

					const activeSubscription = client.user.subscriptions.find((sub: any) => sub.status === 'ACTIVE')

					return {
						id: client.userId,
						name: client.user.name || 'Sin nombre',
						email: client.user.email,
						avatar: client.user.avatar || undefined,
						joinDate: client.createdAt.toISOString().split('T')[0],
						subscription: activeSubscription?.planType || 'FREE',
						lastWorkout: lastSession?.startTime.toISOString().split('T')[0],
						streak,
						progress: Math.round(adherenceRate),
						adherenceRate,
						totalWorkouts,
						completedWorkouts
					}
				})
			)

			return clientMetrics

		} catch (error) {
			logger.error('Error getting client metrics:', error, 'TrainerMetrics')
			throw error
		}
	}

	static async getRecentActivity(trainerId: string, limit: number = 10): Promise<RecentActivity[]> {
		try {
			const activities: RecentActivity[] = []

			// Entrenamientos completados recientes
			const recentSessions = await prisma.workoutSession.findMany({
				where: {
					status: 'COMPLETED',
					workout: { creatorId: trainerId }
				},
				include: {
					user: true,
					workout: true
				},
				orderBy: { endTime: 'desc' },
				take: 5
			})

			recentSessions.forEach(session => {
				activities.push({
					id: `session-${session.id}`,
					type: 'workout_completed',
					client: session.user.name || 'Cliente',
					clientName: session.user.name || 'Cliente',
					action: `completó ${session.workout.name}`,
					description: `completó ${session.workout.name}`,
					time: this.formatTimeAgo(session.endTime || session.startTime),
					timestamp: session.endTime || session.startTime,
					rating: session.rating || 5,
					metadata: {
						workoutName: session.workout.name,
						rating: session.rating || 5
					}
				})
			})

			// Nuevos clientes recientes (últimos 7 días para actividad)
			const sevenDaysAgo = new Date()
			sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
			
			const newClients = await prisma.clientProfile.findMany({
				where: { 
					trainerId,
					createdAt: { gte: sevenDaysAgo }
				},
				include: {
					user: {
						include: {
							subscriptions: true
						}
					}
				},
				orderBy: { createdAt: 'desc' },
				take: 3
			})

			newClients.forEach(client => {
				const activeSubscription = client.user.subscriptions.find((sub: any) => sub.status === 'ACTIVE')
				activities.push({
					id: `client-${client.id}`,
					type: 'new_client',
					client: client.user.name || 'Cliente',
					clientName: client.user.name || 'Cliente',
					action: 'se unió como cliente',
					description: 'se unió como cliente',
					time: this.formatTimeAgo(client.createdAt),
					timestamp: client.createdAt,
					subscription: activeSubscription?.planType || 'FREE',
					metadata: {
						subscription: activeSubscription?.planType || 'FREE'
					}
				})
			})

			// Ordenar por tiempo y limitar
			return activities
				.sort((a, b) => {
					// Ordenar por tiempo (más reciente primero)
					const timeA = this.parseTimeAgo(a.time)
					const timeB = this.parseTimeAgo(b.time)
					return timeA - timeB
				})
				.slice(0, limit)

		} catch (error) {
			logger.error('Error getting recent activity:', error, 'TrainerMetrics')
			throw error
		}
	}

	private static async calculateAdherenceRate(trainerId: string): Promise<number> {
		try {
			const thirtyDaysAgo = new Date()
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

			// Obtener entrenamientos asignados en los últimos 30 días
			const assignedWorkouts = await prisma.workout.count({
				where: {
					creatorId: trainerId,
					createdAt: { gte: thirtyDaysAgo }
				}
			})

			// Obtener sesiones completadas en los últimos 30 días
			const completedSessions = await prisma.workoutSession.count({
				where: {
					status: 'COMPLETED',
					startTime: { gte: thirtyDaysAgo },
					workout: { creatorId: trainerId }
				}
			})

			if (assignedWorkouts === 0) return 0
			return Math.round((completedSessions / assignedWorkouts) * 100)

		} catch (error) {
			logger.error('Error calculating adherence rate:', error, 'TrainerMetrics')
			return 0
		}
	}

	private static async calculateClientStreak(userId: string, trainerId: string): Promise<number> {
		try {
			const sessions = await prisma.workoutSession.findMany({
				where: {
					userId,
					status: 'COMPLETED',
					workout: { creatorId: trainerId }
				},
				orderBy: { endTime: 'desc' },
				take: 30 // Últimas 30 sesiones
			})

			if (sessions.length === 0) return 0

			let streak = 0
			let currentDate = new Date()
			currentDate.setHours(0, 0, 0, 0)

			for (const session of sessions) {
				const sessionDate = new Date(session.endTime || session.startTime)
				sessionDate.setHours(0, 0, 0, 0)

				const daysDiff = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))

				if (daysDiff === streak) {
					streak++
				} else if (daysDiff > streak + 1) {
					break
				}
			}

			return streak

		} catch (error) {
			logger.error('Error calculating client streak:', error, 'TrainerMetrics')
			return 0
		}
	}

	private static async calculateClientAdherence(userId: string, trainerId: string): Promise<number> {
		try {
			const thirtyDaysAgo = new Date()
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

			// Entrenamientos asignados al cliente en los últimos 30 días
			const assignedWorkouts = await prisma.workout.count({
				where: {
					creatorId: trainerId,
					assignedToId: userId,
					createdAt: { gte: thirtyDaysAgo }
				}
			})

			// Sesiones completadas por el cliente en los últimos 30 días
			const completedSessions = await prisma.workoutSession.count({
				where: {
					userId,
					status: 'COMPLETED',
					startTime: { gte: thirtyDaysAgo },
					workout: { creatorId: trainerId }
				}
			})

			if (assignedWorkouts === 0) return 0
			return (completedSessions / assignedWorkouts) * 100

		} catch (error) {
			logger.error('Error calculating client adherence:', error, 'TrainerMetrics')
			return 0
		}
	}

	private static formatTimeAgo(date: Date): string {
		const now = new Date()
		const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

		if (diffInMinutes < 60) {
			return `hace ${diffInMinutes} minutos`
		} else if (diffInMinutes < 1440) { // 24 horas
			const hours = Math.floor(diffInMinutes / 60)
			return `hace ${hours} hora${hours > 1 ? 's' : ''}`
		} else {
			const days = Math.floor(diffInMinutes / 1440)
			return `hace ${days} día${days > 1 ? 's' : ''}`
		}
	}

	private static parseTimeAgo(timeString: string): number {
		// Convertir string de tiempo a minutos para ordenar
		const match = timeString.match(/(\d+)\s+(minuto|hora|día)s?/)
		if (!match) return 0

		const value = parseInt(match[1])
		const unit = match[2]

		switch (unit) {
			case 'minuto': return value
			case 'hora': return value * 60
			case 'día': return value * 1440
			default: return 0
		}
	}
}