import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { workoutPatchSchema } from '@/lib/validations/api-schemas'

import { logger } from '@/lib/logger'
// GET /api/workouts/[id] - Obtener rutina específica
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

    const workout = await prisma.workout.findUnique({
      where: { id: id },
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
        sessions: {
          where: {
            userId: session.user.id
          },
          orderBy: {
            startTime: 'desc'
          },
          take: 5 // Últimas 5 sesiones
        }
      }
    })

    if (!workout) {
      return NextResponse.json(
        { error: 'Rutina no encontrada' },
        { status: 404 }
      )
    }

    // Verificar permisos de acceso
    const hasAccess = (
      workout.creatorId === session.user.id ||
      workout.assignedToId === session.user.id ||
      workout.isPublic ||
      (session.user.role === 'TRAINER' && (workout.assignedTo as any)?.clientProfiles?.some(
        (cp: any) => cp.trainer?.userId === session.user.id
      ))
    )

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Sin permisos para acceder a esta rutina' },
        { status: 403 }
      )
    }

    // Calcular estadísticas
    const stats = {
      totalExercises: workout.exercises.length,
      estimatedDuration: workout.duration || workout.exercises.reduce((acc, ex) => {
        const exerciseTime = ex.duration || (ex.sets || 1) * (ex.reps || 10) * 2
        const restTime = (ex.sets || 1) * (ex.restTime || 60)
        return acc + exerciseTime + restTime
      }, 0) / 60,
      completedSessions: workout.sessions.length,
      lastCompleted: workout.sessions[0]?.startTime || null
    }

    return NextResponse.json({
      ...workout,
      stats
    })

  } catch (error) {
    logger.error('Error fetching workout:', error, 'API')
    return NextResponse.json(
      { error: 'Error al obtener rutina' },
      { status: 500 }
    )
  }
}

// PUT /api/workouts/[id] - Actualizar rutina
export async function PUT(
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
      name,
      description,
      category,
      isTemplate,
      isPublic,
      exercises
    } = body

    // Verificar que la rutina existe y el usuario tiene permisos
    const existingWorkout = await prisma.workout.findUnique({
      where: { id: id },
      include: {
        exercises: true
      }
    })

    if (!existingWorkout) {
      return NextResponse.json(
        { error: 'Rutina no encontrada' },
        { status: 404 }
      )
    }

    // Solo el creador puede editar la rutina
    if (existingWorkout.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Solo el creador puede editar esta rutina' },
        { status: 403 }
      )
    }

    // Actualizar rutina con transacción
    const updatedWorkout = await prisma.$transaction(async (tx) => {
      // Actualizar datos básicos
      const workout = await tx.workout.update({
        where: { id: id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(category && { category }),
          ...(isTemplate !== undefined && { isTemplate }),
          ...(isPublic !== undefined && { isPublic })
        }
      })

      // Si se proporcionan ejercicios, actualizar la lista completa
      if (exercises) {
        // Eliminar ejercicios existentes
        await tx.workoutExercise.deleteMany({
          where: { workoutId: id }
        })

        // Crear nuevos ejercicios
        if (exercises.length > 0) {
          await tx.workoutExercise.createMany({
            data: exercises.map((ex: any, index: number) => ({
              workoutId: id,
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
      }

      return workout
    })

    // Obtener rutina completa actualizada
    const completeWorkout = await prisma.workout.findUnique({
      where: { id: id },
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

    return NextResponse.json(completeWorkout)

  } catch (error) {
    logger.error('Error updating workout:', error, 'API')
    return NextResponse.json(
      { error: 'Error al actualizar rutina' },
      { status: 500 }
    )
  }
}

// PATCH /api/workouts/[id] - Actualización parcial de rutina
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    let parsed
    try {
      const json = await req.json()
      parsed = workoutPatchSchema.safeParse(json)
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validación fallida', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const payload = parsed.data

    const existingWorkout = await prisma.workout.findUnique({
      where: { id },
      include: { exercises: true }
    })

    if (!existingWorkout) {
      return NextResponse.json(
        { error: 'Rutina no encontrada' },
        { status: 404 }
      )
    }

    if (existingWorkout.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Solo el creador puede editar esta rutina' },
        { status: 403 }
      )
    }

    const updatedWorkout = await prisma.$transaction(async (tx) => {
      const workout = await tx.workout.update({
        where: { id },
        data: {
          ...(payload.name && { name: payload.name }),
          ...(payload.description !== undefined && { description: payload.description }),
          ...(payload.category && { category: payload.category }),
          ...(payload.isTemplate !== undefined && { isTemplate: payload.isTemplate }),
          ...(payload.isPublic !== undefined && { isPublic: payload.isPublic })
        }
      })

      if (payload.exercises) {
        await tx.workoutExercise.deleteMany({ where: { workoutId: id } })
        if (payload.exercises.length > 0) {
          await tx.workoutExercise.createMany({
            data: payload.exercises.map((ex: any, index: number) => ({
              workoutId: id,
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
      }

      return workout
    })

    const completeWorkout = await prisma.workout.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        exercises: { include: { exercise: true }, orderBy: { order: 'asc' } }
      }
    })

    return NextResponse.json(completeWorkout)

  } catch (error) {
    logger.error('Error patching workout:', error, 'API')
    return NextResponse.json(
      { error: 'Error al actualizar rutina' },
      { status: 500 }
    )
  }
}

// DELETE /api/workouts/[id] - Eliminar rutina
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que la rutina existe y el usuario tiene permisos
    const existingWorkout = await prisma.workout.findUnique({
      where: { id: id }
    })

    if (!existingWorkout) {
      return NextResponse.json(
        { error: 'Rutina no encontrada' },
        { status: 404 }
      )
    }

    // Solo el creador puede eliminar la rutina
    if (existingWorkout.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Solo el creador puede eliminar esta rutina' },
        { status: 403 }
      )
    }

    // Eliminar rutina y sus ejercicios (cascade)
    await prisma.workout.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: 'Rutina eliminada exitosamente' })

  } catch (error) {
    logger.error('Error deleting workout:', error, 'API')
    return NextResponse.json(
      { error: 'Error al eliminar rutina' },
      { status: 500 }
    )
  }
}
