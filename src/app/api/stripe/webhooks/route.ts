import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe, getPlanByPrice } from '@/lib/stripe'
import { prisma } from '@/lib/db'

import { logger } from '@/lib/logger'
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    logger.error('Webhook signature verification failed:', err.message, 'API')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCancellation(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handleSuccessfulPayment(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleFailedPayment(invoice)
        break
      }

      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer
        logger.debug('New customer created: ${customer.id}', 'API')
        break
      }

      default:
        logger.debug('Unhandled event type: ${event.type}', 'API')
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('Error processing webhook:', error, 'API')
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const subscriptionId = subscription.id
  const status = subscription.status
  const currentPeriodStart = new Date(subscription.current_period_start * 1000)
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000)
  
  // Obtener el precio y el plan asociado
  const priceId = subscription.items.data[0]?.price.id
  const planType = getPlanByPrice(priceId) || 'FREE'

  // Buscar el usuario asociado con este customer de Stripe
  const user = await prisma.user.findFirst({
    where: {
      subscriptions: {
        some: {
          stripeCustomerId: customerId
        }
      }
    },
    include: {
      subscriptions: true
    }
  })

  if (!user) {
    logger.error('User not found for Stripe customer: ${customerId}', 'API')
    return
  }

  // Actualizar o crear la suscripción
  await prisma.subscription.upsert({
    where: {
      stripeSubscriptionId: subscriptionId
    },
    update: {
      status: mapStripeStatusToPrisma(status),
      planType: planType as any,
      currentPeriodStart,
      currentPeriodEnd,
      stripePriceId: priceId,
    },
    create: {
      userId: user.id,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      planType: planType as any,
      status: mapStripeStatusToPrisma(status),
      currentPeriodStart,
      currentPeriodEnd,
    }
  })

  // Si es entrenador y tiene plan TRAINER/ENTERPRISE, crear perfil de entrenador
  if ((planType === 'TRAINER' || planType === 'ENTERPRISE') && user.role === 'CLIENT') {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'TRAINER' }
    })

    // Crear perfil de entrenador si no existe
    await prisma.trainerProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        isActive: true,
        maxClients: planType === 'TRAINER' ? 50 : -1, // -1 = ilimitado
      }
    })
  }

  logger.debug('Subscription ${subscriptionId} updated for user ${user.id}', 'API')
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id

  await prisma.subscription.update({
    where: {
      stripeSubscriptionId: subscriptionId
    },
    data: {
      status: 'CANCELED',
      currentPeriodEnd: new Date(), // Termina inmediatamente
    }
  })

  logger.debug('Subscription ${subscriptionId} cancelled', 'API')
}

async function handleSuccessfulPayment(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  const subscriptionId = invoice.subscription as string

  // Actualizar estado de la suscripción si estaba en estado problema
  if (subscriptionId) {
    await prisma.subscription.update({
      where: {
        stripeSubscriptionId: subscriptionId
      },
      data: {
        status: 'ACTIVE'
      }
    })
  }

  logger.debug('Payment succeeded for customer ${customerId}', 'API')
}

async function handleFailedPayment(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  const subscriptionId = invoice.subscription as string

  if (subscriptionId) {
    await prisma.subscription.update({
      where: {
        stripeSubscriptionId: subscriptionId
      },
      data: {
        status: 'PAST_DUE'
      }
    })
  }

  logger.debug('Payment failed for customer ${customerId}', 'API')
}

function mapStripeStatusToPrisma(stripeStatus: string) {
  const statusMap: Record<string, string> = {
    'incomplete': 'INCOMPLETE',
    'incomplete_expired': 'INCOMPLETE_EXPIRED',
    'trialing': 'TRIALING',
    'active': 'ACTIVE',
    'past_due': 'PAST_DUE',
    'canceled': 'CANCELED',
    'unpaid': 'UNPAID',
  }

  return statusMap[stripeStatus] || 'INCOMPLETE'
}