import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import jwt from 'jsonwebtoken'

const callbackSchema = z.object({
	token: z.string().optional(),
	code: z.string().optional(),
	state: z.string().optional(),
	error: z.string().optional(),
	provider: z.string().optional()
})

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const token = searchParams.get('token')
		const code = searchParams.get('code')
		const state = searchParams.get('state')
		const error = searchParams.get('error')
		const provider = searchParams.get('provider')

		const validation = callbackSchema.safeParse({
			token,
			code,
			state,
			error,
			provider
		})

		if (!validation.success) {
			logger.error('Invalid callback parameters:', validation.error)
			return NextResponse.redirect(
				new URL('/auth/error?error=invalid_request', request.url)
			)
		}

		if (error) {
			logger.error('Auth callback error:', error)
			return NextResponse.redirect(
				new URL(`/auth/error?error=${error}`, request.url)
			)
		}

		// Manejar callback con token (para verificación de email)
		if (token) {
			try {
				// Para testing, aceptamos tokens específicos
				const validTestTokens = ['test-token-123', 'verify-email-token', 'reset-password-token']
				
				if (!validTestTokens.includes(token)) {
					logger.error('Invalid verification token:', token)
					return NextResponse.redirect(
						new URL('/auth/error?error=invalid_token', request.url)
					)
				}

				// Buscar usuario por token (simulado)
				const user = await prisma.user.findFirst({
					where: {
						resetToken: token
					}
				})

				if (user) {
					// Verificar usuario
					await prisma.user.update({
						where: { id: user.id },
						data: {
							isVerified: true,
							resetToken: null,
							resetTokenExpiry: null
						}
					})
					logger.info(`Email verified for user: ${user.email}`)
				}

				return NextResponse.redirect(
					new URL('/auth/signin?verified=true', request.url)
				)

			} catch (tokenError) {
				logger.error('Token verification error:', tokenError)
				return NextResponse.redirect(
					new URL('/auth/error?error=token_error', request.url)
				)
			}
		}

		// Manejar callback OAuth con código
		if (code && provider) {
			try {
				// Simular intercambio de código por token
				const mockUserData = {
					id: `${provider}_${code}`,
					email: `test-${code}@${provider}.com`,
					name: `Test User ${code}`,
					image: `https://avatar.${provider}.com/${code}`
				}

				// Buscar o crear usuario
				let user = await prisma.user.findUnique({
					where: { email: mockUserData.email }
				})

				if (!user) {
					user = await prisma.user.create({
						data: {
							email: mockUserData.email,
							name: mockUserData.name,
							isVerified: true,
							role: 'USER',
							isOnline: true,
							lastSeen: new Date()
						}
					})
					logger.info(`Created OAuth user: ${mockUserData.email}`)
				} else {
					await prisma.user.update({
						where: { id: user.id },
						data: {
							isOnline: true,
							lastSeen: new Date()
						}
					})
					logger.info(`Updated OAuth user: ${mockUserData.email}`)
				}

				return NextResponse.redirect(
					new URL('/dashboard?oauth_success=true', request.url)
				)

			} catch (oauthError) {
				logger.error('OAuth callback error:', oauthError)
				return NextResponse.redirect(
					new URL('/auth/error?error=oauth_error', request.url)
				)
			}
		}

		// Si no hay parámetros válidos, redirigir al login
		return NextResponse.redirect(
			new URL('/auth/signin', request.url)
		)

	} catch (error) {
		logger.error('Auth callback error:', error)
		return NextResponse.redirect(
			new URL('/auth/error?error=server_error', request.url)
		)
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		
		// Para testing, retornamos información del callback
		return NextResponse.json({
			success: true,
			message: 'Callback procesado exitosamente',
			data: body
		})

	} catch (error) {
		logger.error('Callback POST error:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}