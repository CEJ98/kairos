import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Schema de validación para rutinas
const routineSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido'),
	description: z.string().optional(),
	category: z.enum(['STRENGTH', 'CARDIO', 'HIIT', 'FLEXIBILITY', 'FUNCTIONAL']).optional(),
	difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
	estimatedDuration: z.number().min(1).optional(),
	isTemplate: z.boolean().default(false),
	isActive: z.boolean().default(true)
})

const routineBlockSchema = z.object({
	name: z.string().min(1, 'El nombre del bloque es requerido'),
	order: z.number().min(0),
	rounds: z.number().min(1).default(1),
	restBetweenRounds: z.number().min(0).optional(),
	notes: z.string().optional()
})

const routineSetSchema = z.object({
	exerciseId: z.string().min(1, 'El ejercicio es requerido'),
	order: z.number().min(0),
	reps: z.number().min(0).optional(),
	weight: z.number().min(0).optional(),
	duration: z.number().min(0).optional(),
	distance: z.number().min(0).optional(),
	restTime: z.number().min(0).optional(),
	notes: z.string().optional()
})

const createRoutineSchema = z.object({
	routine: routineSchema,
	blocks: z.array(z.object({
		...routineBlockSchema.shape,
		sets: z.array(routineSetSchema)
	}))
})

