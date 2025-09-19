/**
 * API Route: Cancelar Recordatorio de Entrenamiento
 * DELETE /api/notifications/workout-reminder/[workoutId]
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'


// DELETE /api/notifications/workout-reminder/[workoutId]
// Cancelar recordatorio de entrenamiento
export async function DELETE(request: NextRequest, { params }: any) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}

		const _p = (params && typeof (params as any).then === 'function') ? await params : params
		const { workoutId } = _p

		if (!workoutId) {
			return NextResponse.json(
				{ error: 'workoutId es requerido' },
				{ status: 400 }
			)
		}

		// Verificar que el workout existe y el usuario tiene permisos
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

		// Buscar y eliminar notificaciones de recordatorio pendientes para este workout
		const targetUserId = workout.assignedToId || workout.creatorId
		const deletedNotifications = await prisma.notification.deleteMany({
			where: {
				userId: targetUserId,
				type: 'workout_reminder',
				metadata: {
					contains: `"workoutId":"${workoutId}"`
				},
				isRead: false // Solo eliminar las no leídas
			}
		})

		logger.info(`Workout reminders cancelled:`, {
			workoutId,
			userId: targetUserId,
			deletedCount: deletedNotifications.count
		})

		return NextResponse.json({
			success: true,
			deletedCount: deletedNotifications.count,
			message: 'Recordatorios cancelados correctamente'
		})

	} catch (error) {
		logger.error('Error cancelling workout reminders:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}
