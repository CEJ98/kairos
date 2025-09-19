import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

/**
 * POST /api/chat/messages/[conversationId]/read
 * Marca todos los mensajes de una conversación como leídos
 */
export async function POST(
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

		// Marcar como leídos todos los mensajes no enviados por el usuario actual
		const updateResult = await prisma.message.updateMany({
			where: {
				conversationId: conversationId,
				senderId: { not: userId },
				isRead: false
			},
			data: {
				isRead: true
			}
		})

		logger.info(`Marked ${updateResult.count} messages as read in conversation ${conversationId}`)
		return NextResponse.json({ 
			success: true, 
			markedAsRead: updateResult.count 
		})

	} catch (error) {
		logger.error('Error marking messages as read:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}