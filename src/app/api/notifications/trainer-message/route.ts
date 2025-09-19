/**
 * API Route: Mensajes del Trainer
 * POST /api/notifications/trainer-message
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notificationService } from '@/lib/notification-service'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

// POST /api/notifications/trainer-message
// Enviar mensaje del trainer a un cliente
export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}

		// Verificar que el usuario es un trainer
		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { role: true }
		})

		if (user?.role !== 'TRAINER') {
			return NextResponse.json(
				{ error: 'Solo los trainers pueden enviar mensajes' },
				{ status: 403 }
			)
		}

		const { clientId, message } = await request.json()

		if (!clientId || !message) {
			return NextResponse.json(
				{ error: 'clientId y message son requeridos' },
				{ status: 400 }
			)
		}

		// Verificar que el cliente existe
		const client = await prisma.user.findUnique({
			where: { id: clientId },
			select: { id: true, name: true, role: true }
		})

		if (!client || client.role !== 'CLIENT') {
			return NextResponse.json(
				{ error: 'Cliente no encontrado' },
				{ status: 404 }
			)
		}

		// Verificar relación trainer-cliente
		const clientProfile = await prisma.clientProfile.findFirst({
			where: {
				userId: clientId,
				trainerId: session.user.id
			}
		})

		if (!clientProfile) {
			return NextResponse.json(
				{ error: 'No tienes permisos para enviar mensajes a este cliente' },
				{ status: 403 }
			)
		}

		// Crear notificación de mensaje
		const notificationId = await notificationService.sendTrainerMessage(
			clientId,
			session.user.id,
			message
		)

		logger.info(`Trainer message sent:`, {
			notificationId,
			clientId,
			trainerId: session.user.id,
			message: message.substring(0, 50) + '...'
		})

		return NextResponse.json({
			success: true,
			notificationId,
			message: `Mensaje enviado a ${client.name} correctamente`
		})

	} catch (error) {
		logger.error('Error sending trainer message:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}