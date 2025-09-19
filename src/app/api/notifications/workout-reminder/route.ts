/**
 * API Route: Recordatorios de Entrenamiento
 * Maneja la programación y cancelación de recordatorios de entrenamientos
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notificationService } from '@/lib/notification-service'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

// POST /api/notifications/workout-reminder
// Programar recordatorio de entrenamiento
export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}

		const { workoutId, scheduledTime, reminderMinutes = 30 } = await request.json()

		if (!workoutId || !scheduledTime) {
			return NextResponse.json(
				{ error: 'workoutId y scheduledTime son requeridos' },
				{ status: 400 }
			)
		}

		// Verificar que el workout existe y pertenece al usuario
		const workout = await prisma.workout.findFirst({
			where: {
				id: workoutId,
				OR: [
					{ assignedToId: session.user.id }, // Cliente asignado
					{ creatorId: session.user.id } // Trainer creador
				]
			},
			select: {
				id: true,
				name: true,
				assignedToId: true,
				creatorId: true
			}
		})

		if (!workout) {
			return NextResponse.json(
				{ error: 'Entrenamiento no encontrado' },
				{ status: 404 }
			)
		}

		// Crear recordatorio para el cliente asignado
		const targetUserId = workout.assignedToId || workout.creatorId
		const notificationId = await notificationService.createWorkoutReminder(
			targetUserId,
			workout.id,
			workout.name,
			new Date(scheduledTime),
			reminderMinutes
		)

		logger.info(`Workout reminder scheduled:`, {
			notificationId,
			workoutId,
			userId: targetUserId,
			scheduledTime,
			reminderMinutes
		})

		return NextResponse.json({
			success: true,
			notificationId,
			message: 'Recordatorio programado correctamente'
		})

	} catch (error) {
		logger.error('Error scheduling workout reminder:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}