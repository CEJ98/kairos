import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { exerciseCreateSchema } from '@/lib/validations/api-schemas'

import { logger } from '@/lib/logger'
// GET /api/exercises - Obtener ejercicios
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const muscleGroup = searchParams.get('muscleGroup')
    const difficulty = searchParams.get('difficulty')
    const equipment = searchParams.get('equipment')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Construir filtros
    const where: any = {
      isActive: true
    }

    if (category && category !== 'all') {
      where.category = category
    }

    if (muscleGroup && muscleGroup !== 'all') {
      where.muscleGroup = {
        has: muscleGroup
      }
    }

    if (difficulty && difficulty !== 'all') {
      where.difficulty = difficulty
    }

    if (equipment && equipment !== 'all') {
      where.equipment = {
        has: equipment
      }
    }

    if (search) {
      where.OR = [
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

    // Obtener ejercicios con paginación
    const [exercises, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          name: 'asc'
        }
      }),
      prisma.exercise.count({ where })
    ])

    return NextResponse.json({
      exercises,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    logger.error('Error fetching exercises:', error, 'API')
    return NextResponse.json(
      { error: 'Error al obtener ejercicios' },
      { status: 500 }
    )
  }
}

// POST /api/exercises - Crear ejercicio (solo entrenadores/admin)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo entrenadores y admin pueden crear ejercicios
    if (!['TRAINER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    let parsed
    try {
      const json = await req.json()
      parsed = exerciseCreateSchema.safeParse(json)
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validación fallida', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Verificar que el ejercicio no existe
    const existingExercise = await prisma.exercise.findFirst({
      where: {
        name: parsed.data.name
      }
    })

    if (existingExercise) {
      return NextResponse.json(
        { error: 'Ya existe un ejercicio con este nombre' },
        { status: 400 }
      )
    }

    // Crear ejercicio
    const exercise = await prisma.exercise.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        instructions: parsed.data.instructions,
        tips: parsed.data.tips,
        category: parsed.data.category,
        muscleGroups: JSON.stringify(parsed.data.muscleGroups),
        equipments: JSON.stringify(parsed.data.equipments || []),
        difficulty: parsed.data.difficulty,
        imageUrl: parsed.data.imageUrl,
        videoUrl: parsed.data.videoUrl,
        gifUrl: parsed.data.gifUrl,
        isActive: true
      }
    })

    return NextResponse.json(exercise, { status: 201 })

  } catch (error) {
    logger.error('Error creating exercise:', error, 'API')
    return NextResponse.json(
      { error: 'Error al crear ejercicio' },
      { status: 500 }
    )
  }
}
