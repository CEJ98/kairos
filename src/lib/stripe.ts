import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const getStripeJs = async () => {
  const { loadStripe } = await import('@stripe/stripe-js')
  return await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
}

// Configuración de planes de precios
export const PRICING_PLANS = {
  FREE: {
    name: 'Gratis',
    price: 0,
    features: [
      '3 rutinas personales',
      'Biblioteca básica de ejercicios',
      'Timer de entrenamiento',
      'Seguimiento básico de progreso'
    ],
    limits: {
      workouts: 3,
      clients: 0,
      storage: '100MB'
    }
  },
  BASIC: {
    name: 'Básico',
    price: 999, // $9.99 USD
    stripeProductId: process.env.STRIPE_PRICE_BASIC_MONTHLY,
    features: [
      'Rutinas ilimitadas',
      'Biblioteca completa de ejercicios',
      'Análisis avanzado de progreso',
      'Planes de nutrición básicos',
      'Soporte por email'
    ],
    limits: {
      workouts: -1, // ilimitado
      clients: 0,
      storage: '1GB'
    }
  },
  PRO: {
    name: 'Pro',
    price: 1999, // $19.99 USD
    stripeProductId: process.env.STRIPE_PRICE_PRO_MONTHLY,
    features: [
      'Todo del plan Básico',
      'Integración con wearables',
      'Planes de nutrición avanzados',
      'Comunidad premium',
      'Soporte prioritario'
    ],
    limits: {
      workouts: -1,
      clients: 0,
      storage: '5GB'
    }
  },
  TRAINER: {
    name: 'Entrenador',
    price: 4999, // $49.99 USD
    stripeProductId: process.env.STRIPE_PRICE_TRAINER_MONTHLY,
    features: [
      'Dashboard profesional de entrenador',
      'Hasta 50 clientes',
      'Rutinas personalizadas por cliente',
      'Sistema de facturación automática',
      'Reportes y analytics avanzados',
      'Video llamadas integradas',
      'White label básico'
    ],
    limits: {
      workouts: -1,
      clients: 50,
      storage: '20GB'
    }
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 9999, // $99.99 USD
    stripeProductId: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
    features: [
      'Todo del plan Entrenador',
      'Clientes ilimitados',
      'API access completo',
      'White label completo',
      'Integraciones personalizadas',
      'Soporte dedicado',
      'SLA garantizado'
    ],
    limits: {
      workouts: -1,
      clients: -1,
      storage: '100GB'
    }
  }
} as const

export type PricingPlan = keyof typeof PRICING_PLANS

export async function createCustomer(email: string, name: string) {
  return await stripe.customers.create({
    email,
    name,
    metadata: {
      source: 'kairos-fitness'
    }
  })
}

export async function createSubscription(
  customerId: string,
  priceId: string,
  trialDays?: number
) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
    trial_period_days: trialDays,
    metadata: {
      source: 'kairos-fitness'
    }
  })

  return subscription
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

export async function updateSubscription(subscriptionId: string, newPriceId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  
  return await stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: newPriceId,
    }],
    proration_behavior: 'create_prorations',
  })
}

export async function cancelSubscription(subscriptionId: string, atPeriodEnd = true) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: atPeriodEnd,
  })
}

export async function resumeSubscription(subscriptionId: string) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })
}

export function getPlanByPrice(priceId: string): PricingPlan | null {
  for (const [planKey, plan] of Object.entries(PRICING_PLANS)) {
    if ((plan as any).stripeProductId === priceId) {
      return planKey as PricingPlan
    }
  }
  return null
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(price / 100)
}