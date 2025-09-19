import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { NextRequest } from 'next/server'
import * as nextAuth from 'next-auth'

import { PATCH as WORKOUTS_PATCH, DELETE as WORKOUTS_DELETE } from '@/app/api/workouts/[id]/route'

function makeReq(method: string, url: string, body?: any) {
  const req: Partial<NextRequest> & { method: string } = {
    method,
    url,
    json: async () => body
  }
  return req as NextRequest
}

const txMock = {
  workout: {
    update: vi.fn().mockResolvedValue({ id: 'w1' })
  },
  workoutExercise: {
    deleteMany: vi.fn().mockResolvedValue({}),
    createMany: vi.fn().mockResolvedValue({})
  }
}

const prismaWorkoutFindUnique = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: vi.fn(async (fn: any) => fn(txMock)),
    workout: {
      findUnique: (args: any) => prismaWorkoutFindUnique(args),
      delete: vi.fn().mockResolvedValue({})
    }
  }
}))

describe('API /api/workouts/[id]', () => {
  beforeEach(() => {
    vi.spyOn(nextAuth, 'getServerSession').mockResolvedValue({ user: { id: 'u1', role: 'TRAINER' } } as any)
    prismaWorkoutFindUnique.mockReset()
  })

  it('PATCH returns 401 without auth', async () => {
    vi.spyOn(nextAuth, 'getServerSession').mockResolvedValueOnce(null as any)
    const req = makeReq('PATCH', 'http://localhost/api/workouts/w1', { name: 'New' })
    const res = await WORKOUTS_PATCH(req, { params: Promise.resolve({ id: 'w1' }) })
    expect(res.status).toBe(401)
  })

  it('PATCH returns 404 when workout not found', async () => {
    prismaWorkoutFindUnique.mockResolvedValueOnce(null)
    const req = makeReq('PATCH', 'http://localhost/api/workouts/wX', { name: 'New' })
    const res = await WORKOUTS_PATCH(req, { params: Promise.resolve({ id: 'wX' }) })
    expect(res.status).toBe(404)
  })

  it('PATCH updates workout when valid', async () => {
    prismaWorkoutFindUnique
      .mockResolvedValueOnce({ id: 'w1', creatorId: 'u1', exercises: [] })
      .mockResolvedValueOnce({ id: 'w1', exercises: [], creator: {} })
    const req = makeReq('PATCH', 'http://localhost/api/workouts/w1', { name: 'New Name' })
    const res = await WORKOUTS_PATCH(req, { params: Promise.resolve({ id: 'w1' }) })
    expect(res.status).toBe(200)
  })

  it('DELETE returns 401 without auth', async () => {
    vi.spyOn(nextAuth, 'getServerSession').mockResolvedValueOnce(null as any)
    const req = makeReq('DELETE', 'http://localhost/api/workouts/w1')
    const res = await WORKOUTS_DELETE(req, { params: Promise.resolve({ id: 'w1' }) })
    expect(res.status).toBe(401)
  })
})

