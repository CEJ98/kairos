/**
 * Performance Enhancements for Kairos Fitness
 * Additional optimizations beyond the base performance.ts
 */

import { logger } from './logger'
import { PerformanceMonitor } from './performance'

// Web Vitals monitoring
export class WebVitalsMonitor {
  private static vitals: Map<string, number> = new Map()

  static recordVital(name: string, value: number) {
    this.vitals.set(name, value)
    
    // Log poor performance metrics
    const thresholds = {
      'CLS': 0.1,
      'FID': 100,
      'FCP': 1800,
      'LCP': 2500,
      'TTFB': 800
    }

    if (thresholds[name as keyof typeof thresholds] && value > thresholds[name as keyof typeof thresholds]) {
      logger.warn(`Poor ${name} performance: ${value}`, 'PERFORMANCE')
    }
  }

  static getVitals() {
    return Object.fromEntries(this.vitals)
  }

  static initWebVitals() {
    if (typeof window === 'undefined') return

    // Observe Core Web Vitals
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(metric => this.recordVital('CLS', metric.value))
      getFID(metric => this.recordVital('FID', metric.value))
      getFCP(metric => this.recordVital('FCP', metric.value))
      getLCP(metric => this.recordVital('LCP', metric.value))
      getTTFB(metric => this.recordVital('TTFB', metric.value))
    }).catch(err => {
      logger.error('Failed to load web-vitals:', err, 'PERFORMANCE')
    })
  }
}

// Component performance optimization
export class ComponentOptimizer {
  // Memoization helper with deep comparison
  static createMemoizedComponent<T extends React.ComponentType<any>>(
    Component: T,
    areEqual?: (prevProps: any, nextProps: any) => boolean
  ): T {
    const React = require('react')
    return React.memo(Component, areEqual) as T
  }

  // Virtual scrolling for large lists
  static getVirtualScrollConfig(itemHeight: number, containerHeight: number) {
    return {
      itemHeight,
      containerHeight,
      overscan: 5, // Render 5 extra items outside viewport
      getVisibleRange: (scrollTop: number) => {
        const start = Math.floor(scrollTop / itemHeight)
        const visibleCount = Math.ceil(containerHeight / itemHeight)
        return {
          start: Math.max(0, start - 5),
          end: start + visibleCount + 5
        }
      }
    }
  }

  // Debounced search optimization
  static createDebouncedSearch(searchFn: (query: string) => void, delay: number = 300) {
    let timeoutId: NodeJS.Timeout
    
    return (query: string) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => searchFn(query), delay)
    }
  }
}

// API request optimization
export class APIOptimizer {
  private static requestCache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private static pendingRequests = new Map<string, Promise<any>>()

  // Request deduplication
  static async dedupedRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl: number = 5000
  ): Promise<T> {
    // Check cache first
    const cached = this.requestCache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }

    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }

    // Make new request
    const promise = requestFn().then(data => {
      this.requestCache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      })
      this.pendingRequests.delete(key)
      return data
    }).catch(error => {
      this.pendingRequests.delete(key)
      throw error
    })

    this.pendingRequests.set(key, promise)
    return promise
  }

  // Batch API requests
  static async batchRequests<T>(
    requests: Array<() => Promise<T>>,
    batchSize: number = 5
  ): Promise<T[]> {
    const results: T[] = []
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize)
      const batchResults = await Promise.all(batch.map(req => req()))
      results.push(...batchResults)
    }
    
    return results
  }

  // Request retry with exponential backoff
  static async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn()
      } catch (error) {
        lastError = error as Error
        
        if (attempt === maxRetries) break
        
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw lastError!
  }
}

// Image optimization utilities
export class ImageOptimizer {
  // Progressive image loading
  static createProgressiveLoader() {
    if (typeof window === 'undefined') return

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          const src = img.dataset.src
          const srcset = img.dataset.srcset
          
          if (src) {
            img.src = src
            img.removeAttribute('data-src')
          }
          
          if (srcset) {
            img.srcset = srcset
            img.removeAttribute('data-srcset')
          }
          
          img.classList.add('loaded')
          observer.unobserve(img)
        }
      })
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    })

    return observer
  }

  // WebP support detection
  static supportsWebP(): Promise<boolean> {
    return new Promise(resolve => {
      const webP = new Image()
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2)
      }
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
    })
  }

  // Generate responsive image URLs
  static generateResponsiveUrls(baseUrl: string, sizes: number[]) {
    return sizes.map(size => ({
      url: `${baseUrl}?w=${size}&q=75&f=webp`,
      width: size
    }))
  }
}

