/**
 * Database Performance Monitoring and Query Analysis
 * Tracks query performance, identifies bottlenecks, and provides optimization insights
 */

import { PrismaClient } from '@prisma/client'
import { cacheManager } from './cache-manager'
import { logger } from './logger'

// Performance metrics storage
interface QueryMetrics {
  query: string
  duration: number
  timestamp: Date
  params?: any
  model?: string
  action?: string
}

interface PerformanceStats {
  totalQueries: number
  avgDuration: number
  slowQueries: QueryMetrics[]
  topModels: Record<string, number>
  topActions: Record<string, number>
  hourlyStats: Record<string, number>
}

class DatabaseMonitor {
  private static instance: DatabaseMonitor
  private metrics: QueryMetrics[] = []
  private maxMetrics = 10000 // Keep last 10k queries
  private slowQueryThreshold = 1000 // 1 second
  private isEnabled = process.env.NODE_ENV !== 'test'

  private constructor() {}

  public static getInstance(): DatabaseMonitor {
    if (!DatabaseMonitor.instance) {
      DatabaseMonitor.instance = new DatabaseMonitor()
    }
    return DatabaseMonitor.instance
  }

  /**
   * Record query execution metrics
   */
  public recordQuery(metrics: QueryMetrics): void {
    if (!this.isEnabled) return

    this.metrics.push(metrics)

    // Maintain metrics array size
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Log slow queries immediately
    if (metrics.duration > this.slowQueryThreshold) {
      logger.db(`Slow query detected (${metrics.duration}ms)`, {
        model: metrics.model,
        action: metrics.action,
        duration: metrics.duration,
        timestamp: metrics.timestamp
      })
    }

    // Log extremely slow queries with more detail
    if (metrics.duration > 5000) {
      logger.error(`CRITICAL: Very slow query (${metrics.duration}ms)`, {
        query: metrics.query.substring(0, 200),
        model: metrics.model,
        action: metrics.action,
        params: metrics.params,
        timestamp: metrics.timestamp
      }, 'DATABASE')
    }
  }

  /**
   * Get comprehensive performance statistics
   */
  public getStats(timeWindow?: number): PerformanceStats {
    const now = new Date()
    const windowStart = timeWindow ? new Date(now.getTime() - timeWindow) : null
    
    const relevantMetrics = windowStart 
      ? this.metrics.filter(m => m.timestamp >= windowStart)
      : this.metrics

    if (relevantMetrics.length === 0) {
      return {
        totalQueries: 0,
        avgDuration: 0,
        slowQueries: [],
        topModels: {},
        topActions: {},
        hourlyStats: {}
      }
    }

    // Calculate basic stats
    const totalQueries = relevantMetrics.length
    const avgDuration = relevantMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries
    const slowQueries = relevantMetrics
      .filter(m => m.duration > this.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)

    // Aggregate by model
    const topModels: Record<string, number> = {}
    relevantMetrics.forEach(m => {
      if (m.model) {
        topModels[m.model] = (topModels[m.model] || 0) + 1
      }
    })

    // Aggregate by action
    const topActions: Record<string, number> = {}
    relevantMetrics.forEach(m => {
      if (m.action) {
        topActions[m.action] = (topActions[m.action] || 0) + 1
      }
    })

    // Hourly distribution
    const hourlyStats: Record<string, number> = {}
    relevantMetrics.forEach(m => {
      const hour = m.timestamp.getHours().toString().padStart(2, '0')
      hourlyStats[hour] = (hourlyStats[hour] || 0) + 1
    })

    return {
      totalQueries,
      avgDuration: Math.round(avgDuration * 100) / 100,
      slowQueries,
      topModels,
      topActions,
      hourlyStats
    }
  }

  /**
   * Get query optimization recommendations
   */
  public getOptimizationRecommendations(): string[] {
    const recommendations: string[] = []
    const stats = this.getStats()

    // Check for excessive slow queries
    const slowQueryRate = (stats.slowQueries.length / stats.totalQueries) * 100
    if (slowQueryRate > 5) {
      recommendations.push(`High slow query rate: ${slowQueryRate.toFixed(1)}%. Consider adding indexes or optimizing query patterns.`)
    }

    // Check average query time
    if (stats.avgDuration > 500) {
      recommendations.push(`High average query time: ${stats.avgDuration}ms. Consider query optimization and caching.`)
    }

    // Check for N+1 patterns (many queries to same model)
    Object.entries(stats.topModels).forEach(([model, count]) => {
      if (count > stats.totalQueries * 0.4) {
        recommendations.push(`Potential N+1 query pattern detected on ${model} model. Consider using 'include' or 'select' to fetch related data.`)
      }
    })

    // Check for excessive findMany without pagination
    if (stats.topActions.findMany > stats.totalQueries * 0.3) {
      recommendations.push(`Many findMany queries detected. Ensure proper pagination is implemented for large datasets.`)
    }

    return recommendations
  }

