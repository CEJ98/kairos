import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const oauthSchema = z.object({
	provider: z.enum(['google', 'github', 'discord']),
	code: z.string().optional(),
	state: z.string().optional(),
	error: z.string().optional()
})

export async function GET(request: NextRequest, { params }: any) {
	try {
		const { searchParams } = new URL(request.url)
		const _p = (params && typeof (params as any).then === 'function') ? await params : params
		const provider = _p.provider
		const code = searchParams.get('code')
		const state = searchParams.get('state')
		const error = searchParams.get('error')

		const validation = oauthSchema.safeParse({
			provider,
			code,
			state,
			error
		})

		if (!validation.success) {
			logger.error('Invalid OAuth parameters:', validation.error)
			return NextResponse.redirect(
				new URL('/auth/error?error=invalid_request', request.url)
			)
		}

		if (error) {
			logger.error(`OAuth error from ${provider}:`, error)
			return NextResponse.redirect(
				new URL(`/auth/error?error=${error}`, request.url)
			)
		}

		if (!code) {
			logger.error(`No authorization code received from ${provider}`)
			return NextResponse.redirect(
				new URL('/auth/error?error=no_code', request.url)
			)
		}

		// Para propósitos de testing, simulamos un flujo OAuth exitoso
		const mockUserData = {
			id: `${provider}_test_user`,
			email: `test@${provider}.com`,
			name: `Test ${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
			image: `https://avatar.${provider}.com/test`
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
					isVerified: true, // OAuth users are pre-verified
					role: 'USER',
					isOnline: true,
					lastSeen: new Date()
				}
			})
			logger.info(`Created new OAuth user: ${mockUserData.email}`)
		} else {
			// Actualizar información del usuario
			user = await prisma.user.update({
				where: { id: user.id },
				data: {
					isOnline: true,
					lastSeen: new Date()
				}
			})
			logger.info(`Updated OAuth user: ${mockUserData.email}`)
		}

		// En un entorno real, aquí se establecería la sesión
		// Para testing, redirigimos al dashboard
		return NextResponse.redirect(
			new URL('/dashboard?oauth_success=true', request.url)
		)

	} catch (error) {
		logger.error(`OAuth ${typeof params?.then === 'function' ? 'unknown' : (params as any)?.provider} error:`, error)
		return NextResponse.redirect(
			new URL('/auth/error?error=server_error', request.url)
		)
	}
}

export async function POST(request: NextRequest, { params }: any) {
	try {
		const body = await request.json()
		const _p = (params && typeof (params as any).then === 'function') ? await params : params
		const provider = _p.provider

		// Para testing, retornamos información mock del proveedor
		return NextResponse.json({
			success: true,
			provider,
			message: `OAuth ${provider} endpoint disponible`,
			data: body
		})

	} catch (error) {
		logger.error('OAuth POST error:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}
