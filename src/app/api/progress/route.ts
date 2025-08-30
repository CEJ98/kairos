import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

import { logger } from '@/lib/logger'
// GET /api/progress - Obtener progreso del usuario
export async function GET(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		const { searchParams } = new URL(req.url)
		const timeframe = searchParams.get('timeframe') || '30' // días
		const type = searchParams.get('type') // 'workouts', 'measurements', 'records'

		const startDate = new Date()
		startDate.setDate(startDate.getDate() - parseInt(timeframe))

		const progressData: any = {}

		// Estadísticas de entrenamientos
		if (!type || type === 'workouts') {
			const workoutStats = await prisma.workoutSession.aggregate({
				where: {
					userId: session.user.id,
					startTime: {
						gte: startDate
					},
					status: 'COMPLETED'
				},
				_count: {
					id: true
				},
				_sum: {
					duration: true,
					caloriesBurned: true
				},
				_avg: {
					rating: true,
					duration: true
				}
			})

			// Entrenamientos por día
			const dailyWorkouts = await prisma.$queryRaw`
				SELECT 
					DATE("startTime") as date,
					COUNT(*) as count,
					SUM(duration) as total_duration,
					SUM("caloriesBurned") as total_calories
				FROM workout_sessions 
				WHERE "userId" = ${session.user.id}
					AND "startTime" >= ${startDate}
					AND status = 'COMPLETED'
				GROUP BY DATE("startTime")
				ORDER BY date ASC
			`

			// Categorías más entrenadas
			const categoryStats = await prisma.$queryRaw`
				SELECT 
					w.category,
					COUNT(*) as count,
					AVG(ws.rating) as avg_rating
				FROM workout_sessions ws
				JOIN workouts w ON ws."workoutId" = w.id
				WHERE ws."userId" = ${session.user.id}
					AND ws."startTime" >= ${startDate}
					AND ws.status = 'COMPLETED'
				GROUP BY w.category
				ORDER BY count DESC
			`

			progressData.workouts = {
				stats: workoutStats,
				daily: dailyWorkouts,
				categories: categoryStats
			}
		}

		// Mediciones corporales
		if (!type || type === 'measurements') {
			const measurements = await prisma.bodyMeasurement.findMany({
				where: {
					userId: session.user.id,
					measuredAt: {
						gte: startDate
					}
				},
				orderBy: {
					measuredAt: 'asc'
				}
			})

			// Última medición
			const latestMeasurement = await prisma.bodyMeasurement.findFirst({
				where: {
					userId: session.user.id
				},
				orderBy: {
					measuredAt: 'desc'
				}
			})

			progressData.measurements = {
				history: measurements,
				latest: latestMeasurement
			}
		}

		// Records personales
		if (!type || type === 'records') {
			const personalRecords = await prisma.personalRecord.findMany({
				where: {
					userId: session.user.id,
					achievedAt: {
						gte: startDate
					}
				},
				include: {
					exercise: {
						select: {
							id: true,
							name: true,
							category: true
						}
					}
				},
				orderBy: {
					achievedAt: 'desc'
				}
			})

			// Records por categoría
			const recordsByCategory = await prisma.$queryRaw`
				SELECT 
					e.category,
					COUNT(*) as count
				FROM personal_records pr
				JOIN exercises e ON pr."exerciseId" = e.id
				WHERE pr."userId" = ${session.user.id}
					AND pr."achievedAt" >= ${startDate}
				GROUP BY e.category
				ORDER BY count DESC
			`

			progressData.records = {
				recent: personalRecords,
				byCategory: recordsByCategory
			}
		}

		return NextResponse.json(progressData)

	} catch (error) {
		logger.error('Error fetching progress:', error, 'API')
		return NextResponse.json(
			{ error: 'Error al obtener progreso' },
			{ status: 500 }
		)
	}
}

// POST /api/progress - Crear nueva medición o record
export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		const body = await req.json()
		const { type, data } = body

		if (type === 'measurement') {
			// Crear nueva medición corporal
			const measurement = await prisma.bodyMeasurement.create({
				data: {
					userId: session.user.id,
					weight: data.weight,
					bodyFat: data.bodyFat,
					muscle: data.muscle,
					chest: data.chest,
					waist: data.waist,
					hips: data.hips,
					arms: data.arms,
					thighs: data.thighs,
					measuredAt: data.measuredAt ? new Date(data.measuredAt) : new Date(),
					notes: data.notes
				}
			})

			return NextResponse.json(measurement, { status: 201 })

		} else if (type === 'record') {
			// Crear nuevo record personal
			const record = await prisma.personalRecord.upsert({
				where: {
					userId_exerciseId_recordType: {
						userId: session.user.id,
						exerciseId: data.exerciseId,
						recordType: data.recordType
					}
				},
				update: {
					value: data.value,
					reps: data.reps,
					achievedAt: data.achievedAt ? new Date(data.achievedAt) : new Date()
				},
				create: {
					userId: session.user.id,
					exerciseId: data.exerciseId,
					recordType: data.recordType,
					value: data.value,
					reps: data.reps,
					achievedAt: data.achievedAt ? new Date(data.achievedAt) : new Date()
				},
				include: {
					exercise: {
						select: {
							id: true,
							name: true,
							category: true
						}
					}
				}
			})

			return NextResponse.json(record, { status: 201 })

		} else {
			return NextResponse.json(
				{ error: 'Tipo de progreso no válido' },
				{ status: 400 }
			)
		}

	} catch (error) {
		logger.error('Error creating progress entry:', error, 'API')
		return NextResponse.json(
			{ error: 'Error al crear entrada de progreso' },
			{ status: 500 }
		)
	}
}