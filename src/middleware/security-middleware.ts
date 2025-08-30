/**
 * Comprehensive Security Middleware for Kairos Fitness
 * Integrates all security protections: rate limiting, CSRF, validation, etc.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limiter'
import { validateCSRFToken } from '@/lib/csrf-protection'
import { applySecurityHeaders } from '@/lib/security-headers'
import { logSecurityEvent } from '@/lib/security-audit'
import { createValidator } from '@/lib/advanced-validation'
import { getToken } from 'next-auth/jwt'

import { logger } from '@/lib/logger'
interface SecurityConfig {
  rateLimiting?: {
    enabled: boolean
    requests: number
    window: number
  }
  csrf?: {
    enabled: boolean
    methods: string[]
  }
  validation?: {
    enabled: boolean
    maxBodySize: number
  }
  authentication?: {
    required: boolean
    roles?: string[]
  }
  logging?: {
    enabled: boolean
    logLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  }
}

const DEFAULT_CONFIG: SecurityConfig = {
  rateLimiting: {
    enabled: true,
    requests: 100,
    window: 15 * 60 * 1000 // 15 minutes
  },
  csrf: {
    enabled: true,
    methods: ['POST', 'PUT', 'DELETE', 'PATCH']
  },
  validation: {
    enabled: true,
    maxBodySize: 1024 * 1024 // 1MB
  },
  authentication: {
    required: false
  },
  logging: {
    enabled: true,
    logLevel: 'MEDIUM'
  }
}

/**
 * Route-specific security configurations
 */
const ROUTE_CONFIGS: Record<string, Partial<SecurityConfig>> = {
  '/api/auth/register': {
    rateLimiting: { enabled: true, requests: 5, window: 15 * 60 * 1000 },
    csrf: { enabled: true, methods: ['POST'] },
    logging: { enabled: true, logLevel: 'HIGH' }
  },
  '/api/auth/login': {
    rateLimiting: { enabled: true, requests: 10, window: 15 * 60 * 1000 },
    csrf: { enabled: true, methods: ['POST'] },
    logging: { enabled: true, logLevel: 'HIGH' }
  },
  '/api/admin': {
    rateLimiting: { enabled: true, requests: 50, window: 15 * 60 * 1000 },
    authentication: { required: true, roles: ['admin'] },
    logging: { enabled: true, logLevel: 'CRITICAL' }
  },
  '/api/trainer': {
    authentication: { required: true, roles: ['trainer', 'admin'] },
    logging: { enabled: true, logLevel: 'HIGH' }
  },
  '/api/client': {
    authentication: { required: true, roles: ['client', 'trainer', 'admin'] },
    logging: { enabled: true, logLevel: 'MEDIUM' }
  },
  '/api/upload': {
    rateLimiting: { enabled: true, requests: 20, window: 15 * 60 * 1000 },
    validation: { enabled: true, maxBodySize: 10 * 1024 * 1024 }, // 10MB for uploads
    authentication: { required: true },
    logging: { enabled: true, logLevel: 'HIGH' }
  }
}

/**
 * Get security configuration for a route
 */
function getRouteConfig(pathname: string): SecurityConfig {
  const config = { ...DEFAULT_CONFIG }
  
  // Find matching route configuration
  for (const [route, routeConfig] of Object.entries(ROUTE_CONFIGS)) {
    if (pathname.startsWith(route)) {
      // Merge configurations
      Object.assign(config, {
        rateLimiting: { ...config.rateLimiting, ...routeConfig.rateLimiting },
        csrf: { ...config.csrf, ...routeConfig.csrf },
        validation: { ...config.validation, ...routeConfig.validation },
        authentication: { ...config.authentication, ...routeConfig.authentication },
        logging: { ...config.logging, ...routeConfig.logging }
      })
      break
    }
  }
  
  return config
}

/**
 * Extract client information for security logging
 */
function getClientInfo(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  
  return {
    ip,
    userAgent: request.headers.get('user-agent') || 'unknown',
    referer: request.headers.get('referer') || 'unknown',
    origin: request.headers.get('origin') || 'unknown'
  }
}

/**
 * Check if request body size is within limits
 */
async function validateRequestSize(
  request: NextRequest,
  maxSize: number
): Promise<{ valid: boolean; error?: string }> {
  const contentLength = request.headers.get('content-length')
  
  if (contentLength) {
    const size = parseInt(contentLength, 10)
    if (size > maxSize) {
      return {
        valid: false,
        error: `Request body too large. Maximum size: ${Math.round(maxSize / 1024)}KB`
      }
    }
  }
  
  return { valid: true }
}

/**
 * Validate request headers for suspicious patterns
 */
function validateHeaders(request: NextRequest): { valid: boolean; issues?: string[] } {
  const issues: string[] = []
  const suspiciousHeaders = [
    'x-forwarded-host',
    'x-original-url',
    'x-rewrite-url'
  ]
  
  // Check for header injection attempts
  request.headers.forEach((value, name) => {
    if (value.includes('\n') || value.includes('\r')) {
      issues.push(`Header injection attempt in ${name}`)
    }
    
    if (suspiciousHeaders.includes(name.toLowerCase())) {
      issues.push(`Suspicious header: ${name}`)
    }
  })
  
  // Check User-Agent
  const userAgent = request.headers.get('user-agent')
  if (!userAgent || userAgent.length < 10) {
    issues.push('Missing or suspicious User-Agent')
  }
  
  return {
    valid: issues.length === 0,
    issues: issues.length > 0 ? issues : undefined
  }
}

/**
 * Main security middleware function
 */
