/**
 * API Route: Notificaciones de Logros
 * POST /api/notifications/achievement
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notificationService } from '@/lib/notification-service'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

// POST /api/notifications/achievement
// Notificar logro conseguido
export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}

		const { userId, achievementName, achievementData } = await request.json()

		if (!userId || !achievementName) {
			return NextResponse.json(
				{ error: 'userId y achievementName son requeridos' },
				{ status: 400 }
			)
		}

		// Verificar que el usuario objetivo existe
		const targetUser = await prisma.user.findUnique({
			where: { id: userId },
			select: { id: true, name: true, role: true }
		})

		if (!targetUser) {
			return NextResponse.json(
				{ error: 'Usuario no encontrado' },
				{ status: 404 }
			)
		}

		// Verificar permisos: el usuario puede notificar sus propios logros
		// o un trainer puede notificar logros de sus clientes
		let hasPermission = false

		if (session.user.id === userId) {
			// El usuario notifica su propio logro
			hasPermission = true
		} else {
			// Verificar si es trainer y tiene relación con el cliente
			const user = await prisma.user.findUnique({
				where: { id: session.user.id },
				select: { role: true }
			})

			if (user?.role === 'TRAINER') {
				const clientProfile = await prisma.clientProfile.findFirst({
					where: {
						userId: userId,
						trainerId: session.user.id
					}
				})
				hasPermission = !!clientProfile
			}
		}

		if (!hasPermission) {
			return NextResponse.json(
				{ error: 'No tienes permisos para notificar logros a este usuario' },
				{ status: 403 }
			)
		}

		// Crear notificación de logro
		const notificationId = await notificationService.notifyAchievement(
			userId,
			achievementName,
			achievementData
		)

		logger.info(`Achievement notification sent:`, {
			notificationId,
			userId,
			achievementName,
			notifiedBy: session.user.id
		})

		return NextResponse.json({
			success: true,
			notificationId,
			message: `Logro "${achievementName}" notificado a ${targetUser.name} correctamente`
		})

	} catch (error) {
		logger.error('Error notifying achievement:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}