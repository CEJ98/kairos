/**
 * Optimized Database Queries for Kairos Fitness
 * Implements efficient queries with caching, pagination, and performance monitoring
 */

import { prisma } from './db'
import { cacheManager, CacheKeys, cacheUtils } from './cache-manager'
import { logger } from './logger'

// Performance monitoring
const queryTimes = new Map<string, number[]>()

function trackQueryTime(queryName: string, startTime: number) {
  const duration = Date.now() - startTime
  if (!queryTimes.has(queryName)) {
    queryTimes.set(queryName, [])
  }
  queryTimes.get(queryName)!.push(duration)
  
  // Log slow queries (>1000ms)
  if (duration > 1000) {
    logger.performance(`Slow query detected: ${queryName} took ${duration}ms`, { queryName, duration })
  }
}

export const optimizedQueries = {
  /**
   * Get user profile with caching
   */
  getUserProfile: async (userId: string) => {
    const startTime = Date.now()
    const cacheKey = cacheUtils.generateKey('user_profile', userId)

    const result = await cacheManager.getOrSet(
      CacheKeys.USER_PROFILE,
      cacheKey,
      async () => {
        return await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            role: true,
            isVerified: true,
            createdAt: true,
            // Include related profiles based on role
            clientProfiles: {
              select: {
                id: true,
                age: true,
                weight: true,
                height: true,
                fitnessGoal: true,
                activityLevel: true,
                trainer: {
                  select: {
                    id: true,
                    user: {
                      select: {
                        name: true,
                        avatar: true
                      }
                    }
                  }
                }
              }
            },
            trainerProfile: {
              select: {
                id: true,
                bio: true,
                experience: true,
                specialties: true,
                hourlyRate: true,
                maxClients: true,
                isActive: true,
                clients: {
                  select: {
                    id: true,
                    user: {
                      select: {
                        name: true,
                        avatar: true
                      }
                    }
                  }
                }
              }
            },
            subscriptions: {
              where: { status: 'ACTIVE' },
              select: {
                id: true,
                planType: true,
                status: true,
                currentPeriodEnd: true
              },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        })
      }
    )

    trackQueryTime('getUserProfile', startTime)
    return result
  },

  /**
   * Get user workouts with optimized pagination and filtering
   */
  getUserWorkouts: async (
    userId: string, 
    options: {
      page?: number
      limit?: number
      category?: string
      isTemplate?: boolean
      search?: string
      sortBy?: 'createdAt' | 'name' | 'category'
      sortOrder?: 'asc' | 'desc'
    } = {}
  ) => {
    const startTime = Date.now()
    const {
      page = 1,
      limit = 20,
      category,
      isTemplate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options

    const cacheKey = cacheUtils.generateKey(
      'user_workouts',
      userId,
      page,
      limit,
      category || 'all',
      String(isTemplate),
      search || 'none',
      sortBy,
      sortOrder
    )

    const result = await cacheManager.getOrSet(
      CacheKeys.USER_WORKOUTS,
      cacheKey,
      async () => {
        const skip = (page - 1) * limit

        // Build where clause
        const where: any = {
          OR: [
            { creatorId: userId },
            { assignedToId: userId },
            { isPublic: true }
          ]
        }

        if (category && category !== 'all') {
          where.category = category
        }

        if (isTemplate !== undefined) {
          where.isTemplate = isTemplate
        }

        if (search) {
          where.AND = [
            ...(where.AND || []),
            {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
              ]
            }
          ]
        }

        // Parallel execution for count and data
        const [workouts, total] = await Promise.all([
          prisma.workout.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
              duration: true,
              isTemplate: true,
              isPublic: true,
              createdAt: true,
              updatedAt: true,
              creator: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              },
              exercises: {
                select: {
                  id: true,
                  order: true,
                  exercise: {
                    select: {
                      id: true,
                      name: true,
                      category: true,
                      difficulty: true,
                      imageUrl: true
                    }
                  }
                },
                orderBy: { order: 'asc' }
              },
              _count: {
                select: {
                  sessions: true
                }
              }
            }
          }),
          prisma.workout.count({ where })
        ])

        return {
          workouts,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
          }
        }
      },
      10 * 60 * 1000 // Cache for 10 minutes
    )

    trackQueryTime('getUserWorkouts', startTime)
    return result
  },

  /**
   * Get workout details with exercises
   */
  getWorkoutDetails: async (workoutId: string, userId?: string) => {
    const startTime = Date.now()
    const cacheKey = cacheUtils.generateKey('workout_details', workoutId, userId || 'anonymous')

    const result = await cacheManager.getOrSet(
      CacheKeys.WORKOUT_DETAILS,
      cacheKey,
      async () => {
        const workout = await prisma.workout.findUnique({
          where: { id: workoutId },
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            duration: true,
            isTemplate: true,
            isPublic: true,
            createdAt: true,
            updatedAt: true,
            creator: {
              select: {
                id: true,
                name: true,
                avatar: true,
                trainerProfile: {
                  select: {
                    bio: true,
                    experience: true,
                    specialties: true
                  }
                }
              }
            },
            exercises: {
              select: {
                id: true,
                order: true,
                sets: true,
                reps: true,
                weight: true,
                duration: true,
                distance: true,
                restTime: true,
                notes: true,
                exercise: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    category: true,
                    muscleGroups: true,
                    equipment: true,
                    difficulty: true,
                    instructions: true,
                    tips: true,
                    imageUrl: true,
                    videoUrl: true,
                    gifUrl: true
                  }
                }
              },
              orderBy: { order: 'asc' }
            },
            _count: {
              select: {
                sessions: true
              }
            }
          }
        })

        if (!workout) return null

        // Get user-specific data if authenticated
        let userSpecificData = null
        if (userId) {
          userSpecificData = await prisma.workoutSession.findFirst({
            where: {
              userId,
              workoutId: workoutId,
              status: 'COMPLETED'
            },
            select: {
              id: true,
              duration: true,
              rating: true,
              caloriesBurned: true,
              endTime: true
            },
            orderBy: { endTime: 'desc' }
          })
        }

        return {
          ...workout,
          userStats: userSpecificData
        }
      }
    )

    trackQueryTime('getWorkoutDetails', startTime)
    return result
  },

  /**
   * Get user workout sessions with analytics
   */
  getUserSessions: async (
    userId: string,
    options: {
      page?: number
      limit?: number
      status?: string
      dateFrom?: Date
      dateTo?: Date
      workoutId?: string
    } = {}
  ) => {
    const startTime = Date.now()
    const {
      page = 1,
      limit = 20,
      status,
      dateFrom,
      dateTo,
      workoutId
    } = options

    const cacheKey = cacheUtils.generateKey(
      'user_sessions',
      userId,
      page,
      limit,
      status || 'all',
      dateFrom?.toISOString() || 'none',
      dateTo?.toISOString() || 'none',
      workoutId || 'all'
    )

    const result = await cacheManager.getOrSet(
      CacheKeys.WORKOUT_SESSIONS,
      cacheKey,
      async () => {
        const skip = (page - 1) * limit

        const where: any = { userId }

        if (status) {
          where.status = status
        }

        if (dateFrom || dateTo) {
          where.startTime = {}
          if (dateFrom) where.startTime.gte = dateFrom
          if (dateTo) where.startTime.lte = dateTo
        }

        if (workoutId) {
          where.workoutId = workoutId
        }

        const [sessions, total, stats] = await Promise.all([
          prisma.workoutSession.findMany({
            where,
            skip,
            take: limit,
            orderBy: { startTime: 'desc' },
            select: {
              id: true,
              startTime: true,
              endTime: true,
              duration: true,
              status: true,
              rating: true,
              caloriesBurned: true,
              notes: true,
              workout: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  duration: true
                }
              },
              exercises: {
                select: {
                  id: true,
                  setsCompleted: true,
                  repsCompleted: true,
                  exercise: {
                    select: {
                      name: true,
                      category: true
                    }
                  }
                }
              }
            }
          }),
          prisma.workoutSession.count({ where }),
          // Get aggregate stats
          prisma.workoutSession.aggregate({
            where: { userId, status: 'COMPLETED' },
            _count: { id: true },
            _sum: {
              duration: true,
              caloriesBurned: true
            },
            _avg: {
              rating: true,
              duration: true
            }
          })
        ])

        return {
          sessions,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          },
          stats: {
            totalSessions: stats._count.id,
            totalDuration: stats._sum.duration || 0,
            totalCalories: stats._sum.caloriesBurned || 0,
            avgRating: stats._avg.rating || 0,
            avgDuration: stats._avg.duration || 0
          }
        }
      },
      5 * 60 * 1000 // Cache for 5 minutes
    )

    trackQueryTime('getUserSessions', startTime)
    return result
  },

  /**
   * Get exercises with optimized filtering
   */
  getExercises: async (
    options: {
      category?: string
      difficulty?: string
      muscleGroup?: string
      equipment?: string
      search?: string
      page?: number
      limit?: number
    } = {}
  ) => {
    const startTime = Date.now()
    const {
      category,
      difficulty,
      muscleGroup,
      equipment,
      search,
      page = 1,
      limit = 50
    } = options

    const cacheKey = cacheUtils.generateKey(
      'exercises',
      category || 'all',
      difficulty || 'all',
      muscleGroup || 'all',
      equipment || 'all',
      search || 'none',
      page,
      limit
    )

    const result = await cacheManager.getOrSet(
      CacheKeys.EXERCISE_LIST,
      cacheKey,
      async () => {
        const skip = (page - 1) * limit
        const where: any = { isActive: true }

        if (category) {
          where.category = category
        }

        if (difficulty) {
          where.difficulty = difficulty
        }

        if (muscleGroup) {
          where.muscleGroups = {
            contains: muscleGroup
          }
        }

        if (equipment) {
          where.equipment = {
            contains: equipment
          }
        }

        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        }

        const [exercises, total] = await Promise.all([
          prisma.exercise.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: 'asc' },
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
              muscleGroups: true,
              equipment: true,
              difficulty: true,
              imageUrl: true,
              gifUrl: true,
              instructions: true,
              tips: true
            }
          }),
          prisma.exercise.count({ where })
        ])

        return {
          exercises,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      },
      60 * 60 * 1000 // Cache for 1 hour
    )

    trackQueryTime('getExercises', startTime)
    return result
  },

  /**
   * Get user analytics with comprehensive stats
   */
  getUserAnalytics: async (userId: string, timeframe: 'week' | 'month' | 'year' = 'month') => {
    const startTime = Date.now()
    const cacheKey = cacheUtils.generateKey('user_analytics', userId, timeframe)

    const result = await cacheManager.getOrSet(
      CacheKeys.USER_STATS,
      cacheKey,
      async () => {
        const now = new Date()
        let startDate: Date

        switch (timeframe) {
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
          case 'year':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
            break
        }

        // Parallel execution of analytics queries
        const [
          sessionStats,
          workoutStats,
          recordsCount,
          measurementsCount,
          recentSessions
        ] = await Promise.all([
          // Session analytics
          prisma.workoutSession.aggregate({
            where: {
              userId,
              status: 'COMPLETED',
              startTime: { gte: startDate }
            },
            _count: { id: true },
            _sum: {
              duration: true,
              caloriesBurned: true
            },
            _avg: {
              rating: true
            }
          }),
          // Workout creation stats
          prisma.workout.count({
            where: {
              creatorId: userId,
              createdAt: { gte: startDate }
            }
          }),
          // Personal records
          prisma.personalRecord.count({
            where: {
              userId,
              achievedAt: { gte: startDate }
            }
          }),
          // Body measurements
          prisma.bodyMeasurement.count({
            where: {
              userId,
              measuredAt: { gte: startDate }
            }
          }),
          // Recent session performance
          prisma.workoutSession.findMany({
            where: {
              userId,
              status: 'COMPLETED',
              startTime: { gte: startDate }
            },
            select: {
              startTime: true,
              duration: true,
              caloriesBurned: true,
              rating: true
            },
            orderBy: { startTime: 'desc' },
            take: 10
          })
        ])

        return {
          timeframe,
          sessions: {
            count: sessionStats._count.id,
            totalDuration: sessionStats._sum.duration || 0,
            totalCalories: sessionStats._sum.caloriesBurned || 0,
            avgRating: sessionStats._avg.rating || 0
          },
          workoutsCreated: workoutStats,
          personalRecords: recordsCount,
          measurementsTaken: measurementsCount,
          recentActivity: recentSessions,
          calculatedMetrics: {
            avgSessionsPerWeek: sessionStats._count.id / (timeframe === 'week' ? 1 : timeframe === 'month' ? 4 : 52),
            avgCaloriesPerSession: sessionStats._count.id > 0 ? (sessionStats._sum.caloriesBurned || 0) / sessionStats._count.id : 0,
            consistencyScore: Math.min(100, (sessionStats._count.id / (timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 365)) * 100)
          }
        }
      },
      5 * 60 * 1000 // Cache for 5 minutes
    )

    trackQueryTime('getUserAnalytics', startTime)
    return result
  },

  /**
   * Get query performance stats
   */
  getQueryStats: () => {
    const stats = new Map<string, {
      count: number
      avgTime: number
      maxTime: number
      minTime: number
    }>()

    queryTimes.forEach((times, queryName) => {
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length
      const maxTime = Math.max(...times)
      const minTime = Math.min(...times)

      stats.set(queryName, {
        count: times.length,
        avgTime: Math.round(avgTime),
        maxTime,
        minTime
      })
    })

    return Object.fromEntries(stats)
  },

  /**
   * Cache invalidation helpers
   */
  invalidateUserCache: async (userId: string) => {
    await cacheManager.invalidateRelated(userId, 'profile')
  },

  invalidateWorkoutCache: async (userId: string, workoutId?: string) => {
    await cacheManager.invalidateRelated(userId, 'workout')
    if (workoutId) {
      await cacheManager.delete(CacheKeys.WORKOUT_DETAILS, workoutId)
    }
  }
}

export default optimizedQueries