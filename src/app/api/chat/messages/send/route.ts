import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

interface SendMessageRequest {
	toId: string
	content: string
	type?: 'TEXT' | 'IMAGE' | 'FILE'
}

/**
 * POST /api/chat/messages/send
 * Envía un nuevo mensaje
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
		const { toId, content, type = 'TEXT' } = body
		const fromId = session.user.id

		// Validaciones básicas
		if (!toId || !content.trim()) {
			return NextResponse.json(
				{ error: 'Destinatario y contenido son requeridos' },
				{ status: 400 }
			)
		}

		if (fromId === toId) {
			return NextResponse.json(
				{ error: 'No puedes enviarte mensajes a ti mismo' },
				{ status: 400 }
			)
		}

		// Verificar que el destinatario existe
		const recipient = await prisma.user.findUnique({
			where: { id: toId },
			select: { id: true, name: true, role: true }
		})

		if (!recipient) {
			return NextResponse.json(
				{ error: 'Destinatario no encontrado' },
				{ status: 404 }
			)
		}

		// Crear el mensaje
		// Crear o encontrar conversación
		let conversation = await prisma.conversation.findFirst({
			where: {
				OR: [
					{ user1Id: fromId, user2Id: toId },
					{ user1Id: toId, user2Id: fromId }
				]
			}
		})

		if (!conversation) {
			conversation = await prisma.conversation.create({
				data: {
					user1Id: fromId,
					user2Id: toId
				}
			})
		}

		const message = await prisma.message.create({
			data: {
				conversationId: conversation.id,
				senderId: fromId,
				content: content.trim(),
				type,
				isRead: false
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
			metadata: {}
		}

		logger.info(`Message sent from ${fromId} to ${toId}`, {
			messageId: message.id,
			type: message.type
		})

		// TODO: Aquí se podría implementar notificaciones push en tiempo real
		// usando WebSockets, Server-Sent Events, o servicios como Pusher

		return NextResponse.json(formattedMessage, { status: 201 })

	} catch (error) {
		logger.error('Error sending message:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}