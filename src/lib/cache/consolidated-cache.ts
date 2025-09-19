/**
 * Consolidated Cache Strategy
 * Unified caching system for data, resources, and API responses
 */

import { logger } from '../logger'

// Cache configuration interface
export interface CacheConfig {
	ttl?: number // Time to live in milliseconds
	maxSize?: number // Maximum number of entries
	strategy?: 'lru' | 'fifo' | 'lfu' // Eviction strategy
	persistent?: boolean // Whether to persist to localStorage
	compress?: boolean // Whether to compress data
	validate?: (data: any) => boolean // Validation function
}

// Cache entry interface
export interface CacheEntry<T = any> {
	key: string
	value: T
	timestamp: number
	ttl: number
	accessCount: number
	lastAccessed: number
	size: number
	compressed?: boolean
}

// Cache statistics interface
export interface CacheStats {
	hits: number
	misses: number
	size: number
	maxSize: number
	hitRate: number
	memoryUsage: number
	evictions: number
}

/**
 * Unified Cache Manager
 * Handles multiple cache layers with different strategies
 */
export class UnifiedCacheManager {
	private static instance: UnifiedCacheManager
	private caches: Map<string, Map<string, CacheEntry>> = new Map()
	private configs: Map<string, CacheConfig> = new Map()
	private stats: Map<string, CacheStats> = new Map()
	private cleanupIntervals: Map<string, NodeJS.Timeout> = new Map()

	private constructor() {
		// Initialize default caches
		this.createCache('api', {
			ttl: 5 * 60 * 1000, // 5 minutes
			maxSize: 100,
			strategy: 'lru',
			persistent: false
		})

		this.createCache('data', {
			ttl: 15 * 60 * 1000, // 15 minutes
			maxSize: 50,
			strategy: 'lru',
			persistent: true
		})

		this.createCache('resources', {
			ttl: 60 * 60 * 1000, // 1 hour
			maxSize: 200,
			strategy: 'lfu',
			persistent: true,
			compress: true
		})

		this.createCache('session', {
			ttl: 30 * 60 * 1000, // 30 minutes
			maxSize: 20,
			strategy: 'fifo',
			persistent: false
		})
	}

	static getInstance(): UnifiedCacheManager {
		if (!UnifiedCacheManager.instance) {
			UnifiedCacheManager.instance = new UnifiedCacheManager()
		}
		return UnifiedCacheManager.instance
	}

	/**
	 * Create a new cache with configuration
	 */
	createCache(name: string, config: CacheConfig): void {
		const defaultConfig: CacheConfig = {
			ttl: 10 * 60 * 1000, // 10 minutes default
			maxSize: 100,
			strategy: 'lru',
			persistent: false,
			compress: false
		}

		const finalConfig = { ...defaultConfig, ...config }
		this.configs.set(name, finalConfig)
		this.caches.set(name, new Map())
		this.stats.set(name, {
			hits: 0,
			misses: 0,
			size: 0,
			maxSize: finalConfig.maxSize || 100,
			hitRate: 0,
			memoryUsage: 0,
			evictions: 0
		})

		// Load from persistent storage if enabled
		if (finalConfig.persistent && typeof window !== 'undefined') {
			this.loadFromStorage(name)
		}

		// Setup cleanup interval
		const cleanupInterval = setInterval(() => {
			this.cleanup(name)
		}, Math.min(finalConfig.ttl || 600000, 300000)) // Max 5 minutes

		this.cleanupIntervals.set(name, cleanupInterval)

		logger.debug(`Cache '${name}' created with config:`, finalConfig)
	}

	/**
	 * Set value in cache
	 */
	set<T>(cacheName: string, key: string, value: T, customTtl?: number): void {
		const cache = this.caches.get(cacheName)
		const config = this.configs.get(cacheName)
		const stats = this.stats.get(cacheName)

		if (!cache || !config || !stats) {
			logger.warn(`Cache '${cacheName}' not found`)
			return
		}

		// Validate data if validator exists
		if (config.validate && !config.validate(value)) {
			logger.warn(`Invalid data for cache '${cacheName}', key '${key}'`)
			return
		}

		const now = Date.now()
		const ttl = customTtl || config.ttl || 600000
		let processedValue = value
		let compressed = false

		// Compress if enabled
		if (config.compress && typeof value === 'string') {
			try {
				processedValue = this.compress(value) as T
				compressed = true
			} catch (error) {
				logger.warn('Failed to compress cache value', error)
			}
		}

		const entry: CacheEntry<T> = {
			key,
			value: processedValue,
			timestamp: now,
			ttl,
			accessCount: 0,
			lastAccessed: now,
			size: this.calculateSize(processedValue),
			compressed
		}

		// Check if we need to evict entries
		if (cache.size >= (config.maxSize || 100)) {
			this.evict(cacheName)
		}

		cache.set(key, entry)
		stats.size = cache.size
		stats.memoryUsage += entry.size

		// Persist if enabled
		if (config.persistent) {
			this.saveToStorage(cacheName)
		}

		logger.debug(`Cache set: ${cacheName}[${key}] (TTL: ${ttl}ms, Size: ${entry.size})`)
	}

