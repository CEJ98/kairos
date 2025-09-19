/**
 * API Route: Notificaciones de Asignación de Rutinas
 * POST /api/notifications/workout-assignment
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notificationService } from '@/lib/notification-service'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

// POST /api/notifications/workout-assignment
// Notificar asignación de rutina a un cliente
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
				{ error: 'Solo los trainers pueden asignar rutinas' },
				{ status: 403 }
			)
		}

		const { clientId, workoutId, workoutName } = await request.json()

		if (!clientId || !workoutId || !workoutName) {
			return NextResponse.json(
				{ error: 'clientId, workoutId y workoutName son requeridos' },
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

		// Verificar que el workout existe y fue creado por el trainer
		const workout = await prisma.workout.findFirst({
			where: {
				id: workoutId,
				creatorId: session.user.id
			},
			select: { id: true, name: true }
		})

		if (!workout) {
			return NextResponse.json(
				{ error: 'Rutina no encontrada o no tienes permisos' },
				{ status: 404 }
			)
		}

		// Asignar la rutina al cliente
		await prisma.workout.update({
			where: { id: workoutId },
			data: { assignedToId: clientId }
		})

		// Crear notificación de asignación
		const notificationId = await notificationService.notifyWorkoutAssignment(
			clientId,
			session.user.id,
			workoutId,
			workoutName
		)

		logger.info(`Workout assigned and notification sent:`, {
			notificationId,
			workoutId,
			clientId,
			trainerId: session.user.id,
			workoutName
		})

		return NextResponse.json({
			success: true,
			notificationId,
			message: `Rutina "${workoutName}" asignada a ${client.name} correctamente`
		})

	} catch (error) {
		logger.error('Error assigning workout:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}