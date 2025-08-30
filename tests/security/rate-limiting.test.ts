/**
 * Security Tests - Rate Limiting
 * Tests to ensure rate limiting is properly implemented and functioning
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  checkRateLimit, 
  RATE_LIMIT_CONFIGS, 
  withRateLimit,
  checkUserRateLimit,
  checkEmailRateLimit,
  clearRateLimitStore
} from '@/lib/rate-limiter'

describe('Rate Limiting Security', () => {
  beforeEach(() => {
    // Clear rate limit store before each test
    clearRateLimitStore()
    vi.clearAllMocks()
  })

  describe('Basic Rate Limiting', () => {
    it('should allow requests within limit', () => {
      const config = RATE_LIMIT_CONFIGS.auth
      
      // First request should be allowed
      const result1 = checkRateLimit('test-ip', config)
      expect(result1.isAllowed).toBe(true)
      expect(result1.remaining).toBe(4) // 5 - 1 = 4
      
      // Second request should also be allowed
      const result2 = checkRateLimit('test-ip', config)
      expect(result2.isAllowed).toBe(true)
      expect(result2.remaining).toBe(3)
    })

    it('should block requests exceeding limit', () => {
      const config = { maxRequests: 2, windowMs: 60000 }
      
      // Make requests up to limit
      checkRateLimit('test-ip-2', config)
      checkRateLimit('test-ip-2', config)
      
      // Third request should be blocked
      const result = checkRateLimit('test-ip-2', config)
      expect(result.isAllowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfter).toBeGreaterThan(0)
    })

    it('should reset after window expires', async () => {
      const config = { maxRequests: 1, windowMs: 10 } // 10ms window
      
      // Use up the limit
      const result1 = checkRateLimit('test-ip-3', config)
      expect(result1.isAllowed).toBe(true)
      
      const result2 = checkRateLimit('test-ip-3', config)
      expect(result2.isAllowed).toBe(false)
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 15))
      
      // Should be allowed again
      const result3 = checkRateLimit('test-ip-3', config)
      expect(result3.isAllowed).toBe(true)
    })

    it('should handle different IPs independently', () => {
      const config = { maxRequests: 1, windowMs: 60000 }
      
      // First IP uses up limit
      const result1 = checkRateLimit('ip-1', config)
      expect(result1.isAllowed).toBe(true)
      
      const result2 = checkRateLimit('ip-1', config)
      expect(result2.isAllowed).toBe(false)
      
      // Second IP should still be allowed
      const result3 = checkRateLimit('ip-2', config)
      expect(result3.isAllowed).toBe(true)
    })
  })

  describe('Configuration Validation', () => {
    it('should have proper auth rate limiting config', () => {
      const config = RATE_LIMIT_CONFIGS.auth
      expect(config.maxRequests).toBe(5)
      expect(config.windowMs).toBe(15 * 60 * 1000) // 15 minutes
      expect(config.message).toContain('authentication attempts')
    })

    it('should have proper API rate limiting config', () => {
      const config = RATE_LIMIT_CONFIGS.api
      expect(config.maxRequests).toBe(100)
      expect(config.windowMs).toBe(60 * 1000) // 1 minute
      expect(config.message).toContain('API requests')
    })

    it('should have proper strict rate limiting config', () => {
      const config = RATE_LIMIT_CONFIGS.strict
      expect(config.maxRequests).toBe(3)
      expect(config.windowMs).toBe(5 * 60 * 1000) // 5 minutes
      expect(config.message).toContain('Too many requests')
    })
  })

  describe('User-specific Rate Limiting', () => {
    it('should rate limit by user ID', () => {
      const config = { maxRequests: 2, windowMs: 60000 }
      
      // User 1 makes requests
      const result1 = checkUserRateLimit('user-1', config)
      expect(result1.isAllowed).toBe(true)
      
      const result2 = checkUserRateLimit('user-1', config)
      expect(result2.isAllowed).toBe(true)
      
      const result3 = checkUserRateLimit('user-1', config)
      expect(result3.isAllowed).toBe(false)
      
      // User 2 should have separate limit
      const result4 = checkUserRateLimit('user-2', config)
      expect(result4.isAllowed).toBe(true)
    })
  })

  describe('Email-specific Rate Limiting', () => {
    it('should rate limit by email address', () => {
      const config = { maxRequests: 1, windowMs: 60000 }
      
      const result1 = checkEmailRateLimit('test@example.com', config)
      expect(result1.isAllowed).toBe(true)
      
      const result2 = checkEmailRateLimit('test@example.com', config)
      expect(result2.isAllowed).toBe(false)
      
      // Different email should have separate limit
      const result3 = checkEmailRateLimit('other@example.com', config)
      expect(result3.isAllowed).toBe(true)
    })

    it('should handle email case insensitively', () => {
      const config = { maxRequests: 1, windowMs: 60000 }
      
      const result1 = checkEmailRateLimit('Test@Example.com', config)
      expect(result1.isAllowed).toBe(true)
      
      // Same email with different case should be blocked
      const result2 = checkEmailRateLimit('test@example.com', config)
      expect(result2.isAllowed).toBe(false)
    })
  })

  describe('Rate Limit Headers', () => {
    it('should return correct rate limit information', () => {
      const config = { maxRequests: 5, windowMs: 60000 }
      
      const result = checkRateLimit('header-test-ip', config)
      
      expect(result).toHaveProperty('limit', 5)
      expect(result).toHaveProperty('remaining', 4)
      expect(result).toHaveProperty('resetTime')
      expect(typeof result.resetTime).toBe('number')
      expect(result.resetTime).toBeGreaterThan(Date.now())
    })

    it('should include retryAfter when rate limited', () => {
      const config = { maxRequests: 1, windowMs: 60000 }
      
      // Use up the limit
      checkRateLimit('retry-test-ip', config)
      
      // Next request should include retryAfter
      const result = checkRateLimit('retry-test-ip', config)
      expect(result.isAllowed).toBe(false)
      expect(result).toHaveProperty('retryAfter')
      expect(typeof result.retryAfter).toBe('number')
      expect(result.retryAfter!).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid identifiers gracefully', () => {
      const config = { maxRequests: 5, windowMs: 60000 }
      
      // Empty identifier
      const result1 = checkRateLimit('', config)
      expect(typeof result1.isAllowed).toBe('boolean')
      
      // Special characters
      const result2 = checkRateLimit('user@#$%', config)
      expect(typeof result2.isAllowed).toBe('boolean')
    })

    it('should handle malformed config gracefully', () => {
      const badConfig = { maxRequests: -1, windowMs: 0 }
      
      const result = checkRateLimit('test-ip', badConfig)
      expect(typeof result.isAllowed).toBe('boolean')
    })
  })
})