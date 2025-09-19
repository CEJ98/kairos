// @ts-nocheck
/**
 * Advanced Database Optimizations
 * Additional performance enhancements and query strategies
 */

import { PrismaClient } from '@prisma/client'
import { unifiedCache } from '../cache/consolidated-cache'
import { logger } from '../logger'
import { unifiedPerformanceMonitor } from '../performance/consolidated-monitor'

// Advanced query builder with optimization patterns
export class AdvancedQueryBuilder {
	private prisma: PrismaClient

	constructor(prismaClient: PrismaClient) {
		this.prisma = prismaClient
	}

	/**
	 * Optimized workout fetching with intelligent preloading
	 */
	async getWorkoutsOptimized(params: {
		userId: string
		page?: number
		limit?: number
		category?: string
		includeExercises?: boolean
		includeStats?: boolean
	}) {
		const { userId, page = 1, limit = 20, category, includeExercises = false, includeStats = false } = params
		const cacheKey = `workouts:${userId}:${page}:${limit}:${category}:${includeExercises}:${includeStats}`

		return unifiedCache.getOrSet('data', cacheKey, async () => {
			const startTime = performance.now()

			// Build optimized where clause
			const where: any = {
				OR: [
					{ creatorId: userId },
					{ assignedToId: userId },
					{ 
						AND: [
							{ isPublic: true },
							{ isTemplate: true }
						]
					}
				]
			}

			if (category && category !== 'all') {
				where.category = category
			}

			// Optimized select with conditional includes
			const select: any = {
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
						email: true
					}
				}
			}

			if (includeExercises) {
				select.workoutExercises = {
					select: {
						id: true,
						order: true,
						sets: true,
						reps: true,
						weight: true,
						restTime: true,
						exercise: {
							select: {
								id: true,
								name: true,
								category: true,
								muscleGroups: true,
								difficulty: true,
								instructions: true
							}
						}
					},
					orderBy: { order: 'asc' }
				}
			}

			// Parallel execution for better performance
			const [workouts, totalCount] = await Promise.all([
				this.prisma.workout.findMany({
					where,
					select,
					skip: (page - 1) * limit,
					take: limit,
					orderBy: { createdAt: 'desc' }
				}),
				this.prisma.workout.count({ where })
			])

			// Add stats if requested (separate query to avoid N+1)
			if (includeStats && workouts.length > 0) {
				const workoutIds = workouts.map(w => w.id)
				const stats = await this.prisma.workoutSession.groupBy({
					by: ['workoutId'],
					where: {
						workoutId: { in: workoutIds },
						status: 'completed'
					},
					_count: { id: true },
					_avg: { duration: true }
				})

				// Attach stats to workouts
				workouts.forEach((workout: any) => {
					const stat = stats.find(s => s.workoutId === workout.id)
					workout.stats = {
						completions: stat?._count?.id || 0,
						avgDuration: stat?._avg?.duration || 0
					}
				})
			}

			const duration = performance.now() - startTime
			unifiedPerformanceMonitor.trackDatabaseQuery('getWorkoutsOptimized', duration)

			return {
				workouts,
				totalCount,
				totalPages: Math.ceil(totalCount / limit),
				currentPage: page,
				hasNextPage: page * limit < totalCount,
				hasPrevPage: page > 1
			}
		}, 5 * 60 * 1000) // Cache for 5 minutes
	}

	/**
	 * Optimized user analytics with aggregations
	 */
	async getUserAnalyticsOptimized(userId: string, timeRange: '7d' | '30d' | '90d' | '1y' = '30d') {
		const cacheKey = `analytics:${userId}:${timeRange}`

		return unifiedCache.getOrSet('data', cacheKey, async () => {
			const startTime = performance.now()

			// Calculate date range
			const now = new Date()
			const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }
			const startDate = new Date(now.getTime() - daysMap[timeRange] * 24 * 60 * 60 * 1000)

			// Parallel aggregation queries
			const [sessionStats, exerciseStats, progressStats] = await Promise.all([
				// Workout session statistics
				this.prisma.workoutSession.aggregate({
					where: {
						userId,
						startTime: { gte: startDate },
						status: 'completed'
					},
					_count: { id: true },
					_sum: { duration: true },
					_avg: { duration: true }
				}),

				// Exercise performance statistics
				this.prisma.exerciseLog.groupBy({
					by: ['exerciseId'],
					where: {
						sessionId: {
							in: await this.prisma.workoutSession.findMany({
								where: {
									userId,
									startTime: { gte: startDate },
									status: 'completed'
								},
								select: { id: true }
							}).then(sessions => sessions.map(s => s.id))
						}
					},
					_count: { id: true },
					_max: { reps: true },
					_avg: { reps: true }
				}),

				// Progress tracking (body measurements)
				this.prisma.bodyMeasurement.findMany({
					where: {
						userId,
						measuredAt: { gte: startDate }
					},
					orderBy: { measuredAt: 'asc' },
					select: {
						measuredAt: true,
						weight: true,
						bodyFat: true
					}
				})
			])

			// Calculate trends and insights
			const analytics = {
				timeRange,
				workoutStats: {
				totalSessions: sessionStats._count.id || 0,
				totalDuration: sessionStats._sum.duration || 0,
				avgDuration: sessionStats._avg.duration || 0,
				frequency: (sessionStats._count.id || 0) / daysMap[timeRange]
			},
			exerciseStats: {
				uniqueExercises: exerciseStats.length,
				totalSets: exerciseStats.reduce((sum, stat) => sum + (stat._count?.id || 0), 0),
				topExercises: exerciseStats
					.sort((a, b) => (b._count?.id || 0) - (a._count?.id || 0))
					.slice(0, 5)
					.map(stat => ({
						exerciseId: stat.exerciseId,
						count: stat._count?.id || 0,
						maxReps: stat._max?.reps || 0,
						avgReps: stat._avg?.reps || 0
					}))
			},
			progressStats: {
				measurements: progressStats.length,
				weightTrend: this.calculateTrend(progressStats.map(p => p.weight).filter((w): w is number => w !== null)),
				bodyFatTrend: this.calculateTrend(progressStats.map(p => p.bodyFat).filter((bf): bf is number => bf !== null))
			}
			}

			const duration = performance.now() - startTime
			unifiedPerformanceMonitor.trackDatabaseQuery('getUserAnalyticsOptimized', duration)

			return analytics
		}, 15 * 60 * 1000) // Cache for 15 minutes
	}

	/**
	 * Batch operation for bulk updates
	 */
	async batchUpdateExerciseLogs(updates: Array<{
		id: string
		weight?: number
		reps?: number
		notes?: string
	}>) {
		const startTime = performance.now()

		try {
			// Use transaction for consistency
			const result = await this.prisma.$transaction(
				updates.map(update => 
					this.prisma.exerciseLog.update({
						where: { id: update.id },
						data: {
							...(update.weight !== undefined && { weight: update.weight }),
							...(update.reps !== undefined && { reps: update.reps }),
							...(update.notes !== undefined && { notes: update.notes }),
							updatedAt: new Date()
						}
					})
				)
			)

			const duration = performance.now() - startTime
			unifiedPerformanceMonitor.trackDatabaseQuery('batchUpdateExerciseLogs', duration)

			logger.info(`Batch updated ${updates.length} exercise logs in ${duration.toFixed(2)}ms`)
			return result

		} catch (error) {
			logger.error('Batch update failed', error)
			throw error
		}
	}

	/**
	 * Optimized search with full-text capabilities
	 */
	async searchOptimized(params: {
		query: string
		type: 'workouts' | 'exercises' | 'users' | 'all'
		userId?: string
		limit?: number
	}) {
		const { query, type, userId, limit = 20 } = params
		const cacheKey = `search:${query}:${type}:${userId}:${limit}`

		return unifiedCache.getOrSet('api', cacheKey, async () => {
			const startTime = performance.now()
			const searchTerm = query.toLowerCase().trim()

			const results: any = {}

			if (type === 'workouts' || type === 'all') {
				results.workouts = await this.prisma.workout.findMany({
					where: {
						AND: [
							{
								OR: [
									{ name: { contains: searchTerm, mode: 'insensitive' } },
									{ description: { contains: searchTerm, mode: 'insensitive' } },
									{ category: { contains: searchTerm, mode: 'insensitive' } }
								]
							},
							{
								OR: [
									{ isPublic: true },
									...(userId ? [{ creatorId: userId }, { assignedToId: userId }] : [])
								]
							}
						]
					},
					select: {
						id: true,
						name: true,
						description: true,
						category: true,
						duration: true,
						isTemplate: true,
						isPublic: true,
						creator: {
							select: { id: true, name: true }
						}
					},
					take: limit,
					orderBy: [
						{ isTemplate: 'desc' },
						{ createdAt: 'desc' }
					]
				})
			}

			if (type === 'exercises' || type === 'all') {
				results.exercises = await this.prisma.exercise.findMany({
					where: {
						AND: [
							{ isActive: true },
							{
								OR: [
									{ name: { contains: searchTerm, mode: 'insensitive' } },
									{ category: { contains: searchTerm, mode: 'insensitive' } },
									{ muscleGroups: { hasSome: [searchTerm] } }
								]
							}
						]
					},
					select: {
						id: true,
						name: true,
						category: true,
						muscleGroups: true,
						difficulty: true,
						equipment: true
					},
					take: limit,
					orderBy: { name: 'asc' }
				})
			}

			if (type === 'users' || type === 'all') {
				results.users = await this.prisma.user.findMany({
					where: {
						AND: [
							{ isActive: true },
							{
								OR: [
									{ name: { contains: searchTerm, mode: 'insensitive' } },
									{ email: { contains: searchTerm, mode: 'insensitive' } }
								]
							}
						]
					},
					select: {
						id: true,
						name: true,
						email: true,
						role: true,
						avatar: true
					},
					take: limit,
					orderBy: { name: 'asc' }
				})
			}

			const duration = performance.now() - startTime
			unifiedPerformanceMonitor.trackDatabaseQuery('searchOptimized', duration)

			return results
		}, 2 * 60 * 1000) // Cache for 2 minutes
	}

	/**
	 * Calculate trend from array of numbers
	 */
	private calculateTrend(values: number[]): 'up' | 'down' | 'stable' | 'insufficient_data' {
		if (values.length < 2) return 'insufficient_data'

		const first = values[0]
		const last = values[values.length - 1]
		const change = ((last - first) / first) * 100

		if (Math.abs(change) < 2) return 'stable'
		return change > 0 ? 'up' : 'down'
	}
}

