/**
 * Notification Service
 * Servicio para crear y gestionar notificaciones de recordatorios y asignaciones
 */

import { prisma } from './db'
import { logger } from './logger'
import { notificationService as pushNotificationService } from './notifications'
import { getRedisPublisher } from './redis'
import type { NotificationEvent } from '@/app/api/notifications/sse/route'

export interface CreateNotificationData {
	title: string
	message: string
	type: 'workout_reminder' | 'workout_assigned' | 'nutrition_assigned' | 'achievement' | 'system' | 'trainer_message' | 'progress_updated'
	priority?: 'low' | 'medium' | 'high' | 'urgent'
	actionUrl?: string
	actionLabel?: string
	metadata?: Record<string, any>
	scheduledFor?: Date // Para notificaciones programadas
}

export interface NotificationTemplate {
	type: string
	title: (data: any) => string
	message: (data: any) => string
	actionUrl?: (data: any) => string
	actionLabel?: string
	priority?: 'low' | 'medium' | 'high' | 'urgent'
}

// Plantillas de notificaciones predefinidas
export const NotificationTemplates: Record<string, NotificationTemplate> = {
	workout_reminder: {
		type: 'workout_reminder',
		title: (data) => `🏋️‍♂️ Recordatorio de Entrenamiento`,
		message: (data) => `Tu rutina "${data.workoutName}" está programada ${data.timeUntil}`,
		actionUrl: (data) => `/dashboard/workouts/${data.workoutId}`,
		actionLabel: 'Ver Entrenamiento',
		priority: 'medium'
	},

	workout_assigned: {
		type: 'workout_assigned',
		title: (data) => `💪 Nueva Rutina Asignada`,
		message: (data) => `Tu trainer ${data.trainerName} te ha asignado una nueva rutina: "${data.workoutName}"`,
		actionUrl: (data) => `/dashboard/workouts/${data.workoutId}`,
		actionLabel: 'Ver Rutina',
		priority: 'high'
	},

	nutrition_assigned: {
		type: 'nutrition_assigned',
		title: (data) => `🥗 Plan de Nutrición Actualizado`,
		message: (data) => `Tu trainer ${data.trainerName} ha actualizado tu plan de nutrición`,
		actionUrl: (data) => `/dashboard/nutrition`,
		actionLabel: 'Ver Plan',
		priority: 'medium'
	},

	achievement: {
		type: 'achievement',
		title: (data) => `🏆 ¡Nuevo Logro Desbloqueado!`,
		message: (data) => `¡Felicidades! Has conseguido: ${data.achievementName}`,
		actionUrl: (data) => `/dashboard/progress`,
		actionLabel: 'Ver Progreso',
		priority: 'high'
	},

	trainer_message: {
		type: 'trainer_message',
		title: (data) => `💬 Mensaje de tu Trainer`,
		message: (data) => `${data.trainerName}: ${data.message}`,
		actionUrl: (data) => `/dashboard/messages`,
		actionLabel: 'Ver Mensaje',
		priority: 'medium'
	},

	system: {
		type: 'system',
		title: (data) => data.title || '📢 Notificación del Sistema',
		message: (data) => data.message,
		actionUrl: (data) => data.actionUrl,
		actionLabel: 'Ver Más',
		priority: 'low'
	},

	progress_updated: {
		type: 'progress_updated',
		title: (data) => `📈 Progreso Actualizado`,
		message: (data) => `${data.clientName} completó el workout "${data.workoutName}"`,
		actionUrl: (data) => `/dashboard/clients/${data.clientId}/progress`,
		actionLabel: 'Ver Progreso',
		priority: 'medium'
	}
}

export class NotificationService {
	constructor() {
		// Constructor vacío - usamos el servicio singleton existente
	}

	/**
	 * Crear una notificación
	 */
	async createNotification(userId: string, data: CreateNotificationData): Promise<string> {
		try {
			const notification = await prisma.notification.create({
				data: {
					userId,
					title: data.title,
					message: data.message,
					type: data.type,
					priority: data.priority || 'medium',
					actionUrl: data.actionUrl,
					actionLabel: data.actionLabel,
					metadata: data.metadata ? JSON.stringify(data.metadata) : null
				}
			})

			// Enviar push notification si está habilitado
			await this.sendPushNotification(userId, {
				title: data.title,
				body: data.message,
				data: {
					notificationId: notification.id,
					type: data.type,
					actionUrl: data.actionUrl,
					...data.metadata
				}
			})

			logger.info(`Notification created for user ${userId}:`, {
				notificationId: notification.id,
				type: data.type,
				title: data.title
			})

			// Publish to Redis Pub/Sub for real-time notifications
			await this.publishToRedis(notification)

			return notification.id
		} catch (error) {
			logger.error('Error creating notification:', error)
			throw error
		}
	}

	/**
	 * Crear notificación usando plantilla
	 */
	async createFromTemplate(
		userId: string,
		templateKey: string,
		templateData: any,
		options?: { scheduledFor?: Date }
	): Promise<string> {
		const template = NotificationTemplates[templateKey]
		if (!template) {
			throw new Error(`Template '${templateKey}' not found`)
		}

		return this.createNotification(userId, {
			title: template.title(templateData),
			message: template.message(templateData),
			type: template.type as any,
			priority: template.priority,
			actionUrl: template.actionUrl?.(templateData),
			actionLabel: template.actionLabel,
			metadata: templateData,
			scheduledFor: options?.scheduledFor
		})
	}

