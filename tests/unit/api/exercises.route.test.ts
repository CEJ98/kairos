import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { NextRequest } from 'next/server'
import * as nextAuth from 'next-auth'

import { POST as EXERCISES_POST } from '@/app/api/exercises/route'

function makeReq(method: string, url: string, body?: any) {
  const req: Partial<NextRequest> & { method: string } = {
    method,
    url,
    json: async () => body
  }
  return req as NextRequest
}

vi.mock('@/lib/db', () => ({
  prisma: {
    exercise: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'ex1', name: 'Squat' })
    }
  }
}))

describe('API /api/exercises', () => {
  beforeEach(() => {
    vi.spyOn(nextAuth, 'getServerSession').mockResolvedValue({ user: { id: 'u1', role: 'TRAINER' } } as any)
  })

  it('POST returns 400 on invalid payload', async () => {
    const req = makeReq('POST', 'http://localhost/api/exercises', { name: '' })
    const res = await EXERCISES_POST(req)
    expect(res.status).toBe(400)
  })

  it('POST creates exercise with valid payload', async () => {
    const payload = {
      name: 'Squat',
      category: 'STRENGTH',
      difficulty: 'BEGINNER',
      muscleGroups: ['QUADRICEPS'],
      equipments: ['BARBELL']
    }
    const req = makeReq('POST', 'http://localhost/api/exercises', payload)
    const res = await EXERCISES_POST(req)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBeDefined()
  })
})

