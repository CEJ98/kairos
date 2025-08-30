import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

import { logger } from '@/lib/logger'
// GET /api/users/[id] - Obtener usuario específico
export async function GET(
	req: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const params = await context.params
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		// Verificar permisos
		const canAccess = 
			session.user.id === params.id || // El usuario puede ver su propio perfil
			session.user.role === 'ADMIN' || // Los admins pueden ver cualquier usuario
			(session.user.role === 'TRAINER') // Los trainers pueden ver sus clientes

		if (!canAccess) {
			return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
		}

		// Obtener usuario
		const user = await prisma.user.findUnique({
			where: { id: params.id },
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				avatar: true,
				isVerified: true,
				createdAt: true,
				clientProfiles: {
					select: {
						id: true,
						age: true,
						weight: true,
						height: true,
						gender: true,
						fitnessGoal: true,
						activityLevel: true,
						trainerId: true
					}
				},
				trainerProfile: {
					select: {
						id: true,
						bio: true,
						experience: true,
						specialties: true,
						hourlyRate: true,
						isActive: true,
						maxClients: true
					}
				}
			}
		})

		if (!user) {
			return NextResponse.json(
				{ error: 'Usuario no encontrado' },
				{ status: 404 }
			)
		}

		// Si es trainer, verificar que puede ver este usuario
		if (session.user.role === 'TRAINER' && session.user.id !== params.id) {
			const isClient = user.clientProfiles.some(profile => 
				profile.trainerId === session.user.id
			)
			if (!isClient) {
				return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
			}
		}

		return NextResponse.json(user)

	} catch (error) {
		logger.error('Error fetching user:', error, 'API')
		return NextResponse.json(
			{ error: 'Error al obtener usuario' },
			{ status: 500 }
		)
	}
}

// PUT /api/users/[id] - Actualizar usuario
export async function PUT(
	req: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const params = await context.params
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		// Verificar permisos
		const canEdit = 
			session.user.id === params.id || // El usuario puede editar su propio perfil
			session.user.role === 'ADMIN' // Los admins pueden editar cualquier usuario

		if (!canEdit) {
			return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
		}

		const body = await req.json()
		const { name, avatar, profileData } = body

		// Actualizar datos básicos del usuario
		const updateData: any = {}
		if (name !== undefined) updateData.name = name
		if (avatar !== undefined) updateData.avatar = avatar

		const user = await prisma.user.update({
			where: { id: params.id },
			data: updateData
		})

		// Actualizar perfil específico si se proporciona
		if (profileData) {
			if (user.role === 'CLIENT') {
				// Buscar perfil de cliente existente
				const existingProfile = await prisma.clientProfile.findFirst({
					where: { userId: params.id }
				})

				if (existingProfile) {
					await prisma.clientProfile.update({
						where: { id: existingProfile.id },
						data: {
							age: profileData.age,
							weight: profileData.weight,
							height: profileData.height,
							gender: profileData.gender,
							fitnessGoal: profileData.fitnessGoal,
							activityLevel: profileData.activityLevel
						}
					})
				} else {
					// Crear perfil si no existe
					await prisma.clientProfile.create({
						data: {
							userId: params.id,
							age: profileData.age,
							weight: profileData.weight,
							height: profileData.height,
							gender: profileData.gender,
							fitnessGoal: profileData.fitnessGoal,
							activityLevel: profileData.activityLevel
						}
					})
				}
			} else if (user.role === 'TRAINER') {
				// Actualizar perfil de trainer
				await prisma.trainerProfile.upsert({
					where: { userId: params.id },
					update: {
						bio: profileData.bio,
						experience: profileData.experience,
						specialties: profileData.specialties,
						hourlyRate: profileData.hourlyRate,
						maxClients: profileData.maxClients
					},
					create: {
						userId: params.id,
						bio: profileData.bio,
						experience: profileData.experience,
						specialties: profileData.specialties,
						hourlyRate: profileData.hourlyRate,
						maxClients: profileData.maxClients || 50
					}
				})
			}
		}

		// Obtener usuario actualizado
		const updatedUser = await prisma.user.findUnique({
			where: { id: params.id },
			include: {
				clientProfiles: true,
				trainerProfile: true
			}
		})

		return NextResponse.json(updatedUser)

	} catch (error) {
		logger.error('Error updating user:', error, 'API')
		return NextResponse.json(
			{ error: 'Error al actualizar usuario' },
			{ status: 500 }
		)
	}
}

// DELETE /api/users/[id] - Eliminar usuario (solo admins)
export async function DELETE(
	req: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const params = await context.params
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user || session.user.role !== 'ADMIN') {
			return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
		}

		// No permitir que el admin se elimine a sí mismo
		if (session.user.id === params.id) {
			return NextResponse.json(
				{ error: 'No puedes eliminar tu propia cuenta' },
				{ status: 400 }
			)
		}

		// Verificar que el usuario existe
		const user = await prisma.user.findUnique({
			where: { id: params.id }
		})

		if (!user) {
			return NextResponse.json(
				{ error: 'Usuario no encontrado' },
				{ status: 404 }
			)
		}

		// Eliminar usuario (las relaciones se eliminan en cascada)
		await prisma.user.delete({
			where: { id: params.id }
		})

		return NextResponse.json({ message: 'Usuario eliminado correctamente' })

	} catch (error) {
		logger.error('Error deleting user:', error, 'API')
		return NextResponse.json(
			{ error: 'Error al eliminar usuario' },
			{ status: 500 }
		)
	}
}