import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NutritionService } from '@/lib/nutrition-service'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Schema para asignar plan
const assignPlanSchema = z.object({
	assignedToId: z.string().min(1, 'ID del usuario asignado es requerido')
})

// GET /api/nutrition/plans/[id] - Obtener plan específico
export async function GET(
	request: NextRequest,
	{ params }: any
) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}

		const _p = (params && typeof (params as any).then === 'function') ? await params : params
		const plan = await NutritionService.getNutritionPlan(
			_p.id,
			session.user.id
		)

		return NextResponse.json({ plan })
	} catch (error: any) {
		if (error.message === 'Plan de nutrición no encontrado') {
			return NextResponse.json(
				{ error: 'Plan no encontrado' },
				{ status: 404 }
			)
		}

		logger.error('Error en GET /api/nutrition/plans/[id]:', error, 'API')
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}

// PATCH /api/nutrition/plans/[id] - Asignar plan a usuario
export async function PATCH(
	request: NextRequest,
	{ params }: any
) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}

		const body = await request.json()
		const { assignedToId } = assignPlanSchema.parse(body)

		const _p = (params && typeof (params as any).then === 'function') ? await params : params
		const plan = await NutritionService.assignNutritionPlan(
			_p.id,
			assignedToId,
			session.user.id
		)

		return NextResponse.json({ plan })
	} catch (error: any) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Datos inválidos', details: error.errors },
				{ status: 400 }
			)
		}

		if (error.message === 'No tienes permisos para asignar este plan') {
			return NextResponse.json(
				{ error: 'Sin permisos' },
				{ status: 403 }
			)
		}

		logger.error('Error en PATCH /api/nutrition/plans/[id]:', error, 'API')
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}
