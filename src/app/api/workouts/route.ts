import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

import { logger } from '@/lib/logger'
// GET /api/workouts - Obtener rutinas del usuario
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const isTemplate = searchParams.get('isTemplate')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Construir filtros
    const where: any = {
      OR: [
        { creatorId: session.user.id }, // Rutinas creadas por el usuario
        { assignedToId: session.user.id }, // Rutinas asignadas al usuario
        { isPublic: true } // Rutinas públicas
      ]
    }

    if (category && category !== 'all') {
      where.category = category
    }

    if (isTemplate !== null) {
      where.isTemplate = isTemplate === 'true'
    }

    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive'
              }
            },
            {
              description: {
                contains: search,
                mode: 'insensitive'
              }
            }
          ]
        }
      ]
    }

    // Obtener rutinas con ejercicios incluidos
    const [workouts, total] = await Promise.all([
      prisma.workout.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          exercises: {
            include: {
              exercise: true
            },
            orderBy: {
              order: 'asc'
            }
          },
          _count: {
            select: {
              sessions: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          updatedAt: 'desc'
        }
      }),
      prisma.workout.count({ where })
    ])

    // Transformar datos para incluir estadísticas
    const workoutsWithStats = workouts.map(workout => ({
      ...workout,
      totalExercises: workout.exercises.length,
      estimatedDuration: workout.duration || workout.exercises.reduce((acc, ex) => {
        const exerciseTime = ex.duration || (ex.sets || 1) * (ex.reps || 10) * 2 // 2 sec per rep
        const restTime = (ex.sets || 1) * (ex.restTime || 60)
        return acc + exerciseTime + restTime
      }, 0) / 60, // en minutos
      completedSessions: workout._count.sessions
    }))

    return NextResponse.json({
      workouts: workoutsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    logger.error('Error fetching workouts:', error, 'API')
    return NextResponse.json(
      { error: 'Error al obtener rutinas' },
      { status: 500 }
    )
  }
}

// POST /api/workouts - Crear nueva rutina
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      description,
      category,
      isTemplate,
      isPublic,
      assignedToId,
      exercises
    } = body

    // Validaciones
    if (!name || !category) {
      return NextResponse.json(
        { error: 'Campos obligatorios: name, category' },
        { status: 400 }
      )
    }

    if (exercises && exercises.length === 0) {
      return NextResponse.json(
        { error: 'La rutina debe tener al menos un ejercicio' },
        { status: 400 }
      )
    }

    // Verificar que el usuario puede asignar la rutina
    if (assignedToId && assignedToId !== session.user.id) {
      // Solo entrenadores pueden asignar rutinas a otros usuarios
      if (session.user.role !== 'TRAINER') {
        return NextResponse.json(
          { error: 'Solo entrenadores pueden asignar rutinas a otros usuarios' },
          { status: 403 }
        )
      }

      // Verificar que el usuario asignado existe y es cliente del entrenador
      const assignedUser = await prisma.user.findUnique({
        where: { id: assignedToId },
        include: {
          clientProfiles: {
            where: {
              trainer: {
                userId: session.user.id
              }
            }
          }
        }
      })

      if (!assignedUser || assignedUser.clientProfiles.length === 0) {
        return NextResponse.json(
          { error: 'Usuario no encontrado o no es tu cliente' },
          { status: 404 }
        )
      }
    }

    // Crear rutina con transacción
    const workout = await prisma.$transaction(async (tx) => {
      // Crear rutina
      const newWorkout = await tx.workout.create({
        data: {
          name,
          description,
          category,
          isTemplate: isTemplate || false,
          isPublic: isPublic || false,
          creatorId: session.user.id,
          assignedToId: assignedToId || session.user.id,
        }
      })

      // Agregar ejercicios si existen
      if (exercises && exercises.length > 0) {
        await tx.workoutExercise.createMany({
          data: exercises.map((ex: any, index: number) => ({
            workoutId: newWorkout.id,
            exerciseId: ex.exerciseId,
            order: index + 1,
            sets: ex.sets || 3,
            reps: ex.reps,
            weight: ex.weight,
            duration: ex.duration,
            distance: ex.distance,
            restTime: ex.restTime || 60,
            notes: ex.notes
          }))
        })
      }

      return newWorkout
    })

    // Obtener rutina completa con ejercicios
    const completeWorkout = await prisma.workout.findUnique({
      where: { id: workout.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        exercises: {
          include: {
            exercise: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    return NextResponse.json(completeWorkout, { status: 201 })

  } catch (error) {
    logger.error('Error creating workout:', error, 'API')
    return NextResponse.json(
      { error: 'Error al crear rutina' },
      { status: 500 }
    )
  }
}