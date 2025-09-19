'use client'

import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

export interface TrainerAssignmentRequest {
	clientId: string
	trainerId: string
	notes?: string
}

export interface ClientAssignment {
	id: string
	clientId: string
	trainerId: string
	status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
	createdAt: Date
	updatedAt: Date
	notes?: string
	client: {
		id: string
		name: string
		email: string
		avatar?: string
	}
	trainer: {
		id: string
		name: string
		email: string
		avatar?: string
		bio?: string
		experience?: number
		specialties?: string[]
		hourlyRate?: number
	}
}

export interface TrainerSearchResult {
	id: string
	name: string
	email: string
	avatar?: string
	bio?: string
	experience?: number
	specialties?: string[]
	hourlyRate?: number
	maxClients: number
	currentClients: number
	isActive: boolean
	rating?: number
}

export class TrainerAssignmentService {
	/**
	 * Buscar entrenadores disponibles
	 */
	static async searchAvailableTrainers(filters?: {
		specialty?: string
		maxRate?: number
		minExperience?: number
		location?: string
	}): Promise<TrainerSearchResult[]> {
		try {
			const trainers = await prisma.user.findMany({
				where: {
					role: 'TRAINER',
					trainerProfile: {
						isActive: true,
						...(filters?.maxRate && {
							hourlyRate: {
								lte: filters.maxRate
							}
						}),
						...(filters?.minExperience && {
							experience: {
								gte: filters.minExperience
							}
						})
					}
				},
				include: {
					trainerProfile: {
						include: {
							clients: true
						}
					}
				}
			})

			return trainers.map(trainer => {
				const profile = trainer.trainerProfile!
				const specialties = profile.specialties ? 
					JSON.parse(profile.specialties) : []

				// Filtrar por especialidad si se especifica
				if (filters?.specialty && 
					!specialties.some((s: string) => 
						s.toLowerCase().includes(filters.specialty!.toLowerCase())
					)) {
					return null
				}

				return {
					id: trainer.id,
					name: trainer.name || '',
					email: trainer.email,
					avatar: trainer.avatar,
					bio: profile.bio,
					experience: profile.experience,
					specialties,
					hourlyRate: profile.hourlyRate,
					maxClients: profile.maxClients,
					currentClients: profile.clients.length,
					isActive: profile.isActive,
					rating: 4.5 // TODO: Calcular rating real
				}
			}).filter(Boolean) as TrainerSearchResult[]

		} catch (error) {
			logger.error('Error searching trainers', error, 'TRAINER_ASSIGNMENT')
			throw new Error('Error al buscar entrenadores')
		}
	}

	/**
	 * Solicitar asignación de entrenador
	 */
	static async requestTrainerAssignment(
		clientId: string, 
		trainerId: string, 
		notes?: string
	): Promise<ClientAssignment> {
		try {
			// Verificar que el cliente no tenga ya un entrenador
			const existingProfile = await prisma.clientProfile.findFirst({
				where: {
					userId: clientId,
					trainerId: { not: null }
				}
			})

			if (existingProfile) {
				throw new Error('El cliente ya tiene un entrenador asignado')
			}

			// Verificar que el entrenador existe y está activo
			const trainer = await prisma.user.findUnique({
				where: { id: trainerId, role: 'TRAINER' },
				include: {
					trainerProfile: {
						include: {
							clients: true
						}
					}
				}
			})

			if (!trainer?.trainerProfile?.isActive) {
				throw new Error('Entrenador no disponible')
			}

			// Verificar capacidad del entrenador
			if (trainer.trainerProfile.clients.length >= trainer.trainerProfile.maxClients) {
				throw new Error('El entrenador ha alcanzado su capacidad máxima de clientes')
			}

			// Buscar perfil existente del cliente
			let clientProfile = await prisma.clientProfile.findFirst({
				where: { userId: clientId }
			})

			// Crear o actualizar el perfil del cliente
			if (clientProfile) {
				clientProfile = await prisma.clientProfile.update({
					where: { id: clientProfile.id },
					data: {
						trainerId: trainer.trainerProfile.id
					}
				})
			} else {
				clientProfile = await prisma.clientProfile.create({
					data: {
						userId: clientId,
						trainerId: trainer.trainerProfile.id
					}
				})
			}

			// Obtener datos completos para la respuesta
			const fullClientProfile = await prisma.clientProfile.findUnique({
				where: { id: clientProfile.id },
				include: {
					user: true,
					trainer: {
						include: {
							user: true
						}
					}
				}
			})

			if (!fullClientProfile) {
				throw new Error('Error al crear la asignación')
			}

			logger.info('Trainer assigned to client', {
				clientId,
				trainerId,
				assignmentId: clientProfile.id
			}, 'TRAINER_ASSIGNMENT')

			return {
				id: fullClientProfile.id,
				clientId,
				trainerId,
				status: 'ACCEPTED', // Por ahora auto-aceptamos
				createdAt: new Date(),
				updatedAt: new Date(),
				notes,
				client: {
				id: fullClientProfile.user.id,
				name: fullClientProfile.user.name || '',
				email: fullClientProfile.user.email,
				avatar: fullClientProfile.user.avatar || undefined
			},
			trainer: {
				id: fullClientProfile.trainer!.user.id,
				name: fullClientProfile.trainer!.user.name || '',
				email: fullClientProfile.trainer!.user.email,
				avatar: fullClientProfile.trainer!.user.avatar || undefined,
				bio: fullClientProfile.trainer!.bio || undefined,
				experience: fullClientProfile.trainer!.experience || undefined,
				specialties: fullClientProfile.trainer!.specialties ? fullClientProfile.trainer!.specialties.split(',') : undefined,
				hourlyRate: fullClientProfile.trainer!.hourlyRate || undefined
			}
			}

		} catch (error) {
			logger.error('Error requesting trainer assignment', error, 'TRAINER_ASSIGNMENT')
			throw error
		}
	}

