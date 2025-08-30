/**
 * Mock handlers for Stripe endpoints
 */

import { http, HttpResponse } from 'msw'

export const stripeHandlers = [
  // Create subscription
  http.post('/api/stripe/create-subscription', async ({ request }) => {
    const body = await request.json() as any
    
    return HttpResponse.json({
      clientSecret: 'pi_test_client_secret_123',
      subscriptionId: 'sub_test_123',
      customerId: 'cus_test_123',
    })
  }),

  // Stripe portal
  http.post('/api/stripe/portal', async ({ request }) => {
    return HttpResponse.json({
      url: 'https://billing.stripe.com/session/test_123',
    })
  }),

  // Verify payment
  http.post('/api/stripe/verify-payment', async ({ request }) => {
    const body = await request.json() as any
    
    if (body.paymentIntentId === 'pi_fail') {
      return HttpResponse.json(
        { error: 'Payment failed' },
        { status: 400 }
      )
    }
    
    return HttpResponse.json({
      success: true,
      subscription: {
        id: 'sub_test_123',
        status: 'active',
        currentPeriodEnd: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
      },
    })
  }),

  // Webhook endpoint
  http.post('/api/stripe/webhooks', async ({ request }) => {
    const signature = request.headers.get('stripe-signature')
    
    if (!signature) {
      return HttpResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }
    
    // Mock webhook processing
    return HttpResponse.json({ received: true })
  }),
]