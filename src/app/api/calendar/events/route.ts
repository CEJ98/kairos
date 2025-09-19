import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { parseSearchParams, parseJson } from '@/lib/api-validation'
import { calendarEventsQuerySchema, createCalendarEventSchema, updateCalendarEventSchema } from '@/lib/validations'

// GET /api/calendar/events?start=YYYY-MM-DD&end=YYYY-MM-DD
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const parsed = parseSearchParams(req.url, calendarEventsQuerySchema)
    if (!parsed.ok) return parsed.error
    const { start, end } = parsed.data

    const where: any = { userId: session.user.id, status: 'PLANNED' }
    if (start || end) {
      where.startTime = {}
      if (start) where.startTime.gte = new Date(start)
      if (end) where.startTime.lte = new Date(end)
    }

    const sessions = await prisma.workoutSession.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: { workout: { select: { name: true } } },
    })

    const events = sessions.map((s) => ({
      id: s.id,
      workoutId: s.workoutId,
      title: s.workout?.name || 'Workout',
      date: s.startTime.toISOString().slice(0, 10),
    }))

    return NextResponse.json({ events })
  } catch (e) {
    return NextResponse.json({ error: 'Error al obtener eventos' }, { status: 500 })
  }
}

// POST /api/calendar/events -> { workoutId, date: YYYY-MM-DD }
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const parsed = await parseJson(req, createCalendarEventSchema)
    if (!parsed.ok) return parsed.error
    const { workoutId, date } = parsed.data

    const startTime = new Date(date)

    const created = await prisma.workoutSession.create({
      data: {
        userId: session.user.id,
        workoutId,
        startTime,
        status: 'PLANNED',
      },
    })
    return NextResponse.json({ id: created.id })
  } catch (e) {
    return NextResponse.json({ error: 'Error al crear evento' }, { status: 500 })
  }
}

// PATCH /api/calendar/events -> { id, date: YYYY-MM-DD } or { id, status: 'COMPLETED' }
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const parsed = await parseJson(req, updateCalendarEventSchema)
    if (!parsed.ok) return parsed.error
    const { id, date, status } = parsed.data as any

    // Asegurar ownership
    const existing = await prisma.workoutSession.findUnique({ where: { id } })
    if (!existing || existing.userId !== session.user.id)
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    // Cambiar fecha (reprogramar)
    if (date) {
      const updated = await prisma.workoutSession.update({
        where: { id },
        data: { startTime: new Date(date), status: 'PLANNED' },
      })
      return NextResponse.json({ ok: true, id: updated.id })
    }

    // Marcar como completado
    if (status === 'COMPLETED') {
      const end = new Date()
      const duration = existing.startTime ? Math.max(0, Math.round((end.getTime() - existing.startTime.getTime()) / 1000)) : null
      const updated = await prisma.workoutSession.update({
        where: { id },
        data: { status: 'COMPLETED', endTime: end, duration },
      })
      return NextResponse.json({ ok: true, id: updated.id })
    }

    return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: 'Error al mover evento' }, { status: 500 })
  }
}

// DELETE /api/calendar/events?id=...
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

    const existing = await prisma.workoutSession.findUnique({ where: { id } })
    if (!existing || existing.userId !== session.user.id)
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    await prisma.workoutSession.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Error al eliminar evento' }, { status: 500 })
  }
}
