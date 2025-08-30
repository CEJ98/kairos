import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

import { logger } from '@/lib/logger'
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
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
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
    } = body

    await prisma.$transaction(async (tx) => {
      // Actualizar usuario base
      const updateData: any = {}
      if (name !== undefined) updateData.name = name
      if (avatar !== undefined) updateData.avatar = avatar

      if (Object.keys(updateData).length > 0) {
        await tx.user.update({
          where: { id: session.user.id },
          data: updateData
        })
      }

      // Actualizar perfil de cliente si es necesario
      if (session.user.role === 'CLIENT' || session.user.role === 'TRAINER') {
        const clientData: any = {}
        if (age !== undefined) clientData.age = age
        if (weight !== undefined) clientData.weight = weight
        if (height !== undefined) clientData.height = height
        if (gender !== undefined) clientData.gender = gender
        if (fitnessGoal !== undefined) clientData.fitnessGoal = fitnessGoal
        if (activityLevel !== undefined) clientData.activityLevel = activityLevel

        if (Object.keys(clientData).length > 0) {
          await tx.clientProfile.upsert({
            where: { id: session.user.id },
            update: clientData,
            create: {
              userId: session.user.id,
              ...clientData
            }
          })
        }
      }

      // Actualizar perfil de entrenador si es necesario
      if (session.user.role === 'TRAINER') {
        const trainerData: any = {}
        if (bio !== undefined) trainerData.bio = bio
        if (experience !== undefined) trainerData.experience = experience
        if (specialties !== undefined) trainerData.specialties = specialties
        if (hourlyRate !== undefined) trainerData.hourlyRate = hourlyRate
        if (maxClients !== undefined) trainerData.maxClients = maxClients

        if (Object.keys(trainerData).length > 0) {
          await tx.trainerProfile.upsert({
            where: { userId: session.user.id },
            update: trainerData,
            create: {
              userId: session.user.id,
              isActive: true,
              maxClients: maxClients || 50,
              ...trainerData
            }
          })
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

    const { password, ...userWithoutPassword } = updatedUser!

    return NextResponse.json(userWithoutPassword)

  } catch (error) {
    logger.error('Error updating user profile:', error, 'API')
    return NextResponse.json(
      { error: 'Error al actualizar perfil' },
      { status: 500 }
    )
  }
}