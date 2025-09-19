import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { logger } from '@/lib/logger'

// Eventos requeridos para el webhook
const REQUIRED_EVENTS = [
	'customer.subscription.created',
	'customer.subscription.updated',
	'customer.subscription.deleted',
	'invoice.payment_succeeded',
	'invoice.payment_failed',
	'checkout.session.completed',
	'customer.subscription.trial_will_end',
	'customer.created',
	'customer.updated'
] as const

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		
		// Solo permitir a administradores crear webhooks
		if (!session?.user || session.user.role !== 'ADMIN') {
			return NextResponse.json(
				{ error: 'No autorizado' }, 
				{ status: 403 }
			)
		}

		const body = await request.json()
		const { url, description } = body

		if (!url) {
			return NextResponse.json(
				{ error: 'URL es requerida' },
				{ status: 400 }
			)
		}

		// Validar que la URL sea HTTPS en producción
		if (process.env.NODE_ENV === 'production' && !url.startsWith('https://')) {
			return NextResponse.json(
				{ error: 'URL debe usar HTTPS en producción' },
				{ status: 400 }
			)
		}

		// Verificar si ya existe un webhook para esta URL
		const existingWebhooks = await stripe.webhookEndpoints.list({
			limit: 10
		})

		const existingWebhook = existingWebhooks.data.find(wh => wh.url === url)
		if (existingWebhook) {
			return NextResponse.json(
				{ 
					error: 'Ya existe un webhook para esta URL',
					webhookId: existingWebhook.id
				},
				{ status: 409 }
			)
		}

		// Crear el webhook
		const webhook = await stripe.webhookEndpoints.create({
			url,
			enabled_events: [...REQUIRED_EVENTS],
			description: description || 'Kairos Fitness - Production Webhook'
		})

		logger.info(`Webhook creado: ${webhook.id} para ${url}`, 'API')

		return NextResponse.json({
			success: true,
			webhook: {
				id: webhook.id,
				url: webhook.url,
				status: webhook.status,
				secret: webhook.secret,
				enabled_events: webhook.enabled_events,
				created: new Date(webhook.created * 1000).toISOString()
			}
		})

	} catch (error: any) {
		logger.error('Error creando webhook:', error, 'API')
		
		if (error.type === 'StripeInvalidRequestError') {
			return NextResponse.json(
				{ error: `Error de Stripe: ${error.message}` },
				{ status: 400 }
			)
		}

		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}

// Endpoint para actualizar webhook existente
export async function PUT(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		
		if (!session?.user || session.user.role !== 'ADMIN') {
			return NextResponse.json(
				{ error: 'No autorizado' }, 
				{ status: 403 }
			)
		}

		const body = await request.json()
		const { webhookId, enabled_events } = body

		if (!webhookId) {
			return NextResponse.json(
				{ error: 'webhookId es requerido' },
				{ status: 400 }
			)
		}

		// Actualizar el webhook
		const webhook = await stripe.webhookEndpoints.update(webhookId, {
			enabled_events: enabled_events || [...REQUIRED_EVENTS]
		})

		logger.info(`Webhook actualizado: ${webhook.id}`, 'API')

		return NextResponse.json({
			success: true,
			webhook: {
				id: webhook.id,
				url: webhook.url,
				status: webhook.status,
				enabled_events: webhook.enabled_events
			}
		})

	} catch (error: any) {
		logger.error('Error actualizando webhook:', error, 'API')
		
		if (error.type === 'StripeInvalidRequestError') {
			return NextResponse.json(
				{ error: `Error de Stripe: ${error.message}` },
				{ status: 400 }
			)
		}

		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
			)
	}
}