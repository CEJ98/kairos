import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

/**
 * GET /api/chat/messages/[conversationId]
 * Obtiene todos los mensajes de una conversación específica
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ conversationId: string }> }
) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}

		const { conversationId } = await params
		const userId = session.user.id

		// Verificar que la conversación existe
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
		if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
			return NextResponse.json(
				{ error: 'Acceso denegado a esta conversación' },
				{ status: 403 }
			)
		}

		// Obtener parámetros de paginación
		const url = new URL(request.url)
		const page = parseInt(url.searchParams.get('page') || '1')
		const limit = parseInt(url.searchParams.get('limit') || '50')
		const skip = (page - 1) * limit

		// Obtener mensajes de la conversación
		const messages = await prisma.message.findMany({
			where: {
				conversationId: conversationId
			},
			include: {
				sender: {
					select: {
						id: true,
						name: true,
						avatar: true,
						role: true
					}
				}
			},
			orderBy: {
				createdAt: 'desc'
			},
			skip,
			take: limit
		})

		// Contar total de mensajes para paginación
		const totalMessages = await prisma.message.count({
			where: {
				conversationId: conversationId
			}
		})

		// Formatear mensajes
		const formattedMessages = messages.map(message => ({
			id: message.id,
			conversationId: message.conversationId,
			senderId: message.senderId,
			content: message.content,
			type: message.type,
			isRead: message.isRead,
			readAt: message.readAt,
			createdAt: message.createdAt,
			sender: message.sender
		}))

		// Respuesta con paginación
		const response = {
			messages: formattedMessages.reverse(), // Mostrar más antiguos primero
			pagination: {
				page,
				limit,
				total: totalMessages,
				totalPages: Math.ceil(totalMessages / limit),
				hasNext: skip + limit < totalMessages,
				hasPrev: page > 1
			}
		}

		logger.info(`Loaded ${messages.length} messages for conversation ${conversationId}`, {
			userId,
			page,
			limit
		})

		return NextResponse.json(response)

	} catch (error) {
		logger.error('Error loading messages:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}