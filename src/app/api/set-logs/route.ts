import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}
		
		const {
			sessionId,
			setId,
			setIndex,
			repsCompleted,
			weightUsed,
			durationActual,
			startTime,
			endTime,
			restTimeActual
		} = await request.json()
		
		if (!sessionId || !setId || !setIndex) {
			return NextResponse.json(
				{ error: 'sessionId, setId y setIndex son requeridos' },
				{ status: 400 }
			)
		}
		
		// Verificar que la sesión pertenece al usuario
		const workoutSession = await prisma.workoutSession.findFirst({
			where: {
				id: sessionId,
				userId: session.user.id
			}
		})
		
		if (!workoutSession) {
			return NextResponse.json(
				{ error: 'Sesión no encontrada o no autorizada' },
				{ status: 404 }
			)
		}
		
		// Crear el log del set
		const setLog = await prisma.setLog.create({
			data: {
				sessionId,
				setId,
				setIndex,
				repsCompleted,
				weightUsed,
				durationActual,
				startTime: new Date(startTime),
				endTime: endTime ? new Date(endTime) : null,
				restTimeActual
			}
		})
		
		return NextResponse.json(setLog)
		
	} catch (error) {
		console.error('Error creating set log:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}

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
		const sessionId = searchParams.get('sessionId')
		const limit = parseInt(searchParams.get('limit') || '50')
		const offset = parseInt(searchParams.get('offset') || '0')
		
		const whereClause: any = {}
		
		if (sessionId) {
			// Verificar que la sesión pertenece al usuario
			const workoutSession = await prisma.workoutSession.findFirst({
				where: {
					id: sessionId,
					userId: session.user.id
				}
			})
			
			if (!workoutSession) {
				return NextResponse.json(
					{ error: 'Sesión no encontrada' },
					{ status: 404 }
				)
			}
			
			whereClause.sessionId = sessionId
		} else {
			// Obtener logs de todas las sesiones del usuario
			whereClause.session = {
				userId: session.user.id
			}
		}
		
		const setLogs = await prisma.setLog.findMany({
			where: whereClause,
			orderBy: {
				createdAt: 'desc'
			},
			take: limit,
			skip: offset,
			include: {
				set: {
					include: {
						exercise: true
					}
				},
				session: true
			}
		})
		
		return NextResponse.json(setLogs)
		
	} catch (error) {
		console.error('Error fetching set logs:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}