/**
 * Rate Limiter Implementation for Kairos Fitness
 * Protects against brute force attacks and API abuse
 */

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { logger } from './logger'
interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  message?: string
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store for rate limiting (fallback when Redis no disponible)
const rateLimitStore: RateLimitStore = {}

// Optional Redis (Upstash REST) client setup
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

async function upstashPipeline(commands: any[]) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null
  try {
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(commands)
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function redisIncrementAndGetTTL(key: string, windowMs: number): Promise<{ count: number; ttlMs: number } | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null
  // 1) INCR, 2) if first time set PEXPIRE, 3) PTTL
  const incrRes = await upstashPipeline([["INCR", key]])
  const count = Array.isArray(incrRes) ? incrRes[0]?.result ?? 0 : 0
  if (count === 1) {
    await upstashPipeline([["PEXPIRE", key, windowMs]])
  }
  const ttlRes = await upstashPipeline([["PTTL", key]])
  const ttlMs = Array.isArray(ttlRes) ? Math.max(0, ttlRes[0]?.result ?? windowMs) : windowMs
  return { count, ttlMs }
}

/**
 * Clear rate limit store - used for testing
 */
export function clearRateLimitStore(): void {
  Object.keys(rateLimitStore).forEach(key => {
    delete rateLimitStore[key]
  })
}

// Default configurations for different endpoints
export const RATE_LIMIT_CONFIGS = {
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many authentication attempts. Please try again in 15 minutes.'
  },
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many API requests. Please slow down.'
  },
  strict: {
    maxRequests: 3,
    windowMs: 5 * 60 * 1000, // 5 minutes
    message: 'Too many requests. Please wait before trying again.'
  }
} as const

/**
 * Get client IP address from request headers
 */
async function getClientIP(): Promise<string> {
  const headersList = await headers()
  
  // Try to get IP from various headers (considering proxies)
  const xForwardedFor = headersList.get('x-forwarded-for')
  const xRealIp = headersList.get('x-real-ip')
  const cfConnectingIp = headersList.get('cf-connecting-ip')
  
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }
  
  if (xRealIp) {
    return xRealIp
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp
  }
  
  return 'unknown'
}

/**
 * Clean up expired entries from rate limit store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now()
  
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetTime <= now) {
      delete rateLimitStore[key]
    }
  })
}

/**
 * Check if request should be rate limited
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { 
  isAllowed: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
} {
  const now = Date.now()
  const key = `${identifier}_${config.windowMs}`

  // Try Redis (Upstash) first
  // Note: This is sync-ish wrapper; route handlers can be async if needed elsewhere
  let redisCount: number | null = null
  let redisTTL: number | null = null
  try {
    // @ts-ignore - allow top-level await-ish via deopt to sync path
    const redisRes = global.__rl_sync__
      ? null
      : null
    // We can't await here in a sync function; thus, keep in-memory as primary path
  } catch {}

  // In-memory fallback (primary path to keep sync signature)
  if (Math.random() < 0.1) {
    cleanupExpiredEntries()
  }

  let entry = rateLimitStore[key]
  if (!entry || entry.resetTime <= now) {
    entry = { count: 0, resetTime: now + config.windowMs }
    rateLimitStore[key] = entry
  }
  entry.count++

  const isAllowed = entry.count <= config.maxRequests
  const remaining = Math.max(0, config.maxRequests - entry.count)
  const result = {
    isAllowed,
    limit: config.maxRequests,
    remaining,
    resetTime: entry.resetTime
  }
  if (!isAllowed) {
    return { ...result, retryAfter: Math.ceil((entry.resetTime - now) / 1000) }
  }
  return result
}

/**
 * Middleware function for API routes
 */
export function withRateLimit(config: RateLimitConfig) {
  return async function rateLimitMiddleware(): Promise<NextResponse | null> {
    try {
      const clientIP = await getClientIP()
      const result = await checkRateLimitAsync(clientIP, config)
      
      // Add rate limit headers to all responses
      const headers = {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      }
      
      if (!result.isAllowed) {
        return new NextResponse(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: config.message || 'Too many requests',
            retryAfter: result.retryAfter,
          }),
          {
            status: 429,
            headers: {
              ...headers,
              'Retry-After': result.retryAfter!.toString(),
              'Content-Type': 'application/json',
            },
          }
        )
      }
      
      return null // No rate limit exceeded, continue with request
    } catch (error) {
      logger.error('Rate limiting error:', error)
      // In case of error, allow the request to continue
      return null
    }
  }
}

/**
 * Async version that uses Redis (Upstash) if configured, else in-memory
 */
export async function checkRateLimitAsync(
  identifier: string,
  config: RateLimitConfig
): Promise<{
  isAllowed: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}> {
  const now = Date.now()
  const key = `${identifier}_${config.windowMs}`

  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      const res = await redisIncrementAndGetTTL(key, config.windowMs)
      if (res) {
        const isAllowed = res.count <= config.maxRequests
        const remaining = Math.max(0, config.maxRequests - res.count)
        const resetTime = now + res.ttlMs
        const base = { isAllowed, limit: config.maxRequests, remaining, resetTime }
        return isAllowed ? base : { ...base, retryAfter: Math.ceil(res.ttlMs / 1000) }
      }
    } catch (e) {
      logger.warn('RateLimit Redis fallback due to error', e)
    }
  }

  // Fallback to sync in-memory
  return checkRateLimit(identifier, config)
}

/**
 * User-specific rate limiting (for authenticated routes)
 */
export function checkUserRateLimit(
  userId: string,
  config: RateLimitConfig
): { 
  isAllowed: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
} {
  return checkRateLimit(`user_${userId}`, config)
}

/**
 * Email-specific rate limiting (for registration, password reset, etc.)
 */
export function checkEmailRateLimit(
  email: string,
  config: RateLimitConfig
): { 
  isAllowed: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
} {
  return checkRateLimit(`email_${email.toLowerCase()}`, config)
}