// Bundle size optimization
export class BundleAnalyzer {
  // Dynamic import with loading states
  static async loadChunk<T>(
    importFn: () => Promise<{ default: T }>,
    onLoading?: () => void,
    onError?: (error: Error) => void
  ): Promise<T> {
    try {
      onLoading?.()
      const stopTimer = PerformanceMonitor.startTimer('chunk_load')
      
      const loadedModule = await importFn()
      const duration = stopTimer()
      
      logger.debug(`Chunk loaded in ${duration.toFixed(2)}ms`, 'PERFORMANCE')
      return loadedModule.default
    } catch (error) {
      const err = error as Error
      logger.error('Failed to load chunk:', err, 'PERFORMANCE')
      onError?.(err)
      throw err
    }
  }

  // Preload critical chunks
  static preloadCriticalChunks() {
    if (typeof window === 'undefined') return

    // Preload after initial page load
    setTimeout(() => {
      // Add critical chunks here when components are available
      logger.debug('Critical chunks preloading initialized', 'PERFORMANCE')
    }, 2000)
  }
}

// Memory leak prevention
export class MemoryManager {
  private static observers: Set<any> = new Set()
  private static timers: Set<NodeJS.Timeout> = new Set()
  private static listeners: Set<{ element: Element; event: string; handler: Function }> = new Set()

  // Track observers for cleanup
  static trackObserver(observer: any) {
    this.observers.add(observer)
    return observer
  }

  // Track timers for cleanup
  static trackTimer(timer: NodeJS.Timeout) {
    this.timers.add(timer)
    return timer
  }

  // Track event listeners for cleanup
  static trackListener(element: Element, event: string, handler: Function) {
    const listener = { element, event, handler }
    this.listeners.add(listener)
    element.addEventListener(event, handler as EventListener)
    return () => {
      element.removeEventListener(event, handler as EventListener)
      this.listeners.delete(listener)
    }
  }

  // Cleanup all tracked resources
  static cleanup() {
    // Disconnect observers
    this.observers.forEach(observer => {
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect()
      }
    })
    this.observers.clear()

    // Clear timers
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()

    // Remove event listeners
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler as EventListener)
    })
    this.listeners.clear()
  }
}

// Performance monitoring dashboard
export class PerformanceDashboard {
  static generateReport() {
    const metrics = PerformanceMonitor.getAllMetrics()
    const vitals = WebVitalsMonitor.getVitals()
    const memory = typeof window !== 'undefined' && (performance as any).memory ? {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
    } : null

    return {
      timestamp: new Date().toISOString(),
      metrics,
      vitals,
      memory,
      recommendations: this.generateRecommendations(metrics, vitals)
    }
  }

  private static generateRecommendations(metrics: any, vitals: any) {
    const recommendations: string[] = []

    // Check for slow queries
    Object.entries(metrics).forEach(([key, data]: [string, any]) => {
      if (key.includes('db.') && data.avg > 500) {
        recommendations.push(`Optimize database query: ${key} (avg: ${data.avg.toFixed(2)}ms)`)
      }
    })

    // Check Core Web Vitals
    if (vitals.LCP > 2500) {
      recommendations.push('Improve Largest Contentful Paint (LCP) - consider image optimization')
    }
    if (vitals.FID > 100) {
      recommendations.push('Improve First Input Delay (FID) - reduce JavaScript execution time')
    }
    if (vitals.CLS > 0.1) {
      recommendations.push('Improve Cumulative Layout Shift (CLS) - avoid layout shifts')
    }

    return recommendations
  }
}

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  // Initialize Web Vitals monitoring
  WebVitalsMonitor.initWebVitals()
  
  // Preload critical chunks after checking if components exist
  setTimeout(() => {
    const criticalChunks: string[] = [
      // Only preload if components exist
    ]
    
    criticalChunks.forEach((chunk: string) => {
      try {
        logger.info(`Preloading chunk: ${chunk}`)
      } catch (err: any) {
        logger.warn('Failed to preload chunk:', err, 'PERFORMANCE')
      }
    })
  }, 2000)
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    MemoryManager.cleanup()
  })
}