import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe, createCustomer, createSubscription } from '@/lib/stripe'
import { prisma } from '@/lib/db'

import { logger } from '@/lib/logger'
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { priceId, trialDays } = await req.json()

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID requerido' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscriptions: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    let customerId = user.subscriptions[0]?.stripeCustomerId

    // Crear customer en Stripe si no existe
    if (!customerId) {
      const customer = await createCustomer(user.email, user.name || 'Usuario')
      customerId = customer.id

      // Guardar customer ID en la base de datos
      await prisma.subscription.create({
        data: {
          userId: user.id,
          stripeCustomerId: customerId,
          planType: 'FREE',
          status: 'INCOMPLETE',
        }
      })
    }

    // Crear la suscripción
    const subscription = await createSubscription(customerId, priceId, trialDays)

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
    })

  } catch (error) {
    logger.error('Error creating subscription:', error, 'API')
    return NextResponse.json(
      { error: 'Error al crear suscripción' },
      { status: 500 }
    )
  }
}