  /**
   * Generate performance report
   */
  public generateReport(format: 'json' | 'text' = 'text'): string | object {
    const stats = this.getStats()
    const recommendations = this.getOptimizationRecommendations()
    const cacheStats = cacheManager.getStats()

    const report = {
      generatedAt: new Date().toISOString(),
      databaseStats: {
        totalQueries: stats.totalQueries,
        avgDuration: `${stats.avgDuration}ms`,
        slowQueriesCount: stats.slowQueries.length,
        slowQueryThreshold: `${this.slowQueryThreshold}ms`
      },
      cacheStats: {
        hitRate: `${cacheStats.hitRate}%`,
        totalOperations: cacheStats.totalOperations,
        hitCount: cacheStats.hitCount,
        missCount: cacheStats.missCount
      },
      topModels: Object.entries(stats.topModels)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([model, count]) => ({ model, queries: count })),
      topActions: Object.entries(stats.topActions)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([action, count]) => ({ action, queries: count })),
      slowestQueries: stats.slowQueries.slice(0, 5).map(q => ({
        model: q.model,
        action: q.action,
        duration: `${q.duration}ms`,
        timestamp: q.timestamp.toISOString()
      })),
      recommendations,
      performanceScore: this.calculatePerformanceScore(stats, cacheStats)
    }

    if (format === 'json') {
      return report
    }

    // Text format
    return `
📊 DATABASE PERFORMANCE REPORT
Generated: ${report.generatedAt}

📈 Query Statistics:
• Total Queries: ${report.databaseStats.totalQueries}
• Average Duration: ${report.databaseStats.avgDuration}
• Slow Queries: ${report.databaseStats.slowQueriesCount}

🎯 Cache Performance:
• Hit Rate: ${report.cacheStats.hitRate}
• Total Operations: ${report.cacheStats.totalOperations}

🔍 Top Models:
${report.topModels.map(m => `• ${m.model}: ${m.queries} queries`).join('\n')}

⚡ Top Actions:
${report.topActions.map(a => `• ${a.action}: ${a.queries} queries`).join('\n')}

🐌 Slowest Queries:
${report.slowestQueries.map(q => `• ${q.model}.${q.action}: ${q.duration}`).join('\n')}

💡 Recommendations:
${recommendations.map(r => `• ${r}`).join('\n')}

🏆 Performance Score: ${report.performanceScore}/100
    `.trim()
  }

  /**
   * Calculate overall performance score (0-100)
   */
  private calculatePerformanceScore(stats: PerformanceStats, cacheStats: any): number {
    let score = 100

    // Penalize slow queries
    const slowQueryRate = (stats.slowQueries.length / stats.totalQueries) * 100
    score -= slowQueryRate * 2

    // Penalize high average duration
    if (stats.avgDuration > 200) {
      score -= Math.min(40, (stats.avgDuration - 200) / 10)
    }

    // Reward good cache hit rate
    if (cacheStats.hitRate < 70) {
      score -= (70 - cacheStats.hitRate)
    }

    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  /**
   * Clear metrics (useful for testing)
   */
  public clearMetrics(): void {
    this.metrics = []
  }

  /**
   * Health check for database performance
   */
  public healthCheck(): {
    status: 'healthy' | 'warning' | 'critical'
    issues: string[]
    metrics: {
      avgDuration: number
      slowQueryCount: number
      totalQueries: number
    }
  } {
    const stats = this.getStats(5 * 60 * 1000) // Last 5 minutes
    const issues: string[] = []

    // Check for critical issues
    if (stats.avgDuration > 2000) {
      issues.push('Critical: Very high average query duration')
    }

    const slowQueryRate = stats.totalQueries > 0 ? (stats.slowQueries.length / stats.totalQueries) * 100 : 0
    if (slowQueryRate > 20) {
      issues.push('Critical: Very high slow query rate')
    }

    // Check for warnings
    if (stats.avgDuration > 1000) {
      issues.push('Warning: High average query duration')
    }

    if (slowQueryRate > 10) {
      issues.push('Warning: High slow query rate')
    }

    const status = issues.some(i => i.startsWith('Critical')) ? 'critical' :
                  issues.some(i => i.startsWith('Warning')) ? 'warning' : 'healthy'

    return {
      status,
      issues,
      metrics: {
        avgDuration: stats.avgDuration,
        slowQueryCount: stats.slowQueries.length,
        totalQueries: stats.totalQueries
      }
    }
  }
}

/**
 * Prisma middleware for automatic query monitoring
 */
export function createPerformanceMiddleware(monitor: DatabaseMonitor) {
  return async (params: any, next: any) => {
    const start = Date.now()
    
    try {
      const result = await next(params)
      const duration = Date.now() - start
      
      monitor.recordQuery({
        query: `${params.model}.${params.action}`,
        duration,
        timestamp: new Date(),
        model: params.model,
        action: params.action,
        params: process.env.NODE_ENV === 'development' ? params.args : undefined
      })
      
      return result
    } catch (error) {
      const duration = Date.now() - start
      
      monitor.recordQuery({
        query: `${params.model}.${params.action} (ERROR)`,
        duration,
        timestamp: new Date(),
        model: params.model,
        action: params.action
      })
      
      throw error
    }
  }
}

// Export singleton instance
export const dbMonitor = DatabaseMonitor.getInstance()

// Enhanced Prisma client with monitoring
export function createMonitoredPrismaClient(): PrismaClient {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
  })

  // Add performance monitoring middleware
  prisma.$use(createPerformanceMiddleware(dbMonitor))

  return prisma
}

export default dbMonitor