import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateCSRFToken } from '@/lib/csrf-protection'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiter'
import { applySecurityHeaders } from '@/lib/security-headers'

import { logger } from '@/lib/logger'
/**
 * GET /api/csrf-token
 * Returns a CSRF token for the current authenticated session
 */
export async function GET(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(RATE_LIMIT_CONFIGS.api)()
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    // Get current session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Generate CSRF token
    const csrfToken = generateCSRFToken(session.user.id, session.user.id)
    
    const response = NextResponse.json({
      token: csrfToken,
      expiresIn: 3600, // 1 hour in seconds
      timestamp: new Date().toISOString()
    })

    // Add security headers
    return applySecurityHeaders(response)
    
  } catch (error) {
    logger.error('Error generating CSRF token:', error, 'API')
    
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    
    return applySecurityHeaders(response)
  }
}

/**
 * POST /api/csrf-token/validate
 * Validates a CSRF token (for testing purposes)
 */
export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(RATE_LIMIT_CONFIGS.strict)()
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // This endpoint is mainly for testing - in production,
    // CSRF validation happens automatically in protected routes
    const response = NextResponse.json({
      message: 'CSRF validation endpoint - use protected routes for actual validation',
      timestamp: new Date().toISOString()
    })

    return applySecurityHeaders(response)
    
  } catch (error) {
    logger.error('Error validating CSRF token:', error, 'API')
    
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    
    return applySecurityHeaders(response)
  }
}