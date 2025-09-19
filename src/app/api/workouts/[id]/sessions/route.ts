import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notificationService } from '@/lib/notification-service'
import { logger } from '@/lib/logger'
// POST /api/workouts/[id]/sessions - Crear nueva sesión de entrenamiento
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const {
      startTime,
      endTime,
      duration,
      status,
      notes,
      rating,
      caloriesBurned,
      exercises
    } = body

    // Verificar que la rutina existe y el usuario tiene acceso
    const workout = await prisma.workout.findUnique({
      where: { id: id }
    })

    if (!workout) {
      return NextResponse.json(
        { error: 'Rutina no encontrada' },
        { status: 404 }
      )
    }

    // Verificar permisos
    if (workout.creatorId !== session.user.id && workout.assignedToId !== session.user.id) {
      return NextResponse.json(
        { error: 'Sin permisos para crear sesión en esta rutina' },
        { status: 403 }
      )
    }

    // Crear sesión con transacción
    const workoutSession = await prisma.$transaction(async (tx) => {
      // Crear sesión
      const newSession = await tx.workoutSession.create({
        data: {
          userId: session.user.id,
          workoutId: id,
          startTime: new Date(startTime),
          endTime: endTime ? new Date(endTime) : null,
          duration,
          status: status || 'IN_PROGRESS',
          notes,
          rating: rating ? Math.max(1, Math.min(5, rating)) : null, // 1-5 rating
          caloriesBurned
        }
      })

      // Crear logs de ejercicios si se proporcionan
      if (exercises && exercises.length > 0) {
        await tx.exerciseLog.createMany({
          data: exercises.map((ex: any) => ({
            sessionId: newSession.id,
            exerciseId: ex.exerciseId,
            order: ex.order,
            setsCompleted: ex.setsCompleted,
            repsCompleted: ex.repsCompleted || [],
            weightUsed: ex.weightUsed || [],
            durationActual: ex.durationActual,
            distanceActual: ex.distanceActual,
            restTimeActual: ex.restTimeActual,
            difficulty: ex.difficulty ? Math.max(1, Math.min(10, ex.difficulty)) : null,
            notes: ex.notes
          }))
        })
      }

      return newSession
    })

    // Obtener sesión completa con ejercicios
    const completeSession = await prisma.workoutSession.findUnique({
      where: { id: workoutSession.id },
      include: {
        workout: {
          select: {
            id: true,
            name: true
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

    // Enviar notificación de progreso si la sesión está completada
    if (status === 'COMPLETED') {
      try {
        // Obtener información del entrenador si existe
        const workoutWithCreator = await prisma.workout.findUnique({
          where: { id: id },
          include: {
            creator: {
              select: {
                id: true,
                name: true
              }
            }
          }
        })

        if (workoutWithCreator?.creator) {
           await notificationService.notifyProgressUpdate(
             workoutWithCreator.creator.id,
             session.user.id,
             session.user.name || 'Cliente',
             workoutWithCreator.name,
             {
               workoutId: id,
               sessionId: workoutSession.id,
               duration: duration,
               caloriesBurned: caloriesBurned,
               rating: rating
             }
           )
        }
      } catch (notificationError) {
        logger.error('Error sending progress notification:', notificationError, 'API')
        // No interrumpir el flujo principal por error de notificación
      }
    }

    return NextResponse.json(completeSession, { status: 201 })

  } catch (error) {
    logger.error('Error creating workout session:', error, 'API')
    return NextResponse.json(
      { error: 'Error al crear sesión de entrenamiento' },
      { status: 500 }
    )
  }
}

// GET /api/workouts/[id]/sessions - Obtener sesiones de una rutina
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Verificar acceso a la rutina
    const workout = await prisma.workout.findUnique({
      where: { id: id }
    })

    if (!workout) {
      return NextResponse.json(
        { error: 'Rutina no encontrada' },
        { status: 404 }
      )
    }

    // Construir filtros
    const where: any = {
      workoutId: id,
      userId: session.user.id // Solo sesiones del usuario actual
    }

    if (status) {
      where.status = status
    }

    // Obtener sesiones
    const [sessions, total] = await Promise.all([
      prisma.workoutSession.findMany({
        where,
        include: {
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
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          startTime: 'desc'
        }
      }),
      prisma.workoutSession.count({ where })
    ])

    return NextResponse.json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    logger.error('Error fetching workout sessions:', error, 'API')
    return NextResponse.json(
      { error: 'Error al obtener sesiones' },
      { status: 500 }
    )
  }
}