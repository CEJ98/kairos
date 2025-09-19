import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { TrainerAssignmentService } from '@/lib/trainer-assignment'
import { logger } from '@/lib/logger'

// GET /api/trainers/search - Buscar entrenadores disponibles
export async function GET(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		// Obtener parámetros de búsqueda
		const { searchParams } = new URL(req.url)
		const specialty = searchParams.get('specialty') || undefined
		const maxRate = searchParams.get('maxRate') ? 
			parseFloat(searchParams.get('maxRate')!) : undefined
		const minExperience = searchParams.get('minExperience') ? 
			parseInt(searchParams.get('minExperience')!) : undefined
		const location = searchParams.get('location') || undefined

		const filters = {
			specialty,
			maxRate,
			minExperience,
			location
		}

		// Buscar entrenadores
		const trainers = await TrainerAssignmentService.searchAvailableTrainers(filters)

		logger.info('Trainers search completed', {
			userId: session.user.id,
			filters,
			resultsCount: trainers.length
		}, 'TRAINER_SEARCH')

		return NextResponse.json({
			trainers,
			count: trainers.length
		})

	} catch (error) {
		logger.error('Error searching trainers:', error, 'API')
		return NextResponse.json(
			{ error: 'Error al buscar entrenadores' },
			{ status: 500 }
		)
	}
}