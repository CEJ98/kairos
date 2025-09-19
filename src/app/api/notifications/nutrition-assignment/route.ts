/**
 * API Route: Notificaciones de Asignación de Planes Nutricionales
 * POST /api/notifications/nutrition-assignment
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notificationService } from '@/lib/notification-service'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

// POST /api/notifications/nutrition-assignment
// Notificar asignación de plan nutricional a un cliente
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
				{ error: 'Solo los trainers pueden asignar planes nutricionales' },
				{ status: 403 }
			)
		}

		const { clientId, planId, planName } = await request.json()

		if (!clientId) {
			return NextResponse.json(
				{ error: 'clientId es requerido' },
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

		// Si se proporciona planId, verificar que existe y pertenece al trainer
		if (planId) {
			const nutritionPlan = await prisma.nutritionPlan.findFirst({
				where: {
					id: planId,
					creatorId: session.user.id
				},
				select: { id: true, name: true }
			})

			if (!nutritionPlan) {
				return NextResponse.json(
					{ error: 'Plan nutricional no encontrado o no tienes permisos' },
					{ status: 404 }
				)
			}

			// Asignar el plan al cliente
			await prisma.nutritionPlan.update({
				where: { id: planId },
				data: {
					assignedToId: clientId
				}
			})
		}

		// Crear notificación de asignación
		const notificationId = await notificationService.notifyNutritionAssignment(
			clientId,
			session.user.id,
			planName || 'Plan de Nutrición'
		)

		logger.info(`Nutrition plan assigned and notification sent:`, {
			notificationId,
			planId,
			clientId,
			trainerId: session.user.id,
			planName
		})

		return NextResponse.json({
			success: true,
			notificationId,
			message: `Plan nutricional asignado a ${client.name} correctamente`
		})

	} catch (error) {
		logger.error('Error assigning nutrition plan:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}