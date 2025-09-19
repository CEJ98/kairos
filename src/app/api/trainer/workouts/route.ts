import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { notificationService } from '@/lib/notification-service'

// Esquema de validación para asignar workout
const assignWorkoutSchema = z.object({
	clientId: z.string().min(1, 'ID del cliente es requerido'),
	workoutId: z.string().min(1, 'ID del workout es requerido'),
	scheduledDate: z.string().optional(),
	notes: z.string().optional()
})

// GET /api/trainer/workouts - Obtener workouts del entrenador
export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}

		// Verificar que el usuario sea entrenador
		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { role: true }
		})

		if (user?.role !== 'TRAINER') {
			return NextResponse.json(
				{ error: 'Acceso denegado. Solo entrenadores pueden acceder.' },
				{ status: 403 }
			)
		}

		// Obtener workouts creados por el entrenador
		const workouts = await prisma.workout.findMany({
			where: {
				creatorId: session.user.id
			},
			select: {
				id: true,
				name: true,
				description: true,
				duration: true,
				category: true,
				createdAt: true,
				updatedAt: true,
				_count: {
					select: {
						exercises: true
					}
				}
			},
			orderBy: { createdAt: 'desc' }
		})

		return NextResponse.json({
			workouts: workouts.map(workout => ({
				id: workout.id,
				name: workout.name,
				description: workout.description,
				duration: workout.duration,
				category: workout.category,
				exerciseCount: workout._count.exercises,
				createdAt: workout.createdAt,
				updatedAt: workout.updatedAt
			}))
		})

	} catch (error) {
		console.error('Error al obtener workouts del entrenador:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}

// POST /api/trainer/workouts - Asignar workout a cliente
export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}

		// Verificar que el usuario sea entrenador
		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { role: true }
		})

		if (user?.role !== 'TRAINER') {
			return NextResponse.json(
				{ error: 'Acceso denegado. Solo entrenadores pueden acceder.' },
				{ status: 403 }
			)
		}

		// Obtener perfil del entrenador
		const trainerProfile = await prisma.trainerProfile.findUnique({
			where: { userId: session.user.id }
		})

		if (!trainerProfile) {
			return NextResponse.json(
				{ error: 'Perfil de entrenador no encontrado' },
				{ status: 404 }
			)
		}

		// Validar datos de entrada
		const body = await request.json()
		const validatedData = assignWorkoutSchema.parse(body)

		// Verificar que el cliente pertenezca al entrenador
		const clientProfile = await prisma.clientProfile.findFirst({
			where: {
				id: validatedData.clientId,
				trainerId: trainerProfile.id
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true
					}
				}
			}
		})

		if (!clientProfile) {
			return NextResponse.json(
				{ error: 'Cliente no encontrado o no asignado a este entrenador' },
				{ status: 404 }
			)
		}

		// Verificar que el workout exista y pertenezca al entrenador
		const workout = await prisma.workout.findFirst({
			where: {
				id: validatedData.workoutId,
				creatorId: session.user.id
			}
		})

		if (!workout) {
			return NextResponse.json(
				{ error: 'Workout no encontrado o no pertenece a este entrenador' },
				{ status: 404 }
			)
		}

		// Asignar workout al cliente
		const updatedWorkout = await prisma.workout.update({
			where: { id: validatedData.workoutId },
			data: {
				assignedToId: clientProfile.userId
			},
			include: {
				assignedTo: {
					select: {
						id: true,
						name: true,
						email: true
					}
				},
				creator: {
					select: {
						id: true,
						name: true
					}
				}
			}
		})

		// Enviar notificación SSE al cliente
		try {
			await notificationService.notifyWorkoutAssignment(
				clientProfile.userId,
				session.user.id,
				updatedWorkout.id,
				updatedWorkout.name
			)
		} catch (notificationError) {
			console.error('Error enviando notificación de workout asignado:', notificationError)
			// No fallar la asignación si la notificación falla
		}

		return NextResponse.json({
			message: 'Workout asignado exitosamente',
			assignment: {
				id: updatedWorkout.id,
				workout: {
					id: updatedWorkout.id,
					name: updatedWorkout.name,
					description: updatedWorkout.description,
					duration: updatedWorkout.duration,
					category: updatedWorkout.category
				},
				client: updatedWorkout.assignedTo,
				notes: validatedData.notes,
				assignedAt: updatedWorkout.updatedAt
			}
		}, { status: 201 })

	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Datos inválidos', details: error.errors },
				{ status: 400 }
			)
		}

		console.error('Error al asignar workout:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}