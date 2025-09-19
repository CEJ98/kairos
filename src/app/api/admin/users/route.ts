import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const adminUserSchema = z.object({
	page: z.number().min(1).default(1),
	limit: z.number().min(1).max(100).default(10),
	search: z.string().optional(),
	role: z.enum(['USER', 'ADMIN', 'MODERATOR']).optional(),
	isVerified: z.boolean().optional()
})

const createUserSchema = z.object({
	email: z.string().email('Email inválido'),
	name: z.string().min(1, 'Nombre requerido'),
	password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
	role: z.enum(['USER', 'ADMIN', 'MODERATOR']).default('USER'),
	isVerified: z.boolean().default(false)
})

// Función para verificar permisos de admin
function isAdmin(request: NextRequest): boolean {
	// Para testing, aceptamos headers específicos
	const authHeader = request.headers.get('authorization')
	const adminTokens = ['admin-token', 'test-admin-123', 'demo-admin']
	
	if (authHeader) {
		const token = authHeader.replace('Bearer ', '')
		return adminTokens.includes(token)
	}
	
	// También verificar por header personalizado para testing
	const testAdmin = request.headers.get('x-test-admin')
	return testAdmin === 'true'
}

export async function GET(request: NextRequest) {
	try {
		// Verificar permisos de administrador
		if (!isAdmin(request)) {
			logger.security('Unauthorized admin access attempt')
			return NextResponse.json(
				{ error: 'Acceso no autorizado' },
				{ status: 403 }
			)
		}

		const { searchParams } = new URL(request.url)
		const page = parseInt(searchParams.get('page') || '1')
		const limit = parseInt(searchParams.get('limit') || '10')
		const search = searchParams.get('search') || undefined
		const role = searchParams.get('role') as 'USER' | 'ADMIN' | 'MODERATOR' | undefined
		const isVerified = searchParams.get('isVerified') === 'true' ? true : 
							 searchParams.get('isVerified') === 'false' ? false : undefined

		const validation = adminUserSchema.safeParse({
			page,
			limit,
			search,
			role,
			isVerified
		})

		if (!validation.success) {
			return NextResponse.json(
				{ error: 'Parámetros inválidos', details: validation.error.errors },
				{ status: 400 }
			)
		}

		const { page: validPage, limit: validLimit, search: validSearch, role: validRole, isVerified: validIsVerified } = validation.data

		// Construir filtros de búsqueda
		const where: any = {}
		
		if (validSearch) {
			where.OR = [
				{ email: { contains: validSearch, mode: 'insensitive' } },
				{ name: { contains: validSearch, mode: 'insensitive' } }
			]
		}
		
		if (validRole) {
			where.role = validRole
		}
		
		if (validIsVerified !== undefined) {
			where.isVerified = validIsVerified
		}

		// Obtener usuarios con paginación
		const [users, totalCount] = await Promise.all([
			prisma.user.findMany({
				where,
				select: {
					id: true,
					email: true,
					name: true,
					role: true,
					isVerified: true,
					isOnline: true,
					lastSeen: true,
					createdAt: true,
					updatedAt: true
				},
				skip: (validPage - 1) * validLimit,
				take: validLimit,
				orderBy: { createdAt: 'desc' }
			}),
			prisma.user.count({ where })
		])

		const totalPages = Math.ceil(totalCount / validLimit)

		logger.info(`Admin fetched ${users.length} users (page ${validPage}/${totalPages})`)

		return NextResponse.json({
			success: true,
			data: {
				users,
				pagination: {
					currentPage: validPage,
					totalPages,
					totalCount,
					limit: validLimit,
					hasNext: validPage < totalPages,
					hasPrev: validPage > 1
				}
			}
		})

	} catch (error) {
		logger.error('Error fetching users:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}

export async function POST(request: NextRequest) {
	try {
		// Verificar permisos de administrador
		if (!isAdmin(request)) {
			logger.security('Unauthorized admin user creation attempt')
			return NextResponse.json(
				{ error: 'Acceso no autorizado' },
				{ status: 403 }
			)
		}

		const body = await request.json()
		const validation = createUserSchema.safeParse(body)
		
		if (!validation.success) {
			return NextResponse.json(
				{ error: 'Datos inválidos', details: validation.error.errors },
				{ status: 400 }
			)
		}

		const { email, name, password, role, isVerified } = validation.data

		// Verificar si el usuario ya existe
		const existingUser = await prisma.user.findUnique({
			where: { email: email.toLowerCase() }
		})

		if (existingUser) {
			return NextResponse.json(
				{ error: 'El usuario ya existe' },
				{ status: 409 }
			)
		}

		// Para testing, no hasheamos la contraseña
		// En producción, usar bcrypt
		const hashedPassword = `hashed_${password}`

		// Crear nuevo usuario
		const newUser = await prisma.user.create({
			data: {
				email: email.toLowerCase(),
				name,
				password: hashedPassword,
				role,
				isVerified,
				isOnline: false,
				lastSeen: new Date()
			},
			select: {
				id: true,
				email: true,
				name: true,
				role: true,
				isVerified: true,
				createdAt: true
			}
		})

		logger.info(`Admin created new user: ${newUser.email} with role: ${newUser.role}`)

		return NextResponse.json({
			success: true,
			message: 'Usuario creado exitosamente',
			data: newUser
		}, { status: 201 })

	} catch (error) {
		logger.error('Error creating user:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}