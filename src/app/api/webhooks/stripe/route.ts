import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')!

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    logger.info(`Stripe webhook received: ${event.type}`)
  } catch (err: any) {
    logger.error('Stripe webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer)
        break

      case 'customer.updated':
        await handleCustomerUpdated(event.data.object as Stripe.Customer)
        break

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'setup_intent.succeeded':
        await handleSetupIntentSucceeded(event.data.object as Stripe.SetupIntent)
        break

      default:
        logger.info(`Unhandled Stripe event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('Error processing Stripe webhook:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// Webhook handlers
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const customer = await stripe.customers.retrieve(customerId)
  
  if (customer.deleted) return

  const userId = customer.metadata?.userId
  if (!userId) {
    logger.warn(`No userId found in customer metadata: ${customerId}`)
    return
  }

  // Update or create subscription in database
  await prisma.subscription.upsert({
    where: {
      stripeSubscriptionId: subscription.id
    },
    update: {
      status: subscription.status.toUpperCase(),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date()
    },
    create: {
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id,
      planType: mapStripePriceToPlanType(subscription.items.data[0]?.price.id),
      status: subscription.status.toUpperCase(),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    }
  })

  logger.info(`Subscription created for user ${userId}:`, {
    subscriptionId: subscription.id,
    status: subscription.status,
    planType: mapStripePriceToPlanType(subscription.items.data[0]?.price.id)
  })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: subscription.id
    },
    data: {
      status: subscription.status.toUpperCase(),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      stripePriceId: subscription.items.data[0]?.price.id,
      planType: mapStripePriceToPlanType(subscription.items.data[0]?.price.id),
      updatedAt: new Date()
    }
  })

  logger.info(`Subscription updated: ${subscription.id}`, {
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: subscription.id
    },
    data: {
      status: 'CANCELED',
      updatedAt: new Date()
    }
  })

  logger.info(`Subscription deleted: ${subscription.id}`)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string
  if (!subscriptionId) return

  // Update subscription status if needed
  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: subscriptionId
    },
    data: {
      status: 'ACTIVE',
      updatedAt: new Date()
    }
  })

  // Get user for notification
  const subscription = await prisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: subscriptionId
    },
    include: {
      user: true
    }
  })

  if (subscription?.user) {
    logger.info(`Payment succeeded for user ${subscription.user.email}:`, {
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      subscriptionId
    })

    // Here you could send a notification or email
    // await sendPaymentSuccessNotification(subscription.user, invoice)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string
  if (!subscriptionId) return

  // Get user for notification
  const subscription = await prisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: subscriptionId
    },
    include: {
      user: true
    }
  })

  if (subscription?.user) {
    logger.warn(`Payment failed for user ${subscription.user.email}:`, {
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      subscriptionId,
      nextPaymentAttempt: invoice.next_payment_attempt
    })

    // Here you could send a payment failure notification
    // await sendPaymentFailedNotification(subscription.user, invoice)
  }
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  logger.info(`Customer created: ${customer.id}`, {
    email: customer.email,
    name: customer.name
  })
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  const userId = customer.metadata?.userId
  if (userId && customer.email) {
    // Update user email if changed
    await prisma.user.updateMany({
      where: {
        id: userId
      },
      data: {
        email: customer.email,
        updatedAt: new Date()
      }
    })
  }

  logger.info(`Customer updated: ${customer.id}`)
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string
  
  logger.info(`Checkout session completed:`, {
    sessionId: session.id,
    customerId,
    subscriptionId,
    mode: session.mode,
    paymentStatus: session.payment_status
  })

  // If this was a subscription checkout, the subscription.created event will handle the DB update
  // If this was a one-time payment, handle it here
  if (session.mode === 'payment') {
    // Handle one-time payment logic here
    logger.info(`One-time payment completed: ${session.amount_total! / 100} ${session.currency}`)
  }
}

async function handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent) {
  const customerId = setupIntent.customer as string
  
  logger.info(`Setup intent succeeded for customer: ${customerId}`, {
    paymentMethod: setupIntent.payment_method,
    usage: setupIntent.usage
  })

  // Update user's payment method status if needed
  const customer = await stripe.customers.retrieve(customerId)
  if (!customer.deleted && customer.metadata?.userId) {
    // Mark user as having a valid payment method
    await prisma.user.updateMany({
      where: {
        id: customer.metadata.userId
      },
      data: {
        updatedAt: new Date()
      }
    })
  }
}

// Utility function to map Stripe price IDs to plan types
function mapStripePriceToPlanType(stripePriceId?: string): string {
  const priceMapping: Record<string, string> = {
    // Add your actual Stripe price IDs here
    [process.env.STRIPE_PRICE_BASIC || '']: 'BASIC',
    [process.env.STRIPE_PRICE_PRO || '']: 'PRO',
    [process.env.STRIPE_PRICE_TRAINER || '']: 'TRAINER',
    [process.env.STRIPE_PRICE_ENTERPRISE || '']: 'ENTERPRISE',
  }

  return priceMapping[stripePriceId || ''] || 'FREE'
}

// Export for API route
export const config = {
  api: {
    bodyParser: false,
  },
}