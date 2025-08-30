import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

import { logger } from '@/lib/logger'
// GET /api/sessions/[id] - Obtener sesión específica
export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		// Obtener sesión con todos los detalles
		const workoutSession = await prisma.workoutSession.findUnique({
			where: { id: params.id },
			include: {
				workout: {
					select: {
						id: true,
						name: true,
						description: true,
						category: true,
						duration: true
					}
				},
				exercises: {
					include: {
						exercise: {
							select: {
								id: true,
								name: true,
								description: true,
								category: true,
								muscleGroups: true,
								equipments: true,
								difficulty: true,
								instructions: true,
								imageUrl: true,
								videoUrl: true
							}
						}
					},
					orderBy: {
						order: 'asc'
					}
				},
				user: {
					select: {
						id: true,
						name: true,
						email: true
					}
				}
			}
		})

		if (!workoutSession) {
			return NextResponse.json(
				{ error: 'Sesión no encontrada' },
				{ status: 404 }
			)
		}

		// Verificar permisos
		if (workoutSession.userId !== session.user.id) {
			return NextResponse.json(
				{ error: 'Sin permisos para acceder a esta sesión' },
				{ status: 403 }
			)
		}

		return NextResponse.json(workoutSession)

	} catch (error) {
		logger.error('Error fetching workout session:', error, 'API')
		return NextResponse.json(
			{ error: 'Error al obtener sesión' },
			{ status: 500 }
		)
	}
}

// PUT /api/sessions/[id] - Actualizar sesión
export async function PUT(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		const body = await req.json()
		const {
			endTime,
			duration,
			status,
			notes,
			rating,
			caloriesBurned,
			exercises
		} = body

		// Verificar que la sesión existe y pertenece al usuario
		const existingSession = await prisma.workoutSession.findUnique({
			where: { id: params.id }
		})

		if (!existingSession) {
			return NextResponse.json(
				{ error: 'Sesión no encontrada' },
				{ status: 404 }
			)
		}

		if (existingSession.userId !== session.user.id) {
			return NextResponse.json(
				{ error: 'Sin permisos para modificar esta sesión' },
				{ status: 403 }
			)
		}

		// Actualizar sesión con transacción
		const updatedSession = await prisma.$transaction(async (tx) => {
			// Actualizar datos de la sesión
			const sessionData: any = {
				updatedAt: new Date()
			}

			if (endTime !== undefined) sessionData.endTime = endTime ? new Date(endTime) : null
			if (duration !== undefined) sessionData.duration = duration
			if (status !== undefined) sessionData.status = status
			if (notes !== undefined) sessionData.notes = notes
			if (rating !== undefined) sessionData.rating = rating ? Math.max(1, Math.min(5, rating)) : null
			if (caloriesBurned !== undefined) sessionData.caloriesBurned = caloriesBurned

			const updatedSession = await tx.workoutSession.update({
				where: { id: params.id },
				data: sessionData
			})

			// Actualizar ejercicios si se proporcionan
			if (exercises && Array.isArray(exercises)) {
				// Eliminar logs existentes
				await tx.exerciseLog.deleteMany({
					where: { sessionId: params.id }
				})

				// Crear nuevos logs
				if (exercises.length > 0) {
					await tx.exerciseLog.createMany({
						data: exercises.map((ex: any) => ({
							sessionId: params.id,
							exerciseId: ex.exerciseId,
							order: ex.order,
							setsCompleted: ex.setsCompleted,
							repsCompleted: JSON.stringify(ex.repsCompleted || []),
							weightUsed: JSON.stringify(ex.weightUsed || []),
							durationActual: ex.durationActual,
							distanceActual: ex.distanceActual,
							restTimeActual: ex.restTimeActual,
							difficulty: ex.difficulty ? Math.max(1, Math.min(10, ex.difficulty)) : null,
							notes: ex.notes
						}))
					})
				}
			}

			return updatedSession
		})

		// Obtener sesión completa actualizada
		const completeSession = await prisma.workoutSession.findUnique({
			where: { id: params.id },
			include: {
				workout: {
					select: {
						id: true,
						name: true,
						description: true
					}
				},
				exercises: {
					include: {
						exercise: {
							select: {
								id: true,
								name: true,
								category: true
							}
						}
					},
					orderBy: {
						order: 'asc'
					}
				}
			}
		})

		return NextResponse.json(completeSession)

	} catch (error) {
		logger.error('Error updating workout session:', error, 'API')
		return NextResponse.json(
			{ error: 'Error al actualizar sesión' },
			{ status: 500 }
		)
	}
}

// DELETE /api/sessions/[id] - Eliminar sesión
export async function DELETE(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		// Verificar que la sesión existe y pertenece al usuario
		const existingSession = await prisma.workoutSession.findUnique({
			where: { id: params.id }
		})

		if (!existingSession) {
			return NextResponse.json(
				{ error: 'Sesión no encontrada' },
				{ status: 404 }
			)
		}

		if (existingSession.userId !== session.user.id) {
			return NextResponse.json(
				{ error: 'Sin permisos para eliminar esta sesión' },
				{ status: 403 }
			)
		}

		// Eliminar sesión (los logs se eliminan en cascada)
		await prisma.workoutSession.delete({
			where: { id: params.id }
		})

		return NextResponse.json({ message: 'Sesión eliminada correctamente' })

	} catch (error) {
		logger.error('Error deleting workout session:', error, 'API')
		return NextResponse.json(
			{ error: 'Error al eliminar sesión' },
			{ status: 500 }
		)
	}
}