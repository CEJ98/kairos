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
		
		const { routineId, startTime } = await request.json()
		
		if (!routineId || !startTime) {
			return NextResponse.json(
				{ error: 'routineId y startTime son requeridos' },
				{ status: 400 }
			)
		}
		
		// Verificar que la rutina existe y está asignada al usuario
		const assignment = await prisma.routineAssignment.findFirst({
			where: {
				studentId: session.user.id,
				routineId: routineId,
				isActive: true
			}
		})
		
		if (!assignment) {
			return NextResponse.json(
				{ error: 'Rutina no encontrada o no asignada' },
				{ status: 404 }
			)
		}
		
		// Crear sesión de entrenamiento
		const workoutSession = await prisma.workoutSession.create({
			data: {
				userId: session.user.id,
				workoutId: routineId,
				startTime: new Date(startTime),
				status: 'IN_PROGRESS'
			}
		})
		
		return NextResponse.json(workoutSession)
		
	} catch (error) {
		console.error('Error creating workout session:', error)
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
		const limit = parseInt(searchParams.get('limit') || '10')
		const offset = parseInt(searchParams.get('offset') || '0')
		
		const sessions = await prisma.workoutSession.findMany({
			where: {
				userId: session.user.id
			},
			orderBy: {
				startTime: 'desc'
			},
			take: limit,
			skip: offset,
			include: {
				setLogs: true,
				workout: true
			}
		})
		
		return NextResponse.json(sessions)
		
	} catch (error) {
		console.error('Error fetching workout sessions:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}