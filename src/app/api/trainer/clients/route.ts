/**
 * API Route: Gestión de Clientes del Entrenador
 * GET /api/trainer/clients - Listar clientes asignados
 * POST /api/trainer/clients - Asignar cliente a entrenador
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { UserRole } from '@/types/user'

// GET - Obtener lista de clientes asignados al entrenador
export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		
		if (!session?.user) {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}

		if (session.user.role !== UserRole.TRAINER) {
			return NextResponse.json(
				{ error: 'Acceso denegado. Solo entrenadores pueden acceder a esta ruta' },
				{ status: 403 }
			)
		}

		// Obtener el perfil del entrenador
		const trainerProfile = await prisma.trainerProfile.findUnique({
			where: { userId: session.user.id },
			include: {
				clients: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true,
								createdAt: true
							}
						}
					}
				}
			}
		})

		if (!trainerProfile) {
			return NextResponse.json(
				{ error: 'Perfil de entrenador no encontrado' },
				{ status: 404 }
			)
		}

		// Formatear datos de clientes
		const clients = trainerProfile.clients.map(client => ({
			id: client.id,
			user: client.user,
			fitnessGoal: client.fitnessGoal,
			activityLevel: client.activityLevel,
			height: client.height,
			weight: client.weight,
			age: client.age,
			gender: client.gender,
			assignedAt: client.createdAt
		}))

		logger.info(`Trainer ${session.user.id} retrieved ${clients.length} clients`, 'TrainerClients')

		return NextResponse.json({
			clients,
			total: clients.length
		})

	} catch (error) {
		logger.error('Error getting trainer clients:', error, 'TrainerClients')
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}

// POST - Asignar cliente a entrenador
export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		
		if (!session?.user) {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}

		if (session.user.role !== UserRole.TRAINER) {
			return NextResponse.json(
				{ error: 'Acceso denegado. Solo entrenadores pueden asignar clientes' },
				{ status: 403 }
			)
		}

		const body = await request.json()
		const { clientEmail } = body

		if (!clientEmail) {
			return NextResponse.json(
				{ error: 'Email del cliente es requerido' },
				{ status: 400 }
			)
		}

		// Verificar que el entrenador tiene perfil
		const trainerProfile = await prisma.trainerProfile.findUnique({
			where: { userId: session.user.id }
		})

		if (!trainerProfile) {
			return NextResponse.json(
				{ error: 'Perfil de entrenador no encontrado' },
				{ status: 404 }
			)
		}

		// Buscar el cliente por email
		const clientUser = await prisma.user.findUnique({
			where: { email: clientEmail },
			include: {
				clientProfiles: true
			}
		})

		if (!clientUser) {
			return NextResponse.json(
				{ error: 'Cliente no encontrado' },
				{ status: 404 }
			)
		}

		if (clientUser.role !== 'CLIENT') {
			return NextResponse.json(
				{ error: 'El usuario no es un cliente' },
				{ status: 400 }
			)
		}

		// Buscar o crear perfil de cliente
		let clientProfile = clientUser.clientProfiles.find(profile => !profile.trainerId)
		if (!clientProfile) {
			// Crear perfil de cliente si no existe
			clientProfile = await prisma.clientProfile.create({
				data: {
					userId: clientUser.id
				}
			})
		}

		// Verificar si ya está asignado
		if (clientProfile.trainerId === trainerProfile.id) {
			return NextResponse.json(
				{ error: 'El cliente ya está asignado a este entrenador' },
				{ status: 400 }
			)
		}

		// Asignar cliente al entrenador
		const updatedClientProfile = await prisma.clientProfile.update({
			where: { id: clientProfile.id },
			data: {
				trainerId: trainerProfile.id
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true
					}
				}
			}
		})

		logger.info(`Client ${clientUser.id} assigned to trainer ${session.user.id}`, 'TrainerClients')

		return NextResponse.json({
			message: 'Cliente asignado exitosamente',
			client: {
				id: updatedClientProfile.id,
				user: updatedClientProfile.user,
				fitnessGoal: updatedClientProfile.fitnessGoal,
				activityLevel: updatedClientProfile.activityLevel,
				height: updatedClientProfile.height,
				weight: updatedClientProfile.weight,
				age: updatedClientProfile.age,
				gender: updatedClientProfile.gender,
				assignedAt: updatedClientProfile.updatedAt
			}
		})

	} catch (error) {
		logger.error('Error assigning client to trainer:', error, 'TrainerClients')
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}