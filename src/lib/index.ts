/**
 * Barrel exports for lib modules
 * Centralizes imports and reduces duplication
 */

// Core utilities
export * from './utils'

// Database and ORM
export { prisma, dbMonitor, cacheManager } from './db'
export * from './db-monitor'
export * from './cache-manager'
export * from './optimized-queries'
// Exportaciones avanzadas de base de datos deshabilitadas por estabilidad de tipos
// export * from './database/advanced-optimizations'

// Authentication and security
export * from './auth'
export * from './security-audit'
export * from './security-headers'
export * from './csrf-protection'
export * from './rate-limiter'

// Validation
export * from './validations/consolidated'
export * from './advanced-validation'
export * from './form-validation'

// Performance and monitoring
// Exportaciones desde './performance' removidas: el módulo no expone estos miembros

// Unified cache system
export {
	UnifiedCacheManager,
	unifiedCache,
	apiCache,
	dataCache,
	resourceCache,
	sessionCache,
	useCache,
	initializeCacheSystem
} from './cache/consolidated-cache'

// Performance monitoring (consolidated)
export { 
	unifiedPerformanceMonitor,
	UnifiedPerformanceMonitor,
	usePerformanceMonitor,
	initializePerformanceMonitoring
} from './performance/consolidated-monitor'
// export { performanceEnhancer } from './performance'
export * from './performance-enhancements'
export { logger, logError, logWarning, logInfo, logDebug } from './logger'

// Services
export { WorkoutEngine } from './workout-engine'
export * from './personal-records'
export * from './trainer-assignment'
export * from './trainer-metrics'
export * from './nutrition-service'
export { NotificationService } from './notification-service'
export { AnalyticsEngine } from './analytics'
export * from './backup'

// External integrations
export * from './stripe'
export * from './email'
export { notificationService } from './notifications'

// PWA and client-side
export * from './pwa'
export * from './pwa/mobile-compatibility'
export * from './image-optimizer'

// SEO and metadata
export * from './seo'

// Internationalization
export * from '../i18n'
