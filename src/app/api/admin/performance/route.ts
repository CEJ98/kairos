/**
 * Admin Performance Monitoring API
 * Provides database and application performance metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbMonitor } from '@/lib/db-monitor'
import { cacheManager } from '@/lib/cache-manager'

import { logger } from '@/lib/logger'
// GET /api/admin/performance - Get performance metrics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only allow admin access
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'json'
    const timeWindow = searchParams.get('timeWindow') 
      ? parseInt(searchParams.get('timeWindow')!) 
      : undefined

    // Get comprehensive performance data
    const [
      dbStats,
      cacheStats,
      healthCheck,
      recommendations,
      report
    ] = await Promise.all([
      Promise.resolve(dbMonitor.getStats(timeWindow)),
      Promise.resolve(cacheManager.getStats()),
      Promise.resolve(dbMonitor.healthCheck()),
      Promise.resolve(dbMonitor.getOptimizationRecommendations()),
      Promise.resolve(dbMonitor.generateReport(format as any))
    ])

    const performanceData = {
      timestamp: new Date().toISOString(),
      system: {
        status: healthCheck.status,
        issues: healthCheck.issues,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      },
      database: {
        totalQueries: dbStats.totalQueries,
        avgDuration: dbStats.avgDuration,
        slowQueriesCount: dbStats.slowQueries.length,
        topModels: dbStats.topModels,
        topActions: dbStats.topActions,
        hourlyDistribution: dbStats.hourlyStats,
        slowQueries: dbStats.slowQueries.slice(0, 10).map(q => ({
          model: q.model,
          action: q.action,
          duration: q.duration,
          timestamp: q.timestamp
        }))
      },
      cache: {
        hitRate: cacheStats.hitRate,
        hitCount: cacheStats.hitCount,
        missCount: cacheStats.missCount,
        totalOperations: cacheStats.totalOperations,
        cacheInfo: cacheStats.cacheInfo
      },
      recommendations,
      fullReport: format === 'text' ? report : null
    }

    if (format === 'text') {
      return new NextResponse(report as string, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': 'attachment; filename=performance-report.txt'
        }
      })
    }

    return NextResponse.json(performanceData)

  } catch (error) {
    logger.error('Error fetching performance metrics:', error, 'API')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/performance - Perform performance actions
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only allow admin access
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { action, cacheKey } = body

    switch (action) {
      case 'clearCache':
        if (cacheKey) {
          await cacheManager.clear(cacheKey)
        } else {
          // Clear all caches
          const cacheStats = cacheManager.getStats()
          for (const key of Object.keys(cacheStats.cacheInfo)) {
            await cacheManager.clear(key as any)
          }
        }
        return NextResponse.json({ 
          success: true, 
          message: cacheKey ? `Cache ${cacheKey} cleared` : 'All caches cleared' 
        })

      case 'resetMetrics':
        dbMonitor.clearMetrics()
        cacheManager.resetStats()
        return NextResponse.json({ 
          success: true, 
          message: 'Performance metrics reset' 
        })

      case 'generateReport':
        const report = dbMonitor.generateReport('json')
        return NextResponse.json({
          success: true,
          report
        })

      case 'healthCheck':
        const healthCheck = dbMonitor.healthCheck()
        const cacheHealth = cacheManager.healthCheck()
        
        return NextResponse.json({
          success: true,
          health: {
            database: healthCheck,
            cache: cacheHealth,
            overall: healthCheck.status === 'healthy' && cacheHealth.status === 'healthy' 
              ? 'healthy' 
              : healthCheck.status === 'critical' || cacheHealth.status === 'critical'
              ? 'critical'
              : 'warning'
          }
        })

      case 'optimize':
        // Perform automatic optimizations
        const recommendations = dbMonitor.getOptimizationRecommendations()
        
        // Example: Clear caches if hit rate is low
        const cacheStats = cacheManager.getStats()
        const optimizations: string[] = []
        
        if (cacheStats.hitRate < 60) {
          // Reset cache to allow fresh data
          cacheManager.resetStats()
          optimizations.push('Cache statistics reset due to low hit rate')
        }

        // Example: Clear old metrics if too many
        const dbStats = dbMonitor.getStats()
        if (dbStats.totalQueries > 50000) {
          dbMonitor.clearMetrics()
          optimizations.push('Database metrics cleared due to excessive accumulation')
        }

        return NextResponse.json({
          success: true,
          optimizations,
          recommendations
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Error performing performance action:', error, 'API')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/performance - Update performance settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only allow admin access
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { setting, value } = body

    // This would update performance settings
    // For now, return the current settings
    const settings = {
      monitoring: {
        enabled: process.env.NODE_ENV !== 'test',
        slowQueryThreshold: 1000,
        maxMetrics: 10000
      },
      caching: {
        enabled: true,
        defaultTTL: 300000, // 5 minutes
        maxSize: 1000
      }
    }

    return NextResponse.json({
      success: true,
      settings,
      message: 'Performance settings retrieved'
    })

  } catch (error) {
    logger.error('Error updating performance settings:', error, 'API')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}