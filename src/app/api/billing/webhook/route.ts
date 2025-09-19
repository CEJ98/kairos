import { NextRequest, NextResponse } from 'next/server'
import { stripe, getPlanByPrice } from '@/lib/stripe'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) return NextResponse.json({ error: 'No webhook secret' }, { status: 500 })

  let event: any
  try {
    const buf = await req.text()
    event = stripe.webhooks.constructEvent(buf, sig as string, webhookSecret)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const subscriptionId = session.subscription as string | undefined
        const customerId = session.customer as string | undefined
        const priceId = session?.display_items?.[0]?.price?.id || session?.line_items?.data?.[0]?.price?.id || undefined
        const userId = session.metadata?.userId as string | undefined
        const plan = session.metadata?.plan as string | undefined

        // Fetch full subscription for dates/status
        let subData: any = undefined
        if (subscriptionId) {
          subData = await stripe.subscriptions.retrieve(subscriptionId)
        }

        if (userId) {
          await prisma.subscription.upsert({
            where: { userId },
            create: {
              userId,
              stripeCustomerId: customerId || undefined,
              stripeSubscriptionId: subscriptionId || undefined,
              planType: (plan as any) || (priceId ? getPlanByPrice(priceId) || 'BASIC' : 'BASIC'),
              status: subData?.status?.toUpperCase() || 'ACTIVE',
              currentPeriodStart: subData?.current_period_start ? new Date(subData.current_period_start * 1000) : undefined,
              currentPeriodEnd: subData?.current_period_end ? new Date(subData.current_period_end * 1000) : undefined,
              cancelAtPeriodEnd: !!subData?.cancel_at_period_end,
            },
            update: {
              stripeCustomerId: customerId || undefined,
              stripeSubscriptionId: subscriptionId || undefined,
              planType: (plan as any) || (priceId ? getPlanByPrice(priceId) || 'BASIC' : 'BASIC'),
              status: subData?.status?.toUpperCase() || 'ACTIVE',
              currentPeriodStart: subData?.current_period_start ? new Date(subData.current_period_start * 1000) : undefined,
              currentPeriodEnd: subData?.current_period_end ? new Date(subData.current_period_end * 1000) : undefined,
              cancelAtPeriodEnd: !!subData?.cancel_at_period_end,
            },
          })
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const subscriptionId = sub.id as string
        const customerId = sub.customer as string
        const status = (sub.status as string)?.toUpperCase() || 'ACTIVE'
        const priceId = sub.items?.data?.[0]?.price?.id as string | undefined
        const planType = priceId ? getPlanByPrice(priceId) : null

        // Find by stripeSubscriptionId or customerId
        const existing = await prisma.subscription.findFirst({
          where: {
            OR: [
              { stripeSubscriptionId: subscriptionId },
              { stripeCustomerId: customerId },
            ],
          },
        })
        if (existing) {
          await prisma.subscription.update({
            where: { id: existing.id },
            data: {
              stripeSubscriptionId: subscriptionId,
              stripeCustomerId: customerId,
              status,
              planType: planType || existing.planType,
              currentPeriodStart: sub.current_period_start ? new Date(sub.current_period_start * 1000) : existing.currentPeriodStart,
              currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : existing.currentPeriodEnd,
              cancelAtPeriodEnd: !!sub.cancel_at_period_end,
            },
          })
        }
        break
      }
      default:
        break
    }
  } catch (e) {
    // Log and continue
  }

  return NextResponse.json({ received: true })
}

