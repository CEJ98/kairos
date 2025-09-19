import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NutritionService } from '@/lib/nutrition-service'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Schema de validación para crear plan de nutrición
const createNutritionPlanSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido'),
	description: z.string().optional(),
	isTemplate: z.boolean().optional(),
	dailyCalories: z.number().positive().optional(),
	dailyProtein: z.number().positive().optional(),
	dailyCarbs: z.number().positive().optional(),
	dailyFats: z.number().positive().optional(),
	dailyFiber: z.number().positive().optional(),
	tags: z.array(z.string()).optional(),
	notes: z.string().optional(),
	meals: z.array(z.object({
		name: z.string().min(1),
		type: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
		order: z.number().int().positive(),
		suggestedTime: z.string().optional(),
		targetCalories: z.number().positive().optional(),
		targetProtein: z.number().positive().optional(),
		targetCarbs: z.number().positive().optional(),
		targetFats: z.number().positive().optional(),
		instructions: z.string().optional(),
		notes: z.string().optional(),
		foods: z.array(z.object({
			foodId: z.string(),
			quantity: z.number().positive(),
			unit: z.string(),
			notes: z.string().optional()
		})).optional()
	})).optional()
})

// GET /api/nutrition/plans - Obtener planes de nutrición
export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}

		const { searchParams } = new URL(request.url)
		const includeTemplates = searchParams.get('includeTemplates') === 'true'
		const includeAssigned = searchParams.get('includeAssigned') === 'true'
		const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
		const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined

		const plans = await NutritionService.getNutritionPlans(session.user.id, {
			includeTemplates,
			includeAssigned,
			limit,
			offset
		})

		return NextResponse.json({ plans })
	} catch (error) {
		logger.error('Error en GET /api/nutrition/plans:', error, 'API')
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}

// POST /api/nutrition/plans - Crear plan de nutrición
export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}

		const body = await request.json()
		const validatedData = createNutritionPlanSchema.parse(body)

		const plan = await NutritionService.createNutritionPlan(
			session.user.id,
			validatedData
		)

		return NextResponse.json({ plan }, { status: 201 })
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Datos inválidos', details: error.errors },
				{ status: 400 }
			)
		}

		logger.error('Error en POST /api/nutrition/plans:', error, 'API')
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}