import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPortalSession } from '@/lib/stripe'
import { prisma } from '@/lib/db'

import { logger } from '@/lib/logger'
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { returnUrl } = await req.json()

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscriptions: true }
    })

    if (!user || !user.subscriptions[0]?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No se encontró customer de Stripe' },
        { status: 404 }
      )
    }

    const portalSession = await createPortalSession(
      user.subscriptions[0].stripeCustomerId,
      returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`
    )

    return NextResponse.json({ url: portalSession.url })

  } catch (error) {
    logger.error('Error creating portal session:', error, 'API')
    return NextResponse.json(
      { error: 'Error al crear sesión de portal' },
      { status: 500 }
    )
  }
}