/**
 * Database Connection Pool Manager
 */
export class DatabaseConnectionManager {
	private static instance: DatabaseConnectionManager
	private connectionMetrics = {
		activeConnections: 0,
		totalQueries: 0,
		slowQueries: 0,
		errors: 0,
		lastHealthCheck: new Date()
	}

	static getInstance(): DatabaseConnectionManager {
		if (!DatabaseConnectionManager.instance) {
			DatabaseConnectionManager.instance = new DatabaseConnectionManager()
		}
		return DatabaseConnectionManager.instance
	}

	/**
	 * Monitor database health
	 */
	async healthCheck(): Promise<{
		status: 'healthy' | 'degraded' | 'unhealthy'
		metrics: typeof this.connectionMetrics
		recommendations: string[]
	}> {
		const recommendations: string[] = []
		let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

		// Check slow query rate
		const slowQueryRate = this.connectionMetrics.totalQueries > 0 
			? (this.connectionMetrics.slowQueries / this.connectionMetrics.totalQueries) * 100 
			: 0

		if (slowQueryRate > 10) {
			status = 'degraded'
			recommendations.push('High slow query rate detected. Consider query optimization.')
		}

		if (slowQueryRate > 25) {
			status = 'unhealthy'
			recommendations.push('Critical slow query rate. Immediate optimization required.')
		}

		// Check error rate
		const errorRate = this.connectionMetrics.totalQueries > 0 
			? (this.connectionMetrics.errors / this.connectionMetrics.totalQueries) * 100 
			: 0

		if (errorRate > 1) {
			status = 'degraded'
			recommendations.push('Elevated error rate detected.')
		}

		if (errorRate > 5) {
			status = 'unhealthy'
			recommendations.push('Critical error rate. Check database connectivity.')
		}

		this.connectionMetrics.lastHealthCheck = new Date()

		return {
			status,
			metrics: { ...this.connectionMetrics },
			recommendations
		}
	}

