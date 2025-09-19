/**
 * Workout System Tests
 * Tests for workout engine, validations, and core functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WorkoutEngine } from '@/lib/workout-engine'
import { createWorkoutSchema, workoutExerciseSchema } from '@/lib/validations'

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    workout: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    exercise: {
      findMany: vi.fn(),
      findUnique: vi.fn()
    },
    workoutSession: {
      create: vi.fn(),
      findMany: vi.fn()
    }
  }
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}))

describe('Workout System', () => {
  let workoutEngine: WorkoutEngine

  beforeEach(() => {
    vi.clearAllMocks()
    workoutEngine = new WorkoutEngine()
  })

  describe('Workout Validations', () => {
    it('should validate correct workout data', () => {
      const validWorkout = {
        name: 'Upper Body Strength',
        description: 'A comprehensive upper body workout',
        category: 'STRENGTH',
        duration: 45,
        exercises: [{
          exerciseId: 'clx123456789abcdef',
          order: 1,
          sets: 3,
          reps: 12
        }]
      }

      const result = createWorkoutSchema.safeParse(validWorkout)
      expect(result.success).toBe(true)
    })

    it('should reject workout with invalid name', () => {
      const invalidWorkout = {
        name: '', // Empty name
        description: 'A workout description',
        category: 'STRENGTH'
      }

      const result = createWorkoutSchema.safeParse(invalidWorkout)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required')
      }
    })

    it('should validate workout exercise data', () => {
      const validExercise = {
        exerciseId: 'clx123456789abcdef',
        order: 1,
        sets: 3,
        reps: 12,
        weight: 50,
        restTime: 60
      }

      const result = workoutExerciseSchema.safeParse(validExercise)
      expect(result.success).toBe(true)
    })

    it('should reject exercise with invalid sets', () => {
      const invalidExercise = {
        exerciseId: 'clx123456789abcdef',
        order: 1,
        sets: 0, // Invalid: must be at least 1
        reps: 12
      }

      const result = workoutExerciseSchema.safeParse(invalidExercise)
      expect(result.success).toBe(false)
    })
  })

  describe('Workout Engine', () => {
    it('should generate workout recommendations', async () => {
      const mockProfile = {
        fitnessLevel: 'INTERMEDIATE',
        goals: ['STRENGTH', 'MUSCLE_GAIN'],
        availableTime: 60,
        equipment: ['DUMBBELLS', 'BARBELL']
      }

      const mockPreferences = {
        muscleGroups: ['CHEST', 'BACK', 'SHOULDERS'],
        workoutTypes: ['STRENGTH']
      }

      // Mock the database response
      const { prisma } = await import('@/lib/db')
      vi.mocked(prisma.workout.findMany).mockResolvedValue([
        {
          id: 'workout1',
          name: 'Upper Body Strength',
          category: 'STRENGTH',
          duration: 45,
          creatorId: 'trainer1',
          assignedToId: null,
          isTemplate: false,
          isPublic: true,
          description: 'Upper body workout',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ])

      const recommendations = await workoutEngine.generateRecommendations(
        'user123',
        3
      )

      expect(recommendations).toBeDefined()
      expect(Array.isArray(recommendations)).toBe(true)
    })

    it('should calculate workout analytics', async () => {
      const userId = 'user123'
      const timeframe = 30 // days

      // Mock workout sessions data
      const { prisma } = await import('@/lib/db')
      vi.mocked(prisma.workoutSession.findMany).mockResolvedValue([
        {
          id: 'session1',
          userId,
          workoutId: 'workout1',
          startTime: new Date(),
          endTime: new Date(),
          duration: 2700, // 45 minutes in seconds
          caloriesBurned: 300,
          status: 'COMPLETED',
          notes: null,
          rating: null
        }
      ])

      const analytics = await workoutEngine.generateWorkoutAnalytics(userId, 'month')

      expect(analytics).toBeDefined()
      expect(typeof analytics.totalSessions).toBe('number')
      expect(typeof analytics.averageDuration).toBe('number')
      expect(typeof analytics.consistencyScore).toBe('number')
    })

    it('should generate progression suggestions', async () => {
      const userId = 'user123'
      const exerciseId = 'exercise1'

      // Mock exercise history
      const { prisma } = await import('@/lib/db')
      vi.mocked(prisma.workoutSession.findMany).mockResolvedValue([
        {
          id: 'session1',
          userId,
          workoutId: 'workout1',
          startTime: new Date(),
          endTime: new Date(),
          duration: 2700,
          status: 'COMPLETED',
          notes: null,
          rating: null,
          caloriesBurned: null
        }
      ])

      const suggestions = await workoutEngine.generateProgressionSuggestions(
        userId
      )

      expect(suggestions).toBeDefined()
      expect(Array.isArray(suggestions)).toBe(true)
    })
  })

  describe('Workout Creation Flow', () => {
    it('should create a complete workout with exercises', () => {
      const workoutData = {
        name: 'Full Body HIIT',
        description: 'High intensity interval training for full body',
        category: 'HIIT',
        difficulty: 'ADVANCED',
        estimatedDuration: 30,
        exercises: [
          {
            exerciseId: 'clx123456789abcdef',
            order: 1,
            sets: 4,
            reps: 15,
            restTime: 30
          },
          {
            exerciseId: 'clx987654321fedcba',
            order: 2,
            duration: 60, // For time-based exercises
            restTime: 45
          }
        ]
      }

      const result = createWorkoutSchema.safeParse(workoutData)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.name).toBe('Full Body HIIT')
        expect(result.data.exercises).toHaveLength(2)
      }
    })

    it('should handle different exercise types (reps vs duration)', () => {
      // Test rep-based exercise
      const repExercise = {
        exerciseId: 'clx123456789abcdef',
        order: 1,
        sets: 3,
        reps: 12,
        weight: 25
      }

      const repResult = workoutExerciseSchema.safeParse(repExercise)
      expect(repResult.success).toBe(true)

      // Test duration-based exercise
      const durationExercise = {
        exerciseId: 'clx987654321fedcba',
        order: 2,
        duration: 60, // 60 seconds
        restTime: 30
      }

      const durationResult = workoutExerciseSchema.safeParse(durationExercise)
      expect(durationResult.success).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const { prisma } = await import('@/lib/db')
      vi.mocked(prisma.workout.findMany).mockRejectedValue(new Error('Database error'))

      const recommendations = await workoutEngine.generateRecommendations(
        'user123',
        3
      )

      // Should return empty array on error
      expect(recommendations).toEqual([])
    })

    it('should validate extreme values', () => {
      const extremeWorkout = {
        name: 'A'.repeat(200), // Too long
        description: 'Valid description',
        category: 'STRENGTH'
      }

      const result = createWorkoutSchema.safeParse(extremeWorkout)
      expect(result.success).toBe(false)
    })
  })
})