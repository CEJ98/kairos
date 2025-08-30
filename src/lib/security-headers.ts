/**
 * Security Headers Configuration for Kairos Fitness
 * Implements comprehensive security headers following OWASP guidelines
 */

export interface SecurityHeaders {
  [key: string]: string
}

/**
 * Get environment-specific allowed origins
 */
function getAllowedOrigins(): string[] {
  const env = process.env.NODE_ENV
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
  
  if (env === 'development') {
    return ['http://localhost:3000', 'http://127.0.0.1:3000', ...allowedOrigins]
  }
  
  if (env === 'production') {
    return [
      process.env.NEXTAUTH_URL || 'https://kairosfit.com',
      ...allowedOrigins
    ].filter(Boolean)
  }
  
  return allowedOrigins
}

/**
 * Generate Content Security Policy
 */
function generateCSP(): string {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  const cspDirectives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-eval'", // Required for Next.js dev mode
      isDevelopment ? "'unsafe-inline'" : "",
      'https://js.stripe.com',
      'https://checkout.stripe.com',
      'https://maps.googleapis.com',
    ].filter(Boolean),
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind and inline styles
      'https://fonts.googleapis.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://images.unsplash.com',
      'https://res.cloudinary.com',
      'https://lh3.googleusercontent.com', // Google avatars
      '*.stripe.com',
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
    ],
    'connect-src': [
      "'self'",
      'https://api.stripe.com',
      'https://checkout.stripe.com',
      'https://maps.googleapis.com',
      'wss://ws.pusherapp.com', // If using real-time features
      isDevelopment ? 'ws://localhost:*' : '',
      isDevelopment ? 'http://localhost:*' : '',
    ].filter(Boolean),
    'frame-src': [
      'https://js.stripe.com',
      'https://checkout.stripe.com',
      'https://hooks.stripe.com',
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'block-all-mixed-content': [],
    'upgrade-insecure-requests': isDevelopment ? [] : [''],
  }

  return Object.entries(cspDirectives)
    .map(([directive, sources]) => {
      if (sources.length === 0) return directive
      return `${directive} ${sources.join(' ')}`
    })
    .join('; ')
}

/**
 * Get security headers for API routes
 */
export function getSecurityHeaders(): SecurityHeaders {
  const allowedOrigins = getAllowedOrigins()
  
  return {
    // CORS Headers
    'Access-Control-Allow-Origin': allowedOrigins.join(', '),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 
      'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
    
    // Security Headers
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 
      'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    'Strict-Transport-Security': 
      'max-age=63072000; includeSubDomains; preload',
    'Content-Security-Policy': generateCSP(),
    
    // Custom headers
    'X-DNS-Prefetch-Control': 'on',
    'X-Download-Options': 'noopen',
    'X-Permitted-Cross-Domain-Policies': 'none',
  }
}

/**
 * CORS configuration for specific origins
 */
export function checkCORSOrigin(origin: string | null): boolean {
  if (!origin) return true // Same-origin requests
  
  const allowedOrigins = getAllowedOrigins()
  return allowedOrigins.includes(origin)
}

/**
 * Apply security headers to a Response
 */
export function applySecurityHeaders<T extends Response>(response: T): T {
  const headers = getSecurityHeaders()
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

/**
 * Create a secure Response with headers
 */
export function createSecureResponse(
  body: any,
  init?: ResponseInit
): Response {
  const response = new Response(body, init)
  return applySecurityHeaders(response)
}

/**
 * Rate limiting headers
 */
export function addRateLimitHeaders(
  response: Response,
  limit: number,
  remaining: number,
  resetTime: number
): Response {
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString())
  
  return response
}