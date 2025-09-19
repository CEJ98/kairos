import { z, ZodSchema } from 'zod'
import { NextRequest, NextResponse } from 'next/server'

export async function parseJson<T extends ZodSchema<any>>(req: NextRequest, schema: T) {
  const raw = await req.json().catch(() => ({}))
  const result = schema.safeParse(raw)
  if (!result.success) {
    return {
      ok: false as const,
      error: NextResponse.json({ error: 'Invalid payload', issues: result.error.flatten() }, { status: 400 }),
    }
  }
  return { ok: true as const, data: result.data as z.infer<T> }
}

export function parseSearchParams<T extends ZodSchema<any>>(url: string, schema: T) {
  const u = new URL(url)
  const obj: Record<string, string> = {}
  u.searchParams.forEach((v, k) => { obj[k] = v })
  const result = schema.safeParse(obj)
  if (!result.success) {
    return { ok: false as const, error: NextResponse.json({ error: 'Invalid query', issues: result.error.flatten() }, { status: 400 }) }
  }
  return { ok: true as const, data: result.data as z.infer<T> }
}

