/**
 * Advanced Cache Manager for Kairos Fitness
 * Provides intelligent caching for database queries and API responses
 */

import { LRUCache } from 'lru-cache'

import { logger } from './logger'
// Cache configuration interface
interface CacheConfig {
  maxSize: number
  ttl: number // Time to live in milliseconds
  staleWhileRevalidate: number
  updateAgeOnGet: boolean
}

// Cache keys enum for type safety
export enum CacheKeys {
  USER_PROFILE = 'user_profile',
  USER_WORKOUTS = 'user_workouts',
  WORKOUT_DETAILS = 'workout_details',
  EXERCISE_LIST = 'exercise_list',
  USER_STATS = 'user_stats',
  TRAINER_CLIENTS = 'trainer_clients',
  SUBSCRIPTION_STATUS = 'subscription_status',
  BODY_MEASUREMENTS = 'body_measurements',
  PERSONAL_RECORDS = 'personal_records',
  WORKOUT_SESSIONS = 'workout_sessions',
}

// Cache configurations for different data types
const CACHE_CONFIGS: Record<CacheKeys, CacheConfig> = {
  [CacheKeys.USER_PROFILE]: {
    maxSize: 1000,
    ttl: 15 * 60 * 1000, // 15 minutes
    staleWhileRevalidate: 5 * 60 * 1000, // 5 minutes
    updateAgeOnGet: true,
  },
  [CacheKeys.USER_WORKOUTS]: {
    maxSize: 500,
    ttl: 10 * 60 * 1000, // 10 minutes
    staleWhileRevalidate: 2 * 60 * 1000, // 2 minutes
    updateAgeOnGet: true,
  },
  [CacheKeys.WORKOUT_DETAILS]: {
    maxSize: 2000,
    ttl: 30 * 60 * 1000, // 30 minutes
    staleWhileRevalidate: 10 * 60 * 1000, // 10 minutes
    updateAgeOnGet: true,
  },
  [CacheKeys.EXERCISE_LIST]: {
    maxSize: 100,
    ttl: 60 * 60 * 1000, // 1 hour
    staleWhileRevalidate: 20 * 60 * 1000, // 20 minutes
    updateAgeOnGet: false,
  },
  [CacheKeys.USER_STATS]: {
    maxSize: 1000,
    ttl: 5 * 60 * 1000, // 5 minutes
    staleWhileRevalidate: 1 * 60 * 1000, // 1 minute
    updateAgeOnGet: true,
  },
  [CacheKeys.TRAINER_CLIENTS]: {
    maxSize: 200,
    ttl: 15 * 60 * 1000, // 15 minutes
    staleWhileRevalidate: 5 * 60 * 1000, // 5 minutes
    updateAgeOnGet: true,
  },
  [CacheKeys.SUBSCRIPTION_STATUS]: {
    maxSize: 1000,
    ttl: 10 * 60 * 1000, // 10 minutes
    staleWhileRevalidate: 2 * 60 * 1000, // 2 minutes
    updateAgeOnGet: true,
  },
  [CacheKeys.BODY_MEASUREMENTS]: {
    maxSize: 500,
    ttl: 30 * 60 * 1000, // 30 minutes
    staleWhileRevalidate: 10 * 60 * 1000, // 10 minutes
    updateAgeOnGet: true,
  },
  [CacheKeys.PERSONAL_RECORDS]: {
    maxSize: 1000,
    ttl: 20 * 60 * 1000, // 20 minutes
    staleWhileRevalidate: 5 * 60 * 1000, // 5 minutes
    updateAgeOnGet: true,
  },
  [CacheKeys.WORKOUT_SESSIONS]: {
    maxSize: 1000,
    ttl: 5 * 60 * 1000, // 5 minutes
    staleWhileRevalidate: 1 * 60 * 1000, // 1 minute
    updateAgeOnGet: true,
  },
}

