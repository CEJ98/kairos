/**
 * Vitest Setup File for Kairos Fitness Testing
 * Global test configuration and mocks
 */

import '@testing-library/jest-dom'
import { beforeAll, afterAll, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  notFound: vi.fn(),
  redirect: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => {
    // Mock Next.js Image component
    return { src, alt, ...props }
  },
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => ({
    href,
    children,
    ...props
  }),
}))

// Mock Stripe
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    elements: vi.fn(() => ({
      create: vi.fn(),
      mount: vi.fn(),
      destroy: vi.fn(),
    })),
    confirmPayment: vi.fn(),
    confirmSetup: vi.fn(),
  })),
}))

// Mock rate limiter
vi.mock('@/lib/rate-limiter', () => {
  let requestCounts = new Map()
  let windowStartTimes = new Map()
  
  return {
    checkRateLimit: vi.fn((identifier, config) => {
      const key = identifier
      const now = Date.now()
      
      // Initialize window start time if not exists
      if (!windowStartTimes.has(key)) {
        windowStartTimes.set(key, now)
        requestCounts.set(key, 0)
      }
      
      const windowStart = windowStartTimes.get(key)
      
      // Reset if window has expired
      if (now - windowStart >= config.windowMs) {
        requestCounts.set(key, 0)
        windowStartTimes.set(key, now)
      }
      
      const count = requestCounts.get(key) || 0
      const newCount = count + 1
      requestCounts.set(key, newCount)
      
      const isAllowed = newCount <= config.maxRequests
      const remaining = Math.max(0, config.maxRequests - newCount)
      const currentWindowStart = windowStartTimes.get(key)
      const resetTime = currentWindowStart + config.windowMs
      
      return {
        isAllowed,
        limit: config.maxRequests,
        remaining,
        resetTime,
        retryAfter: isAllowed ? undefined : Math.ceil(config.windowMs / 1000)
      }
    }),
    checkUserRateLimit: vi.fn((userId, config) => {
      const key = `user:${userId}`
      const count = requestCounts.get(key) || 0
      const newCount = count + 1
      requestCounts.set(key, newCount)
      
      const isAllowed = newCount <= config.maxRequests
      const remaining = Math.max(0, config.maxRequests - newCount)
      const resetTime = Date.now() + config.windowMs
      
      return {
        isAllowed,
        limit: config.maxRequests,
        remaining,
        resetTime,
        retryAfter: isAllowed ? undefined : Math.ceil(config.windowMs / 1000)
      }
    }),
    checkEmailRateLimit: vi.fn((email, config) => {
      const key = `email:${email.toLowerCase()}`
      const count = requestCounts.get(key) || 0
      const newCount = count + 1
      requestCounts.set(key, newCount)
      
      const isAllowed = newCount <= config.maxRequests
      const remaining = Math.max(0, config.maxRequests - newCount)
      const resetTime = Date.now() + config.windowMs
      
      return {
        isAllowed,
        limit: config.maxRequests,
        remaining,
        resetTime,
        retryAfter: isAllowed ? undefined : Math.ceil(config.windowMs / 1000)
      }
    }),
    clearRateLimitStore: vi.fn(() => {
       requestCounts.clear()
       windowStartTimes.clear()
     }),
    withRateLimit: vi.fn(),
    RATE_LIMIT_CONFIGS: {
      auth: { maxRequests: 5, windowMs: 900000, message: 'Too many authentication attempts' },
      api: { maxRequests: 100, windowMs: 60000, message: 'Too many API requests' },
      strict: { maxRequests: 3, windowMs: 300000, message: 'Too many requests' }
    }
  }
})

// Mock bcrypt - Removed global mock to allow test-specific spies

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    security: vi.fn()
  }
}))

// Mock advanced validation
vi.mock('@/lib/advanced-validation', () => ({
  AdvancedValidator: vi.fn().mockImplementation(() => ({
    validateString: vi.fn(() => ({ success: true, data: 'test', securityIssues: [], sanitized: false })),
    validateEmail: vi.fn(() => ({ success: true, data: 'test@example.com' })),
    validatePassword: vi.fn(() => ({ success: true, data: 'password123' })),
    validateFile: vi.fn(() => ({ success: true, data: {} })),
    validateJSON: vi.fn(() => ({
      success: true,
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'trainer'
      }
    }))
  })),
  createValidator: vi.fn(() => ({
    validateJSON: vi.fn(() => ({
      success: true,
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'trainer'
      }
    }))
  })),
  validateRequestBody: vi.fn(() => ({ success: true, data: {} })),
  validateFields: vi.fn(() => ({ success: true, data: {} })),
  commonValidations: {
    email: vi.fn(() => vi.fn(() => ({ success: true, data: 'test@example.com' }))),
    password: vi.fn(() => vi.fn(() => ({ success: true, data: 'password123' }))),
    name: vi.fn(() => vi.fn(() => ({ success: true, data: 'Test User' }))),
    description: vi.fn(() => vi.fn(() => ({ success: true, data: 'Test description' }))),
    url: vi.fn(() => vi.fn(() => ({ success: true, data: 'https://example.com' })))
  }
}))

