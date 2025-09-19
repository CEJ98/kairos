import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { securityMiddleware } from '@/middleware/security-middleware'
import { locales } from '@/i18n'
import { UserRole, VALID_ROLES, validateUserRole } from '@/types/user'
import { logger } from './lib/logger'
import { checkRateLimitAsync, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiter'

// API rate limit target: 100 req/min per IP via Redis when available
const API_RATE_LIMIT = RATE_LIMIT_CONFIGS.api

// Rutas que requieren autenticación
const PROTECTED_ROUTES = [
  '/dashboard'
]

// Rutas de autenticación que deben redirigir si ya está autenticado
const AUTH_ROUTES = [
  '/es/signin',
  '/es/signup',
  '/es/forgot-password'
]

// Rutas que requieren rol específico
const TRAINER_ONLY_ROUTES = [
	'/dashboard/trainer'
]

const CLIENT_ONLY_ROUTES = [
	'/dashboard/client'
]

const ADMIN_ONLY_ROUTES = [
	'/dashboard/admin'
]

// Función para obtener IP del cliente
function getClientIP(request: NextRequest): string {
	const forwarded = request.headers.get('x-forwarded-for')
	const realIP = request.headers.get('x-real-ip')

	if (forwarded) return forwarded.split(',')[0].trim()
	if (realIP) return realIP
	return 'unknown'
}

// Función de rate limiting
function rateLimit(identifier: string, config: { requests: number; windowMs: number }) {
	const now = Date.now()

	// Limpiar entradas expiradas
	rateLimitStore.forEach((value, key) => {
		if (value.resetTime < now) {
			rateLimitStore.delete(key)
		}
	})

	const current = rateLimitStore.get(identifier)

	if (!current || current.resetTime < now) {
		rateLimitStore.set(identifier, {
			count: 1,
			resetTime: now + config.windowMs
		})
		return { allowed: true, remaining: config.requests - 1 }
	}

	if (current.count >= config.requests) {
		return { allowed: false, remaining: 0, resetTime: current.resetTime }
	}

	current.count++
	return { allowed: true, remaining: config.requests - current.count }
}

// Función para agregar headers de seguridad
function addSecurityHeaders(response: NextResponse) {
	response.headers.set('X-Frame-Options', 'DENY')
	response.headers.set('X-Content-Type-Options', 'nosniff')
	response.headers.set('X-XSS-Protection', '1; mode=block')
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
	return response
}

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl

	// Rate limiting for API routes (per IP)
	if (pathname.startsWith('/api/')) {
		// Exempt some internal/webhook routes
		const exempt = (
			pathname.startsWith('/api/billing/webhook') ||
			pathname.startsWith('/api/stripe/webhooks') ||
			pathname.startsWith('/api/socket')
		)
		if (!exempt) {
			const ip = getClientIP(request)
			const result = await checkRateLimitAsync(`ip_${ip}`, API_RATE_LIMIT)
			const headers = new Headers({
				'X-RateLimit-Limit': String(result.limit),
				'X-RateLimit-Remaining': String(result.remaining),
				'X-RateLimit-Reset': String(result.resetTime),
			})
			if (!result.isAllowed) {
				headers.set('Retry-After', String(result.retryAfter || 60))
				return new NextResponse(
					JSON.stringify({ error: 'Too many requests' }),
					{ status: 429, headers }
				)
			}
			return NextResponse.next({ headers })
		}
		return NextResponse.next()
	}

	// Extraer el pathname sin el prefijo de idioma para las verificaciones
	const pathnameWithoutLocale = pathname.replace(/^\/(es|en)/, '') || '/'
	
	const isAuthPage = pathnameWithoutLocale.startsWith('/signin') || pathnameWithoutLocale.startsWith('/signup') || pathnameWithoutLocale.startsWith('/forgot-password')
	const isDashboard = pathnameWithoutLocale.startsWith('/dashboard')

	// Aplicar middleware de seguridad solo a rutas no-API
	const securityResponse = await securityMiddleware(request)
	if (securityResponse) {
		return securityResponse
	}

	try {
		// Obtener token de autenticación
		const token = await getToken({
			req: request,
			secret: process.env.NEXTAUTH_SECRET
		})

		// Si no hay token y está intentando acceder al dashboard
		if (!token && isDashboard) {
			logger.info('Redirecting unauthenticated user to signin', {
				path: pathname,
				userAgent: request.headers.get('user-agent')
			})
			return NextResponse.redirect(new URL('/es/signin', request.url))
		}

		// Si hay token y está en página de auth, redirigir al dashboard
		if (token && isAuthPage) {
			const userRole = token.role as string
			
			// Validar rol antes de redirigir
			if (!validateUserRole(userRole)) {
				logger.error('Invalid user role detected during redirect', {
					userId: token.sub,
					role: userRole
				})
				return NextResponse.redirect(new URL('/es/signin?error=invalid_role', request.url))
			}
			
			let dashboardUrl = '/dashboard/client' // default
			switch (userRole) {
				case UserRole.TRAINER:
					dashboardUrl = '/dashboard/trainer'
					break
				case UserRole.ADMIN:
					dashboardUrl = '/dashboard/admin'
					break
				case UserRole.CLIENT:
				default:
					dashboardUrl = '/dashboard/client'
					break
			}
			
			logger.info('Redirecting authenticated user to dashboard', {
				userId: token.sub,
				role: token.role,
				dashboard: dashboardUrl
			})
			return NextResponse.redirect(new URL(dashboardUrl, request.url))
		}

		// Si está en dashboard, verificar rol
		if (isDashboard && token) {
			const userRole = token.role as string
			
			// Validar que el rol sea válido
			if (!validateUserRole(userRole)) {
				logger.error('Invalid user role detected in dashboard access', {
					userId: token.sub,
					role: userRole,
					path: pathname
				})
				return NextResponse.redirect(new URL('/es/signin?error=invalid_role', request.url))
			}
			
			const isTrainerPath = pathname.startsWith('/dashboard/trainer')
			const isClientPath = pathname.startsWith('/dashboard/client')
			const isAdminPath = pathname.startsWith('/dashboard/admin')

			// Control de acceso basado en roles
			switch (userRole) {
				case UserRole.TRAINER:
					if (isClientPath || isAdminPath) {
						logger.warn('Trainer attempting to access unauthorized dashboard', {
							userId: token.sub,
							path: pathname,
							role: userRole
						})
						return NextResponse.redirect(new URL('/dashboard/trainer', request.url))
					}
					break
					
				case UserRole.CLIENT:
					if (isTrainerPath || isAdminPath) {
						logger.warn('Client attempting to access unauthorized dashboard', {
							userId: token.sub,
							path: pathname,
							role: userRole
						})
						return NextResponse.redirect(new URL('/dashboard/client', request.url))
					}
					break
					
				case UserRole.ADMIN:
					// Admin puede acceder a cualquier dashboard
					break
					
				default:
					logger.error('Unknown user role in dashboard access', {
						userId: token.sub,
						role: userRole,
						path: pathname
					})
					return NextResponse.redirect(new URL('/es/signin?error=unknown_role', request.url))
			}
		}

		// Continuar con la request
		return NextResponse.next()

	} catch (error) {
		logger.error('Middleware error', {
			error,
			path: pathname,
			userAgent: request.headers.get('user-agent')
		})
		
		// En caso de error, permitir continuar pero log el error
		return NextResponse.next()
	}
}

// Configurar rutas donde aplicar el middleware
export const config = {
  matcher: [
    /*
     * Temporarily disabled for debugging - only match specific protected routes
     */
    '/dashboard/:path*',
    '/api/:path*'
  ]
}
