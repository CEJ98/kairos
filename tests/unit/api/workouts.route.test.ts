import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { NextRequest } from 'next/server'
import * as nextAuth from 'next-auth'

import { GET as WORKOUTS_GET, POST as WORKOUTS_POST } from '@/app/api/workouts/route'

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
    create: vi.fn().mockResolvedValue({ id: 'w1' })
  },
  workoutExercise: {
    createMany: vi.fn().mockResolvedValue({})
  }
}

vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: vi.fn(async (fn: any) => fn(txMock)),
    workout: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      findUnique: vi.fn().mockResolvedValue({ id: 'w1', exercises: [], creator: {}, _count: { sessions: 0 } })
    }
  }
}))

describe('API /api/workouts', () => {
  beforeEach(() => {
    vi.spyOn(nextAuth, 'getServerSession').mockResolvedValue({ user: { id: 'u1', role: 'TRAINER' } } as any)
  })

  it('GET requires auth', async () => {
    vi.spyOn(nextAuth, 'getServerSession').mockResolvedValueOnce(null as any)
    const req = makeReq('GET', 'http://localhost/api/workouts')
    const res = await WORKOUTS_GET(req)
    expect(res.status).toBe(401)
  })

  it('POST returns 400 on invalid payload', async () => {
    const req = makeReq('POST', 'http://localhost/api/workouts', { name: 'x' })
    const res = await WORKOUTS_POST(req)
    expect(res.status).toBe(400)
  })

  it('POST creates workout with valid payload', async () => {
    const payload = {
      name: 'Leg Day',
      category: 'strength',
      exercises: [ { exerciseId: 'ex1', sets: 3, reps: 10 } ]
    }
    const req = makeReq('POST', 'http://localhost/api/workouts', payload)
    const res = await WORKOUTS_POST(req)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBe('w1')
  })
})