// Mock validations
vi.mock('@/lib/validations', () => ({
  createUserSchema: {
    safeParse: vi.fn(() => ({
      success: true,
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'trainer'
      }
    }))
  },
  createWorkoutSchema: {
    safeParse: vi.fn((data) => {
      // Basic validation logic for testing
      if (!data || typeof data !== 'object') {
        return { success: false, error: { issues: [{ message: 'Invalid data' }] } }
      }
      if (!data.name) {
        return { success: false, error: { issues: [{ message: 'Workout name is required' }] } }
      }
      if (data.name.length > 100) {
        return { success: false, error: { issues: [{ message: 'Name is too long' }] } }
      }
      if (data.duration && data.duration > 480) {
        return { success: false, error: { issues: [{ message: 'Duration too long' }] } }
      }
      if (!data.exercises || !Array.isArray(data.exercises) || data.exercises.length === 0) {
        return { success: false, error: { issues: [{ message: 'Workout must have at least one exercise' }] } }
      }
      return {
        success: true,
        data: {
          name: data.name,
          exercises: data.exercises || [],
          duration: data.duration,
          description: data.description,
          category: data.category,
          isTemplate: data.isTemplate,
          isPublic: data.isPublic
        }
      }
    })
  },
  workoutExerciseSchema: {
    safeParse: vi.fn((data) => {
      if (!data || typeof data !== 'object') {
        return { success: false, error: { issues: [{ message: 'Invalid data' }] } }
      }
      if (!data.exerciseId) {
        return { success: false, error: { issues: [{ message: 'Exercise ID is required' }] } }
      }
      if (!data.order) {
        return { success: false, error: { issues: [{ message: 'Order is required' }] } }
      }
      if (data.sets !== undefined && (data.sets < 1 || data.sets > 20)) {
        return { success: false, error: { issues: [{ message: 'Invalid sets value' }] } }
      }
      if (data.reps !== undefined && (data.reps < 1 || data.reps > 1000)) {
        return { success: false, error: { issues: [{ message: 'Invalid reps value' }] } }
      }
      return {
        success: true,
        data: {
          exerciseId: data.exerciseId,
          order: data.order,
          sets: data.sets,
          reps: data.reps,
          weight: data.weight,
          duration: data.duration,
          distance: data.distance,
          restTime: data.restTime,
          notes: data.notes
        }
      }
    })
  }
}))

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn((query) => {
        const email = query?.where?.email
        // Return null for specific test emails to allow registration
        if (email === 'trainer@example.com' || 
            email === 'newtrainer@example.com' || 
            email === 'admin@example.com' ||
            email?.includes('newuser') ||
            email?.includes('unique')) {
          return Promise.resolve(null)
        }
        // Return existing user for sign-in tests
        return Promise.resolve({
          id: 'existing-user-id',
          email: email || 'test@example.com',
          password: '$2a$12$hashedpassword',
          role: 'CLIENT',
          isVerified: true
        })
      }),
      create: vi.fn((data) => ({
        id: 'new-user-id',
        email: data.email,
        name: data.name,
        role: data.role || 'TRAINER',
        isVerified: true
      })),
      update: vi.fn((query) => {
        const userId = query?.where?.id
        return Promise.resolve({
          id: userId || 'updated-user-id',
          email: 'test@example.com',
          name: 'Updated User',
          role: 'CLIENT',
          isVerified: true,
          lastSeen: new Date(),
          isOnline: true
        })
      })
    },
    trainerProfile: {
      create: vi.fn(() => ({ id: 'trainer-profile-id' }))
    },
    clientProfile: {
      create: vi.fn(() => ({ id: 'client-profile-id' }))
    }
  }
}))

// Mock Supabase client
vi.mock('@/lib/supabase-client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      refreshSession: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    }))
  })),
  createSupabaseBrowserClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      refreshSession: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    }))
  }))
}))

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/kairos_test'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.STRIPE_SECRET_KEY = 'sk_test_123'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'

// Setup MSW server
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterAll(() => {
  server.close()
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  vi.clearAllMocks()
})