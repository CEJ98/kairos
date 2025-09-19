import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe, getPlanByPrice } from '@/lib/stripe'
import { prisma } from '@/lib/db'

import { logger } from '@/lib/logger'
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Helper functions
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
	const customerId = subscription.customer as string
	const subscriptionId = subscription.id
	const priceId = subscription.items.data[0]?.price.id

	if (!customerId || !priceId) return

	// Obtener información del plan
	const plan = getPlanByPrice(priceId)
	if (!plan) {
		logger.error(`Plan not found for price ID: ${priceId}`, 'API')
		return
	}

	// Buscar el usuario por suscripciones con customer ID
	const user = await prisma.user.findFirst({
		where: {
			subscriptions: {
				some: {
					stripeCustomerId: customerId
				}
			}
		}
	})

	if (!user) {
		logger.error(`User not found for customer ID: ${customerId}`, 'API')
		return
	}

	// Actualizar o crear suscripción
	await prisma.subscription.upsert({
		where: {
			stripeSubscriptionId: subscriptionId
		},
		update: {
			status: mapStripeStatusToPrisma(subscription.status),
			planType: plan,
			stripePriceId: priceId,
			currentPeriodStart: new Date(subscription.current_period_start * 1000),
			currentPeriodEnd: new Date(subscription.current_period_end * 1000),
			cancelAtPeriodEnd: subscription.cancel_at_period_end
		},
		create: {
			userId: user.id,
			stripeSubscriptionId: subscriptionId,
			stripeCustomerId: customerId,
			status: mapStripeStatusToPrisma(subscription.status),
			planType: plan,
			stripePriceId: priceId,
			currentPeriodStart: new Date(subscription.current_period_start * 1000),
			currentPeriodEnd: new Date(subscription.current_period_end * 1000),
			cancelAtPeriodEnd: subscription.cancel_at_period_end
		}
	})

	// Actualizar el rol del usuario si es necesario
	if (plan === 'TRAINER' && user.role !== 'TRAINER') {
		await prisma.user.update({
			where: { id: user.id },
			data: { role: 'TRAINER' }
		})
	}

	logger.info(`Subscription updated for user ${user.id}: ${plan}`, 'API')
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
	const subscriptionId = subscription.id

	await prisma.subscription.update({
		where: {
			stripeSubscriptionId: subscriptionId
		},
		data: {
			status: 'CANCELED'
		}
	})

	logger.info(`Subscription canceled: ${subscriptionId}`, 'API')
}

async function handleSuccessfulPayment(invoice: Stripe.Invoice) {
	const subscriptionId = invoice.subscription as string

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

	logger.info(`Payment successful for subscription: ${subscriptionId}`, 'API')
}

async function handleFailedPayment(invoice: Stripe.Invoice) {
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

	logger.error(`Payment failed for subscription: ${subscriptionId}`, 'API')
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
	const customerId = session.customer as string
	const subscriptionId = session.subscription as string

	if (!customerId) return

	// Buscar el usuario por email si existe
	if (session.customer_details?.email) {
		const user = await prisma.user.findUnique({
			where: { email: session.customer_details.email }
		})

		if (user && subscriptionId) {
			// Actualizar la suscripción con el customer ID de Stripe
			await prisma.subscription.updateMany({
				where: {
					userId: user.id,
					stripeSubscriptionId: subscriptionId
				},
				data: {
					stripeCustomerId: customerId
				}
			})
		}
	}

	logger.info(`Checkout completed for customer ${customerId}`, 'API')
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
	const customerId = subscription.customer as string
	
	// Encontrar el usuario
	const user = await prisma.user.findFirst({
		where: {
			subscriptions: {
				some: {
					stripeCustomerId: customerId
				}
			}
		}
	})

	if (!user) {
		logger.error(`User not found for trial ending notification: ${customerId}`, 'API')
		return
	}

	// Aquí puedes agregar lógica para enviar notificaciones
	// Por ejemplo, enviar un email recordando que el trial termina pronto
	
	logger.info(`Trial will end for user ${user.id}`, 'API')

	// Opcional: Crear una notificación en la base de datos
	try {
		await prisma.notification.create({
			data: {
				userId: user.id,
				title: 'Trial Ending Soon',
				message: 'Your trial period will end soon. Please update your subscription to continue using our services.',
				type: 'subscription',
				priority: 'high'
			}
		})
	} catch (error) {
		logger.error('Failed to create trial ending notification:', error, 'API')
	}
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
	// Actualizar información del cliente si es necesario
	const user = await prisma.user.findFirst({
		where: {
			subscriptions: {
				some: {
					stripeCustomerId: customer.id
				}
			}
		}
	})

	if (user && customer.email && customer.email !== user.email) {
		// Actualizar email si cambió
		await prisma.user.update({
			where: { id: user.id },
			data: { email: customer.email }
		})
		logger.info(`Updated email for user ${user.id}`, 'API')
	}
}

function mapStripeStatusToPrisma(stripeStatus: string) {
	switch (stripeStatus) {
		case 'active':
			return 'ACTIVE'
		case 'canceled':
			return 'CANCELED'
		case 'incomplete':
			return 'INCOMPLETE'
		case 'incomplete_expired':
			return 'INCOMPLETE_EXPIRED'
		case 'past_due':
			return 'PAST_DUE'
		case 'trialing':
			return 'TRIALING'
		case 'unpaid':
			return 'UNPAID'
		default:
			return 'INACTIVE'
	}
}

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
        logger.info(`New customer created: ${customer.id}`, 'API')
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription
        await handleTrialWillEnd(subscription)
        break
      }

      case 'customer.updated': {
        const customer = event.data.object as Stripe.Customer
        await handleCustomerUpdated(customer)
        break
      }

      default:
        logger.info(`Unhandled event type: ${event.type}`, 'API')
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