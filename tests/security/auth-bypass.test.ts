/**
 * Security Tests - Authentication Bypass Prevention
 * Tests to ensure the critical auth bypass vulnerability has been fixed
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock bcryptjs (usar hoisted para evitar problemas de inicialización)
const { mockCompare } = vi.hoisted(() => ({ mockCompare: vi.fn() }))
vi.mock('bcryptjs', () => ({
  compare: mockCompare,
  hash: vi.fn(() => Promise.resolve('$2a$12$hashedpassword'))
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

import { authOptions, authorizeCredentialsForTest } from '@/lib/auth'
import { prisma } from '@/lib/db'

describe('Authentication Bypass Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Credentials Provider Security', () => {
    it('should mock bcrypt compare correctly', async () => {
      // Simple test to verify mock is working
      mockCompare.mockResolvedValue(true)
      const result = await mockCompare('test', 'hash')
      expect(result).toBe(true)
      expect(mockCompare).toHaveBeenCalledWith('test', 'hash')
    })

    it('should reject login when user has no password', async () => {
      // Mock user without password
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
        password: null,
        role: 'CLIENT',
        name: 'Test User',
        avatar: null,
        isVerified: false,
        isOnline: false,
        lastSeen: new Date(),
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        trainerProfile: null,
        clientProfiles: [],
      })

      const result = await authorizeCredentialsForTest({
        email: 'test@example.com',
        password: 'any-password',
      })

      expect(result).toBeNull()
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: {
          trainerProfile: true,
          clientProfiles: true,
        },
      })
    })

    it('should reject login with "password" as password', async () => {
      // Mock user with hashed password
      const hashedPassword = '$2a$12$fakehash'
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'CLIENT',
        name: 'Test User',
        avatar: null,
        isVerified: false,
        isOnline: false,
        lastSeen: new Date(),
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        trainerProfile: null,
        clientProfiles: [],
      })

      // Mock bcrypt to return false for "password"
      mockCompare.mockResolvedValue(false)

      const result = await authorizeCredentialsForTest({
        email: 'test@example.com',
        password: 'password', // This should not work anymore
      })

      expect(result).toBeNull()
    })

    it('should reject login with empty password', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'CLIENT',
        name: 'Test User',
        avatar: null,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        trainerProfile: null,
        clientProfiles: [],
      })

      const credentialsProvider = authOptions.providers![0] as any
      const result = await credentialsProvider.authorize({
        email: 'test@example.com',
        password: '',
      })

      expect(result).toBeNull()
    })

    it('should require both email and password', async () => {
      const credentialsProvider = authOptions.providers![0] as any

      // Test missing email
      let result = await credentialsProvider.authorize({
        email: '',
        password: 'password',
      })
      expect(result).toBeNull()

      // Test missing password
      result = await credentialsProvider.authorize({
        email: 'test@example.com',
        password: '',
      })
      expect(result).toBeNull()

      // Test both missing
      result = await credentialsProvider.authorize({
        email: '',
        password: '',
      })
      expect(result).toBeNull()
    })

    it('should only authenticate with valid password hash', async () => {
      const hashedPassword = '$2a$12$fakehash'

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        avatar: null,
        role: 'CLIENT',
        isVerified: false,
        isOnline: false,
        lastSeen: new Date(),
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        trainerProfile: null,
        clientProfiles: [],
      })

      // Mock bcrypt compare to return false for wrong password
      mockCompare.mockResolvedValue(false)

      const result = await authorizeCredentialsForTest({
        email: 'test@example.com',
        password: 'wrongpassword',
      })

      expect(result).toBeNull()
      expect(mockCompare).toHaveBeenCalledWith('wrongpassword', hashedPassword)
    })

    it('should authenticate successfully with correct password', async () => {
      const hashedPassword = '$2a$12$fakehash'

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        avatar: null,
        role: 'CLIENT',
        isVerified: false,
        isOnline: false,
        lastSeen: new Date(),
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        trainerProfile: null,
        clientProfiles: [],
      })

      // Mock bcrypt compare to return true for correct password
      mockCompare.mockResolvedValue(true)

      const result = await authorizeCredentialsForTest({
        email: 'test@example.com',
        password: 'correctpassword',
      })

      expect(result).toEqual({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        image: '',
        role: 'CLIENT',
      })
      expect(mockCompare).toHaveBeenCalledWith('correctpassword', hashedPassword)
    })

    it('should reject non-existent users', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const result = await authorizeCredentialsForTest({
        email: 'nonexistent@example.com',
        password: 'anypassword',
      })

      expect(result).toBeNull()
    })
  })

  describe('Session Security', () => {
    it('should include user role in JWT token', async () => {
      const jwt = authOptions.callbacks?.jwt
      expect(jwt).toBeDefined()

      const token = { role: undefined, id: undefined }
      const user = { id: 'user-id', role: 'CLIENT' }

      const result = await jwt!({ token, user } as any)
      
      expect(result).toMatchObject({
        role: 'CLIENT',
        id: 'user-id',
      })
    })

    it('should include user role in session', async () => {
      const sessionCallback = authOptions.callbacks?.session
      expect(sessionCallback).toBeDefined()

      const session = {
        user: {
          id: '',
          role: '',
          email: 'test@example.com',
          name: 'Test User',
          image: '',
        },
      }

      const token = {
        id: 'user-id',
        role: 'TRAINER',
      }

      const result = await sessionCallback!({ session, token } as any)

      expect(result).toMatchObject({
        user: {
          id: 'user-id',
          role: 'TRAINER',
          email: 'test@example.com',
          name: 'Test User',
        },
      })
    })
  })
})
