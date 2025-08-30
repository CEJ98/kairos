import { cache } from 'react'
import { unstable_cache } from 'next/cache'

import { logger } from './logger'
// Configuración de caché para diferentes tipos de datos
export const CACHE_CONFIG = {
  // Datos del usuario (5 minutos)
  user: {
    revalidate: 300,
    tags: ['user']
  },
  
  // Ejercicios (1 hora - datos semi-estáticos)
  exercises: {
    revalidate: 3600,
    tags: ['exercises']
  },
  
  // Entrenamientos del usuario (10 minutos)
  workouts: {
    revalidate: 600,
    tags: ['workouts']
  },
  
  // Progreso y estadísticas (2 minutos)
  progress: {
    revalidate: 120,
    tags: ['progress']
  },
  
  // Community feed (30 segundos)
  community: {
    revalidate: 30,
    tags: ['community']
  },
  
  // Leaderboard (1 minuto)
  leaderboard: {
    revalidate: 60,
    tags: ['leaderboard']
  }
}

// Función para crear caché con configuración específica
export function createCachedFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyParts: string[],
  config: { revalidate?: number; tags?: string[] }
) {
  return unstable_cache(fn, keyParts, config)
}

// Cache React para componentes
export const cacheComponent = cache

// Utilidades para optimizar consultas de base de datos
export class QueryOptimizer {
  // Batch multiple queries into one
  static async batchQueries<T>(queries: Promise<T>[]): Promise<T[]> {
    return Promise.all(queries)
  }
  
  // Implementar pagination eficiente
  static getPaginationParams(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit
    const take = Math.min(limit, 100) // Límite máximo de 100
    
    return { skip, take }
  }
  
  // Optimizar selects de Prisma
  static getSelectFields(fields: string[]) {
    return fields.reduce((acc, field) => {
      acc[field] = true
      return acc
    }, {} as Record<string, boolean>)
  }
}

// Métricas de performance
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map()
  
  static startTimer(key: string): () => number {
    const start = performance.now()
    
    return () => {
      const duration = performance.now() - start
      this.recordMetric(key, duration)
      return duration
    }
  }
  
  static recordMetric(key: string, value: number) {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }
    
    const values = this.metrics.get(key)!
    values.push(value)
    
    // Mantener solo los últimos 100 valores
    if (values.length > 100) {
      values.shift()
    }
  }
  
  static getMetrics(key: string) {
    const values = this.metrics.get(key) || []
    
    if (values.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 }
    }
    
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)
    
    return { avg, min, max, count: values.length }
  }
  
  static getAllMetrics() {
    const result: Record<string, any> = {}
    
    for (const [key] of Array.from(this.metrics.entries())) {
      result[key] = this.getMetrics(key)
    }
    
    return result
  }
}

// Lazy loading utilities
export class LazyLoader {
  // Lazy load images with intersection observer
  static observeImages() {
    if (typeof window === 'undefined') return
    
    const images = document.querySelectorAll('img[data-src]')
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          img.src = img.dataset.src!
          img.removeAttribute('data-src')
          imageObserver.unobserve(img)
        }
      })
    })
    
    images.forEach(img => imageObserver.observe(img))
  }
  
  // Dynamic import with error handling
  static async loadComponent<T>(
    importFn: () => Promise<{ default: T }>,
    fallback?: T
  ): Promise<T> {
    try {
      const moduleResult = await importFn()
      return moduleResult.default
    } catch (error) {
      logger.error('Error loading component:', error, 'PERFORMANCE')
      if (fallback) return fallback
      throw error
    }
  }
}

// Bundle analyzer utilities
export class BundleOptimizer {
  // Tree shaking helper - analyze unused exports
  static analyzeBundle() {
    if (process.env.ANALYZE === 'true') {
      logger.debug('Bundle analysis enabled', 'PERFORMANCE')
    }
  }
  
  // Code splitting recommendations
  static getChunkStrategy() {
    return {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all'
      },
      common: {
        minChunks: 2,
        priority: -10,
        reuseExistingChunk: true
      }
    }
  }
}

// Database connection optimization
export class DBOptimizer {
  private static connectionPool: any = null
  
  // Connection pooling configuration
  static getPoolConfig() {
    return {
      max: parseInt(process.env.DB_POOL_MAX || '20'),
      min: parseInt(process.env.DB_POOL_MIN || '5'),
      acquire: 30000,
      idle: 10000
    }
  }
  
  // Query performance monitoring
  static async executeWithMetrics<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const stopTimer = PerformanceMonitor.startTimer(`db.${queryName}`)
    
    try {
      const result = await queryFn()
      const duration = stopTimer()
      
      // Log slow queries (>1000ms)
      if (duration > 1000) {
        logger.warn('Slow query detected: ${queryName} took ${duration.toFixed(2)}ms', 'PERFORMANCE')
      }
      
      return result
    } catch (error) {
      stopTimer()
      throw error
    }
  }
}

// Memory management
export class MemoryOptimizer {
  // WeakMap for caching without memory leaks
  private static cache = new WeakMap()
  
  static setCache(key: object, value: any) {
    this.cache.set(key, value)
  }
  
  static getCache(key: object) {
    return this.cache.get(key)
  }
  
  // Memory usage monitoring
  static getMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage()
      
      return {
        rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100,
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100,
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100,
        external: Math.round(usage.external / 1024 / 1024 * 100) / 100
      }
    }
    
    return null
  }
}

// Resource preloading
export class ResourcePreloader {
  // Preload critical resources
  static preloadCriticalResources() {
    if (typeof document === 'undefined') return
    
    const criticalResources = [
      '/images/hero-bg.jpg',
      '/fonts/inter-variable.woff2'
    ]
    
    criticalResources.forEach(resource => {
      const link = document.createElement('link')
      link.rel = 'preload'
      
      if (resource.endsWith('.jpg') || resource.endsWith('.png')) {
        link.as = 'image'
      } else if (resource.endsWith('.woff2') || resource.endsWith('.woff')) {
        link.as = 'font'
        link.type = 'font/woff2'
        link.crossOrigin = 'anonymous'
      }
      
      link.href = resource
      document.head.appendChild(link)
    })
  }
  
  // Prefetch next page resources
  static prefetchRoute(route: string) {
    if (typeof document === 'undefined') return
    
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = route
    document.head.appendChild(link)
  }
}

// Service Worker utilities
export class ServiceWorkerManager {
  static async register() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }
    
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      logger.debug('Service Worker registered:', registration, 'PERFORMANCE')
      
      // Update available
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              logger.debug('New version available', 'PERFORMANCE')
            }
          })
        }
      })
      
      return registration
    } catch (error) {
      logger.error('Service Worker registration failed:', error, 'PERFORMANCE')
    }
  }
  
  static async unregister() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }
    
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map(registration => registration.unregister()))
  }
}