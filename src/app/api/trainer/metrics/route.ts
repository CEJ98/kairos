import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { TrainerMetricsService } from '@/lib/trainer-metrics'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const querySchema = z.object({
	limit: z.string().optional().transform(val => val ? parseInt(val) : 10)
})

export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}

		// Verificar que el usuario sea un trainer
		if (session.user.role !== 'TRAINER') {
			return NextResponse.json(
				{ error: 'Acceso denegado. Solo trainers pueden acceder a estas métricas.' },
				{ status: 403 }
			)
		}

		const { searchParams } = new URL(request.url)
		const { limit } = querySchema.parse({
			limit: searchParams.get('limit')
		})

		// Obtener métricas generales del trainer
		const metrics = await TrainerMetricsService.getTrainerMetrics(session.user.id)

		// Obtener métricas de clientes
		const clientMetrics = await TrainerMetricsService.getClientMetrics(session.user.id, limit)

		// Obtener actividad reciente
		const recentActivity = await TrainerMetricsService.getRecentActivity(session.user.id, 10)

		logger.info(`Trainer metrics retrieved for user ${session.user.id}`, 'TrainerMetrics')

		return NextResponse.json({
			metrics,
			clients: clientMetrics,
			recentActivity
		})

	} catch (error) {
		logger.error('Error getting trainer metrics:', error, 'TrainerMetrics')
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}

// Endpoint para obtener métricas de un cliente específico
export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}

		if (session.user.role !== 'TRAINER') {
			return NextResponse.json(
				{ error: 'Acceso denegado' },
				{ status: 403 }
			)
		}

		const body = await request.json()
		const { clientId } = body

		if (!clientId) {
			return NextResponse.json(
				{ error: 'ID del cliente requerido' },
				{ status: 400 }
			)
		}

		// Obtener métricas específicas del cliente
		const clientMetrics = await TrainerMetricsService.getClientMetrics(session.user.id, 1)
		const client = clientMetrics.find(c => c.id === clientId)

		if (!client) {
			return NextResponse.json(
				{ error: 'Cliente no encontrado o no asignado a este trainer' },
				{ status: 404 }
			)
		}

		return NextResponse.json({ client })

	} catch (error) {
		logger.error('Error getting client metrics:', error, 'TrainerMetrics')
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}