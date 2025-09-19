import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Solo permitir a administradores acceder a esta información
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Verificar configuración de webhooks
    const webhookEndpoints = await stripe.webhookEndpoints.list({
      limit: 10
    })

    const currentUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const expectedWebhookUrl = `${currentUrl}/api/stripe/webhooks`

    const webhookStatus = {
      configured: false,
      url: expectedWebhookUrl,
      activeWebhooks: webhookEndpoints.data.map(webhook => ({
        id: webhook.id,
        url: webhook.url,
        status: webhook.status,
        enabled_events: webhook.enabled_events.length,
        created: new Date(webhook.created * 1000).toISOString()
      })),
      requiredEvents: [
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
        'checkout.session.completed',
        'customer.subscription.trial_will_end',
        'customer.created',
        'customer.updated'
      ],
      environment: process.env.NODE_ENV || 'development',
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET
    }

    // Verificar si hay un webhook configurado para nuestra URL
    const matchingWebhook = webhookEndpoints.data.find(webhook => 
      webhook.url === expectedWebhookUrl && webhook.status === 'enabled'
    )

    if (matchingWebhook) {
      webhookStatus.configured = true
      
      // Verificar que tenga los eventos requeridos
      const missingEvents = webhookStatus.requiredEvents.filter(event =>
        !matchingWebhook.enabled_events.includes(event)
      )

      return NextResponse.json({
        ...webhookStatus,
        matchingWebhook: {
          id: matchingWebhook.id,
          enabled_events: matchingWebhook.enabled_events,
          missing_events: missingEvents,
          all_events_configured: missingEvents.length === 0
        }
      })
    }

    return NextResponse.json(webhookStatus)

  } catch (error) {
    logger.error('Error checking webhook status:', error)
    return NextResponse.json(
      { error: 'Error al verificar estado de webhooks' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const currentUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const webhookUrl = `${currentUrl}/api/stripe/webhooks`

    // Crear un nuevo webhook endpoint
    const webhook = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: [
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
        'checkout.session.completed',
        'customer.subscription.trial_will_end',
        'customer.created',
        'customer.updated'
      ],
      description: `Kairos Fitness Webhook - ${process.env.NODE_ENV || 'development'}`
    })

    logger.info(`Created webhook endpoint: ${webhook.id}`)

    return NextResponse.json({
      success: true,
      webhook: {
        id: webhook.id,
        url: webhook.url,
        secret: webhook.secret,
        enabled_events: webhook.enabled_events,
        message: 'Webhook creado exitosamente. Asegúrate de guardar el secreto en las variables de entorno.'
      }
    })

  } catch (error: any) {
    logger.error('Error creating webhook:', error)
    return NextResponse.json(
      { 
        error: 'Error al crear webhook',
        details: error.message 
      },
      { status: 500 }
    )
  }
}