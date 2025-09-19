import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		const { title, message, type, priority = 'medium', actionUrl, actionLabel, metadata } = await request.json()

		if (!title || !message || !type) {
			return NextResponse.json(
				{ error: 'Título, mensaje y tipo son requeridos' },
				{ status: 400 }
			)
		}

		// Validate priority
		const validPriorities = ['low', 'medium', 'high', 'urgent']
		if (!validPriorities.includes(priority)) {
			return NextResponse.json(
				{ error: 'Prioridad no válida' },
				{ status: 400 }
			)
		}

		// Create notification
		const notification = await prisma.notification.create({
			data: {
				userId: session.user.id,
				title,
				message,
				type,
				priority,
				actionUrl,
				actionLabel,
				metadata: metadata ? JSON.stringify(metadata) : null
			}
		})

		logger.info(`Notification created for user ${session.user.id}`, {
			notificationId: notification.id,
			type,
			priority
		})

		return NextResponse.json(notification)

	} catch (error) {
		logger.error('Error creating notification:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}