	/**
	 * Track query execution
	 */
	trackQuery(duration: number, isError: boolean = false): void {
		this.connectionMetrics.totalQueries++

		if (duration > 1000) {
			this.connectionMetrics.slowQueries++
		}

		if (isError) {
			this.connectionMetrics.errors++
		}
	}

	/**
	 * Get connection metrics
	 */
	getMetrics() {
		return { ...this.connectionMetrics }
	}

	/**
	 * Reset metrics (useful for testing)
	 */
	resetMetrics(): void {
		this.connectionMetrics = {
			activeConnections: 0,
			totalQueries: 0,
			slowQueries: 0,
			errors: 0,
			lastHealthCheck: new Date()
		}
	}
}

// Export singleton instances
export const databaseConnectionManager = DatabaseConnectionManager.getInstance()

/**
 * Query execution wrapper with monitoring
 */
export async function executeOptimizedQuery<T>(
	queryName: string,
	queryFn: () => Promise<T>,
	options: {
		cacheKey?: string
		cacheTtl?: number
		trackPerformance?: boolean
	} = {}
): Promise<T> {
	const { cacheKey, cacheTtl = 5 * 60 * 1000, trackPerformance = true } = options
	const startTime = performance.now()

	// Try cache first if key provided
	if (cacheKey) {
		const cached = unifiedCache.get<T>('data', cacheKey)
		if (cached !== null) {
			return cached
		}
	}

	try {
		const result = await queryFn()
		const duration = performance.now() - startTime

		// Track performance
		if (trackPerformance) {
			unifiedPerformanceMonitor.trackDatabaseQuery(queryName, duration)
			databaseConnectionManager.trackQuery(duration)
		}

		// Cache result if key provided
		if (cacheKey) {
			unifiedCache.set('data', cacheKey, result, cacheTtl)
		}

		return result

	} catch (error) {
		const duration = performance.now() - startTime
		
		// Track error
		if (trackPerformance) {
			databaseConnectionManager.trackQuery(duration, true)
		}

		logger.error(`Query ${queryName} failed after ${duration.toFixed(2)}ms`, error)
		throw error
	}
}

/**
 * Batch query executor for multiple operations
 */
export async function executeBatchQueries<T>(
	queries: Array<{
		name: string
		query: () => Promise<T>
		cacheKey?: string
		cacheTtl?: number
	}>
): Promise<T[]> {
	const startTime = performance.now()

	try {
		const results = await Promise.all(
			queries.map(({ name, query, cacheKey, cacheTtl }) =>
				executeOptimizedQuery(name, query, { cacheKey, cacheTtl })
			)
		)

		const duration = performance.now() - startTime
		unifiedPerformanceMonitor.trackDatabaseQuery('batchQueries', duration)

		logger.debug(`Executed ${queries.length} batch queries in ${duration.toFixed(2)}ms`)
		return results

	} catch (error) {
		logger.error('Batch query execution failed', error)
		throw error
	}
}
