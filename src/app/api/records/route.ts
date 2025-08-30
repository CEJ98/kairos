import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

import { logger } from '@/lib/logger'
// GET /api/records - Obtener récords personales del usuario
export async function GET(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		const { searchParams } = new URL(req.url)
		const exerciseId = searchParams.get('exerciseId')
		const category = searchParams.get('category')
		const recordType = searchParams.get('recordType')
		const limit = parseInt(searchParams.get('limit') || '50')

		// Construir filtros
		const where: any = {
			userId: session.user.id
		}

		if (exerciseId) {
			where.exerciseId = exerciseId
		}

		if (recordType) {
			where.recordType = recordType
		}

		// Obtener récords con información del ejercicio
		const records = await prisma.personalRecord.findMany({
			where,
			include: {
				exercise: {
					select: {
						id: true,
						name: true,
						category: true,
						muscleGroups: true,
						equipments: true
					}
				}
			},
			orderBy: {
				achievedAt: 'desc'
			},
			take: limit
		})

		// Filtrar por categoría si se especifica
		let filteredRecords = records
		if (category) {
			filteredRecords = records.filter(record => 
				record.exercise.category.toLowerCase() === category.toLowerCase()
			)
		}

		// Agrupar por ejercicio para obtener el mejor récord de cada uno
		const recordsByExercise = new Map()
		filteredRecords.forEach(record => {
			const exerciseKey = `${record.exerciseId}-${record.recordType}`
			const existing = recordsByExercise.get(exerciseKey)
			
			if (!existing || record.value > existing.value) {
				recordsByExercise.set(exerciseKey, record)
			}
		})

		// Estadísticas
		const stats = {
			totalRecords: filteredRecords.length,
			uniqueExercises: new Set(filteredRecords.map(r => r.exerciseId)).size,
			latestRecord: filteredRecords[0] || null,
			highestValue: filteredRecords.reduce((max, record) => 
				record.value > max ? record.value : max, 0
			),
			categoriesCount: new Set(filteredRecords.map(r => r.exercise.category)).size
		}

		return NextResponse.json({
			records: filteredRecords,
			bestRecords: Array.from(recordsByExercise.values()),
			stats
		})

	} catch (error) {
		logger.error('Error fetching records:', error, 'API')
		return NextResponse.json(
			{ error: 'Error al obtener récords' },
			{ status: 500 }
		)
	}
}

// POST /api/records - Crear nuevo récord personal
export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		const body = await req.json()
		const { exerciseId, recordType, value, reps, achievedAt } = body

		// Validar datos requeridos
		if (!exerciseId || !recordType || !value) {
			return NextResponse.json(
				{ error: 'Exercise ID, tipo de récord y valor son requeridos' },
				{ status: 400 }
			)
		}

		// Verificar que el ejercicio existe
		const exercise = await prisma.exercise.findUnique({
			where: { id: exerciseId }
		})

		if (!exercise) {
			return NextResponse.json(
				{ error: 'Ejercicio no encontrado' },
				{ status: 404 }
			)
		}

		// Verificar si ya existe un récord para este ejercicio y tipo
		const existingRecord = await prisma.personalRecord.findFirst({
			where: {
				userId: session.user.id,
				exerciseId: exerciseId,
				recordType: recordType
			}
		})

		// Si existe un récord y el nuevo valor no es mayor, no crear
		if (existingRecord && parseFloat(value) <= existingRecord.value) {
			return NextResponse.json(
				{ 
					error: 'El nuevo valor debe ser mayor al récord actual',
					currentRecord: existingRecord
				},
				{ status: 400 }
			)
		}

		// Crear o actualizar récord
		const record = await prisma.personalRecord.upsert({
			where: {
				userId_exerciseId_recordType: {
					userId: session.user.id,
					exerciseId: exerciseId,
					recordType: recordType
				}
			},
			update: {
				value: parseFloat(value),
				reps: reps ? parseInt(reps) : null,
				achievedAt: achievedAt ? new Date(achievedAt) : new Date()
			},
			create: {
				userId: session.user.id,
				exerciseId: exerciseId,
				recordType: recordType,
				value: parseFloat(value),
				reps: reps ? parseInt(reps) : null,
				achievedAt: achievedAt ? new Date(achievedAt) : new Date()
			},
			include: {
				exercise: {
					select: {
						id: true,
						name: true,
						category: true,
						muscleGroups: true
					}
				}
			}
		})

		return NextResponse.json(record, { status: 201 })

	} catch (error) {
		logger.error('Error creating record:', error, 'API')
		return NextResponse.json(
			{ error: 'Error al crear récord' },
			{ status: 500 }
		)
	}
}