	/**
	 * Get value from cache
	 */
	get<T>(cacheName: string, key: string): T | null {
		const cache = this.caches.get(cacheName)
		const config = this.configs.get(cacheName)
		const stats = this.stats.get(cacheName)

		if (!cache || !config || !stats) {
			logger.warn(`Cache '${cacheName}' not found`)
			return null
		}

		const entry = cache.get(key)
		if (!entry) {
			stats.misses++
			this.updateHitRate(cacheName)
			return null
		}

		const now = Date.now()

		// Check if expired
		if (now - entry.timestamp > entry.ttl) {
			cache.delete(key)
			stats.size = cache.size
			stats.memoryUsage -= entry.size
			stats.misses++
			this.updateHitRate(cacheName)
			return null
		}

		// Update access statistics
		entry.accessCount++
		entry.lastAccessed = now
		stats.hits++
		this.updateHitRate(cacheName)

		// Decompress if needed
		let value = entry.value
		if (entry.compressed && typeof entry.value === 'string') {
			try {
				value = this.decompress(entry.value as string) as T
			} catch (error) {
				logger.warn('Failed to decompress cache value', error)
				return null
			}
		}

		logger.debug(`Cache hit: ${cacheName}[${key}]`)
		return value
	}

	/**
	 * Check if key exists in cache
	 */
	has(cacheName: string, key: string): boolean {
		const cache = this.caches.get(cacheName)
		if (!cache) return false

		const entry = cache.get(key)
		if (!entry) return false

		// Check if expired
		const now = Date.now()
		if (now - entry.timestamp > entry.ttl) {
			cache.delete(key)
			return false
		}

		return true
	}

	/**
	 * Delete key from cache
	 */
	delete(cacheName: string, key: string): boolean {
		const cache = this.caches.get(cacheName)
		const stats = this.stats.get(cacheName)
		const config = this.configs.get(cacheName)

		if (!cache || !stats) return false

		const entry = cache.get(key)
		if (entry) {
			stats.memoryUsage -= entry.size
		}

		const deleted = cache.delete(key)
		if (deleted) {
			stats.size = cache.size
			// Persist if enabled
			if (config?.persistent) {
				this.saveToStorage(cacheName)
			}
		}

		return deleted
	}

	/**
	 * Clear entire cache
	 */
	clear(cacheName: string): void {
		const cache = this.caches.get(cacheName)
		const stats = this.stats.get(cacheName)
		const config = this.configs.get(cacheName)

		if (!cache || !stats) return

		cache.clear()
		stats.size = 0
		stats.memoryUsage = 0

		// Clear persistent storage
		if (config?.persistent && typeof window !== 'undefined') {
			try {
				localStorage.removeItem(`cache_${cacheName}`)
			} catch (error) {
				logger.warn(`Failed to clear persistent cache '${cacheName}'`, error)
			}
		}

		logger.debug(`Cache '${cacheName}' cleared`)
	}

	/**
	 * Get cache statistics
	 */
	getStats(cacheName: string): CacheStats | null {
		return this.stats.get(cacheName) || null
	}

	/**
	 * Get all cache statistics
	 */
	getAllStats(): Map<string, CacheStats> {
		return new Map(this.stats)
	}

