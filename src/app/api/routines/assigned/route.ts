import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}
		
		// Buscar la asignación de rutina más reciente para el usuario
    const assignment = await prisma.routineAssignment.findFirst({
			where: {
            studentId: session.user.id,
            isActive: true
			},
			orderBy: {
				startDate: 'desc'
			},
			include: {
				routine: {
					include: {
						blocks: {
							orderBy: {
								order: 'asc'
							},
							include: {
								sets: {
									orderBy: {
										order: 'asc'
									},
									include: {
										exercise: true
									}
								}
							}
						}
					}
				}
			}
		})
		
		if (!assignment) {
			return NextResponse.json(
				{ error: 'No tienes rutinas asignadas' },
				{ status: 404 }
			)
		}
		
		return NextResponse.json({
			assignment,
			routine: assignment.routine
		})
		
	} catch (error) {
		console.error('Error fetching assigned routine:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}
