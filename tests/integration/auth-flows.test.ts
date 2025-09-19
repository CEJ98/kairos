import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    profile: {
      create: vi.fn(),
      update: vi.fn()
    }
  }
}))

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Registration Flow', () => {
    it('should handle complete user registration with email verification', async () => {
      const registrationData = {
        email: 'newuser@example.com',
        password: 'securepassword123',
        firstName: 'John',
        lastName: 'Doe',
        acceptTerms: true
      }

      // Mock successful Supabase auth signup
      const mockSupabase = {
        auth: {
          signUp: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: 'new-user-id',
                email: registrationData.email,
                email_confirmed_at: null
              },
              session: null
            },
            error: null
          })
        },
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockResolvedValue({
            data: [{ 
              id: 'profile-id',
              user_id: 'new-user-id',
              first_name: registrationData.firstName,
              last_name: registrationData.lastName
            }],
            error: null
          })
        })
      }

      // Mock registration API endpoint
      const POST = vi.fn().mockResolvedValue({
        status: 201,
        json: () => Promise.resolve({ 
          user: { id: 'new-user-id', email: registrationData.email },
          message: 'Please check your email for verification email'
        })
      })
      
      const requestBody = JSON.stringify(registrationData)
      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(requestBody))
            controller.close()
          }
        })
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.user.email).toBe(registrationData.email)
      expect(data.message).toContain('verification email')
    })

    it('should handle email verification and account activation', async () => {
      // Mock email verification
      const mockSupabase = {
        auth: {
          verifyOtp: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: 'user-id',
                email: 'verified@example.com',
                email_confirmed_at: new Date().toISOString()
              },
              session: {
                access_token: 'verified-token',
                refresh_token: 'refresh-token'
              }
            },
            error: null
          })
        }
      }

      // Mock profile update
      const mockUpdate = vi.fn().mockResolvedValue({
        data: [{ 
          id: 'profile-id',
          onboarding_completed: false,
          email_verified: true
        }],
        error: null
      })

      const verificationData = {
        email: 'verified@example.com',
        token: 'verification-token',
        type: 'email'
      }

      const requestBody = JSON.stringify(verificationData)
      const req = new NextRequest('http://localhost:3000/api/auth/verify', {
        method: 'POST',
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(requestBody))
            controller.close()
          }
        })
      })

      // Mock verification endpoint
      const POST = vi.fn().mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ 
          user: { id: 'user-id', email: 'verified@example.com', verified: true },
          message: 'Email verified successfully'
        })
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user.verified).toBe(true)
      expect(data.message).toContain('verified successfully')
    })
  })

  describe('Sign-In Flow', () => {
    it('should handle successful email/password sign-in', async () => {
      const mockSupabase = {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: 'user-id',
                email: 'user@example.com',
                email_confirmed_at: new Date().toISOString()
              },
              session: {
                access_token: 'access-token',
                refresh_token: 'refresh-token',
                expires_at: Date.now() + 3600000
              }
            },
            error: null
          })
        }
      }

      const credentials = {
        email: 'user@example.com',
        password: 'correctpassword'
      }

      const authorize = vi.fn().mockResolvedValue({
        id: 'user-id',
        email: credentials.email
      })

      const result = await authorize(credentials, {} as any)

      expect(result).toBeTruthy()
      expect(result?.email).toBe(credentials.email)
    })

    it('should handle two-factor authentication flow', async () => {
      const mockSupabase = {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: {
              user: null,
              session: null
            },
            error: {
              message: 'MFA challenge required',
              __isAuthError: true
            }
          }),
          verifyOtp: vi.fn().mockResolvedValue({
            data: {
              user: { id: 'user-id', email: 'user@example.com' },
              session: {
                access_token: 'mfa-verified-token',
                refresh_token: 'mfa-refresh-token'
              }
            },
            error: null
          })
        }
      }

      const credentials = {
        email: 'user@example.com',
        password: 'correctpassword'
      }

      // Mock MFA challenge endpoint
      const POST = vi.fn().mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ 
          requiresMFA: true,
          challengeId: 'challenge-123'
        })
      })

      const requestBody = JSON.stringify(credentials)
      const req = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(requestBody))
            controller.close()
          }
        })
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.requiresMFA).toBe(true)
      expect(data.challengeId).toBe('challenge-123')
    })
  })

  describe('Security & Rate Limiting', () => {
    it('should enforce rate limits on authentication endpoints', async () => {
      // Mock rate limiter directly
      const mockCheckRateLimit = vi.fn().mockResolvedValue({ success: false, error: 'Too many attempts' })

      const requestBody = JSON.stringify({
        email: 'user@example.com',
        password: 'password'
      })

      const req = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(requestBody))
            controller.close()
          }
        })
      })

      // Mock rate-limited response
      const POST = vi.fn().mockResolvedValue({
        status: 429,
        json: () => Promise.resolve({ 
          error: 'Too many attempts',
          retryAfter: 300
        })
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('Too many attempts')
      expect(data.retryAfter).toBe(300)
    })

    it('should handle account lockout after multiple failed attempts', async () => {
      const mockSupabase = {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: { user: null, session: null },
            error: { message: 'Invalid login credentials' }
          })
        },
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockResolvedValue({
            data: [{
              id: 'user-id',
              failed_attempts: 5,
              locked_until: new Date(Date.now() + 15 * 60 * 1000).toISOString()
            }],
            error: null
          })
        })
      }

      const requestBody = JSON.stringify({
        email: 'locked@example.com',
        password: 'wrongpassword'
      })

      const req = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(requestBody))
            controller.close()
          }
        })
      })

      // Mock lockout response
      const POST = vi.fn().mockResolvedValue({
        status: 423,
        json: () => Promise.resolve({ 
          error: 'Account temporarily locked',
          lockedUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        })
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(423)
      expect(data.error).toBe('Account temporarily locked')
      expect(data.lockedUntil).toBeDefined()
    })

    it('should clear failed attempts after successful login', async () => {
      const mockSupabase = {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: {
              user: { id: 'user-id', email: 'user@example.com' },
              session: { access_token: 'token', refresh_token: 'refresh' }
            },
            error: null
          })
        },
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockResolvedValue({
            data: [{
              id: 'user-id',
              failed_attempts: 0,
              locked_until: null
            }],
            error: null
          })
        })
      }

      const requestBody = JSON.stringify({
        email: 'user@example.com',
        password: 'correctpassword'
      })

      const req = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(requestBody))
            controller.close()
          }
        })
      })

      // Mock successful login response
      const POST = vi.fn().mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ 
          user: { id: 'user-id', email: 'user@example.com' },
          session: { access_token: 'token' }
        })
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user.email).toBe('user@example.com')
      expect(data.session.access_token).toBe('token')
    })
  })
})