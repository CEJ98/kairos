import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => null),
}))

describe('billing endpoints auth', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('create-checkout-session returns 401 when unauthenticated', async () => {
    const { POST } = await import('@/app/api/billing/create-checkout-session/route')
    const req: any = { json: async () => ({ plan: 'BASIC' }) }
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('status returns 401 when unauthenticated', async () => {
    const { GET } = await import('@/app/api/billing/status/route')
    const req: any = { }
    const res = await GET(req as any)
    expect(res.status).toBe(401)
  })
})

