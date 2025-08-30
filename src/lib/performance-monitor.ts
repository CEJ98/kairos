/**
 * Performance Monitoring and Optimization for Kairos Fitness
 * Tracks Core Web Vitals, API performance, and user experience metrics
 */

import React from 'react'

import { logger } from './logger'
// Types for performance monitoring
export interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
  url?: string
  userId?: string
}

export interface CoreWebVitals {
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  fcp: number // First Contentful Paint
  ttfb: number // Time to First Byte
  inp: number // Interaction to Next Paint
}

export interface APIPerformanceData {
  endpoint: string
  method: string
  duration: number
  statusCode: number
  timestamp: number
  userId?: string
  error?: string
}

export interface ResourceTimingData {
  name: string
  type: 'script' | 'stylesheet' | 'image' | 'font' | 'other'
  size: number
  duration: number
  startTime: number
}

/**
 * Performance Monitor Class
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private isClient: boolean
  private metrics: Map<string, PerformanceMetric[]> = new Map()

  constructor() {
    this.isClient = typeof window !== 'undefined'
    if (this.isClient) {
      this.initializeWebVitals()
      this.setupPerformanceObserver()
    }
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * Initialize Web Vitals monitoring
   */
  private initializeWebVitals(): void {
    if (!this.isClient) return

    // Import web-vitals dynamically to avoid SSR issues
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(this.onVitalMetric.bind(this))
      getFID(this.onVitalMetric.bind(this))
      getFCP(this.onVitalMetric.bind(this))
      getLCP(this.onVitalMetric.bind(this))
      getTTFB(this.onVitalMetric.bind(this))
    }).catch(error => {
      logger.warn('Web vitals not available:', error, 'PERFORMANCE')
    })
  }

  /**
   * Handle Web Vitals metric callback
   */
  private onVitalMetric(metric: any): void {
    const performanceMetric: PerformanceMetric = {
      name: metric.name,
      value: metric.value,
      rating: this.getRating(metric.name, metric.value),
      timestamp: Date.now(),
      url: window.location.href,
      userId: this.getCurrentUserId()
    }

    this.recordMetric(performanceMetric)
    this.sendMetricToAnalytics(performanceMetric)
  }

  /**
   * Setup Performance Observer for resource timing
   */
  private setupPerformanceObserver(): void {
    if (!this.isClient || !window.PerformanceObserver) return

    try {
      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handleNavigationTiming(entry as PerformanceNavigationTiming)
        }
      })
      navObserver.observe({ entryTypes: ['navigation'] })

      // Observe resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handleResourceTiming(entry as PerformanceResourceTiming)
        }
      })
      resourceObserver.observe({ entryTypes: ['resource'] })

    } catch (error) {
      logger.warn('Failed to setup PerformanceObserver:', error, 'PERFORMANCE')
    }
  }

  /**
   * Handle navigation timing data
   */
  private handleNavigationTiming(entry: PerformanceNavigationTiming): void {
    const metrics = {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      domInteractive: entry.domInteractive - entry.fetchStart,
    }

    Object.entries(metrics).forEach(([name, value]) => {
      if (value > 0) {
        const metric: PerformanceMetric = {
          name: `navigation.${name}`,
          value,
          rating: this.getRatingForNavigationMetric(name, value),
          timestamp: Date.now(),
          url: window.location.href,
          userId: this.getCurrentUserId()
        }
        this.recordMetric(metric)
      }
    })
  }

  /**
   * Handle resource timing data
   */
  private handleResourceTiming(entry: PerformanceResourceTiming): void {
    const resourceType = this.getResourceType(entry.name)
    const size = entry.transferSize || entry.decodedBodySize || 0
    
    // Record slow resources
    if (entry.duration > 1000) { // Slower than 1 second
      const metric: PerformanceMetric = {
        name: `resource.slow.${resourceType}`,
        value: entry.duration,
        rating: 'poor',
        timestamp: Date.now(),
        url: entry.name,
        userId: this.getCurrentUserId()
      }
      this.recordMetric(metric)
    }

    // Record large resources
    if (size > 500000) { // Larger than 500KB
      const metric: PerformanceMetric = {
        name: `resource.large.${resourceType}`,
        value: size,
        rating: 'poor',
        timestamp: Date.now(),
        url: entry.name,
        userId: this.getCurrentUserId()
      }
      this.recordMetric(metric)
    }
  }

  /**
   * Track API performance
   */
  trackAPIPerformance(
    endpoint: string,
    method: string,
    startTime: number,
    statusCode: number,
    error?: string
  ): void {
    const duration = Date.now() - startTime
    
    const metric: PerformanceMetric = {
      name: `api.${method.toLowerCase()}.${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`,
      value: duration,
      rating: this.getRatingForAPIMetric(duration, statusCode),
      timestamp: Date.now(),
      url: endpoint,
      userId: this.getCurrentUserId()
    }

    this.recordMetric(metric)
  }

  /**
   * Create custom performance mark
   */
  mark(name: string): void {
    if (!this.isClient) return
    
    try {
      performance.mark(name)
    } catch (error) {
      logger.warn(`Failed to create performance mark: ${name}`, error, 'PERFORMANCE')
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(category?: string): PerformanceMetric[] {
    if (category) {
      return this.metrics.get(category) || []
    }
    
    const allMetrics: PerformanceMetric[] = []
    for (const categoryMetrics of Array.from(this.metrics.values())) {
      allMetrics.push(...categoryMetrics)
    }
    return allMetrics
  }

  /**
   * Get Core Web Vitals summary
   */
  getWebVitalsSummary(): Partial<CoreWebVitals> {
    const vitals: Partial<CoreWebVitals> = {}
    
    const lcpMetrics = this.metrics.get('LCP') || []
    const fidMetrics = this.metrics.get('FID') || []
    const clsMetrics = this.metrics.get('CLS') || []
    const fcpMetrics = this.metrics.get('FCP') || []
    const ttfbMetrics = this.metrics.get('TTFB') || []

    if (lcpMetrics.length > 0) {
      vitals.lcp = lcpMetrics[lcpMetrics.length - 1].value
    }
    if (fidMetrics.length > 0) {
      vitals.fid = fidMetrics[fidMetrics.length - 1].value
    }
    if (clsMetrics.length > 0) {
      vitals.cls = clsMetrics[clsMetrics.length - 1].value
    }
    if (fcpMetrics.length > 0) {
      vitals.fcp = fcpMetrics[fcpMetrics.length - 1].value
    }
    if (ttfbMetrics.length > 0) {
      vitals.ttfb = ttfbMetrics[ttfbMetrics.length - 1].value
    }

    return vitals
  }

  // Private helper methods

  private recordMetric(metric: PerformanceMetric): void {
    const category = metric.name.split('.')[0]
    const categoryMetrics = this.metrics.get(category) || []
    categoryMetrics.push(metric)
    this.metrics.set(category, categoryMetrics)
    
    // Keep only last 50 metrics per category
    if (categoryMetrics.length > 50) {
      this.metrics.set(category, categoryMetrics.slice(-50))
    }
  }

  private sendMetricToAnalytics(metric: PerformanceMetric): void {
    // In production, send to analytics service
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Performance metric:', metric, 'PERFORMANCE')
    }
  }

  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      'LCP': { good: 2500, poor: 4000 },
      'FID': { good: 100, poor: 300 },
      'CLS': { good: 0.1, poor: 0.25 },
      'FCP': { good: 1800, poor: 3000 },
      'TTFB': { good: 800, poor: 1800 },
      'INP': { good: 200, poor: 500 }
    }

    const threshold = thresholds[name as keyof typeof thresholds]
    if (!threshold) return 'good'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  private getRatingForNavigationMetric(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 100) return 'good'
    if (value <= 1000) return 'needs-improvement'
    return 'poor'
  }

  private getRatingForAPIMetric(duration: number, statusCode: number): 'good' | 'needs-improvement' | 'poor' {
    if (statusCode >= 400) return 'poor'
    if (duration <= 200) return 'good'
    if (duration <= 1000) return 'needs-improvement'
    return 'poor'
  }

  private getResourceType(url: string): ResourceTimingData['type'] {
    if (url.match(/\.(js|mjs)$/)) return 'script'
    if (url.match(/\.css$/)) return 'stylesheet'
    if (url.match(/\.(png|jpg|jpeg|gif|webp|avif|svg)$/)) return 'image'
    if (url.match(/\.(woff|woff2|ttf|otf|eot)$/)) return 'font'
    return 'other'
  }

  private getCurrentUserId(): string | undefined {
    if (!this.isClient) return undefined
    
    try {
      const sessionUser = sessionStorage.getItem('user')
      if (sessionUser) {
        const user = JSON.parse(sessionUser)
        return user.id
      }
      return undefined
    } catch (error) {
      return undefined
    }
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance()
  
  return {
    mark: monitor.mark.bind(monitor),
    getMetrics: monitor.getMetrics.bind(monitor),
    getWebVitalsSummary: monitor.getWebVitalsSummary.bind(monitor),
    trackAPIPerformance: monitor.trackAPIPerformance.bind(monitor)
  }
}

// Initialize performance monitoring
export function initializePerformanceMonitoring() {
  if (typeof window !== 'undefined') {
    const monitor = PerformanceMonitor.getInstance()
    monitor.mark('app-init')
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()