	/**
	 * Evict entries based on strategy
	 */
	private evict(cacheName: string): void {
		const cache = this.caches.get(cacheName)
		const config = this.configs.get(cacheName)
		const stats = this.stats.get(cacheName)

		if (!cache || !config || !stats) return

		const strategy = config.strategy || 'lru'
		const entries = Array.from(cache.entries())

		let keyToEvict: string | null = null

		switch (strategy) {
			case 'lru': // Least Recently Used
				keyToEvict = entries.reduce((oldest, [key, entry]) => {
					const [oldestKey, oldestEntry] = oldest
					return entry.lastAccessed < oldestEntry.lastAccessed ? [key, entry] : oldest
				})[0]
				break

			case 'lfu': // Least Frequently Used
				keyToEvict = entries.reduce((least, [key, entry]) => {
					const [leastKey, leastEntry] = least
					return entry.accessCount < leastEntry.accessCount ? [key, entry] : least
				})[0]
				break

			case 'fifo': // First In, First Out
				keyToEvict = entries.reduce((oldest, [key, entry]) => {
					const [oldestKey, oldestEntry] = oldest
					return entry.timestamp < oldestEntry.timestamp ? [key, entry] : oldest
				})[0]
				break
		}

		if (keyToEvict) {
			this.delete(cacheName, keyToEvict)
			stats.evictions++
			logger.debug(`Evicted key '${keyToEvict}' from cache '${cacheName}' using ${strategy} strategy`)
		}
	}

	/**
	 * Cleanup expired entries
	 */
	private cleanup(cacheName: string): void {
		const cache = this.caches.get(cacheName)
		const stats = this.stats.get(cacheName)

		if (!cache || !stats) return

		const now = Date.now()
		const expiredKeys: string[] = []

		for (const [key, entry] of cache.entries()) {
			if (now - entry.timestamp > entry.ttl) {
				expiredKeys.push(key)
			}
		}

		expiredKeys.forEach(key => {
			const entry = cache.get(key)
			if (entry) {
				stats.memoryUsage -= entry.size
			}
			cache.delete(key)
		})

		stats.size = cache.size

		if (expiredKeys.length > 0) {
			logger.debug(`Cleaned up ${expiredKeys.length} expired entries from cache '${cacheName}'`)
		}
	}

	/**
	 * Update hit rate statistics
	 */
	private updateHitRate(cacheName: string): void {
		const stats = this.stats.get(cacheName)
		if (!stats) return

		const total = stats.hits + stats.misses
		stats.hitRate = total > 0 ? (stats.hits / total) * 100 : 0
	}

	/**
	 * Calculate size of value
	 */
	private calculateSize(value: any): number {
		if (typeof value === 'string') {
			return value.length * 2 // Approximate UTF-16 size
		}
		if (typeof value === 'object') {
			try {
				return JSON.stringify(value).length * 2
			} catch {
				return 100 // Fallback estimate
			}
		}
		return 50 // Default estimate
	}

	/**
	 * Simple compression using base64 encoding
	 */
	private compress(data: string): string {
		if (typeof window !== 'undefined' && window.btoa) {
			return window.btoa(data)
		}
		return data // Fallback to no compression
	}

	/**
	 * Simple decompression using base64 decoding
	 */
	private decompress(data: string): string {
		if (typeof window !== 'undefined' && window.atob) {
			try {
				return window.atob(data)
			} catch {
				return data // Return original if decompression fails
			}
		}
		return data // Fallback to no decompression
	}

	/**
	 * Save cache to localStorage
	 */
	private saveToStorage(cacheName: string): void {
		if (typeof window === 'undefined') return

		const cache = this.caches.get(cacheName)
		if (!cache) return

		try {
			const serialized = JSON.stringify(Array.from(cache.entries()))
			localStorage.setItem(`cache_${cacheName}`, serialized)
		} catch (error) {
			logger.warn(`Failed to save cache '${cacheName}' to storage`, error)
		}
	}

	/**
	 * Load cache from localStorage
	 */
	private loadFromStorage(cacheName: string): void {
		if (typeof window === 'undefined') return

		try {
			const serialized = localStorage.getItem(`cache_${cacheName}`)
			if (!serialized) return

			const entries: [string, CacheEntry][] = JSON.parse(serialized)
			const cache = this.caches.get(cacheName)
			const stats = this.stats.get(cacheName)

			if (!cache || !stats) return

			const now = Date.now()
			let loadedCount = 0

			for (const [key, entry] of entries) {
				// Skip expired entries
				if (now - entry.timestamp <= entry.ttl) {
					cache.set(key, entry)
					stats.memoryUsage += entry.size
					loadedCount++
				}
			}

			stats.size = cache.size
			logger.debug(`Loaded ${loadedCount} entries from persistent cache '${cacheName}'`)

		} catch (error) {
			logger.warn(`Failed to load cache '${cacheName}' from storage`, error)
		}
	}

