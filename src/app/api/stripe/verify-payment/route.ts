import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'

import { logger } from '@/lib/logger'
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { sessionId, paymentIntent } = await req.json()

    if (!sessionId && !paymentIntent) {
      return NextResponse.json(
        { error: 'Session ID o Payment Intent requerido' },
        { status: 400 }
      )
    }

    let subscriptionData = null

    // Verificar usando session ID (Stripe Checkout)
    if (sessionId) {
      const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription']
      })

      if (checkoutSession.payment_status === 'paid' && checkoutSession.subscription) {
        const subscription = checkoutSession.subscription as any
        subscriptionData = {
          subscriptionId: subscription.id,
          planType: subscription.metadata?.planType || 'BASIC',
          status: subscription.status,
          trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toLocaleDateString() : null,
          nextBilling: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toLocaleDateString() : null
        }
      }
    }

    // Verificar usando payment intent (Elements)
    if (paymentIntent && !subscriptionData) {
      const intent = await stripe.paymentIntents.retrieve(paymentIntent)
      
      if (intent.status === 'succeeded') {
        // Buscar la suscripción asociada
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          include: { subscriptions: true }
        })

        if (user?.subscriptions[0]) {
          const subscription = await stripe.subscriptions.retrieve(
            user.subscriptions[0].stripeSubscriptionId!
          )

          subscriptionData = {
            subscriptionId: subscription.id,
            planType: subscription.metadata?.planType || user.subscriptions[0].planType,
            status: subscription.status,
            trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toLocaleDateString() : null,
            nextBilling: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toLocaleDateString() : null
          }
        }
      }
    }

    if (!subscriptionData) {
      return NextResponse.json(
        { error: 'No se pudo verificar el pago' },
        { status: 400 }
      )
    }

    // Actualizar el estado en la base de datos si es necesario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscriptions: true }
    })

    if (user?.subscriptions[0]) {
      await prisma.subscription.update({
        where: { id: user.subscriptions[0].id },
        data: {
          status: 'ACTIVE',
          planType: subscriptionData.planType as any
        }
      })
    }

    return NextResponse.json(subscriptionData)

  } catch (error) {
    logger.error('Error verifying payment:', error, 'API')
    return NextResponse.json(
      { error: 'Error al verificar el pago' },
      { status: 500 }
    )
  }
}