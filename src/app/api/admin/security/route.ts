import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  getSecurityEvents, 
  getSecurityStats, 
  resolveSecurityEvent,
  detectSuspiciousActivity 
} from '@/lib/security-audit'
import { logger } from '@/lib/logger'
import { getCSRFStats } from '@/lib/csrf-protection'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiter'
import { applySecurityHeaders } from '@/lib/security-headers'

/**
 * GET /api/admin/security
 * Returns security dashboard data for administrators
 */
export async function GET(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(RATE_LIMIT_CONFIGS.api)()
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    // Check admin authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const url = new URL(req.url)
    const timeframe = url.searchParams.get('timeframe') as 'hour' | 'day' | 'week' || 'day'
    const eventType = url.searchParams.get('type')
    const severity = url.searchParams.get('severity')
    const limit = parseInt(url.searchParams.get('limit') || '50')

    // Get security statistics
    const stats = getSecurityStats(timeframe)
    
    // Get recent security events
    const events = getSecurityEvents({
      type: eventType as any,
      severity: severity as any,
      limit,
      resolved: false // Only unresolved events by default
    })

    // Get CSRF token statistics
    const csrfStats = getCSRFStats()

    // Detect current suspicious activity
    const suspiciousActivity = detectSuspiciousActivity()

    const response = NextResponse.json({
      stats,
      events,
      csrfStats,
      suspiciousActivity,
      timestamp: new Date().toISOString(),
      timeframe
    })

    return applySecurityHeaders(response)
    
  } catch (error) {
    logger.error('Error fetching security data:', error, 'API')
    
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    
    return applySecurityHeaders(response)
  }
}

/**
 * POST /api/admin/security
 * Resolve security events or perform security actions
 */
export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(RATE_LIMIT_CONFIGS.strict)()
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    // Check admin authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { action, eventId, data } = body

    let result: any = {}

    switch (action) {
      case 'resolve_event':
        if (!eventId) {
          return NextResponse.json(
            { error: 'Event ID is required' },
            { status: 400 }
          )
        }
        
        const resolved = resolveSecurityEvent(eventId)
        result = { 
          success: resolved,
          message: resolved ? 'Event resolved successfully' : 'Event not found'
        }
        break

      case 'get_user_activity':
        if (!data?.userId) {
          return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
          )
        }
        
        const userEvents = getSecurityEvents({
          userId: data.userId,
          limit: 100
        })
        
        const userSuspiciousActivity = detectSuspiciousActivity(data.userId)
        
        result = {
          events: userEvents,
          suspiciousActivity: userSuspiciousActivity,
          userId: data.userId
        }
        break

      case 'get_ip_activity':
        if (!data?.ip) {
          return NextResponse.json(
            { error: 'IP address is required' },
            { status: 400 }
          )
        }
        
        const ipEvents = getSecurityEvents({ limit: 100 })
          .filter(event => event.ip === data.ip)
        
        const ipSuspiciousActivity = detectSuspiciousActivity(undefined, data.ip)
        
        result = {
          events: ipEvents,
          suspiciousActivity: ipSuspiciousActivity,
          ip: data.ip
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const response = NextResponse.json({
      ...result,
      timestamp: new Date().toISOString()
    })

    return applySecurityHeaders(response)
    
  } catch (error) {
    logger.error('Error processing security action:', error, 'API')
    
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    
    return applySecurityHeaders(response)
  }
}