	/**
	 * Crear recordatorio de entrenamiento
	 */
	async createWorkoutReminder(
		userId: string,
		workoutId: string,
		workoutName: string,
		scheduledTime: Date,
		reminderMinutes: number = 30
	): Promise<string> {
		const reminderTime = new Date(scheduledTime.getTime() - reminderMinutes * 60 * 1000)
		const timeUntil = reminderMinutes === 30 ? 'en 30 minutos' : 
						 reminderMinutes === 60 ? 'en 1 hora' : 
						 `en ${reminderMinutes} minutos`

		return this.createFromTemplate(userId, 'workout_reminder', {
			workoutId,
			workoutName,
			timeUntil,
			scheduledTime: scheduledTime.toISOString()
		}, { scheduledFor: reminderTime })
	}

	/**
	 * Notificar asignación de rutina
	 */
	async notifyWorkoutAssignment(
		clientId: string,
		trainerId: string,
		workoutId: string,
		workoutName: string
	): Promise<string> {
		// Obtener nombre del trainer
		const trainer = await prisma.user.findUnique({
			where: { id: trainerId },
			select: { name: true }
		})

		return this.createFromTemplate(clientId, 'workout_assigned', {
			workoutId,
			workoutName,
			trainerName: trainer?.name || 'Tu trainer',
			trainerId
		})
	}

	/**
	 * Notificar asignación de plan nutricional
	 */
	async notifyNutritionAssignment(
		clientId: string,
		trainerId: string,
		planName?: string
	): Promise<string> {
		// Obtener nombre del trainer
		const trainer = await prisma.user.findUnique({
			where: { id: trainerId },
			select: { name: true }
		})

		return this.createFromTemplate(clientId, 'nutrition_assigned', {
			planName: planName || 'tu plan de nutrición',
			trainerName: trainer?.name || 'Tu trainer',
			trainerId
		})
	}

	/**
	 * Notificar logro conseguido
	 */
	async notifyAchievement(
		userId: string,
		achievementName: string,
		achievementData?: any
	): Promise<string> {
		return this.createFromTemplate(userId, 'achievement', {
			achievementName,
			...achievementData
		})
	}

	/**
	 * Enviar mensaje del trainer al cliente
	 */
	async sendTrainerMessage(
		clientId: string,
		trainerId: string,
		message: string
	): Promise<string> {
		// Obtener nombre del trainer
		const trainer = await prisma.user.findUnique({
			where: { id: trainerId },
			select: { name: true }
		})

		return this.createFromTemplate(clientId, 'trainer_message', {
			message,
			trainerName: trainer?.name || 'Tu trainer',
			trainerId
		})
	}

	/**
	 * Notificar progreso actualizado al entrenador
	 */
	async notifyProgressUpdate(
		trainerId: string,
		clientId: string,
		clientName: string,
		workoutName: string,
		progressData?: any
	): Promise<string> {
		return this.createFromTemplate(trainerId, 'progress_updated', {
			clientId,
			clientName,
			workoutName,
			...progressData
		})
	}

	/**
	 * Método genérico para enviar notificaciones (compatibilidad)
	 */
	async sendNotification(data: {
		userId: string
		type: string
		title: string
		message: string
		data?: any
	}): Promise<string> {
		return this.createNotification(data.userId, {
			title: data.title,
			message: data.message,
			type: data.type as any,
			metadata: data.data
		})
	}

	/**
	 * Obtener notificaciones de un usuario
	 */
	async getUserNotifications(
		userId: string,
		options?: {
			limit?: number
			offset?: number
			unreadOnly?: boolean
			type?: string
		}
	) {
		const where: any = { userId }
		if (options?.unreadOnly) where.isRead = false
		if (options?.type) where.type = options.type

		return prisma.notification.findMany({
			where,
			orderBy: { createdAt: 'desc' },
			take: options?.limit || 20,
			skip: options?.offset || 0
		})
	}

	/**
	 * Marcar notificaciones como leídas
	 */
	async markAsRead(notificationIds: string[]): Promise<void> {
		await prisma.notification.updateMany({
			where: { id: { in: notificationIds } },
			data: {
				isRead: true,
				readAt: new Date()
			}
		})
	}

	/**
	 * Eliminar notificaciones
	 */
	async deleteNotifications(notificationIds: string[]): Promise<void> {
		await prisma.notification.deleteMany({
			where: { id: { in: notificationIds } }
		})
	}

	/**
	 * Enviar push notification
	 */
	private async sendPushNotification(userId: string, notification: {
		title: string
		body: string
		data?: any
	}): Promise<void> {
		try {
			// Obtener suscripciones push del usuario
			const pushSubscriptions = await prisma.pushSubscription.findMany({
				where: { 
					userId,
					isActive: true
				}
			})

			if (pushSubscriptions.length === 0) {
				return
			}

			// Enviar push notification usando el servicio existente
			await pushNotificationService.showNotification({
				title: notification.title,
				body: notification.body,
				data: notification.data
			})

		} catch (error) {
			logger.error('Error sending push notification:', error)
			// No lanzar error para no interrumpir el flujo principal
		}
	}

	/**
	 * Publish notification to Redis Pub/Sub for real-time SSE
	 */
	private async publishToRedis(notification: any): Promise<void> {
		try {
			const publisher = getRedisPublisher()
			const channel = `notifications:${notification.userId}`

			// Convert to SSE notification format
			const sseNotification: NotificationEvent = {
				id: notification.id,
				type: notification.type as any,
				userId: notification.userId,
				title: notification.title,
				message: notification.message,
				data: notification.metadata || {},
				timestamp: notification.createdAt.toISOString(),
				read: notification.read
			}

			const message = JSON.stringify(sseNotification)
			await publisher.publish(channel, message)

			logger.debug(`Notification published to Redis channel: ${channel}`, {
				notificationId: notification.id
			})

		} catch (error) {
			logger.error('Error publishing notification to Redis:', error)
			// Don't throw - notification should still be created even if Redis fails
		}
	}
}

export const notificationService = new NotificationService()