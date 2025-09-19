import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Schema de validação para progress metrics
const progressMetricSchema = z.object({
	weight: z.number().positive().optional(),
	bodyFat: z.number().min(0).max(100).optional(),
	muscle: z.number().positive().optional(),
	chest: z.number().positive().optional(),
	waist: z.number().positive().optional(),
	hips: z.number().positive().optional(),
	bicep: z.number().positive().optional(),
	thigh: z.number().positive().optional(),
	notes: z.string().optional(),
	date: z.string().datetime().optional()
})

// GET - Obter métricas de progresso do usuário
export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json(
				{ error: 'Não autorizado' },
				{ status: 401 }
			)
		}

		const { searchParams } = new URL(request.url)
		const limit = parseInt(searchParams.get('limit') || '50')
		const startDate = searchParams.get('startDate')
		const endDate = searchParams.get('endDate')

		// Filtros de data
		const dateFilter: any = {}
		if (startDate) {
			dateFilter.gte = new Date(startDate)
		}
		if (endDate) {
			dateFilter.lte = new Date(endDate)
		}

		// Buscar métricas de progresso
		const progressMetrics = await prisma.progressMetric.findMany({
			where: {
				userId: session.user.id,
				...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
			},
			orderBy: {
				date: 'desc'
			},
			take: limit
		})

		// Calcular estatísticas
		const latest = progressMetrics[0]
		const oldest = progressMetrics[progressMetrics.length - 1]

		const stats = {
			totalEntries: progressMetrics.length,
			latestEntry: latest,
			changes: latest && oldest ? {
				weight: latest.weight && oldest.weight ? 
					{ current: latest.weight, change: latest.weight - oldest.weight } : null,
				bodyFat: latest.bodyFat && oldest.bodyFat ? 
					{ current: latest.bodyFat, change: latest.bodyFat - oldest.bodyFat } : null,
				muscle: latest.muscle && oldest.muscle ? 
					{ current: latest.muscle, change: latest.muscle - oldest.muscle } : null
			} : null
		}

		return NextResponse.json({
			metrics: progressMetrics,
			stats
		})

	} catch (error) {
		console.error('Erro ao buscar métricas de progresso:', error)
		return NextResponse.json(
			{ error: 'Erro interno do servidor' },
			{ status: 500 }
		)
	}
}

// POST - Criar nova métrica de progresso
export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json(
				{ error: 'Não autorizado' },
				{ status: 401 }
			)
		}

		const body = await request.json()
		const validatedData = progressMetricSchema.parse(body)

		// Criar nova métrica
		const progressMetric = await prisma.progressMetric.create({
			data: {
				userId: session.user.id,
				date: validatedData.date ? new Date(validatedData.date) : new Date(),
				weight: validatedData.weight,
				bodyFat: validatedData.bodyFat,
				muscle: validatedData.muscle,
				chest: validatedData.chest,
				waist: validatedData.waist,
				hips: validatedData.hips,
				bicep: validatedData.bicep,
				thigh: validatedData.thigh,
				notes: validatedData.notes
			}
		})

		return NextResponse.json(progressMetric, { status: 201 })

	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Dados inválidos', details: error.errors },
				{ status: 400 }
			)
		}

		console.error('Erro ao criar métrica de progresso:', error)
		return NextResponse.json(
			{ error: 'Erro interno do servidor' },
			{ status: 500 }
		)
	}
}

// PUT - Atualizar métrica de progresso
export async function PUT(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json(
				{ error: 'Não autorizado' },
				{ status: 401 }
			)
		}

		const body = await request.json()
		const { id, ...updateData } = body

		if (!id) {
			return NextResponse.json(
				{ error: 'ID da métrica é obrigatório' },
				{ status: 400 }
			)
		}

		const validatedData = progressMetricSchema.parse(updateData)

		// Verificar se a métrica pertence ao usuário
		const existingMetric = await prisma.progressMetric.findFirst({
			where: {
				id,
				userId: session.user.id
			}
		})

		if (!existingMetric) {
			return NextResponse.json(
				{ error: 'Métrica não encontrada' },
				{ status: 404 }
			)
		}

		// Atualizar métrica
		const updatedMetric = await prisma.progressMetric.update({
			where: { id },
			data: {
				weight: validatedData.weight,
				bodyFat: validatedData.bodyFat,
				muscle: validatedData.muscle,
				chest: validatedData.chest,
				waist: validatedData.waist,
				hips: validatedData.hips,
				bicep: validatedData.bicep,
				thigh: validatedData.thigh,
				notes: validatedData.notes
			}
		})

		return NextResponse.json(updatedMetric)

	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Dados inválidos', details: error.errors },
				{ status: 400 }
			)
		}

		console.error('Erro ao atualizar métrica de progresso:', error)
		return NextResponse.json(
			{ error: 'Erro interno do servidor' },
			{ status: 500 }
		)
	}
}
