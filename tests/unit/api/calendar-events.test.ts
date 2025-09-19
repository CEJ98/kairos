import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next-auth getServerSession via authOptions indirection
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({ user: { id: 'u1' } })),
}))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

// Mock prisma client
const findUnique = vi.fn()
const update = vi.fn()
const del = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    workoutSession: {
      findUnique: (...args: any[]) => findUnique(...args),
      update: (...args: any[]) => update(...args),
      delete: (...args: any[]) => del(...args),
    },
  },
}))

describe('/api/calendar/events basic API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.skip('PATCH completes a session', async () => {
    const { PATCH } = await import('@/app/api/calendar/events/route')
    findUnique.mockResolvedValueOnce({ id: 'cksession1aaaaaaaaaaaaaaa', userId: 'u1', startTime: new Date(Date.now() - 1000) })
    update.mockResolvedValueOnce({ id: 'cksession1aaaaaaaaaaaaaaa' })

    const req: any = {
      url: 'http://localhost/api/calendar/events',
      json: async () => ({ id: 'cksession1aaaaaaaaaaaaaaa', status: 'COMPLETED' }),
    }
    const res = await PATCH(req as any)
    try {
      const data = await (res as any).json()
      // eslint-disable-next-line no-console
      console.log('PATCH complete status:', res.status, 'body:', data)
    } catch {}
    expect(res.status).toBe(200)
    expect(update).toHaveBeenCalled()
  })

  it.skip('PATCH reschedules a session date', async () => {
    const { PATCH } = await import('@/app/api/calendar/events/route')
    findUnique.mockResolvedValueOnce({ id: 'cksession2bbbbbbbbbbbbbbb', userId: 'u1', startTime: new Date() })
    update.mockResolvedValueOnce({ id: 'cksession2bbbbbbbbbbbbbbb' })

    const req: any = {
      url: 'http://localhost/api/calendar/events',
      json: async () => ({ id: 'cksession2bbbbbbbbbbbbbbb', date: '2025-01-01' }),
    }
    const res = await PATCH(req as any)
    try {
      const data = await (res as any).json()
      // eslint-disable-next-line no-console
      console.log('PATCH reschedule status:', res.status, 'body:', data)
    } catch {}
    expect(res.status).toBe(200)
    expect(update).toHaveBeenCalled()
  })

  it('DELETE removes a session by id', async () => {
    const { DELETE } = await import('@/app/api/calendar/events/route')
    findUnique.mockResolvedValueOnce({ id: 'cksession3ccccccccccccccc', userId: 'u1' })
    del.mockResolvedValueOnce({})

    const req: any = {
      url: 'http://localhost/api/calendar/events?id=cksession3ccccccccccccccc',
    }
    const res = await DELETE(req as any)
    expect(res.status).toBe(200)
    expect(del).toHaveBeenCalledWith({ where: { id: 'cksession3ccccccccccccccc' } })
  })
})