// Cache instances
const cacheInstances = new Map<CacheKeys, LRUCache<string, any>>()

// Initialize cache instances
Object.entries(CACHE_CONFIGS).forEach(([key, config]) => {
  cacheInstances.set(key as CacheKeys, new LRUCache({
    max: config.maxSize,
    ttl: config.ttl,
    updateAgeOnGet: config.updateAgeOnGet,
    allowStaleOnFetchRejection: true,
    allowStaleOnFetchAbort: true,
  }))
})

/**
 * Advanced Cache Manager Class
 */
export class CacheManager {
  private static instance: CacheManager
  private hitCount = 0
  private missCount = 0
  private staleCount = 0

  private constructor() {}

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  /**
   * Get value from cache
   */
  public async get<T>(cacheKey: CacheKeys, key: string): Promise<T | null> {
    const cache = cacheInstances.get(cacheKey)
    if (!cache) return null

    const value = cache.get(key)
    
    if (value !== undefined) {
      this.hitCount++
      return value as T
    }

    this.missCount++
    return null
  }

  /**
   * Set value in cache
   */
  public async set<T>(cacheKey: CacheKeys, key: string, value: T, customTTL?: number): Promise<void> {
    const cache = cacheInstances.get(cacheKey)
    if (!cache) return

    if (customTTL) {
      cache.set(key, value, { ttl: customTTL })
    } else {
      cache.set(key, value)
    }
  }

  /**
   * Delete specific key from cache
   */
  public async delete(cacheKey: CacheKeys, key: string): Promise<void> {
    const cache = cacheInstances.get(cacheKey)
    if (cache) {
      cache.delete(key)
    }
  }

  /**
   * Delete all keys matching pattern
   */
  public async deletePattern(cacheKey: CacheKeys, pattern: string): Promise<void> {
    const cache = cacheInstances.get(cacheKey)
    if (!cache) return

    const regex = new RegExp(pattern)
    const keysToDelete: string[] = []

    for (const key of cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => cache.delete(key))
  }

  /**
   * Clear entire cache category
   */
  public async clear(cacheKey: CacheKeys): Promise<void> {
    const cache = cacheInstances.get(cacheKey)
    if (cache) {
      cache.clear()
    }
  }

  /**
   * Get or set pattern with automatic cache management
   */
  public async getOrSet<T>(
    cacheKey: CacheKeys,
    key: string,
    fetchFunction: () => Promise<T>,
    customTTL?: number
  ): Promise<T> {
    // Try to get from cache first
    let cachedValue = await this.get<T>(cacheKey, key)
    
    if (cachedValue !== null) {
      return cachedValue
    }

    // Cache miss - fetch fresh data
    try {
      const freshValue = await fetchFunction()
      await this.set(cacheKey, key, freshValue, customTTL)
      return freshValue
    } catch (error) {
      logger.error('Cache fetch error for ${cacheKey}:${key}:', error, 'CACHE')
      throw error
    }
  }

  /**
   * Invalidate related caches when data changes
   */
  public async invalidateRelated(userId: string, operation: 'workout' | 'session' | 'profile' | 'measurement'): Promise<void> {
    const invalidationMap: Record<string, CacheKeys[]> = {
      workout: [
        CacheKeys.USER_WORKOUTS,
        CacheKeys.WORKOUT_DETAILS,
        CacheKeys.USER_STATS,
      ],
      session: [
        CacheKeys.WORKOUT_SESSIONS,
        CacheKeys.USER_STATS,
        CacheKeys.PERSONAL_RECORDS,
      ],
      profile: [
        CacheKeys.USER_PROFILE,
        CacheKeys.TRAINER_CLIENTS,
      ],
      measurement: [
        CacheKeys.BODY_MEASUREMENTS,
        CacheKeys.USER_STATS,
      ],
    }

    const keysToInvalidate = invalidationMap[operation] || []
    
    for (const cacheKey of keysToInvalidate) {
      await this.deletePattern(cacheKey, `.*${userId}.*`)
    }
  }

