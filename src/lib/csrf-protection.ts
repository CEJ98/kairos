/**
 * CSRF Protection System for Kairos Fitness
 * Protects against Cross-Site Request Forgery attacks
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { logSecurityEvent } from '@/lib/security-audit'

interface CSRFToken {
  token: string
  userId: string
  sessionId: string
  createdAt: Date
  expiresAt: Date
}

// In-memory store for CSRF tokens (use Redis in production)
const csrfTokens = new Map<string, CSRFToken>()
const TOKEN_EXPIRY_MS = 60 * 60 * 1000 // 1 hour
const MAX_TOKENS_PER_USER = 10

/**
 * Generate a new CSRF token for a user session
 */
export function generateCSRFToken(userId: string, sessionId: string): string {
  // Clean up expired tokens
  cleanupExpiredTokens()
  
  // Remove old tokens for this user if limit exceeded
  const userTokens = Array.from(csrfTokens.values())
    .filter(t => t.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  
  if (userTokens.length >= MAX_TOKENS_PER_USER) {
    // Remove oldest tokens
    const tokensToRemove = userTokens.slice(MAX_TOKENS_PER_USER - 1)
    tokensToRemove.forEach(token => {
      csrfTokens.delete(token.token)
    })
  }
  
  // Generate new token using Web Crypto API
  const tokenBytes = new Uint8Array(32)
  crypto.getRandomValues(tokenBytes)
  const token = Array.from(tokenBytes, byte => byte.toString(16).padStart(2, '0')).join('')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY_MS)
  
  const csrfToken: CSRFToken = {
    token,
    userId,
    sessionId,
    createdAt: now,
    expiresAt
  }
  
  csrfTokens.set(token, csrfToken)
  
  return token
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(
  token: string,
  userId: string,
  sessionId: string
): { isValid: boolean; error?: string } {
  if (!token) {
    return { isValid: false, error: 'CSRF token is required' }
  }
  
  const csrfToken = csrfTokens.get(token)
  
  if (!csrfToken) {
    return { isValid: false, error: 'Invalid CSRF token' }
  }
  
  // Check expiration
  if (new Date() > csrfToken.expiresAt) {
    csrfTokens.delete(token)
    return { isValid: false, error: 'CSRF token has expired' }
  }
  
  // Check user and session match
  if (csrfToken.userId !== userId || csrfToken.sessionId !== sessionId) {
    return { isValid: false, error: 'CSRF token mismatch' }
  }
  
  return { isValid: true }
}

/**
 * Middleware to protect API routes from CSRF attacks
 */
export function withCSRFProtection(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async function csrfProtectedHandler(req: NextRequest): Promise<NextResponse> {
    // Only protect state-changing methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return handler(req)
    }
    
    try {
      // Get session
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      
      // Get CSRF token from header or body
      const csrfToken = req.headers.get('x-csrf-token') ||
                       req.headers.get('csrf-token')
      
      if (!csrfToken) {
        // Try to get from form data or JSON body
        const contentType = req.headers.get('content-type')
        
        if (contentType?.includes('application/json')) {
          try {
            const body = await req.json()
            const tokenFromBody = body.csrfToken || body._token
            if (tokenFromBody) {
              // Re-create request with original body
              const newReq = new NextRequest(req.url, {
                method: req.method,
                headers: req.headers,
                body: JSON.stringify(body)
              })
              return validateAndProceed(newReq, tokenFromBody, session.user.id, session.user.id)
            }
          } catch {
            // Continue with header validation
          }
        }
      }
      
      return validateAndProceed(req, csrfToken, session.user.id, session.user.id)
      
    } catch (error) {
      console.error('CSRF protection error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
    
    async function validateAndProceed(
      request: NextRequest,
      token: string | null,
      userId: string,
      sessionId: string
    ): Promise<NextResponse> {
      if (!token) {
        logSecurityEvent(
          'CSRF_TOKEN_MISMATCH',
          'HIGH',
          {
            reason: 'Missing CSRF token',
            method: request.method,
            url: request.url,
            userAgent: request.headers.get('user-agent')
          },
          userId,
          request
        )
        
        return NextResponse.json(
          { error: 'CSRF token is required' },
          { status: 403 }
        )
      }
      
      const validation = validateCSRFToken(token, userId, sessionId)
      
      if (!validation.isValid) {
        logSecurityEvent(
          'CSRF_TOKEN_MISMATCH',
          'HIGH',
          {
            reason: validation.error,
            method: request.method,
            url: request.url,
            token: token.substring(0, 8) + '...', // Log partial token for debugging
            userAgent: request.headers.get('user-agent')
          },
          userId,
          request
        )
        
        return NextResponse.json(
          { error: validation.error },
          { status: 403 }
        )
      }
      
      // Token is valid, proceed with original handler
      return handler(request)
    }
  }
}

/**
 * Get CSRF token for current session (for use in forms)
 */
export async function getCSRFToken(userId?: string, sessionId?: string): Promise<string | null> {
  try {
    if (!userId || !sessionId) {
      return null
    }
    
    return generateCSRFToken(userId, sessionId)
  } catch (error) {
    console.error('Error generating CSRF token:', error)
    return null
  }
}

/**
 * Clean up expired tokens
 */
function cleanupExpiredTokens(): void {
  const now = new Date()
  const expiredTokens: string[] = []
  
  csrfTokens.forEach((tokenData, token) => {
    if (now > tokenData.expiresAt) {
      expiredTokens.push(token)
    }
  })
  
  expiredTokens.forEach(token => {
    csrfTokens.delete(token)
  })
}

/**
 * Get CSRF token statistics (for admin dashboard)
 */
export function getCSRFStats() {
  cleanupExpiredTokens()
  
  const tokens = Array.from(csrfTokens.values())
  const now = new Date()
  
  return {
    totalTokens: tokens.length,
    activeTokens: tokens.filter(t => now <= t.expiresAt).length,
    expiredTokens: tokens.filter(t => now > t.expiresAt).length,
    tokensByUser: tokens.reduce((acc, token) => {
      acc[token.userId] = (acc[token.userId] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    oldestToken: tokens.length > 0 ? 
      Math.min(...tokens.map(t => t.createdAt.getTime())) : null,
    newestToken: tokens.length > 0 ? 
      Math.max(...tokens.map(t => t.createdAt.getTime())) : null
  }
}

/**
 * Revoke all CSRF tokens for a user (useful for logout)
 */
export function revokeUserCSRFTokens(userId: string): number {
  const tokensToRevoke: string[] = []
  
  csrfTokens.forEach((tokenData, token) => {
    if (tokenData.userId === userId) {
      tokensToRevoke.push(token)
    }
  })
  
  tokensToRevoke.forEach(token => {
    csrfTokens.delete(token)
  })
  
  return tokensToRevoke.length
}

/**
 * React hook for CSRF protection in forms
 */
export const useCSRFToken = () => {
  // This would be implemented on the client side
  // For now, we'll provide the server-side utilities
  return {
    getToken: async () => {
      try {
        const response = await fetch('/api/csrf-token')
        if (response.ok) {
          const data = await response.json()
          return data.token
        }
      } catch (error) {
        console.error('Failed to get CSRF token:', error)
      }
      return null
    }
  }
}

/**
 * Utility to add CSRF token to form data
 */
export function addCSRFTokenToFormData(formData: FormData, token: string): FormData {
  formData.append('_token', token)
  return formData
}

/**
 * Utility to add CSRF token to JSON payload
 */
export function addCSRFTokenToJSON(data: Record<string, any>, token: string): Record<string, any> {
  return {
    ...data,
    _token: token
  }
}

/**
 * Express-style middleware for CSRF protection
 */
export const csrfMiddleware = {
  generate: generateCSRFToken,
  validate: validateCSRFToken,
  protect: withCSRFProtection,
  getToken: getCSRFToken,
  revokeUserTokens: revokeUserCSRFTokens,
  getStats: getCSRFStats
}