// GET - Obtener rutinas del coach
export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}

		// Verificar que el usuario sea TRAINER
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

		const { searchParams } = new URL(request.url)
		const page = parseInt(searchParams.get('page') || '1')
		const limit = parseInt(searchParams.get('limit') || '10')
		const category = searchParams.get('category')
		const difficulty = searchParams.get('difficulty')
		const isTemplate = searchParams.get('isTemplate')
		const search = searchParams.get('search')

		const skip = (page - 1) * limit

		// Construir filtros
		const where: any = {
			creatorId: session.user.id
		}

		if (category && category !== 'all') {
			where.category = category
		}

		if (difficulty && difficulty !== 'all') {
			where.difficulty = difficulty
		}

		if (isTemplate !== null) {
			where.isTemplate = isTemplate === 'true'
		}

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' } },
				{ description: { contains: search, mode: 'insensitive' } }
			]
		}

		// Obtener rutinas con sus bloques y sets
		const [routines, total] = await Promise.all([
			prisma.routine.findMany({
				where,
				skip,
				take: limit,
				orderBy: { updatedAt: 'desc' },
				include: {
					blocks: {
						orderBy: { order: 'asc' },
						include: {
							sets: {
								orderBy: { order: 'asc' },
								include: {
									exercise: {
										select: {
											id: true,
											name: true,
											category: true,
											muscleGroups: true,
											equipments: true,
											difficulty: true,
											imageUrl: true
										}
									}
								}
							}
						}
					},
					assignments: {
						select: {
							id: true,
							student: {
								select: {
									id: true,
									name: true,
									email: true
								}
							},
							isActive: true
						}
					}
				}
			}),
			prisma.routine.count({ where })
		])

		// Calcular estadísticas
		const stats = {
			totalRoutines: total,
			totalBlocks: routines.reduce((acc: number, routine: any) => acc + routine.blocks.length, 0),
			totalSets: routines.reduce((acc: number, routine: any) => 
				acc + routine.blocks.reduce((blockAcc: number, block: any) => blockAcc + block.sets.length, 0), 0
			),
			assignedRoutines: routines.filter((routine: any) => routine.assignments.length > 0).length
		}

		return NextResponse.json({
			routines,
			stats,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit)
			}
		})

	} catch (error) {
		console.error('Error al obtener rutinas:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}

// PUT - Actualizar rutina existente
export async function PUT(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}

		const body = await request.json()
		const { routineId, ...updateData } = body

		if (!routineId) {
			return NextResponse.json(
				{ error: 'ID de rutina requerido' },
				{ status: 400 }
			)
		}

		// Verificar que la rutina existe y pertenece al usuario
		const existingRoutine = await prisma.routine.findUnique({
			where: { id: routineId },
			select: { creatorId: true }
		})

		if (!existingRoutine) {
			return NextResponse.json(
				{ error: 'Rutina no encontrada' },
				{ status: 404 }
			)
		}

		if (existingRoutine.creatorId !== session.user.id) {
			return NextResponse.json(
				{ error: 'No tienes permisos para editar esta rutina' },
				{ status: 403 }
			)
		}

		const validatedData = createRoutineSchema.parse(updateData)

		// Actualizar rutina con transacción
		const updatedRoutine = await prisma.$transaction(async (tx) => {
			// Actualizar rutina
			await tx.routine.update({
				where: { id: routineId },
				data: validatedData.routine
			})

			// Eliminar bloques y sets existentes
			await tx.routineSet.deleteMany({
				where: {
					block: {
						routineId: routineId
					}
				}
			})

			await tx.routineBlock.deleteMany({
				where: { routineId: routineId }
			})

			// Crear nuevos bloques y sets
			for (const blockData of validatedData.blocks) {
				const { sets, ...blockInfo } = blockData
				
				const block = await tx.routineBlock.create({
					data: {
						...blockInfo,
						routineId: routineId
					}
				})

				for (const setData of sets) {
					await tx.routineSet.create({
						data: {
							...setData,
							blockId: block.id
						}
					})
				}
			}

			// Retornar rutina actualizada
			return await tx.routine.findUnique({
				where: { id: routineId },
				include: {
					blocks: {
						orderBy: { order: 'asc' },
						include: {
							sets: {
								orderBy: { order: 'asc' },
								include: {
									exercise: {
										select: {
											id: true,
											name: true,
											category: true,
											muscleGroups: true,
											equipments: true,
											difficulty: true,
											imageUrl: true
										}
									}
								}
							}
						}
					}
				}
			})
		})

		return NextResponse.json(updatedRoutine)

	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Datos inválidos', details: error.errors },
				{ status: 400 }
			)
		}

		console.error('Error al actualizar rutina:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}

// DELETE - Eliminar rutina
export async function DELETE(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}

		const { searchParams } = new URL(request.url)
		const routineId = searchParams.get('id')

		if (!routineId) {
			return NextResponse.json(
				{ error: 'ID de rutina requerido' },
				{ status: 400 }
			)
		}

		// Verificar que la rutina existe y pertenece al usuario
		const existingRoutine = await prisma.routine.findUnique({
			where: { id: routineId },
			select: { 
				creatorId: true,
				assignments: {
					select: { id: true, isActive: true }
				}
			}
		})

		if (!existingRoutine) {
			return NextResponse.json(
				{ error: 'Rutina no encontrada' },
				{ status: 404 }
			)
		}

		if (existingRoutine.creatorId !== session.user.id) {
			return NextResponse.json(
				{ error: 'No tienes permisos para eliminar esta rutina' },
				{ status: 403 }
			)
		}

		// Verificar si la rutina está asignada a alumnos
		const activeAssignments = existingRoutine.assignments.filter(a => a.isActive)
		if (activeAssignments.length > 0) {
			return NextResponse.json(
				{ error: 'No se puede eliminar una rutina que está asignada a alumnos activos' },
				{ status: 400 }
			)
		}

		// Eliminar rutina (cascade eliminará bloques y sets)
		await prisma.routine.delete({
			where: { id: routineId }
		})

		return NextResponse.json({ message: 'Rutina eliminada exitosamente' })

	} catch (error) {
		console.error('Error al eliminar rutina:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}

// POST - Crear nueva rutina
export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}

		// Verificar que el usuario sea TRAINER
		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { role: true }
		})

		if (user?.role !== 'TRAINER') {
			return NextResponse.json(
				{ error: 'Acceso denegado. Solo entrenadores pueden crear rutinas.' },
				{ status: 403 }
			)
		}

		const body = await request.json()
		const validatedData = createRoutineSchema.parse(body)

		// Verificar que todos los ejercicios existan
		const exerciseIds = validatedData.blocks.flatMap(block => 
			block.sets.map(set => set.exerciseId)
		)

		const exercises = await prisma.exercise.findMany({
			where: {
				id: { in: exerciseIds },
				isActive: true
			}
		})

		if (exercises.length !== exerciseIds.length) {
			return NextResponse.json(
				{ error: 'Algunos ejercicios no existen o están inactivos' },
				{ status: 400 }
			)
		}

		// Crear rutina con transacción
		const routine = await prisma.$transaction(async (tx) => {
			// Crear rutina
			const newRoutine = await tx.routine.create({
				data: {
					...validatedData.routine,
					creatorId: session.user.id
				}
			})

			// Crear bloques y sets
			for (const blockData of validatedData.blocks) {
				const { sets, ...blockInfo } = blockData
				
				const block = await tx.routineBlock.create({
					data: {
						...blockInfo,
						routineId: newRoutine.id
					}
				})

				// Crear sets del bloque
				for (const setData of sets) {
					await tx.routineSet.create({
						data: {
							...setData,
							blockId: block.id
						}
					})
				}
			}

			// Retornar rutina completa
			return await tx.routine.findUnique({
				where: { id: newRoutine.id },
				include: {
					blocks: {
						orderBy: { order: 'asc' },
						include: {
							sets: {
								orderBy: { order: 'asc' },
								include: {
									exercise: {
										select: {
											id: true,
											name: true,
											category: true,
											muscleGroups: true,
											equipments: true,
											difficulty: true,
											imageUrl: true
										}
									}
								}
							}
						}
					}
				}
			});
		});

		return NextResponse.json(routine, { status: 201 })

	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Datos inválidos', details: error.errors },
				{ status: 400 }
			)
		}

		console.error('Error al crear rutina:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}