  /**
   * Get cache statistics
   */
  public getStats(): {
    hitCount: number
    missCount: number
    hitRate: number
    totalOperations: number
    cacheInfo: Record<CacheKeys, { size: number; maxSize: number }>
  } {
    const totalOperations = this.hitCount + this.missCount
    const hitRate = totalOperations > 0 ? (this.hitCount / totalOperations) * 100 : 0

    const cacheInfo: Record<string, { size: number; maxSize: number }> = {}
    
    cacheInstances.forEach((cache, key) => {
      cacheInfo[key] = {
        size: cache.size,
        maxSize: cache.max,
      }
    })

    return {
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: Math.round(hitRate * 100) / 100,
      totalOperations,
      cacheInfo: cacheInfo as any,
    }
  }

  /**
   * Reset cache statistics
   */
  public resetStats(): void {
    this.hitCount = 0
    this.missCount = 0
    this.staleCount = 0
  }

  /**
   * Preload frequently accessed data
   */
  public async preloadUserData(userId: string): Promise<void> {
    // This would be called when user logs in to pre-populate cache
    // Implementation depends on your data access patterns
    try {
      // Example preloading - adjust based on your most common queries
      logger.debug('Preloading cache for user ${userId}', 'CACHE')
      
      // Could preload: user profile, recent workouts, current subscription, etc.
      // This is a placeholder - implement based on your app's usage patterns
    } catch (error) {
      logger.error('Error preloading cache for user ${userId}:', error, 'CACHE')
    }
  }

  /**
   * Health check for cache system
   */
  public healthCheck(): {
    status: 'healthy' | 'warning' | 'critical'
    issues: string[]
    recommendations: string[]
  } {
    const issues: string[] = []
    const recommendations: string[] = []
    const stats = this.getStats()

    // Check hit rate
    if (stats.hitRate < 70) {
      issues.push(`Low cache hit rate: ${stats.hitRate}%`)
      recommendations.push('Consider adjusting TTL values or cache size')
    }

    // Check cache utilization
    Object.entries(stats.cacheInfo).forEach(([key, info]) => {
      const utilization = (info.size / info.maxSize) * 100
      if (utilization > 90) {
        issues.push(`Cache ${key} is ${utilization.toFixed(1)}% full`)
        recommendations.push(`Consider increasing max size for ${key}`)
      }
    })

    const status = issues.length === 0 ? 'healthy' : 
                  issues.length <= 2 ? 'warning' : 'critical'

    return { status, issues, recommendations }
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance()

// Utility functions for common caching patterns
export const cacheUtils = {
  /**
   * Generate cache key with consistent format
   */
  generateKey: (prefix: string, ...parts: (string | number)[]): string => {
    return `${prefix}:${parts.join(':')}`
  },

  /**
   * Cache with compression for large objects
   */
  cacheWithCompression: async <T>(
    cacheKey: CacheKeys,
    key: string,
    data: T,
    ttl?: number
  ): Promise<void> => {
    try {
      // For large objects, you might want to compress before caching
      // This is a placeholder - implement compression if needed
      await cacheManager.set(cacheKey, key, data, ttl)
    } catch (error) {
      logger.error('Error caching with compression:', error, 'CACHE')
    }
  },

  /**
   * Batch cache operations
   */
  batchSet: async <T>(
    cacheKey: CacheKeys,
    entries: Array<{ key: string; value: T; ttl?: number }>
  ): Promise<void> => {
    const promises = entries.map(({ key, value, ttl }) => 
      cacheManager.set(cacheKey, key, value, ttl)
    )
    await Promise.all(promises)
  },

  /**
   * Cache warming for predictable data
   */
  warmCache: async (userId: string): Promise<void> => {
    await cacheManager.preloadUserData(userId)
  }
}

export default cacheManager