	/**
	 * Obtener clientes de un entrenador
	 */
	static async getTrainerClients(trainerId: string): Promise<ClientAssignment[]> {
		try {
			const trainer = await prisma.user.findUnique({
				where: { id: trainerId, role: 'TRAINER' },
				include: {
					trainerProfile: {
						include: {
							clients: {
								include: {
									user: true
								}
							}
						}
					}
				}
			})

			if (!trainer?.trainerProfile) {
				return []
			}

			return trainer.trainerProfile.clients.map(client => ({
				id: client.id,
				clientId: client.userId,
				trainerId,
				status: 'ACCEPTED' as const,
				createdAt: new Date(),
				updatedAt: new Date(),
				client: {
					id: client.user.id,
					name: client.user.name || '',
					email: client.user.email,
					avatar: client.user.avatar || undefined
				},
				trainer: {
					id: trainer.id,
					name: trainer.name || '',
					email: trainer.email,
					avatar: trainer.avatar || undefined,
					bio: trainer.trainerProfile?.bio || undefined,
					experience: trainer.trainerProfile?.experience || undefined,
					specialties: trainer.trainerProfile?.specialties ? trainer.trainerProfile.specialties.split(',') : undefined,
					hourlyRate: trainer.trainerProfile?.hourlyRate || undefined
				}
			}))

		} catch (error) {
			logger.error('Error getting trainer clients', error, 'TRAINER_ASSIGNMENT')
			throw new Error('Error al obtener clientes del entrenador')
		}
	}

	/**
	 * Remover asignación de entrenador
	 */
	static async removeTrainerAssignment(clientId: string): Promise<void> {
		try {
			await prisma.clientProfile.updateMany({
				where: { userId: clientId },
				data: { trainerId: null }
			})

			logger.info('Trainer assignment removed', {
				clientId
			}, 'TRAINER_ASSIGNMENT')

		} catch (error) {
			logger.error('Error removing trainer assignment', error, 'TRAINER_ASSIGNMENT')
			throw new Error('Error al remover asignación de entrenador')
		}
	}

	/**
	 * Obtener entrenador de un cliente
	 */
	static async getClientTrainer(clientId: string): Promise<ClientAssignment | null> {
		try {
			const clientProfile = await prisma.clientProfile.findFirst({
				where: {
					userId: clientId,
					trainerId: { not: null }
				},
				include: {
					user: true,
					trainer: {
						include: {
							user: true
						}
					}
				}
			})

			if (!clientProfile?.trainer) {
				return null
			}

			return {
				id: clientProfile.id,
				clientId,
				trainerId: clientProfile.trainer.userId,
				status: 'ACCEPTED',
				createdAt: new Date(),
				updatedAt: new Date(),
				client: {
				id: clientProfile.user.id,
				name: clientProfile.user.name || '',
				email: clientProfile.user.email,
				avatar: clientProfile.user.avatar || undefined
			},
			trainer: {
				id: clientProfile.trainer.user.id,
				name: clientProfile.trainer.user.name || '',
				email: clientProfile.trainer.user.email,
				avatar: clientProfile.trainer.user.avatar || undefined,
				bio: clientProfile.trainer.bio || undefined,
				experience: clientProfile.trainer.experience || undefined,
				specialties: clientProfile.trainer.specialties ? clientProfile.trainer.specialties.split(',') : undefined,
				hourlyRate: clientProfile.trainer.hourlyRate || undefined
			}
			}

		} catch (error) {
			logger.error('Error getting client trainer', error, 'TRAINER_ASSIGNMENT')
			throw new Error('Error al obtener entrenador del cliente')
		}
	}
}