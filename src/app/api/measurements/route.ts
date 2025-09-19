import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/measurements - Obtener mediciones del usuario
export async function GET(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		const { searchParams } = new URL(req.url)
		const limit = parseInt(searchParams.get('limit') || '50')
		const startDate = searchParams.get('startDate')
		const endDate = searchParams.get('endDate')
		const metric = searchParams.get('metric') // weight, bodyFat, muscle, etc.

		// Construir filtros
		const where: any = {
			userId: session.user.id
		}

		if (startDate || endDate) {
			where.measuredAt = {}
			if (startDate) where.measuredAt.gte = new Date(startDate)
			if (endDate) where.measuredAt.lte = new Date(endDate)
		}

		// Obtener mediciones
		const measurements = await prisma.bodyMeasurement.findMany({
			where,
			orderBy: {
				measuredAt: 'desc'
			},
			take: limit
		})

		// Si se solicita una métrica específica, filtrar datos
		let processedData: any = measurements
		if (metric) {
			processedData = measurements.map(m => ({
				id: m.id,
				measuredAt: m.measuredAt,
				value: (m as any)[metric],
				notes: m.notes
			})).filter(m => m.value !== null)
		}

		// Estadísticas básicas
		const stats: any = {
			total: measurements.length,
			latest: measurements[0] || null,
			oldest: measurements[measurements.length - 1] || null
		}

		// Calcular tendencias si hay suficientes datos
		if (measurements.length >= 2 && metric) {
			const values = processedData.map((m: any) => m.value).filter((v: any) => v !== null)
			if (values.length >= 2) {
				const first = values[values.length - 1]
				const last = values[0]
				const changeValue = last - first
				const percentChangeValue = (changeValue / first) * 100

				stats.trend = {
					change: changeValue,
					percentChange: percentChangeValue,
					direction: changeValue > 0 ? 'up' : changeValue < 0 ? 'down' : 'stable'
				}
			}
		}

		return NextResponse.json({
			measurements: processedData,
			stats
		})

	} catch (error) {
		console.error('Error fetching measurements:', error)
		return NextResponse.json(
			{ error: 'Error al obtener mediciones' },
			{ status: 500 }
		)
	}
}

// POST /api/measurements - Crear nueva medición
export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		const body = await req.json()
		const {
			weight,
			bodyFat,
			muscle,
			chest,
			waist,
			hips,
			arms,
			thighs,
			measuredAt,
			notes
		} = body

		// Validar que al menos una medición esté presente
		if (!weight && !bodyFat && !muscle && !chest && !waist && !hips && !arms && !thighs) {
			return NextResponse.json(
				{ error: 'Debe proporcionar al menos una medición' },
				{ status: 400 }
			)
		}

		// Crear nueva medición
		const measurement = await prisma.bodyMeasurement.create({
			data: {
				userId: session.user.id,
				weight: weight ? parseFloat(weight) : null,
				bodyFat: bodyFat ? parseFloat(bodyFat) : null,
				muscle: muscle ? parseFloat(muscle) : null,
				chest: chest ? parseFloat(chest) : null,
				waist: waist ? parseFloat(waist) : null,
				hips: hips ? parseFloat(hips) : null,
				arms: arms ? parseFloat(arms) : null,
				thighs: thighs ? parseFloat(thighs) : null,
				measuredAt: measuredAt ? new Date(measuredAt) : new Date(),
				notes: notes || null
			}
		})

		return NextResponse.json(measurement, { status: 201 })

	} catch (error) {
		console.error('Error creating measurement:', error)
		return NextResponse.json(
			{ error: 'Error al crear medición' },
			{ status: 500 }
		)
	}
}