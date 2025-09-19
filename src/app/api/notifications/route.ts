import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { websocketService } from '@/lib/websocket'
import { z } from 'zod'
import { withSecurity } from '@/middleware/security-middleware'

async function baseGET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		const { searchParams } = new URL(request.url)
		const page = parseInt(searchParams.get('page') || '1')
		const limit = parseInt(searchParams.get('limit') || '20')
		const unreadOnly = searchParams.get('unreadOnly') === 'true'
		const type = searchParams.get('type')

		const skip = (page - 1) * limit

		const where: any = {
			userId: session.user.id
		}

		if (unreadOnly) {
			where.isRead = false
		}

		if (type) {
			where.type = type
		}

		const [notifications, total] = await Promise.all([
			prisma.notification.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				skip,
				take: limit
			}),
			prisma.notification.count({ where })
		])

		return NextResponse.json({
			notifications,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit)
		})

	} catch (error) {
		logger.error('Error fetching notifications:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}

async function basePATCH(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		const { notificationIds, action } = await request.json()

		if (!notificationIds || !Array.isArray(notificationIds)) {
			return NextResponse.json(
				{ error: 'IDs de notificación requeridos' },
				{ status: 400 }
			)
		}

		const updateData: any = {}

		switch (action) {
			case 'markAsRead':
				updateData.isRead = true
				updateData.readAt = new Date()
				break
			case 'markAsUnread':
				updateData.isRead = false
				updateData.readAt = null
				break
			case 'archive':
				updateData.isArchived = true
				updateData.archivedAt = new Date()
				break
			case 'unarchive':
				updateData.isArchived = false
				updateData.archivedAt = null
				break
			default:
				return NextResponse.json(
					{ error: 'Acción no válida' },
					{ status: 400 }
				)
		}

		const updatedNotifications = await prisma.notification.updateMany({
			where: {
				id: { in: notificationIds },
				userId: session.user.id
			},
			data: updateData
		})

		return NextResponse.json({
			success: true,
			updated: updatedNotifications.count
		})

	} catch (error) {
		logger.error('Error updating notifications:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}

// Esquema de validación para crear notificaciones
const createNotificationSchema = z.object({
	userId: z.string().min(1, 'ID de usuario requerido'),
	title: z.string().min(1, 'Título requerido').max(100, 'Título muy largo'),
	message: z.string().min(1, 'Mensaje requerido').max(500, 'Mensaje muy largo'),
	type: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'WORKOUT', 'NUTRITION', 'PROGRESS']).default('INFO'),
	actionUrl: z.string().optional(),
	metadata: z.record(z.any()).optional()
})

async function basePOST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		// Solo coaches y admins pueden crear notificaciones
		if (session.user.role !== 'COACH' && session.user.role !== 'ADMIN') {
			return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
		}

		const body = await request.json()
		const validatedData = createNotificationSchema.parse(body)

		// Verificar que el usuario objetivo existe
		const targetUser = await prisma.user.findUnique({
			where: { id: validatedData.userId }
		})

		if (!targetUser) {
			return NextResponse.json(
				{ error: 'Usuario no encontrado' },
				{ status: 404 }
			)
		}

		// Crear la notificación
		const notification = await prisma.notification.create({
			data: {
				userId: validatedData.userId,
				title: validatedData.title,
				message: validatedData.message,
				type: validatedData.type,
				actionUrl: validatedData.actionUrl,
				metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null
			}
		})

		// Enviar notificación via WebSocket
		try {
			websocketService.sendNotificationToUser(validatedData.userId, {
				id: notification.id,
				title: notification.title,
				message: notification.message,
				type: notification.type,
				createdAt: notification.createdAt.toISOString()
			})
		} catch (wsError) {
			logger.warn('Failed to send WebSocket notification:', wsError)
			// No fallar la creación si WebSocket falla
		}

		logger.info(`Notification created: ${notification.id} for user ${validatedData.userId}`)

		return NextResponse.json({
			id: notification.id,
			title: notification.title,
			message: notification.message,
			type: notification.type,
			createdAt: notification.createdAt,
			isRead: notification.isRead
		}, { status: 201 })

	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Datos inválidos', details: error.errors },
				{ status: 400 }
			)
		}

		logger.error('Error creating notification:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}

async function baseDELETE(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		const { notificationIds } = await request.json()

		if (!notificationIds || !Array.isArray(notificationIds)) {
			return NextResponse.json(
				{ error: 'IDs de notificación requeridos' },
				{ status: 400 }
			)
		}

		const deletedNotifications = await prisma.notification.deleteMany({
			where: {
				id: { in: notificationIds },
				userId: session.user.id
			}
		})

		return NextResponse.json({
			success: true,
			deleted: deletedNotifications.count
		})

	} catch (error) {
		logger.error('Error deleting notifications:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}

// Secure wrappers
export const GET = withSecurity(baseGET, {
  csrf: { enabled: false, methods: [] },
  authentication: { required: true },
  rateLimiting: { enabled: true, requests: 120, window: 60 * 1000 },
  logging: { enabled: true, logLevel: 'LOW' }
})

export const POST = withSecurity(basePOST, {
  csrf: { enabled: true, methods: ['POST'] },
  authentication: { required: true },
  rateLimiting: { enabled: true, requests: 20, window: 60 * 1000 },
  logging: { enabled: true, logLevel: 'HIGH' }
})

export const PATCH = withSecurity(basePATCH, {
  csrf: { enabled: true, methods: ['PATCH'] },
  authentication: { required: true },
  rateLimiting: { enabled: true, requests: 60, window: 60 * 1000 },
  logging: { enabled: true, logLevel: 'MEDIUM' }
})

export const DELETE = withSecurity(baseDELETE, {
  csrf: { enabled: true, methods: ['DELETE'] },
  authentication: { required: true },
  rateLimiting: { enabled: true, requests: 20, window: 60 * 1000 },
  logging: { enabled: true, logLevel: 'HIGH' }
})