import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PRICING_PLANS, stripe } from '@/lib/stripe'
import { parseJson } from '@/lib/api-validation'
import { planTypeSchema } from '@/lib/validations'
import { z } from 'zod'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const parsed = await parseJson(req, z.object({ plan: planTypeSchema }))
    if (!parsed.ok) return parsed.error
    const plan = parsed.data.plan as keyof typeof PRICING_PLANS
    const priceId = (PRICING_PLANS[plan] as any).stripeProductId
    if (!priceId) return NextResponse.json({ error: 'Plan inválido o no configurado' }, { status: 400 })

    // Find or create Stripe customer for this user
    const userId = session.user.id
    const userEmail = session.user.email as string
    const userName = (session.user as any).name || undefined

    let existingSub = await prisma.subscription.findFirst({ where: { userId } })
    let customerId = existingSub?.stripeCustomerId || undefined

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        name: userName,
        metadata: { userId },
      })
      customerId = customer.id

      if (existingSub) {
        await prisma.subscription.update({ where: { id: existingSub.id }, data: { stripeCustomerId: customerId } })
      } else {
        existingSub = await prisma.subscription.create({
          data: {
            userId,
            planType: plan,
            status: 'INACTIVE',
            stripeCustomerId: customerId,
          },
        })
      }
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000'}/checkout/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000'}/dashboard/billing`,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      metadata: { userId, plan },
    })

    return NextResponse.json({ url: checkout.url })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error creando checkout' }, { status: 500 })
  }
}
