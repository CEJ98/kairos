import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NutritionService } from '@/lib/nutrition-service'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Schema de validación para crear alimento
const createFoodSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido'),
	brand: z.string().optional(),
	description: z.string().optional(),
	category: z.string().optional(),
	subcategory: z.string().optional(),
	caloriesPer100g: z.number().positive('Las calorías deben ser positivas'),
	proteinPer100g: z.number().min(0, 'Las proteínas no pueden ser negativas'),
	carbsPer100g: z.number().min(0, 'Los carbohidratos no pueden ser negativos'),
	fatsPer100g: z.number().min(0, 'Las grasas no pueden ser negativas'),
	fiberPer100g: z.number().min(0).optional(),
	sugarPer100g: z.number().min(0).optional(),
	sodiumPer100g: z.number().min(0).optional(),
	commonUnit: z.string().optional(),
	commonUnitGrams: z.number().positive().optional()
})

// GET /api/nutrition/foods - Buscar alimentos
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
		const query = searchParams.get('q') || ''
		const category = searchParams.get('category') || undefined
		const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
		const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

		if (!query.trim()) {
			return NextResponse.json(
				{ error: 'Parámetro de búsqueda requerido' },
				{ status: 400 }
			)
		}

		const foods = await NutritionService.searchFoods(query, {
			category,
			limit,
			offset
		})

		return NextResponse.json({ foods })
	} catch (error) {
		logger.error('Error en GET /api/nutrition/foods:', error, 'API')
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}

// POST /api/nutrition/foods - Crear alimento
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
		const validatedData = createFoodSchema.parse(body)

		const food = await NutritionService.createFood(validatedData)

		return NextResponse.json({ food }, { status: 201 })
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Datos inválidos', details: error.errors },
				{ status: 400 }
			)
		}

		logger.error('Error en POST /api/nutrition/foods:', error, 'API')
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}