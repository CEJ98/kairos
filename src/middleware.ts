import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { logger } from './lib/logger'

// Rate limiting store (en producción usar Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Configuración de rate limiting por ruta
const rateLimitConfig = {
	'/api/auth': { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 min
	'/api/users': { requests: 100, windowMs: 15 * 60 * 1000 },
	'/api/workouts': { requests: 200, windowMs: 15 * 60 * 1000 },
	'/api/stripe': { requests: 10, windowMs: 15 * 60 * 1000 },
	default: { requests: 1000, windowMs: 15 * 60 * 1000 }
}

// Rutas que requieren autenticación
const PROTECTED_ROUTES = [
  '/dashboard'
]

// Rutas de autenticación que deben redirigir si ya está autenticado
const AUTH_ROUTES = [
  '/signin',
  '/signup',
  '/forgot-password'
]

// Rutas que requieren rol específico
const TRAINER_ONLY_ROUTES = [
	'/dashboard/trainer'
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
  const clientIP = getClientIP(request)
  
  // Rate limiting para rutas API
  if (pathname.startsWith('/api/')) {
		const config = rateLimitConfig['/api/auth'] || rateLimitConfig.default
		const identifier = `${clientIP}:${pathname}`
		const result = rateLimit(identifier, config)

		if (!result.allowed) {
			const response = NextResponse.json(
				{ error: 'Too many requests' },
				{ status: 429 }
			)
			return addSecurityHeaders(response)
		}
  }
  
  try {
    const response = NextResponse.next()
    
    // Obtener token de NextAuth
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    // Verificar si es una ruta de autenticación
    if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
      if (token) {
        // Usuario ya autenticado, redirigir al dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      return response
    }

    // Verificar si es una ruta protegida
    const isProtectedRoute = PROTECTED_ROUTES.some(route => 
      pathname.startsWith(route)
    )

    if (isProtectedRoute) {
      if (!token) {
        // Usuario no autenticado, redirigir al login
        const loginUrl = new URL('/signin', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
    }

    return response

  } catch (error) {
    logger.error('Middleware error', error, 'MIDDLEWARE')
    return NextResponse.next()
  }
}

// Configurar rutas donde aplicar el middleware
export const config = {
  matcher: [
    /*
     * Solo aplicar middleware a rutas específicas:
     * - /dashboard y subrutas
     * - /signin, /signup, /forgot-password
     */
    '/dashboard/:path*',
    '/signin',
    '/signup', 
    '/forgot-password'
  ]
}