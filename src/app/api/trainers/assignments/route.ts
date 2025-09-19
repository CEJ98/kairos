import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { TrainerAssignmentService } from '@/lib/trainer-assignment'
import { logger } from '@/lib/logger'

// GET /api/trainers/assignments - Obtener asignaciones
export async function GET(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		const { searchParams } = new URL(req.url)
		const trainerId = searchParams.get('trainerId')
		const clientId = searchParams.get('clientId')

		// Si es entrenador, obtener sus clientes
		if (session.user.role === 'TRAINER') {
			const clients = await TrainerAssignmentService.getTrainerClients(session.user.id)
			return NextResponse.json({ assignments: clients })
		}

		// Si es cliente, obtener su entrenador
		if (session.user.role === 'CLIENT') {
			const trainer = await TrainerAssignmentService.getClientTrainer(session.user.id)
			return NextResponse.json({ assignment: trainer })
		}

		// Si es admin, puede ver asignaciones específicas
		if (session.user.role === 'ADMIN') {
			if (trainerId) {
				const clients = await TrainerAssignmentService.getTrainerClients(trainerId)
				return NextResponse.json({ assignments: clients })
			}
			if (clientId) {
				const trainer = await TrainerAssignmentService.getClientTrainer(clientId)
				return NextResponse.json({ assignment: trainer })
			}
		}

		return NextResponse.json({ assignments: [] })

	} catch (error) {
		logger.error('Error getting assignments:', error, 'API')
		return NextResponse.json(
			{ error: 'Error al obtener asignaciones' },
			{ status: 500 }
		)
	}
}

// POST /api/trainers/assignments - Crear nueva asignación
export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		const body = await req.json()
		const { trainerId, clientId, notes } = body

		// Validaciones
		if (!trainerId || !clientId) {
			return NextResponse.json(
				{ error: 'trainerId y clientId son obligatorios' },
				{ status: 400 }
			)
		}

		// Solo clientes pueden solicitar asignación para sí mismos
		// Solo entrenadores/admins pueden asignar a otros
		if (session.user.role === 'CLIENT' && clientId !== session.user.id) {
			return NextResponse.json(
				{ error: 'Solo puedes solicitar asignación para ti mismo' },
				{ status: 403 }
			)
		}

		if (session.user.role === 'TRAINER' && trainerId !== session.user.id) {
			return NextResponse.json(
				{ error: 'Solo puedes asignarte a ti mismo como entrenador' },
				{ status: 403 }
			)
		}

		// Crear asignación
		const assignment = await TrainerAssignmentService.requestTrainerAssignment(
			clientId,
			trainerId,
			notes
		)

		logger.info('Trainer assignment created', {
			assignmentId: assignment.id,
			clientId,
			trainerId,
			requesterId: session.user.id
		}, 'TRAINER_ASSIGNMENT')

		return NextResponse.json(assignment, { status: 201 })

	} catch (error) {
		logger.error('Error creating assignment:', error, 'API')
		
		// Manejar errores específicos
		if (error instanceof Error) {
			if (error.message.includes('ya tiene un entrenador')) {
				return NextResponse.json(
					{ error: error.message },
					{ status: 409 }
				)
			}
			if (error.message.includes('no disponible') || 
				error.message.includes('capacidad máxima')) {
				return NextResponse.json(
					{ error: error.message },
					{ status: 422 }
				)
			}
		}

		return NextResponse.json(
			{ error: 'Error al crear asignación' },
			{ status: 500 }
		)
	}
}

// DELETE /api/trainers/assignments - Eliminar asignación
export async function DELETE(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		const { searchParams } = new URL(req.url)
		const clientId = searchParams.get('clientId')

		if (!clientId) {
			return NextResponse.json(
				{ error: 'clientId es obligatorio' },
				{ status: 400 }
			)
		}

		// Solo el cliente mismo, su entrenador o admin pueden eliminar la asignación
		if (session.user.role === 'CLIENT' && clientId !== session.user.id) {
			return NextResponse.json(
				{ error: 'Solo puedes eliminar tu propia asignación' },
				{ status: 403 }
			)
		}

		if (session.user.role === 'TRAINER') {
			// Verificar que el cliente es suyo
			const clients = await TrainerAssignmentService.getTrainerClients(session.user.id)
			const isMyClient = clients.some(client => client.clientId === clientId)
			if (!isMyClient) {
				return NextResponse.json(
					{ error: 'No tienes permisos para eliminar esta asignación' },
					{ status: 403 }
				)
			}
		}

		// Eliminar asignación
		await TrainerAssignmentService.removeTrainerAssignment(clientId)

		logger.info('Trainer assignment removed', {
			clientId,
			requesterId: session.user.id
		}, 'TRAINER_ASSIGNMENT')

		return NextResponse.json({ success: true })

	} catch (error) {
		logger.error('Error removing assignment:', error, 'API')
		return NextResponse.json(
			{ error: 'Error al eliminar asignación' },
			{ status: 500 }
		)
	}
}