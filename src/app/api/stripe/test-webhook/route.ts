import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		
		if (!session?.user || session.user.role !== 'ADMIN') {
			return NextResponse.json(
				{ error: 'No autorizado' }, 
				{ status: 403 }
			)
		}

		// Verificar configuración de Stripe
		if (!process.env.STRIPE_SECRET_KEY) {
			return NextResponse.json(
				{ error: 'STRIPE_SECRET_KEY no configurada' },
				{ status: 500 }
			)
		}

		if (!process.env.STRIPE_WEBHOOK_SECRET) {
			return NextResponse.json(
				{ error: 'STRIPE_WEBHOOK_SECRET no configurada' },
				{ status: 500 }
			)
		}

		// Obtener webhooks configurados
		const webhooks = await stripe.webhookEndpoints.list({ limit: 10 })
		
		if (webhooks.data.length === 0) {
			return NextResponse.json(
				{ error: 'No hay webhooks configurados' },
				{ status: 400 }
			)
		}

		// Buscar webhook para nuestra aplicación
		const currentUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
		const expectedWebhookUrl = `${currentUrl}/api/stripe/webhooks`
		
		const ourWebhook = webhooks.data.find(wh => wh.url === expectedWebhookUrl)
		
		if (!ourWebhook) {
			return NextResponse.json(
				{ 
					error: 'Webhook no encontrado para esta aplicación',
					expectedUrl: expectedWebhookUrl,
					availableWebhooks: webhooks.data.map(wh => wh.url)
				},
				{ status: 400 }
			)
		}

		// Crear un evento de prueba
		try {
			// Crear un customer de prueba
			const testCustomer = await stripe.customers.create({
				email: 'test@kairos.com',
				name: 'Test Customer',
				metadata: {
					test: 'true',
					createdBy: 'webhook-test'
				}
			})

			logger.info(`Test customer created: ${testCustomer.id}`, 'API')

			// El evento customer.created se enviará automáticamente al webhook
			// Esperar un momento para que se procese
			await new Promise(resolve => setTimeout(resolve, 2000))

			// Limpiar - eliminar el customer de prueba
			await stripe.customers.del(testCustomer.id)
			
			logger.info(`Test customer deleted: ${testCustomer.id}`, 'API')

			return NextResponse.json({
				success: true,
				message: 'Webhook probado exitosamente',
				webhook: {
					id: ourWebhook.id,
					url: ourWebhook.url,
					status: ourWebhook.status
				},
				testEvent: {
					type: 'customer.created',
					customerId: testCustomer.id
				}
			})

		} catch (stripeError: any) {
			logger.error('Error creating test event:', stripeError, 'API')
			
			return NextResponse.json(
				{ 
					error: 'Error creando evento de prueba',
					details: stripeError.message
				},
				{ status: 500 }
			)
		}

	} catch (error: any) {
		logger.error('Error testing webhook:', error, 'API')
		
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}

// Endpoint para obtener el estado de webhooks
export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		
		if (!session?.user || session.user.role !== 'ADMIN') {
			return NextResponse.json(
				{ error: 'No autorizado' }, 
				{ status: 403 }
			)
		}

		if (!process.env.STRIPE_SECRET_KEY) {
			return NextResponse.json(
				{ error: 'STRIPE_SECRET_KEY no configurada' },
				{ status: 500 }
			)
		}

		// Obtener webhooks y eventos recientes
		const [webhooks, events] = await Promise.all([
			stripe.webhookEndpoints.list({ limit: 10 }),
			stripe.events.list({ 
				limit: 10,
				type: 'customer.*'
			})
		])

		const currentUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
		const expectedWebhookUrl = `${currentUrl}/api/stripe/webhooks`
		
		const ourWebhook = webhooks.data.find(wh => wh.url === expectedWebhookUrl)

		return NextResponse.json({
			webhooks: webhooks.data.map(wh => ({
				id: wh.id,
				url: wh.url,
				status: wh.status,
				enabled_events: wh.enabled_events.length,
				created: new Date(wh.created * 1000).toISOString(),
				isOurs: wh.url === expectedWebhookUrl
			})),
			recentEvents: events.data.map(event => ({
				id: event.id,
				type: event.type,
				created: new Date(event.created * 1000).toISOString(),
				processed: event.request?.id ? true : false
			})),
			configuration: {
				hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
				expectedUrl: expectedWebhookUrl,
				webhookConfigured: !!ourWebhook,
				environment: process.env.NODE_ENV || 'development'
			}
		})

	} catch (error: any) {
		logger.error('Error getting webhook status:', error, 'API')
		
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}