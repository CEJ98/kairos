import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Tipos para melhor tipagem
interface OneRMRecord {
	oneRM: number
	weight: number
	reps: number
	date: string
}

// Usar el tipo inferido de Prisma
type SetLogWithRelations = Awaited<ReturnType<typeof getSetLogsWithRelations>>[0]

// Función auxiliar para obtener el tipo correcto
async function getSetLogsWithRelations() {
	return await prisma.setLog.findMany({
		include: {
			set: {
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
			},
			session: {
				select: {
					startTime: true
				}
			}
		}
	})
}

// Fórmulas para calcular 1RM
const calculateOneRepMax = {
	// Fórmula de Epley
	epley: (weight: number, reps: number) => {
		if (reps === 1) return weight
		return weight * (1 + reps / 30)
	},
	
	// Fórmula de Brzycki
	brzycki: (weight: number, reps: number) => {
		if (reps === 1) return weight
		return weight / (1.0278 - 0.0278 * reps)
	},
	
	// Fórmula de Lander
	lander: (weight: number, reps: number) => {
		if (reps === 1) return weight
		return (100 * weight) / (101.3 - 2.67123 * reps)
	},
	
	// Média das três fórmulas para maior precisão
	average: (weight: number, reps: number) => {
		const epley = calculateOneRepMax.epley(weight, reps)
		const brzycki = calculateOneRepMax.brzycki(weight, reps)
		const lander = calculateOneRepMax.lander(weight, reps)
		return (epley + brzycki + lander) / 3
	}
}

// GET - Calcular 1RM estimada para exercícios do usuário
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
		const exerciseId = searchParams.get('exerciseId')
		const days = parseInt(searchParams.get('days') || '90') // Últimos 90 dias por padrão

		const startDate = new Date()
		startDate.setDate(startDate.getDate() - days)

		// Buscar logs de sets do usuário
		const whereClause: any = {
			session: {
				userId: session.user.id
			},
			createdAt: {
				gte: startDate
			},
			weightUsed: {
				gt: 0 // Apenas sets com peso
			},
			repsCompleted: {
				gt: 0,
				lte: 15 // Apenas sets de força (até 15 reps)
			}
		}

		if (exerciseId) {
			whereClause.set = {
				exerciseId
			}
		}

		const setLogs = await prisma.setLog.findMany({
			where: whereClause,
			include: {
				set: {
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
				},
				session: {
					select: {
						startTime: true
					}
				}
			},
			orderBy: {
				createdAt: 'desc'
			}
		})

		// Agrupar por exercício
		const exerciseGroups = new Map<string, SetLogWithRelations[]>()

		setLogs.forEach((setLog) => {
			if (!setLog.set?.exercise) return

			const exerciseId = setLog.set.exercise.id
			if (!exerciseGroups.has(exerciseId)) {
				exerciseGroups.set(exerciseId, [])
			}
			exerciseGroups.get(exerciseId)!.push(setLog)
		})

		// Calcular 1RM para cada exercício
		const oneRepMaxResults: any[] = []

		for (const [exerciseId, sets] of exerciseGroups) {
			const exercise = sets[0].set.exercise
			
			// Encontrar o melhor set (maior 1RM estimada)
			let bestOneRM = 0
			let bestSet: { weight: number; reps: number; date: Date } | null = null
			const allOneRMs: OneRMRecord[] = []

			sets.forEach((setLog) => {
				if (setLog.weightUsed && setLog.repsCompleted) {
					const oneRM = calculateOneRepMax.average(setLog.weightUsed, setLog.repsCompleted)
					allOneRMs.push({
						oneRM,
						weight: setLog.weightUsed,
						reps: setLog.repsCompleted,
						date: setLog.session.startTime.toISOString()
					})

					if (oneRM > bestOneRM) {
						bestOneRM = oneRM
						bestSet = {
							weight: setLog.weightUsed,
							reps: setLog.repsCompleted,
							date: setLog.session.startTime
						}
					}
				}
			})

			// Calcular tendência (últimos 30 dias vs anteriores)
			const thirtyDaysAgo = new Date()
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

			const recentSets = allOneRMs.filter(set => new Date(set.date) >= thirtyDaysAgo)
			const olderSets = allOneRMs.filter(set => new Date(set.date) < thirtyDaysAgo)

			const recentAvg = recentSets.length > 0 ? 
				recentSets.reduce((sum, set) => sum + set.oneRM, 0) / recentSets.length : 0
			const olderAvg = olderSets.length > 0 ? 
				olderSets.reduce((sum, set) => sum + set.oneRM, 0) / olderSets.length : 0

			const trend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0

			oneRepMaxResults.push({
				exercise: {
					id: exercise.id,
					name: exercise.name,
					category: exercise.category,
					muscleGroups: exercise.muscleGroups
				},
				oneRepMax: Math.round(bestOneRM * 100) / 100,
				bestSet,
				totalSets: sets.length,
				trend: Math.round(trend * 100) / 100,
				history: allOneRMs.slice(0, 10) // Últimos 10 registros
			})
		}

		// Ordenar por 1RM (maior primeiro)
		oneRepMaxResults.sort((a, b) => b.oneRepMax - a.oneRepMax)

		return NextResponse.json({
			oneRepMaxData: oneRepMaxResults,
			summary: {
				totalExercises: oneRepMaxResults.length,
				totalSets: setLogs.length,
				daysAnalyzed: days,
				strongestExercise: oneRepMaxResults[0] || null
			}
		})

	} catch (error) {
		console.error('Erro ao calcular 1RM:', error)
		return NextResponse.json(
			{ error: 'Erro interno do servidor' },
			{ status: 500 }
		)
	}
}