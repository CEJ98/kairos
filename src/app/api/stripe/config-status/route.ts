import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
	try {
		// Verificar autenticación y permisos de admin
		const session = await getServerSession(authOptions)
		if (!session?.user || session.user.role !== 'ADMIN') {
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			)
		}

		// Verificar variables de entorno de Stripe
		const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
		const secretKey = process.env.STRIPE_SECRET_KEY
		const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

		// Determinar el entorno basado en las claves
		const isProduction = publishableKey?.startsWith('pk_live_') && secretKey?.startsWith('sk_live_')
		const isDevelopment = publishableKey?.startsWith('pk_test_') && secretKey?.startsWith('sk_test_')

		// Verificar si las claves son válidas (no placeholders)
		const hasValidPublishableKey = publishableKey && 
			!publishableKey.includes('your_') && 
			!publishableKey.includes('pk_test_placeholder')
		
		const hasValidSecretKey = secretKey && 
			!secretKey.includes('your_') && 
			!secretKey.includes('sk_test_placeholder')

		const hasValidWebhookSecret = webhookSecret && 
			!webhookSecret.includes('your_') && 
			!webhookSecret.includes('whsec_placeholder')

		const keysValid = hasValidPublishableKey && hasValidSecretKey

		// Información adicional sobre las claves
		const keyInfo = {
			publishableKey: {
				exists: !!publishableKey,
				valid: !!hasValidPublishableKey,
				type: publishableKey?.startsWith('pk_live_') ? 'live' : 
					  publishableKey?.startsWith('pk_test_') ? 'test' : 'unknown',
				preview: publishableKey ? `${publishableKey.substring(0, 12)}...` : null
			},
			secretKey: {
				exists: !!secretKey,
				valid: !!hasValidSecretKey,
				type: secretKey?.startsWith('sk_live_') ? 'live' : 
					  secretKey?.startsWith('sk_test_') ? 'test' : 'unknown'
			},
			webhookSecret: {
				exists: !!webhookSecret,
				valid: !!hasValidWebhookSecret
			}
		}

		return NextResponse.json({
			hasPublishableKey: !!hasValidPublishableKey,
			hasSecretKey: !!hasValidSecretKey,
			hasWebhookSecret: !!hasValidWebhookSecret,
			environment: isProduction ? 'production' : isDevelopment ? 'development' : 'unknown',
			keysValid,
			keyInfo,
			recommendations: {
				needsProductionKeys: !isProduction && keysValid,
				needsWebhookSecret: keysValid && !hasValidWebhookSecret,
				needsValidKeys: !keysValid
			}
		})

	} catch (error) {
		console.error('Error checking Stripe config status:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}