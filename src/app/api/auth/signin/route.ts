import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const signInSchema = z.object({
	email: z.string().email('Email inválido'),
	password: z.string().min(1, 'Contraseña requerida')
})

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const validation = signInSchema.safeParse(body)
		
		if (!validation.success) {
			return NextResponse.json(
				{ error: 'Datos inválidos', details: validation.error.errors },
				{ status: 400 }
			)
		}

		const { email, password } = validation.data

		// Buscar usuario por email
		const user = await prisma.user.findUnique({
			where: { email: email.toLowerCase() }
		})

		if (!user || !user.password) {
			logger.security(`Sign-in attempt with invalid email: ${email}`)
			return NextResponse.json(
				{ error: 'Credenciales inválidas' },
				{ status: 401 }
			)
		}

		// Verificar contraseña
		const isValidPassword = await bcrypt.compare(password, user.password)
		if (!isValidPassword) {
			logger.security(`Sign-in attempt with invalid password for: ${email}`)
			return NextResponse.json(
				{ error: 'Credenciales inválidas' },
				{ status: 401 }
			)
		}

		// Verificar si el usuario está verificado
		if (!user.isVerified) {
			logger.info(`Sign-in attempt with unverified account: ${email}`)
			return NextResponse.json(
				{ error: 'Cuenta no verificada. Por favor verifica tu email.' },
				{ status: 403 }
			)
		}

		// Actualizar última conexión
		await prisma.user.update({
			where: { id: user.id },
			data: {
				lastSeen: new Date(),
				isOnline: true
			}
		})

		logger.info(`Successful sign-in for user: ${email}`)

		return NextResponse.json({
			success: true,
			message: 'Inicio de sesión exitoso',
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role,
				isVerified: user.isVerified
			}
		})

	} catch (error) {
		logger.error('Error during sign-in:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}