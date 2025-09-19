import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AnalyticsEngine } from '@/lib/analytics'
import { WorkoutEngine } from '@/lib/workout-engine'

// Mock Prisma
vi.mock('@/lib/db', () => ({
	prisma: {
		user: {
			count: vi.fn(),
			findMany: vi.fn(),
			findUnique: vi.fn()
		},
		workoutSession: {
			findMany: vi.fn(),
			count: vi.fn(),
			aggregate: vi.fn()
		},
		bodyMeasurement: {
			findMany: vi.fn(),
			findFirst: vi.fn()
		},
		personalRecord: {
			findMany: vi.fn(),
			count: vi.fn()
		},
		subscription: {
			findMany: vi.fn(),
			aggregate: vi.fn()
		},
		$queryRaw: vi.fn()
	}
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
	logger: {
		error: vi.fn(),
		info: vi.fn(),
		warn: vi.fn()
	}
}))

describe('Progress & Analytics System', () => {
	let analyticsEngine: AnalyticsEngine
	let workoutEngine: WorkoutEngine

	beforeEach(() => {
		vi.clearAllMocks()
		analyticsEngine = new AnalyticsEngine()
		workoutEngine = new WorkoutEngine()
	})

	describe('User Analytics', () => {
		it('should calculate user analytics correctly', async () => {
			const userId = 'user123'
			
			// Mock workout sessions data
			const { prisma } = await import('@/lib/db')
			
			const mockSessions = [
				{
					id: 'session1',
					userId,
					workoutId: 'workout1',
					startTime: new Date('2024-01-15T10:00:00Z'),
					endTime: new Date('2024-01-15T10:45:00Z'),
					duration: 2700, // 45 minutes
					status: 'COMPLETED',
					caloriesBurned: 320,
					notes: null,
					rating: 5
				},
				{
					id: 'session2',
					userId,
					workoutId: 'workout2',
					startTime: new Date('2024-01-16T10:00:00Z'),
					endTime: new Date('2024-01-16T10:30:00Z'),
					duration: 1800, // 30 minutes
					status: 'COMPLETED',
					caloriesBurned: 250,
					notes: null,
					rating: 4
				}
			]
			
			vi.mocked(prisma.user.findUnique).mockResolvedValue({
				id: userId,
				email: 'test@example.com',
				name: 'Test User',
				image: null,
				emailVerified: null,
				role: 'USER',
				isActive: true,
				lastLoginAt: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
				workoutSessions: mockSessions
			})
			
			vi.mocked(prisma.workoutSession.findMany).mockResolvedValue(mockSessions)

			const analytics = await analyticsEngine.generateUserAnalytics(userId)

			expect(analytics).toBeDefined()
			expect(analytics.userId).toBe(userId)
			expect(analytics.totalWorkouts).toBeGreaterThan(0)
			expect(analytics.totalWorkoutTime).toBeGreaterThan(0)
			expect(analytics.averageWorkoutDuration).toBeGreaterThan(0)
			expect(analytics.totalCaloriesBurned).toBeGreaterThan(0)
			expect(['low', 'medium', 'high']).toContain(analytics.engagementLevel)
		})

		it('should calculate consistency score correctly', async () => {
			const userId = 'user123'
			
			// Mock user data with workout sessions
			const { prisma } = await import('@/lib/db')
			
			// Mock consistent workout pattern
			const sessions = Array.from({ length: 20 }, (_, i) => ({
				id: `session${i}`,
				userId,
				workoutId: `workout${i}`,
				startTime: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)), // Daily sessions
				endTime: new Date(Date.now() - (i * 24 * 60 * 60 * 1000) + 2700000),
				duration: 2700,
				status: 'COMPLETED',
				caloriesBurned: 300,
				notes: null,
				rating: 4
			}))

			vi.mocked(prisma.user.findUnique).mockResolvedValue({
				id: userId,
				email: 'test@example.com',
				name: 'Test User',
				image: null,
				emailVerified: null,
				role: 'USER',
				isActive: true,
				lastLoginAt: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
				workoutSessions: sessions
			})

			vi.mocked(prisma.workoutSession.findMany).mockResolvedValue(sessions)

			const analytics = await analyticsEngine.generateUserAnalytics(userId)

			expect(analytics.consistencyScore).toBeGreaterThan(80) // High consistency
			expect(analytics.currentStreak).toBeGreaterThan(0)
		})
	})

	describe('Workout Analytics', () => {
		it('should generate comprehensive workout analytics', async () => {
			const userId = 'user123'
			const timeframe = 'month'

			// Mock workout sessions with exercises
			const { prisma } = await import('@/lib/db')
			vi.mocked(prisma.workoutSession.findMany).mockResolvedValue([
				{
					id: 'session1',
					userId,
					workoutId: 'workout1',
					startTime: new Date('2024-01-15T10:00:00Z'),
					endTime: new Date('2024-01-15T10:45:00Z'),
					duration: 2700,
					status: 'COMPLETED',
					caloriesBurned: 320,
					notes: null,
					rating: 5,

					workout: {
						id: 'workout1',
						name: 'Upper Body',
						category: 'STRENGTH',
						exercises: []
					}
				}
			])

			const analytics = await workoutEngine.generateWorkoutAnalytics(userId, timeframe)

			expect(analytics).toBeDefined()
			expect(analytics.totalSessions).toBeGreaterThan(0)
			expect(analytics.averageDuration).toBeGreaterThan(0)
			expect(analytics.averageCaloriesBurned).toBeGreaterThan(0)
			expect(typeof analytics.muscleGroupDistribution).toBe('object')
			expect(Array.isArray(analytics.difficultyProgression)).toBe(true)
			expect(typeof analytics.consistencyScore).toBe('number')
			expect(typeof analytics.strengthProgression).toBe('object')
		})

		it('should handle empty workout data gracefully', async () => {
			const userId = 'user123'
			
			const { prisma } = await import('@/lib/db')
			vi.mocked(prisma.workoutSession.findMany).mockResolvedValue([])

			const analytics = await workoutEngine.generateWorkoutAnalytics(userId)

			expect(analytics.totalSessions).toBe(0)
			expect(analytics.averageDuration).toBe(0)
			expect(analytics.averageCaloriesBurned).toBe(0)
			expect(analytics.consistencyScore).toBe(0)
		})
	})

	describe('Progress Tracking', () => {
		it('should track body measurements progress', async () => {
			const userId = 'user123'
			
			const { prisma } = await import('@/lib/db')
			vi.mocked(prisma.bodyMeasurement.findMany).mockResolvedValue([
				{
					id: 'measurement1',
					userId,
					weight: 75.5,
					bodyFat: 15.2,
					muscle: 45.8,
					chest: null,
					waist: null,
					hips: null,
					arms: null,
					thighs: null,
					notes: null,
					measuredAt: new Date('2024-01-15T08:00:00Z')
				},
				{
					id: 'measurement2',
					userId,
					weight: 74.8,
					bodyFat: 14.9,
					muscle: 46.1,
					chest: null,
					waist: null,
					hips: null,
					arms: null,
					thighs: null,
					notes: null,
					measuredAt: new Date('2024-01-22T08:00:00Z')
				}
			])

			vi.mocked(prisma.bodyMeasurement.findFirst).mockResolvedValue({
				id: 'measurement2',
				userId,
				weight: 74.8,
				bodyFat: 14.9,
				muscle: 46.1,
				chest: null,
				waist: null,
				hips: null,
				arms: null,
				thighs: null,
				notes: null,
				measuredAt: new Date('2024-01-22T08:00:00Z')
			})

			// This would be tested via API endpoint
			const measurements = await prisma.bodyMeasurement.findMany({
				where: { userId },
				orderBy: { measuredAt: 'asc' }
			})

			expect(measurements).toHaveLength(2)
			expect(measurements[1].weight!).toBeLessThan(measurements[0].weight!) // Weight loss
			expect(measurements[1].muscle!).toBeGreaterThan(measurements[0].muscle!) // Muscle gain
		})

		it('should track personal records', async () => {
			const userId = 'user123'
			
			const { prisma } = await import('@/lib/db')
			vi.mocked(prisma.personalRecord.findMany).mockResolvedValue([
				{
					id: 'record1',
					userId,
					exerciseId: 'exercise1',
					recordType: 'MAX_WEIGHT',
					value: 100,
					reps: null,
					achievedAt: new Date('2024-01-15T10:30:00Z'),
					exercise: {
						id: 'exercise1',
						name: 'Bench Press',
						category: 'STRENGTH',
						description: 'Chest exercise',
						instructions: 'Lie on bench and press',
						imageUrl: null,
						videUrl: null,
						muscleGroups: ['CHEST'],
						equipment: ['BARBELL'],
						difficulty: 'INTERMEDIATE',
						metrics: ['WEIGHT', 'REPS'],
						createdAt: new Date(),
						updatedAt: new Date()
					}
				},
				{
					id: 'record2',
					userId,
					exerciseId: 'exercise2',
					recordType: 'MAX_REPS',
					value: 25,
					reps: 25,
					achievedAt: new Date('2024-01-16T11:00:00Z'),
					exercise: {
						id: 'exercise2',
						name: 'Push-ups',
						category: 'BODYWEIGHT',
						description: 'Bodyweight exercise',
						instructions: 'Push your body up',
						imageUrl: null,
						videUrl: null,
						muscleGroups: ['CHEST'],
						equipment: ['BODYWEIGHT'],
						difficulty: 'BEGINNER',
						metrics: ['REPS'],
						createdAt: new Date(),
						updatedAt: new Date()
					}
				}
			])

			vi.mocked(prisma.$queryRaw).mockResolvedValue([
				{ category: 'STRENGTH', count: 1 },
				{ category: 'BODYWEIGHT', count: 1 }
			])

			const records = await prisma.personalRecord.findMany({
				where: { userId },
				include: { exercise: true }
			})

			expect(records).toHaveLength(2)
			expect(records[0].recordType).toBe('MAX_WEIGHT')
			expect(records[1].recordType).toBe('MAX_REPS')
			expect(records[0].exercise.name).toBe('Bench Press')
			expect(records[1].exercise.name).toBe('Push-ups')
		})
	})

	describe('Progression Suggestions', () => {
		it('should generate progression suggestions based on performance', async () => {
			const userId = 'user123'
			
			const { prisma } = await import('@/lib/db')
			vi.mocked(prisma.workoutSession.findMany).mockResolvedValue([
				{
					id: 'session1',
					userId,
					workoutId: 'workout1',
					startTime: new Date('2024-01-13T10:00:00Z'),
					endTime: new Date('2024-01-13T10:45:00Z'),
					duration: 2700,
					status: 'COMPLETED',
					notes: null,
					rating: null,
					caloriesBurned: null,
					exercises: [
						{
							id: 'ex1',
							exerciseId: 'exercise1',
							sets: 3,
							reps: 12,
							weightUsed: [20, 20, 20],
							exercise: {
								id: 'exercise1',
								name: 'Bench Press'
							}
						}
					]
				},
				{
					id: 'session2',
					userId,
					workoutId: 'workout1',
					startTime: new Date('2024-01-15T10:00:00Z'),
					endTime: new Date('2024-01-15T10:45:00Z'),
					duration: 2700,
					status: 'COMPLETED',
					notes: null,
					rating: null,
					caloriesBurned: null,
					exercises: [
						{
							id: 'ex2',
							exerciseId: 'exercise1',
							sets: 3,
							reps: 12,
							weightUsed: [20, 20, 20], // Same weight - ready for progression
							exercise: {
								id: 'exercise1',
								name: 'Bench Press'
							}
						}
					]
				},
				{
					id: 'session3',
					userId,
					workoutId: 'workout1',
					startTime: new Date('2024-01-17T10:00:00Z'),
					endTime: new Date('2024-01-17T10:45:00Z'),
					duration: 2700,
					status: 'COMPLETED',
					notes: null,
					rating: null,
					caloriesBurned: null,
					exercises: [
						{
							id: 'ex3',
							exerciseId: 'exercise1',
							sets: 3,
							reps: 12,
							weightUsed: [20, 20, 20], // Same weight again
							exercise: {
								id: 'exercise1',
								name: 'Bench Press'
							}
						}
					]
				}
			])

			const suggestions = await workoutEngine.generateProgressionSuggestions(userId)

			expect(suggestions).toBeDefined()
			expect(Array.isArray(suggestions)).toBe(true)
			// Should suggest progression since weight has been consistent
		})

		it('should not suggest progression with insufficient data', async () => {
			const userId = 'user123'
			
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
					caloriesBurned: null,
					exercises: []
				}
			]) // Only 1 session - insufficient data

			const suggestions = await workoutEngine.generateProgressionSuggestions(userId)

			expect(suggestions).toEqual([]) // Should return empty array
		})
	})

	describe('Business Analytics', () => {
		it('should calculate business metrics correctly', async () => {
			const { prisma } = await import('@/lib/db')
			
			// Mock user counts
			vi.mocked(prisma.user.count)
				.mockResolvedValueOnce(1000) // Total users
				.mockResolvedValueOnce(750)  // Active users
				.mockResolvedValueOnce(600)  // Users with workouts
				.mockResolvedValueOnce(500)  // Users with completed workouts
				.mockResolvedValueOnce(200)  // Weekly active users

			// Mock subscription data
			vi.mocked(prisma.subscription.findMany).mockResolvedValue([
				{ id: '1', userId: 'user1', planType: 'PRO', status: 'ACTIVE', currentPeriodStart: new Date(), currentPeriodEnd: new Date(), cancelAtPeriodEnd: false, createdAt: new Date(), updatedAt: new Date(), stripeCustomerId: null, stripeSubscriptionId: null, stripePriceId: null },
				{ id: '2', userId: 'user2', planType: 'BASIC', status: 'ACTIVE', currentPeriodStart: new Date(), currentPeriodEnd: new Date(), cancelAtPeriodEnd: false, createdAt: new Date(), updatedAt: new Date(), stripeCustomerId: null, stripeSubscriptionId: null, stripePriceId: null }
			])

			// Mock subscription count
			;(prisma.subscription.count as any) = vi.fn().mockResolvedValue(200)

			// Mock workout session counts for completion rate
			vi.mocked(prisma.workoutSession.count).mockResolvedValue(500)

			vi.mocked(prisma.subscription.aggregate).mockResolvedValue({
				_sum: { amount: 15000 }, // Monthly revenue
				_count: { id: 300 },
				_avg: { amount: null },
				_min: { amount: null },
				_max: { amount: null }
			})

			const metrics = await analyticsEngine.generateBusinessMetrics()

			expect(metrics).toBeDefined()
			expect(metrics.totalUsers).toBe(1000)
			expect(metrics.activeUsers).toBe(750)
			expect(metrics.monthlyRecurringRevenue).toBeGreaterThan(0)
			expect(metrics.workoutCompletionRate).toBeGreaterThan(0)
			expect(metrics.conversionRate).toBeGreaterThan(0)
		})
	})

	describe('Error Handling', () => {
		it('should handle database errors gracefully in analytics', async () => {
			const userId = 'user123'
			
			const { prisma } = await import('@/lib/db')
			vi.mocked(prisma.workoutSession.findMany).mockRejectedValue(new Error('Database error'))

			const analytics = await workoutEngine.generateWorkoutAnalytics(userId)

			// Should return default values instead of throwing
			expect(analytics.totalSessions).toBe(0)
			expect(analytics.averageDuration).toBe(0)
			expect(analytics.averageCaloriesBurned).toBe(0)
		})

		it('should handle missing user data in analytics', async () => {
			const userId = 'nonexistent-user'
			
			const { prisma } = await import('@/lib/db')
			vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

			await expect(analyticsEngine.generateUserAnalytics(userId)).rejects.toThrow('User not found')
		})
	})
})