	/**
	 * Get or set with factory function
	 */
	async getOrSet<T>(
		cacheName: string, 
		key: string, 
		factory: () => Promise<T> | T,
		customTtl?: number
	): Promise<T> {
		// Try to get from cache first
		const cached = this.get<T>(cacheName, key)
		if (cached !== null) {
			return cached
		}

		// Generate new value
		try {
			const value = await factory()
			this.set(cacheName, key, value, customTtl)
			return value
		} catch (error) {
			logger.error(`Failed to generate value for cache key '${key}'`, error)
			throw error
		}
	}

	/**
	 * Destroy cache manager and cleanup resources
	 */
	destroy(): void {
		// Clear all cleanup intervals
		for (const interval of this.cleanupIntervals.values()) {
			clearInterval(interval)
		}
		this.cleanupIntervals.clear()

		// Clear all caches
		for (const cacheName of this.caches.keys()) {
			this.clear(cacheName)
		}

		this.caches.clear()
		this.configs.clear()
		this.stats.clear()
	}
}

// Export singleton instance
export const unifiedCache = UnifiedCacheManager.getInstance()

// Convenience functions for common cache operations
export const apiCache = {
	get: <T>(key: string) => unifiedCache.get<T>('api', key),
	set: <T>(key: string, value: T, ttl?: number) => unifiedCache.set('api', key, value, ttl),
	has: (key: string) => unifiedCache.has('api', key),
	delete: (key: string) => unifiedCache.delete('api', key),
	clear: () => unifiedCache.clear('api'),
	getOrSet: <T>(key: string, factory: () => Promise<T> | T, ttl?: number) => 
		unifiedCache.getOrSet('api', key, factory, ttl)
}

export const dataCache = {
	get: <T>(key: string) => unifiedCache.get<T>('data', key),
	set: <T>(key: string, value: T, ttl?: number) => unifiedCache.set('data', key, value, ttl),
	has: (key: string) => unifiedCache.has('data', key),
	delete: (key: string) => unifiedCache.delete('data', key),
	clear: () => unifiedCache.clear('data'),
	getOrSet: <T>(key: string, factory: () => Promise<T> | T, ttl?: number) => 
		unifiedCache.getOrSet('data', key, factory, ttl)
}

export const resourceCache = {
	get: <T>(key: string) => unifiedCache.get<T>('resources', key),
	set: <T>(key: string, value: T, ttl?: number) => unifiedCache.set('resources', key, value, ttl),
	has: (key: string) => unifiedCache.has('resources', key),
	delete: (key: string) => unifiedCache.delete('resources', key),
	clear: () => unifiedCache.clear('resources'),
	getOrSet: <T>(key: string, factory: () => Promise<T> | T, ttl?: number) => 
		unifiedCache.getOrSet('resources', key, factory, ttl)
}

export const sessionCache = {
	get: <T>(key: string) => unifiedCache.get<T>('session', key),
	set: <T>(key: string, value: T, ttl?: number) => unifiedCache.set('session', key, value, ttl),
	has: (key: string) => unifiedCache.has('session', key),
	delete: (key: string) => unifiedCache.delete('session', key),
	clear: () => unifiedCache.clear('session'),
	getOrSet: <T>(key: string, factory: () => Promise<T> | T, ttl?: number) => 
		unifiedCache.getOrSet('session', key, factory, ttl)
}

// React hook for cache operations
export function useCache(cacheName: string = 'data') {
	const cache = UnifiedCacheManager.getInstance()

	return {
		get: <T>(key: string) => cache.get<T>(cacheName, key),
		set: <T>(key: string, value: T, ttl?: number) => cache.set(cacheName, key, value, ttl),
		has: (key: string) => cache.has(cacheName, key),
		delete: (key: string) => cache.delete(cacheName, key),
		clear: () => cache.clear(cacheName),
		getOrSet: <T>(key: string, factory: () => Promise<T> | T, ttl?: number) => 
			cache.getOrSet(cacheName, key, factory, ttl),
		getStats: () => cache.getStats(cacheName)
	}
}

// Initialize cache system
export function initializeCacheSystem() {
	UnifiedCacheManager.getInstance()
	logger.info('Unified cache system initialized')
}