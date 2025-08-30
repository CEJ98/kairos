/**
 * Exercises API Tests
 */

import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/exercises/route'
import { createMockExercise } from '../utils/test-utils'

// Mock Prisma
jest.mock('@/lib/db', () => ({
  exercise: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}))

// Mock NextAuth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}))

import { exercise } from '@/lib/db'
import { getServerSession } from 'next-auth/next'

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockExercise = exercise as jest.Mocked<typeof exercise>

describe('/api/exercises', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/exercises', () => {
    it('returns exercises successfully', async () => {
      const mockExercises = [
        createMockExercise({ id: '1', name: 'Push Up' }),
        createMockExercise({ id: '2', name: 'Pull Up' })
      ]

      mockGetServerSession.mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' }
      } as any)
      
      mockExercise.findMany.mockResolvedValue(mockExercises)

      const { req, res } = createMocks({
        method: 'GET'
      })

      await handler.GET(req as any)

      expect(mockExercise.findMany).toHaveBeenCalled()
    })

    it('returns 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'GET'
      })

      const response = await handler.GET(req as any)
      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/exercises', () => {
    it('creates exercise successfully', async () => {
      const newExercise = createMockExercise({ name: 'New Exercise' })
      
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user1', role: 'TRAINER' }
      } as any)

      mockExercise.create.mockResolvedValue(newExercise)

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: 'New Exercise',
          description: 'Test description',
          category: 'CHEST'
        }
      })

      const response = await handler.POST(req as any)
      expect(mockExercise.create).toHaveBeenCalled()
    })

    it('returns 403 if user is not trainer', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user1', role: 'USER' }
      } as any)

      const { req, res } = createMocks({
        method: 'POST',
        body: { name: 'New Exercise' }
      })

      const response = await handler.POST(req as any)
      expect(response.status).toBe(403)
    })
  })
})