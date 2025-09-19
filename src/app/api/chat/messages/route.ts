import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import webpush from 'web-push'

// Configure web-push (skip during build or if invalid)
try {
  if (
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_EMAIL &&
    process.env.VAPID_EMAIL.includes('@')
  ) {
    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_EMAIL}`,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    )
  }
} catch (err) {
  // Log and continue without crashing build/prerender
  logger?.error?.('Failed to configure VAPID in chat/messages route', err)
}

interface SendMessageRequest {
	conversationId: string
	content: string
	type?: 'TEXT' | 'WORKOUT_ASSIGNMENT' | 'IMAGE' | 'FILE'
}

/**
 * POST /api/chat/messages
 * Envía un nuevo mensaje en una conversación específica
 */
export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}

		const body: SendMessageRequest = await request.json()
		const { conversationId, content, type = 'TEXT' } = body
		const senderId = session.user.id

		// Validaciones básicas
		if (!conversationId || !content.trim()) {
			return NextResponse.json(
				{ error: 'Conversación y contenido son requeridos' },
				{ status: 400 }
			)
		}

		// Verificar que la conversación existe y el usuario tiene acceso
		const conversation = await prisma.conversation.findUnique({
			where: { id: conversationId }
		})

		if (!conversation) {
			return NextResponse.json(
				{ error: 'Conversación no encontrada' },
				{ status: 404 }
			)
		}

		// Verificar que el usuario es participante de la conversación
		if (conversation.user1Id !== senderId && conversation.user2Id !== senderId) {
			return NextResponse.json(
				{ error: 'Acceso denegado a esta conversación' },
				{ status: 403 }
			)
		}

		// Crear el mensaje
		const message = await prisma.message.create({
			data: {
				conversationId,
				senderId,
				content: content.trim(),
				type,
				isRead: false
			},
			include: {
				sender: {
					select: {
						id: true,
						name: true,
						avatar: true
					}
				}
			}
		})

		// Actualizar la conversación con el último mensaje
		await prisma.conversation.update({
			where: { id: conversationId },
			data: {
				lastMessage: content.trim(),
				lastMessageAt: new Date()
			}
		})

		// Actualizar el estado de actividad del usuario
		await prisma.user.update({
			where: { id: senderId },
			data: {
				isOnline: true,
				lastSeen: new Date()
			}
		})

		// Formatear respuesta
		const formattedMessage = {
			id: message.id,
			conversationId: message.conversationId,
			senderId: message.senderId,
			content: message.content,
			type: message.type,
			isRead: message.isRead,
			createdAt: message.createdAt,
			sender: message.sender
		}

		logger.info(`Message sent in conversation ${conversationId}`, {
			messageId: message.id,
			type: message.type,
			senderId
		})

		// Send push notification to the recipient
		try {
			const recipientId = conversation.user1Id === senderId ? conversation.user2Id : conversation.user1Id
			
			// Get recipient's push subscriptions
			const subscriptions = await prisma.pushSubscription.findMany({
				where: {
					userId: recipientId,
					isActive: true
				}
			})

			if (subscriptions.length > 0) {
				const senderName = message.sender.name || 'Usuario'
				const notificationPayload = {
					title: `💬 Mensaje de ${senderName}`,
					body: content.length > 50 ? content.substring(0, 50) + '...' : content,
					icon: '/icons/icon-192x192.png',
					badge: '/icons/badge-72x72.png',
					tag: 'new-message',
					data: {
						type: 'new_message',
						conversationId,
						senderId,
						url: `/chat?conversation=${conversationId}`
					},
					actions: [
						{ action: 'reply', title: 'Responder', icon: '/icons/reply.png' },
						{ action: 'view', title: 'Ver', icon: '/icons/view.png' }
					]
				}

				// Send push notifications
				for (const subscription of subscriptions) {
					try {
						const pushSubscription = {
							endpoint: subscription.endpoint,
							keys: {
								p256dh: subscription.p256dh,
								auth: subscription.auth
							}
						}

						await webpush.sendNotification(
							pushSubscription,
							JSON.stringify(notificationPayload)
						)

						logger.info(`Push notification sent for new message to user ${recipientId}`)
					} catch (pushError: any) {
						logger.error(`Failed to send push notification:`, pushError)
						
						// If subscription is invalid, deactivate it
						if (pushError.statusCode === 410) {
							await prisma.pushSubscription.update({
								where: { id: subscription.id },
								data: { isActive: false }
							})
						}
					}
				}

				// Create in-app notification
				await prisma.notification.create({
					data: {
						userId: recipientId,
						title: `Mensaje de ${senderName}`,
						message: content.length > 100 ? content.substring(0, 100) + '...' : content,
						type: 'message',
						priority: 'medium',
						actionUrl: `/chat?conversation=${conversationId}`,
						actionLabel: 'Ver conversación',
						metadata: JSON.stringify({
							conversationId,
							senderId,
							messageId: message.id
						})
					}
				})
			}
		} catch (notificationError) {
			logger.error('Error sending notification for new message:', notificationError)
			// Don't fail the message sending if notification fails
		}

		return NextResponse.json(formattedMessage, { status: 201 })

	} catch (error) {
		logger.error('Error sending message:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}
