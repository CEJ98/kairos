/**
 * Redis Client Configuration for Kairos Fitness
 * Handles Pub/Sub for real-time notifications
 */

import Redis from 'ioredis'
import { logger } from './logger'

// Redis configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const REDIS_PASSWORD = process.env.REDIS_PASSWORD

// Create Redis clients for different purposes
let redisClient: Redis | null = null
let redisPublisher: Redis | null = null
let redisSubscriber: Redis | null = null

/**
 * Initialize Redis client
 */
function createRedisClient(): Redis {
	try {
		const client = new Redis(REDIS_URL, {
			password: REDIS_PASSWORD,
			retryDelayOnFailover: 100,
			maxRetriesPerRequest: 3,
			lazyConnect: true,
			connectTimeout: 10000,
			commandTimeout: 5000,
			retryStrategy: (times) => Math.min(times * 50, 2000),
		})

		client.on('connect', () => {
			logger.info('Redis client connected')
		})

		client.on('error', (error) => {
			logger.error('Redis client error:', error)
		})

		client.on('close', () => {
			logger.warn('Redis client connection closed')
		})

		return client
	} catch (error) {
		logger.error('Failed to create Redis client:', error)
		throw error
	}
}

/**
 * Get Redis client instance (singleton)
 */
export function getRedisClient(): Redis {
	if (!redisClient) {
		redisClient = createRedisClient()
	}
	return redisClient
}

/**
 * Get Redis publisher instance (singleton)
 */
export function getRedisPublisher(): Redis {
	if (!redisPublisher) {
		redisPublisher = createRedisClient()
	}
	return redisPublisher
}

/**
 * Get Redis subscriber instance (singleton)
 */
export function getRedisSubscriber(): Redis {
	if (!redisSubscriber) {
		redisSubscriber = createRedisClient()
	}
	return redisSubscriber
}

/**
 * Close all Redis connections
 */
export async function closeRedisConnections(): Promise<void> {
	try {
		const promises = []
		
		if (redisClient) {
			promises.push(redisClient.quit())
			redisClient = null
		}
		
		if (redisPublisher) {
			promises.push(redisPublisher.quit())
			redisPublisher = null
		}
		
		if (redisSubscriber) {
			promises.push(redisSubscriber.quit())
			redisSubscriber = null
		}

		await Promise.all(promises)
		logger.info('All Redis connections closed')
	} catch (error) {
		logger.error('Error closing Redis connections:', error)
	}
}

/**
 * Test Redis connection
 */
export async function testRedisConnection(): Promise<boolean> {
	try {
		const client = getRedisClient()
		await client.ping()
		logger.info('Redis connection test successful')
		return true
	} catch (error) {
		logger.error('Redis connection test failed:', error)
		return false
	}
}

// Graceful shutdown
process.on('SIGTERM', async () => {
	await closeRedisConnections()
})

process.on('SIGINT', async () => {
	await closeRedisConnections()
})