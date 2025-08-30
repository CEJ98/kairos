/**
 * Security Audit System for Kairos Fitness
 * Comprehensive logging and monitoring of security events
 */

import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { logger } from './logger'

interface SecurityEvent {
  id: string
  timestamp: Date
  type: SecurityEventType
  severity: SecuritySeverity
  userId?: string
  ip: string
  userAgent: string
  details: Record<string, any>
  resolved: boolean
}

type SecurityEventType = 
  | 'AUTH_FAILURE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SUSPICIOUS_REQUEST'
  | 'XSS_ATTEMPT'
  | 'SQL_INJECTION_ATTEMPT'
  | 'PATH_TRAVERSAL_ATTEMPT'
  | 'CSRF_TOKEN_MISMATCH'
  | 'UNAUTHORIZED_ACCESS'
  | 'PRIVILEGE_ESCALATION'
  | 'DATA_BREACH_ATTEMPT'
  | 'MALICIOUS_FILE_UPLOAD'
  | 'BRUTE_FORCE_ATTACK'

type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

// In-memory store for security events (use database in production)
const securityEvents: SecurityEvent[] = []
const MAX_EVENTS = 10000 // Keep last 10k events in memory

/**
 * Log a security event
 */
export function logSecurityEvent(
  type: SecurityEventType,
  severity: SecuritySeverity,
  details: Record<string, any>,
  userId?: string,
  request?: NextRequest
): void {
  try {
    const event: SecurityEvent = {
      id: generateEventId(),
      timestamp: new Date(),
      type,
      severity,
      userId,
      ip: getClientIP(request),
      userAgent: getUserAgent(request),
      details,
      resolved: false
    }

    // Add to memory store
    securityEvents.unshift(event)
    
    // Keep only recent events
    if (securityEvents.length > MAX_EVENTS) {
      securityEvents.splice(MAX_EVENTS)
    }

    // Log with appropriate level using logger
    const logMessage = `${type}: ${JSON.stringify(details)}`
    
    switch (severity) {
      case 'CRITICAL':
        logger.security(logMessage, { event, severity: 'CRITICAL' })
        // In production: send alert to security team
        break
      case 'HIGH':
        logger.security(logMessage, { event, severity: 'HIGH' })
        break
      case 'MEDIUM':
        logger.warn(logMessage, { event, severity: 'MEDIUM' }, 'SECURITY')
        break
      case 'LOW':
        logger.info(logMessage, { event, severity: 'LOW' }, 'SECURITY')
        break
    }

    // In production: store in database and send to monitoring service
    // await storeSecurityEvent(event)
    // await sendToMonitoringService(event)
    
  } catch (error) {
    logger.error('Failed to log security event', error, 'SECURITY')
  }
}

/**
 * Get recent security events
 */
export function getSecurityEvents(
  filters?: {
    type?: SecurityEventType
    severity?: SecuritySeverity
    userId?: string
    limit?: number
    resolved?: boolean
  }
): SecurityEvent[] {
  let events = [...securityEvents]

  if (filters) {
    if (filters.type) {
      events = events.filter(e => e.type === filters.type)
    }
    if (filters.severity) {
      events = events.filter(e => e.severity === filters.severity)
    }
    if (filters.userId) {
      events = events.filter(e => e.userId === filters.userId)
    }
    if (filters.resolved !== undefined) {
      events = events.filter(e => e.resolved === filters.resolved)
    }
    if (filters.limit) {
      events = events.slice(0, filters.limit)
    }
  }

  return events
}

/**
 * Mark security event as resolved
 */
export function resolveSecurityEvent(eventId: string): boolean {
  const event = securityEvents.find(e => e.id === eventId)
  if (event) {
    event.resolved = true
    return true
  }
  return false
}

/**
 * Get security statistics
 */
export function getSecurityStats(timeframe: 'hour' | 'day' | 'week' = 'day') {
  const now = new Date()
  let cutoff: Date

  switch (timeframe) {
    case 'hour':
      cutoff = new Date(now.getTime() - 60 * 60 * 1000)
      break
    case 'day':
      cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case 'week':
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
  }

  const recentEvents = securityEvents.filter(e => e.timestamp >= cutoff)
  
  const stats = {
    total: recentEvents.length,
    bySeverity: {
      CRITICAL: recentEvents.filter(e => e.severity === 'CRITICAL').length,
      HIGH: recentEvents.filter(e => e.severity === 'HIGH').length,
      MEDIUM: recentEvents.filter(e => e.severity === 'MEDIUM').length,
      LOW: recentEvents.filter(e => e.severity === 'LOW').length,
    },
    byType: {} as Record<SecurityEventType, number>,
    resolved: recentEvents.filter(e => e.resolved).length,
    unresolved: recentEvents.filter(e => !e.resolved).length,
    topIPs: getTopIPs(recentEvents),
    timeframe
  }

  // Count by type
  recentEvents.forEach(event => {
    stats.byType[event.type] = (stats.byType[event.type] || 0) + 1
  })

  return stats
}

