import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

import { logger } from '@/lib/logger'
// GET /api/exercises/[id] - Obtener ejercicio específico
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const exercise = await prisma.exercise.findUnique({
      where: {
        id,
        isActive: true
      }
    })

    if (!exercise) {
      return NextResponse.json(
        { error: 'Ejercicio no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(exercise)

  } catch (error) {
    logger.error('Error fetching exercise:', error, 'API')
    return NextResponse.json(
      { error: 'Error al obtener ejercicio' },
      { status: 500 }
    )
  }
}

// PUT /api/exercises/[id] - Actualizar ejercicio (solo entrenadores/admin)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo entrenadores y admin pueden editar ejercicios
    if (!['TRAINER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const {
      name,
      description,
      instructions,
      tips,
      category,
      muscleGroup,
      equipment,
      difficulty,
      imageUrl,
      videoUrl,
      gifUrl,
      isActive
    } = body

    // Verificar que el ejercicio existe
    const existingExercise = await prisma.exercise.findUnique({
      where: { id }
    })

    if (!existingExercise) {
      return NextResponse.json(
        { error: 'Ejercicio no encontrado' },
        { status: 404 }
      )
    }

    // Si se cambia el nombre, verificar que no existe otro con el mismo nombre
    if (name && name !== existingExercise.name) {
      const duplicateExercise = await prisma.exercise.findFirst({
        where: {
          name: name,
          id: {
            not: id
          }
        }
      })

      if (duplicateExercise) {
        return NextResponse.json(
          { error: 'Ya existe un ejercicio con este nombre' },
          { status: 400 }
        )
      }
    }

    // Actualizar ejercicio
    const updatedExercise = await prisma.exercise.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(instructions !== undefined && { instructions }),
        ...(tips !== undefined && { tips }),
        ...(category && { category }),
        ...(muscleGroup && { muscleGroup }),
        ...(equipment !== undefined && { equipment }),
        ...(difficulty && { difficulty }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(gifUrl !== undefined && { gifUrl }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json(updatedExercise)

  } catch (error) {
    logger.error('Error updating exercise:', error, 'API')
    return NextResponse.json(
      { error: 'Error al actualizar ejercicio' },
      { status: 500 }
    )
  }
}

// DELETE /api/exercises/[id] - Eliminar ejercicio (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo admin puede eliminar ejercicios
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { id } = await params
    // Verificar que el ejercicio existe
    const existingExercise = await prisma.exercise.findUnique({
      where: { id }
    })

    if (!existingExercise) {
      return NextResponse.json(
        { error: 'Ejercicio no encontrado' },
        { status: 404 }
      )
    }

    // Soft delete - marcar como inactivo
    await prisma.exercise.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Ejercicio eliminado exitosamente' })

  } catch (error) {
    logger.error('Error deleting exercise:', error, 'API')
    return NextResponse.json(
      { error: 'Error al eliminar ejercicio' },
      { status: 500 }
    )
  }
}