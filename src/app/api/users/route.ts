import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/users - Obtener usuarios (solo para admins/trainers)
export async function GET(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		// Verificar permisos (solo admins y trainers pueden ver otros usuarios)
		if (session.user.role !== 'ADMIN' && session.user.role !== 'TRAINER') {
			return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
		}

		const { searchParams } = new URL(req.url)
		const role = searchParams.get('role')
		const search = searchParams.get('search')
		const page = parseInt(searchParams.get('page') || '1')
		const limit = parseInt(searchParams.get('limit') || '20')
		const skip = (page - 1) * limit

		// Construir filtros
		const where: any = {}

		if (role) {
			where.role = role
		}

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' } },
				{ email: { contains: search, mode: 'insensitive' } }
			]
		}

		// Si es trainer, solo puede ver sus clientes
		if (session.user.role === 'TRAINER') {
			where.OR = [
				{ id: session.user.id }, // El trainer puede verse a sí mismo
				{ 
					clientProfiles: {
						some: {
							trainerId: session.user.id
						}
					}
				}
			]
		}

		// Obtener usuarios
		const [users, total] = await Promise.all([
			prisma.user.findMany({
				where,
				select: {
						id: true,
						name: true,
						email: true,
						role: true,
						createdAt: true,
					clientProfiles: {
					select: {
						age: true,
						gender: true,
						fitnessGoal: true,
						activityLevel: true,
						trainerId: true
					}
				},
				trainerProfile: {
					select: {
						specialties: true,
						experience: true,
						hourlyRate: true,
						bio: true
					}
				}
				},
				orderBy: {
					createdAt: 'desc'
				},
				skip,
				take: limit
			}),
			prisma.user.count({ where })
		])

		return NextResponse.json({
			users,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit)
			}
		})

	} catch (error) {
		console.error('Error fetching users:', error)
		return NextResponse.json(
			{ error: 'Error al obtener usuarios' },
			{ status: 500 }
		)
	}
}

// POST /api/users - Crear nuevo usuario (solo admins)
export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user || session.user.role !== 'ADMIN') {
			return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
		}

		const body = await req.json()
		const { name, email, role, password, profileData } = body

		// Validar datos requeridos
		if (!name || !email || !role) {
			return NextResponse.json(
				{ error: 'Nombre, email y rol son requeridos' },
				{ status: 400 }
			)
		}

		// Verificar que el email no esté en uso
		const existingUser = await prisma.user.findUnique({
			where: { email }
		})

		if (existingUser) {
			return NextResponse.json(
				{ error: 'El email ya está en uso' },
				{ status: 400 }
			)
		}

		// Crear usuario
		const user = await prisma.user.create({
			data: {
				name,
				email,
				role,
				password: password || 'temp123' // Password temporal
			}
		})

		// Crear perfil específico según el rol
		if (role === 'CLIENT' && profileData) {
			await prisma.clientProfile.create({
				data: {
					userId: user.id,
					age: profileData.age,
					gender: profileData.gender,
					height: profileData.height,
					weight: profileData.weight,
					fitnessGoal: profileData.fitnessGoal || 'WEIGHT_LOSS',
					activityLevel: profileData.activityLevel || 'MODERATE',
					trainerId: profileData.trainerId
				}
			})
		} else if (role === 'TRAINER' && profileData) {
			await prisma.trainerProfile.create({
				data: {
					userId: user.id,
					specialties: profileData.specialties,
					experience: profileData.experience,
					bio: profileData.bio,
					hourlyRate: profileData.hourlyRate
				}
			})
		}

		// Obtener usuario completo
		const completeUser = await prisma.user.findUnique({
			where: { id: user.id },
			include: {
				clientProfiles: true,
				trainerProfile: true
			}
		})

		return NextResponse.json(completeUser, { status: 201 })

	} catch (error) {
		console.error('Error creating user:', error)
		return NextResponse.json(
			{ error: 'Error al crear usuario' },
			{ status: 500 }
		)
	}
}