/**
 * Detect suspicious patterns
 */
export function detectSuspiciousActivity(userId?: string, ip?: string) {
  const recentEvents = securityEvents.filter(e => {
    const isRecent = e.timestamp >= new Date(Date.now() - 60 * 60 * 1000) // Last hour
    const matchesUser = userId ? e.userId === userId : true
    const matchesIP = ip ? e.ip === ip : true
    return isRecent && matchesUser && matchesIP
  })

  const suspiciousPatterns = {
    multipleAuthFailures: recentEvents.filter(e => e.type === 'AUTH_FAILURE').length >= 5,
    rateLimitExceeded: recentEvents.filter(e => e.type === 'RATE_LIMIT_EXCEEDED').length >= 3,
    injectionAttempts: recentEvents.filter(e => 
      e.type === 'SQL_INJECTION_ATTEMPT' || e.type === 'XSS_ATTEMPT'
    ).length >= 2,
    pathTraversalAttempts: recentEvents.filter(e => e.type === 'PATH_TRAVERSAL_ATTEMPT').length >= 2,
    privilegeEscalation: recentEvents.filter(e => e.type === 'PRIVILEGE_ESCALATION').length >= 1,
  }

  const isSuspicious = Object.values(suspiciousPatterns).some(Boolean)
  
  if (isSuspicious) {
    logSecurityEvent(
      'SUSPICIOUS_REQUEST',
      'HIGH',
      {
        patterns: suspiciousPatterns,
        eventCount: recentEvents.length,
        userId,
        ip
      },
      userId
    )
  }

  return {
    isSuspicious,
    patterns: suspiciousPatterns,
    riskScore: calculateRiskScore(suspiciousPatterns)
  }
}

/**
 * Helper functions
 */
function generateEventId(): string {
  return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function getClientIP(request?: NextRequest): string {
  if (!request) return 'unknown'
  
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function getUserAgent(request?: NextRequest): string {
  return request?.headers.get('user-agent') || 'unknown'
}

function getTopIPs(events: SecurityEvent[], limit = 5) {
  const ipCounts = events.reduce((acc, event) => {
    acc[event.ip] = (acc[event.ip] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(ipCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([ip, count]) => ({ ip, count }))
}

function calculateRiskScore(patterns: Record<string, boolean>): number {
  const weights = {
    multipleAuthFailures: 30,
    rateLimitExceeded: 20,
    injectionAttempts: 40,
    pathTraversalAttempts: 35,
    privilegeEscalation: 50,
  }

  return Object.entries(patterns).reduce((score, [pattern, detected]) => {
    if (detected) {
      score += weights[pattern as keyof typeof weights] || 10
    }
    return score
  }, 0)
}

/**
 * Middleware helper for automatic security logging
 */
export function createSecurityMiddleware() {
  return {
    logAuthFailure: (userId: string, reason: string, request?: NextRequest) => {
      logSecurityEvent(
        'AUTH_FAILURE',
        'MEDIUM',
        { reason, timestamp: new Date().toISOString() },
        userId,
        request
      )
    },
    
    logRateLimitExceeded: (identifier: string, endpoint: string, request?: NextRequest) => {
      logSecurityEvent(
        'RATE_LIMIT_EXCEEDED',
        'MEDIUM',
        { identifier, endpoint, timestamp: new Date().toISOString() },
        undefined,
        request
      )
    },
    
    logSuspiciousRequest: (details: Record<string, any>, request?: NextRequest) => {
      logSecurityEvent(
        'SUSPICIOUS_REQUEST',
        'HIGH',
        details,
        undefined,
        request
      )
    },
    
    logUnauthorizedAccess: (userId: string, resource: string, request?: NextRequest) => {
      logSecurityEvent(
        'UNAUTHORIZED_ACCESS',
        'HIGH',
        { resource, timestamp: new Date().toISOString() },
        userId,
        request
      )
    }
  }
}

export const securityLogger = createSecurityMiddleware()