import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

/**
 * GET /api/chat/conversations
 * Obtiene todas las conversaciones del usuario actual
 */
export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}

		const userId = session.user.id

		// Obtener todas las conversaciones donde el usuario participa
		const conversations = await prisma.conversation.findMany({
			where: {
				OR: [
					{ user1Id: userId },
					{ user2Id: userId }
				]
			},
			include: {
				messages: {
					orderBy: {
						createdAt: 'desc'
					},
					take: 1,
					include: {
						sender: {
							select: {
								id: true,
								name: true,
								avatar: true
							}
						}
					}
				}
			},
			orderBy: {
				updatedAt: 'desc'
			}
		})

		// Procesar conversaciones para obtener información del otro usuario
		const processedConversations = await Promise.all(
			conversations.map(async (conversation) => {
				const otherUserId = conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id
				
				// Obtener información del otro usuario
				const otherUser = await prisma.user.findUnique({
					where: { id: otherUserId },
					select: {
						id: true,
						name: true,
						avatar: true,
						isOnline: true,
						lastSeen: true
					}
				})

				// Contar mensajes no leídos
				const unreadCount = await prisma.message.count({
					where: {
						conversationId: conversation.id,
						senderId: { not: userId },
						isRead: false
					}
				})

				return {
					id: conversation.id,
					otherUser,
					lastMessage: conversation.messages[0] || null,
					unreadCount,
					updatedAt: conversation.updatedAt
				}
			})
		)

		return NextResponse.json({
			conversations: processedConversations.filter(conv => conv.otherUser),
			total: processedConversations.length
		})

	} catch (error) {
		logger.error('Error fetching conversations:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}

/**
 * POST /api/chat/conversations
 * Crear una nueva conversación o obtener una existente
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

		const { otherUserId } = await request.json()
		if (!otherUserId) {
			return NextResponse.json(
				{ error: 'ID del otro usuario requerido' },
				{ status: 400 }
			)
		}

		const userId = session.user.id

		// Verificar que el otro usuario existe
		const otherUser = await prisma.user.findUnique({
			where: { id: otherUserId },
			select: {
				id: true,
				name: true,
				email: true,
				avatar: true,
				role: true,
				isOnline: true,
				lastSeen: true
			}
		})

		if (!otherUser) {
			return NextResponse.json(
				{ error: 'Usuario no encontrado' },
				{ status: 404 }
			)
		}

		// Buscar conversación existente
		let conversation = await prisma.conversation.findFirst({
			where: {
				OR: [
					{ user1Id: userId, user2Id: otherUserId },
					{ user1Id: otherUserId, user2Id: userId }
				]
			},
			include: {
				messages: {
					orderBy: {
						createdAt: 'desc'
					},
					take: 1
				}
			}
		})

		// Si no existe, crear nueva conversación
		if (!conversation) {
			conversation = await prisma.conversation.create({
				data: {
					user1Id: userId,
					user2Id: otherUserId
				},
				include: {
					messages: true
				}
			})
		}

		// Contar mensajes no leídos
		const unreadCount = await prisma.message.count({
			where: {
				conversationId: conversation.id,
				senderId: { not: userId },
				isRead: false
			}
		})

		const response = {
			id: conversation.id,
			otherUser,
			lastMessage: conversation.messages[0] || null,
			unreadCount,
			updatedAt: conversation.updatedAt
		}

		logger.info(`Created/retrieved conversation ${conversation.id}`)
		return NextResponse.json(response)

	} catch (error) {
		logger.error('Error creating conversation:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}