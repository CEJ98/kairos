import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

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
      gifUrl
    } = body

    // Validaciones
    if (!name || !category || !muscleGroup || !difficulty) {
      return NextResponse.json(
        { error: 'Campos obligatorios: name, category, muscleGroup, difficulty' },
        { status: 400 }
      )
    }

    // Verificar que el ejercicio no existe
    const existingExercise = await prisma.exercise.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
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
        name,
        description,
        instructions,
        tips,
        category,
        muscleGroups: muscleGroup,
        equipments: equipment || [],
        difficulty,
        imageUrl,
        videoUrl,
        gifUrl,
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