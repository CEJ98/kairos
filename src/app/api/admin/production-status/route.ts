import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		
		// Solo permitir a administradores
		if (!session?.user || session.user.role !== 'ADMIN') {
			return NextResponse.json(
				{ error: 'No autorizado' }, 
				{ status: 403 }
			)
		}

		// Verificar variables de entorno críticas
		const environmentVariables = {
			STRIPE_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
			STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
			STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
			NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
			DATABASE_URL: !!process.env.DATABASE_URL,
			NEXT_PUBLIC_SITE_URL: !!process.env.NEXT_PUBLIC_SITE_URL
		}

		// Calcular estados generales
		const stripeConfigured = environmentVariables.STRIPE_PUBLISHABLE_KEY && 
								 environmentVariables.STRIPE_SECRET_KEY
		
		const webhooksConfigured = environmentVariables.STRIPE_WEBHOOK_SECRET
		
		const databaseConfigured = environmentVariables.DATABASE_URL
		
		const authConfigured = environmentVariables.NEXTAUTH_SECRET

		// Verificar conectividad de base de datos
		let databaseConnected = false
		try {
			// Importar dinámicamente para evitar errores si no está configurado
			const { PrismaClient } = await import('@prisma/client')
			const prisma = new PrismaClient()
			await prisma.$connect()
			await prisma.$disconnect()
			databaseConnected = true
		} catch (error) {
			logger.warn('Database connection test failed:', error)
			databaseConnected = false
		}

		// Verificar conectividad con Stripe
		let stripeConnected = false
		try {
			if (process.env.STRIPE_SECRET_KEY) {
				const { stripe } = await import('@/lib/stripe')
				await stripe.accounts.retrieve()
				stripeConnected = true
			}
		} catch (error) {
			logger.warn('Stripe connection test failed:', error)
			stripeConnected = false
		}

		const config = {
			stripeConfigured,
			webhooksConfigured,
			databaseConfigured,
			authConfigured,
			environmentVariables,
			connectivity: {
				database: databaseConnected,
				stripe: stripeConnected
			},
			environment: process.env.NODE_ENV || 'development',
			siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'No configurado',
			timestamp: new Date().toISOString()
		}

		logger.info('Production status checked', 'API')

		return NextResponse.json(config)

	} catch (error: any) {
		logger.error('Error checking production status:', error, 'API')
		
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}