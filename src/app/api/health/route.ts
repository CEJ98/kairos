import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Health check endpoint para monitoreo de la aplicación
 * Verifica el estado de la base de datos y servicios críticos
 */
export async function GET(request: NextRequest) {
	try {
		const startTime = Date.now()
		
		// Verificar conexión a Supabase
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
		const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
		
		if (!supabaseUrl || !supabaseKey) {
			const responseTime = Date.now() - startTime
			return NextResponse.json(
				{
					status: 'degraded',
					message: 'Supabase configuration missing',
					timestamp: new Date().toISOString(),
					responseTime: `${responseTime}ms`,
					version: process.env.npm_package_version || '1.0.0',
					services: {
						database: 'not_configured',
						api: 'operational',
						auth: 'operational'
					},
					environment: process.env.NODE_ENV || 'development'
				},
				{ status: 200 }
			)
		}
		
		const supabase = createClient(supabaseUrl, supabaseKey)
		
		// Test de conexión simple
		const { error: dbError } = await supabase
			.from('users')
			.select('count')
			.limit(1)
			.single()
		
		const responseTime = Date.now() - startTime
		
		if (dbError && !dbError.message.includes('JSON object requested')) {
			return NextResponse.json(
				{
					status: 'error',
					message: 'Database connection failed',
					error: dbError.message,
					timestamp: new Date().toISOString(),
					responseTime: `${responseTime}ms`,
					version: process.env.npm_package_version || '1.0.0'
				},
				{ status: 503 }
			)
		}
		
		return NextResponse.json({
			status: 'healthy',
			message: 'All systems operational',
			timestamp: new Date().toISOString(),
			responseTime: `${responseTime}ms`,
			version: process.env.npm_package_version || '1.0.0',
			services: {
				database: 'connected',
				api: 'operational',
				auth: 'operational'
			},
			environment: process.env.NODE_ENV || 'development'
		})
		
	} catch (error) {
		console.error('Health check failed:', error)
		
		return NextResponse.json(
			{
				status: 'error',
				message: 'Health check failed',
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString(),
				version: process.env.npm_package_version || '1.0.0'
			},
			{ status: 500 }
		)
	}
}

// Permitir OPTIONS para CORS
export async function OPTIONS() {
	return new NextResponse(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type'
		}
	})
}