export async function securityMiddleware(
  request: NextRequest,
  customConfig?: Partial<SecurityConfig>
): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname
  const method = request.method
  const clientInfo = getClientInfo(request)
  
  // Get configuration for this route
  const config = customConfig 
    ? { ...getRouteConfig(pathname), ...customConfig }
    : getRouteConfig(pathname)
  
  let userId: string | undefined
  
  try {
    // 1. Authentication check
    if (config.authentication?.required) {
      const token = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET 
      })
      
      if (!token) {
        if (config.logging?.enabled) {
          logSecurityEvent(
            'AUTH_FAILURE',
            config.logging.logLevel,
            {
              reason: 'No authentication token',
              path: pathname,
              method,
              ...clientInfo
            }
          )
        }
        
        return new NextResponse(
          JSON.stringify({ error: 'Authentication required' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
      
      userId = token.sub
      
      // Role-based access control
      if (config.authentication.roles && config.authentication.roles.length > 0) {
        const userRole = token.role as string
        if (!config.authentication.roles.includes(userRole)) {
          if (config.logging?.enabled) {
          logSecurityEvent(
            'UNAUTHORIZED_ACCESS',
            config.logging.logLevel,
            {
              reason: 'Insufficient permissions',
              userRole,
              requiredRoles: config.authentication.roles,
              path: pathname,
              method,
              ...clientInfo
            },
            userId
          )
        }
          
          return new NextResponse(
            JSON.stringify({ error: 'Insufficient permissions' }),
            { 
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }
      }
    }
    
    // 2. Rate limiting
    if (config.rateLimiting?.enabled) {
      const rateLimitResult = checkRateLimit(
        `${clientInfo.ip}:${pathname}:${method}`,
        {
          maxRequests: config.rateLimiting.requests,
          windowMs: config.rateLimiting.window
        }
      )
      
      if (!rateLimitResult.isAllowed) {
        if (config.logging?.enabled) {
          logSecurityEvent(
            'RATE_LIMIT_EXCEEDED',
            config.logging.logLevel,
            {
              path: pathname,
              method,
              limit: config.rateLimiting.requests,
              window: config.rateLimiting.window,
              ...clientInfo
            },
            userId
          )
        }
        
        return new NextResponse(
          JSON.stringify({ 
            error: 'Rate limit exceeded',
            retryAfter: rateLimitResult.retryAfter
          }),
          { 
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': rateLimitResult.retryAfter?.toString() || '60'
            }
          }
        )
      }
    }
    
    // 3. Header validation
    const headerValidation = validateHeaders(request)
    if (!headerValidation.valid && config.logging?.enabled) {
      logSecurityEvent(
        'SUSPICIOUS_REQUEST',
        config.logging.logLevel,
        {
          reason: 'Suspicious headers detected',
          issues: headerValidation.issues,
          path: pathname,
          method,
          ...clientInfo
        },
        userId
      )
    }
    
    // 4. Request size validation
    if (config.validation?.enabled && ['POST', 'PUT', 'PATCH'].includes(method)) {
      const sizeValidation = await validateRequestSize(
        request,
        config.validation.maxBodySize
      )
      
      if (!sizeValidation.valid) {
        if (config.logging?.enabled) {
          logSecurityEvent(
            'SUSPICIOUS_REQUEST',
            config.logging.logLevel,
            {
              reason: 'Request body too large',
              error: sizeValidation.error,
              path: pathname,
              method,
              ...clientInfo
            },
            userId
          )
        }
        
        return new NextResponse(
          JSON.stringify({ error: sizeValidation.error }),
          { 
            status: 413,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }
    
    // 5. CSRF protection
    if (config.csrf?.enabled && config.csrf.methods.includes(method)) {
      const csrfToken = request.headers.get('x-csrf-token')
      
      if (!csrfToken) {
        if (config.logging?.enabled) {
          logSecurityEvent(
            'CSRF_TOKEN_MISMATCH',
            config.logging.logLevel,
            {
              path: pathname,
              method,
              reason: 'CSRF token missing',
              ...clientInfo
            },
            userId
          )
        }
        
        return new NextResponse(
          JSON.stringify({ error: 'CSRF token required' }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
      
      const csrfValid = await validateCSRFToken(csrfToken, userId || 'anonymous')
      if (!csrfValid) {
        if (config.logging?.enabled) {
          logSecurityEvent(
            'CSRF_TOKEN_MISMATCH',
            'HIGH',
            {
              path: pathname,
              method,
              token: csrfToken.substring(0, 10) + '...',
              ...clientInfo
            },
            userId
          )
        }
        
        return new NextResponse(
          JSON.stringify({ error: 'Invalid CSRF token' }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }
    
    // All security checks passed
    return null
    
  } catch (error) {
    if (config.logging?.enabled) {
      logSecurityEvent(
        'SUSPICIOUS_REQUEST',
        'CRITICAL',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          path: pathname,
          method,
          ...clientInfo
        },
        userId
      )
    }
    
    return new NextResponse(
      JSON.stringify({ error: 'Security validation failed' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Wrapper function to create secured API routes
 */
export function withSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config?: Partial<SecurityConfig>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Apply security middleware
    const securityResponse = await securityMiddleware(request, config)
    
    if (securityResponse) {
      // Security check failed, return error response
      return applySecurityHeaders(securityResponse)
    }
    
    // Security checks passed, proceed with handler
    try {
      const response = await handler(request)
      return applySecurityHeaders(response)
    } catch (error) {
      // Log the error for debugging
      logger.error('Handler error:', error, 'SECURITY')
      
      const errorResponse = new NextResponse(
        JSON.stringify({ 
          error: 'Internal server error'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
      
      return applySecurityHeaders(errorResponse)
    }
  }
}

/**
 * Utility to create validator for request body
 */
export function createRequestValidator(userId?: string) {
  return createValidator(userId)
}