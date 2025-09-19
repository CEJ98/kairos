import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Schema de validación para actualización de perfil
const updateProfileSchema = z.object({
	name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre no puede exceder 100 caracteres').optional(),
	avatar: z.string().url('Avatar debe ser una URL válida').optional(),
	// Campos de perfil de cliente
	age: z.number().int().min(13, 'La edad mínima es 13 años').max(120, 'La edad máxima es 120 años').optional(),
	weight: z.number().min(20, 'El peso mínimo es 20 kg').max(500, 'El peso máximo es 500 kg').optional(),
	height: z.number().min(100, 'La altura mínima es 100 cm').max(250, 'La altura máxima es 250 cm').optional(),
	gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { errorMap: () => ({ message: 'Género debe ser MALE, FEMALE o OTHER' }) }).optional(),
	fitnessGoal: z.enum(['WEIGHT_LOSS', 'MUSCLE_GAIN', 'ENDURANCE', 'STRENGTH', 'GENERAL_FITNESS'], { errorMap: () => ({ message: 'Objetivo de fitness inválido' }) }).optional(),
	activityLevel: z.enum(['SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTREMELY_ACTIVE'], { errorMap: () => ({ message: 'Nivel de actividad inválido' }) }).optional(),
	// Campos de perfil de entrenador
	bio: z.string().max(500, 'La biografía no puede exceder 500 caracteres').optional(),
	experience: z.number().int().min(0, 'La experiencia no puede ser negativa').max(50, 'La experiencia máxima es 50 años').optional(),
	specialties: z.array(z.string()).max(10, 'Máximo 10 especialidades').optional(),
	hourlyRate: z.number().min(0, 'La tarifa no puede ser negativa').max(1000, 'La tarifa máxima es 1000').optional(),
	maxClients: z.number().int().min(1, 'Mínimo 1 cliente').max(200, 'Máximo 200 clientes').optional()
})
// GET /api/users/profile - Obtener perfil completo del usuario
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener usuario con perfiles relacionados
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        clientProfiles: {
          include: {
            trainer: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        trainerProfile: {
          include: {
            clients: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        subscriptions: {
          where: {
            status: 'ACTIVE'
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        workouts: {
          take: 5,
          orderBy: {
            updatedAt: 'desc'
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Obtener estadísticas básicas
    const stats = await prisma.$transaction([
      // Total de entrenamientos completados
      prisma.workoutSession.count({
        where: {
          userId: session.user.id,
          status: 'COMPLETED'
        }
      }),
      // Total de rutinas creadas
      prisma.workout.count({
        where: {
          creatorId: session.user.id
        }
      }),
      // Racha actual (días consecutivos con al menos un entrenamiento)
      prisma.workoutSession.findMany({
        where: {
          userId: session.user.id,
          status: 'COMPLETED'
        },
        select: {
          startTime: true
        },
        orderBy: {
          startTime: 'desc'
        },
        take: 30 // Últimos 30 días
      })
    ])

    // Calcular racha
    const [completedWorkouts, createdWorkouts, recentSessions] = stats
    let currentStreak = 0
    
    if (recentSessions.length > 0) {
      const today = new Date()
      const sessions = recentSessions.map(s => new Date(s.startTime).toDateString())
      const uniqueDates = Array.from(new Set(sessions)).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      
      for (let i = 0; i < uniqueDates.length; i++) {
        const sessionDate = new Date(uniqueDates[i])
        const expectedDate = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000))
        
        if (sessionDate.toDateString() === expectedDate.toDateString()) {
          currentStreak++
        } else {
          break
        }
      }
    }

    // Preparar respuesta sin datos sensibles
    const { password, ...userWithoutPassword } = user
    
    const profile = {
      ...userWithoutPassword,
      stats: {
        completedWorkouts,
        createdWorkouts,
        currentStreak,
        totalClients: user.trainerProfile?.clients?.length || 0,
        activeSubscription: user.subscriptions[0] || null
      }
    }

    return NextResponse.json(profile)

  } catch (error) {
    logger.error('Error fetching user profile:', error, 'API')
    return NextResponse.json(
      { error: 'Error al obtener perfil' },
      { status: 500 }
    )
  }
}

// PUT /api/users/profile - Actualizar perfil del usuario
export async function PUT(req: NextRequest) {
  let session: any = null
  try {
    session = await getServerSession(authOptions)
    if (!session?.user) {
      logger.warn('Unauthorized profile update attempt', 'API')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    let body
    try {
      body = await req.json()
    } catch (error) {
      logger.error('Invalid JSON in profile update request:', error, 'API')
      return NextResponse.json({ error: 'Formato de datos inválido' }, { status: 400 })
    }

    // Validar datos de entrada
    const validationResult = updateProfileSchema.safeParse(body)
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      logger.warn('Profile update validation failed:', { errors, userId: session.user.id }, 'API')
      return NextResponse.json({ 
        error: 'Datos de entrada inválidos', 
        details: errors 
      }, { status: 400 })
    }

    const {
      name,
      avatar,
      // Client profile fields
      age,
      weight,
      height,
      gender,
      fitnessGoal,
      activityLevel,
      // Trainer profile fields
      bio,
      experience,
      specialties,
      hourlyRate,
      maxClients
    } = validationResult.data

    // Verificar que el usuario existe antes de actualizar
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true }
    })

    if (!existingUser) {
      logger.error('User not found during profile update:', { userId: session.user.id }, 'API')
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      // Actualizar usuario base
      const updateData: any = {}
      if (name !== undefined) {
        updateData.name = name.trim()
      }
      if (avatar !== undefined) {
        updateData.avatar = avatar
      }

      if (Object.keys(updateData).length > 0) {
        await tx.user.update({
          where: { id: session.user.id },
          data: {
            ...updateData,
            updatedAt: new Date()
          }
        })
      }

      // Actualizar perfil de cliente si es necesario
      if (existingUser.role === 'CLIENT' || existingUser.role === 'TRAINER') {
        const clientData: any = {}
        if (age !== undefined) clientData.age = age
        if (weight !== undefined) clientData.weight = weight
        if (height !== undefined) clientData.height = height
        if (gender !== undefined) clientData.gender = gender
        if (fitnessGoal !== undefined) clientData.fitnessGoal = fitnessGoal
        if (activityLevel !== undefined) clientData.activityLevel = activityLevel

        if (Object.keys(clientData).length > 0) {
          try {
            const existingClientProfile = await tx.clientProfile.findFirst({
              where: { userId: session.user.id },
            })
            if (existingClientProfile) {
              await tx.clientProfile.update({
                where: { id: existingClientProfile.id },
                data: {
                  ...clientData,
                  updatedAt: new Date(),
                },
              })
            } else {
              await tx.clientProfile.create({
                data: {
                  userId: session.user.id,
                  ...clientData,
                },
              })
            }
          } catch (error) {
            logger.error('Error updating client profile:', error, 'API')
            throw new Error('Error al actualizar perfil de cliente')
          }
        }
      }

      // Actualizar perfil de entrenador si es necesario
      if (existingUser.role === 'TRAINER') {
        const trainerData: any = {}
        if (bio !== undefined) trainerData.bio = bio.trim()
        if (experience !== undefined) trainerData.experience = experience
        if (specialties !== undefined) {
          // Validar y limpiar especialidades
          trainerData.specialties = specialties.filter(s => s && s.trim()).map(s => s.trim())
        }
        if (hourlyRate !== undefined) trainerData.hourlyRate = hourlyRate
        if (maxClients !== undefined) trainerData.maxClients = maxClients

        if (Object.keys(trainerData).length > 0) {
          try {
            await tx.trainerProfile.upsert({
              where: { userId: session.user.id },
              update: {
                ...trainerData,
                updatedAt: new Date()
              },
              create: {
                userId: session.user.id,
                isActive: true,
                maxClients: maxClients || 50,
                ...trainerData
              }
            })
          } catch (error) {
            logger.error('Error updating trainer profile:', error, 'API')
            throw new Error('Error al actualizar perfil de entrenador')
          }
        }
      }
    })

    // Obtener perfil actualizado
    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        clientProfiles: true,
        trainerProfile: true
      }
    })

    if (!updatedUser) {
      logger.error('Updated user not found:', { userId: session.user.id }, 'API')
      return NextResponse.json({ error: 'Error al obtener perfil actualizado' }, { status: 500 })
    }

    const { password, ...userWithoutPassword } = updatedUser

    logger.info('Profile updated successfully:', { userId: session.user.id }, 'API')
    return NextResponse.json(userWithoutPassword)

  } catch (error) {
    // Manejo específico de errores de validación
    if (error instanceof Error && error.message.includes('actualizar perfil')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Error de base de datos
    if (error && typeof error === 'object' && 'code' in error) {
      logger.error('Database error updating profile:', { error }, 'API')
      return NextResponse.json(
        { error: 'Error de base de datos al actualizar perfil' },
        { status: 500 }
      )
    }

    logger.error('Unexpected error updating user profile:', error, 'API')
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
