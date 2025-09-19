/**
 * Consolidated Performance Monitor
 * Unifies performance monitoring capabilities from multiple classes
 */

import { logger } from '../logger'

// Unified performance metrics interface
export interface PerformanceMetrics {
	// Core Web Vitals
	LCP?: number // Largest Contentful Paint
	FID?: number // First Input Delay
	CLS?: number // Cumulative Layout Shift
	FCP?: number // First Contentful Paint
	TTFB?: number // Time to First Byte
	TTI?: number // Time to Interactive

	// Custom metrics
	componentRenderTime?: number
	apiResponseTime?: number
	databaseQueryTime?: number
	bundleSize?: number
	memoryUsage?: number
	cacheHitRate?: number

	// User experience metrics
	navigationTiming?: PerformanceNavigationTiming
	resourceTimings?: PerformanceResourceTiming[]
	userInteractions?: UserInteraction[]
}

export interface UserInteraction {
	type: 'click' | 'scroll' | 'input' | 'navigation'
	timestamp: number
	duration?: number
	target?: string
	metadata?: Record<string, any>
}

export interface PerformanceAlert {
	id: string
	type: 'warning' | 'critical'
	metric: string
	value: number
	threshold: number
	timestamp: number
	message: string
}

/**
 * Unified Performance Monitor
 * Consolidates functionality from multiple performance monitoring classes
 */
export class UnifiedPerformanceMonitor {
	private static instance: UnifiedPerformanceMonitor
	private metrics: Map<string, PerformanceMetrics> = new Map()
	private marks: Map<string, number> = new Map()
	private measures: Map<string, number> = new Map()
	private observers: PerformanceObserver[] = []
	private alerts: PerformanceAlert[] = []
	private thresholds: Record<string, number> = {
		LCP: 2500,
		FID: 100,
		CLS: 0.1,
		FCP: 1800,
		TTFB: 600,
		TTI: 3800,
		componentRenderTime: 16, // 60fps target
		apiResponseTime: 1000,
		databaseQueryTime: 500
	}

	private constructor() {
		if (typeof window !== 'undefined') {
			this.initializeObservers()
			this.startMonitoring()
		}
	}

	static getInstance(): UnifiedPerformanceMonitor {
		if (!UnifiedPerformanceMonitor.instance) {
			UnifiedPerformanceMonitor.instance = new UnifiedPerformanceMonitor()
		}
		return UnifiedPerformanceMonitor.instance
	}

	/**
	 * Initialize performance observers
	 */
	private initializeObservers(): void {
		try {
			// Web Vitals observer
			const vitalsObserver = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					this.processVitalsEntry(entry)
				}
			})

			// Observe different entry types
			const entryTypes = ['largest-contentful-paint', 'first-input', 'layout-shift']
			entryTypes.forEach(type => {
				try {
					vitalsObserver.observe({ type, buffered: true })
				} catch (e) {
					// Some browsers might not support all entry types
					logger.debug(`Performance observer type ${type} not supported`, e)
				}
			})

			this.observers.push(vitalsObserver)

			// Navigation timing observer
			const navigationObserver = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					this.processNavigationEntry(entry as PerformanceNavigationTiming)
				}
			})

			try {
				navigationObserver.observe({ type: 'navigation', buffered: true })
				this.observers.push(navigationObserver)
			} catch (e) {
				logger.debug('Navigation timing observer not supported', e)
			}

			// Resource timing observer
			const resourceObserver = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					this.processResourceEntry(entry as PerformanceResourceTiming)
				}
			})

			try {
				resourceObserver.observe({ type: 'resource', buffered: true })
				this.observers.push(resourceObserver)
			} catch (e) {
				logger.debug('Resource timing observer not supported', e)
			}

		} catch (error) {
			logger.error('Failed to initialize performance observers', error)
		}
	}

	/**
	 * Process Web Vitals entries
	 */
	private processVitalsEntry(entry: PerformanceEntry): void {
		const sessionId = this.getCurrentSessionId()
		const currentMetrics = this.metrics.get(sessionId) || {}

		switch (entry.entryType) {
			case 'largest-contentful-paint':
				currentMetrics.LCP = entry.startTime
				this.checkThreshold('LCP', entry.startTime)
				break
			case 'first-input':
				currentMetrics.FID = (entry as any).processingStart - entry.startTime
				this.checkThreshold('FID', (entry as any).processingStart - entry.startTime)
				break
			case 'layout-shift':
				if (!(entry as any).hadRecentInput) {
					currentMetrics.CLS = (currentMetrics.CLS || 0) + (entry as any).value
					this.checkThreshold('CLS', currentMetrics.CLS || 0)
				}
				break
		}

		this.metrics.set(sessionId, currentMetrics)
	}

	/**
	 * Process navigation timing entries
	 */
	private processNavigationEntry(entry: PerformanceNavigationTiming): void {
		const sessionId = this.getCurrentSessionId()
		const currentMetrics = this.metrics.get(sessionId) || {}

		currentMetrics.navigationTiming = entry
		currentMetrics.TTFB = entry.responseStart - entry.requestStart
		currentMetrics.FCP = entry.loadEventEnd - entry.fetchStart

		this.checkThreshold('TTFB', currentMetrics.TTFB!)
		this.checkThreshold('FCP', currentMetrics.FCP!)

		this.metrics.set(sessionId, currentMetrics)
	}

	/**
	 * Process resource timing entries
	 */
	private processResourceEntry(entry: PerformanceResourceTiming): void {
		const sessionId = this.getCurrentSessionId()
		const currentMetrics = this.metrics.get(sessionId) || {}

		if (!currentMetrics.resourceTimings) {
			currentMetrics.resourceTimings = []
		}

		currentMetrics.resourceTimings.push(entry)
		this.metrics.set(sessionId, currentMetrics)

		// Check for slow resources
		const duration = entry.responseEnd - entry.requestStart
		if (duration > 2000) { // 2 seconds threshold
			this.createAlert('warning', 'slowResource', duration, 2000, 
				`Slow resource detected: ${entry.name} (${duration.toFixed(2)}ms)`)
		}
	}

	/**
	 * Start performance monitoring
	 */
	private startMonitoring(): void {
		// Monitor memory usage
		setInterval(() => {
			this.collectMemoryMetrics()
		}, 30000) // Every 30 seconds

		// Monitor user interactions
		this.setupInteractionTracking()
	}

	/**
	 * Collect memory metrics
	 */
	private collectMemoryMetrics(): void {
		if ('memory' in performance) {
			const memory = (performance as any).memory
			const sessionId = this.getCurrentSessionId()
			const currentMetrics = this.metrics.get(sessionId) || {}

			currentMetrics.memoryUsage = memory.usedJSHeapSize
			this.metrics.set(sessionId, currentMetrics)

			// Check memory threshold (100MB)
			if (memory.usedJSHeapSize > 100 * 1024 * 1024) {
				this.createAlert('warning', 'memoryUsage', memory.usedJSHeapSize, 
					100 * 1024 * 1024, 'High memory usage detected')
			}
		}
	}

	/**
	 * Setup user interaction tracking
	 */
	private setupInteractionTracking(): void {
		const trackInteraction = (type: UserInteraction['type'], event: Event) => {
			const interaction: UserInteraction = {
				type,
				timestamp: performance.now(),
				target: (event.target as Element)?.tagName || 'unknown'
			}

			const sessionId = this.getCurrentSessionId()
			const currentMetrics = this.metrics.get(sessionId) || {}
			if (!currentMetrics.userInteractions) {
				currentMetrics.userInteractions = []
			}
			currentMetrics.userInteractions.push(interaction)
			this.metrics.set(sessionId, currentMetrics)
		}

		// Track clicks
		document.addEventListener('click', (e) => trackInteraction('click', e))
		// Track scrolls (throttled)
		let scrollTimeout: NodeJS.Timeout
		document.addEventListener('scroll', (e) => {
			clearTimeout(scrollTimeout)
			scrollTimeout = setTimeout(() => trackInteraction('scroll', e), 100)
		})
	}

	/**
	 * Mark performance point
	 */
	mark(name: string): void {
		const timestamp = performance.now()
		this.marks.set(name, timestamp)
		
		if (typeof performance.mark === 'function') {
			performance.mark(name)
		}
		
		logger.debug(`Performance mark: ${name} at ${timestamp.toFixed(2)}ms`)
	}

	/**
	 * Measure performance between marks
	 */
	measure(name: string, startMark: string, endMark?: string): number {
		const startTime = this.marks.get(startMark)
		const endTime = endMark ? this.marks.get(endMark) : performance.now()

		if (!startTime) {
			logger.warn(`Start mark '${startMark}' not found`)
			return 0
		}

		if (endMark && !endTime) {
			logger.warn(`End mark '${endMark}' not found`)
			return 0
		}

		const duration = endTime! - startTime
		this.measures.set(name, duration)

		if (typeof performance.measure === 'function') {
			try {
				performance.measure(name, startMark, endMark)
			} catch (e) {
				// Ignore if marks don't exist in native performance API
			}
		}

		logger.debug(`Performance measure: ${name} = ${duration.toFixed(2)}ms`)
		return duration
	}

	/**
	 * Track component render time
	 */
	trackComponentRender(componentName: string, renderTime: number): void {
		const sessionId = this.getCurrentSessionId()
		const currentMetrics = this.metrics.get(sessionId) || {}
		
		currentMetrics.componentRenderTime = renderTime
		this.metrics.set(sessionId, currentMetrics)

		this.checkThreshold('componentRenderTime', renderTime)
		logger.debug(`Component render: ${componentName} = ${renderTime.toFixed(2)}ms`)
	}

	/**
	 * Track API response time
	 */
	trackApiResponse(endpoint: string, responseTime: number): void {
		const sessionId = this.getCurrentSessionId()
		const currentMetrics = this.metrics.get(sessionId) || {}
		
		currentMetrics.apiResponseTime = responseTime
		this.metrics.set(sessionId, currentMetrics)

		this.checkThreshold('apiResponseTime', responseTime)
		logger.debug(`API response: ${endpoint} = ${responseTime.toFixed(2)}ms`)
	}

	/**
	 * Track database query time
	 */
	trackDatabaseQuery(query: string, queryTime: number): void {
		const sessionId = this.getCurrentSessionId()
		const currentMetrics = this.metrics.get(sessionId) || {}
		
		currentMetrics.databaseQueryTime = queryTime
		this.metrics.set(sessionId, currentMetrics)

		this.checkThreshold('databaseQueryTime', queryTime)
		logger.debug(`Database query: ${query.substring(0, 50)}... = ${queryTime.toFixed(2)}ms`)
	}

	/**
	 * Check if metric exceeds threshold
	 */
	private checkThreshold(metric: string, value: number): void {
		const threshold = this.thresholds[metric]
		if (threshold && value > threshold) {
			const severity = value > threshold * 2 ? 'critical' : 'warning'
			this.createAlert(severity, metric, value, threshold, 
				`${metric} exceeded threshold: ${value.toFixed(2)}ms > ${threshold}ms`)
		}
	}

	/**
	 * Create performance alert
	 */
	private createAlert(
		type: 'warning' | 'critical',
		metric: string,
		value: number,
		threshold: number,
		message: string
	): void {
		const alert: PerformanceAlert = {
			id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			type,
			metric,
			value,
			threshold,
			timestamp: Date.now(),
			message
		}

		this.alerts.push(alert)
		logger.warn(`Performance alert: ${message}`, alert)

		// Keep only last 100 alerts
		if (this.alerts.length > 100) {
			this.alerts = this.alerts.slice(-100)
		}
	}

	/**
	 * Get current session ID
	 */
	private getCurrentSessionId(): string {
		return 'current-session' // In a real app, this would be dynamic
	}

	/**
	 * Get current metrics
	 */
	getMetrics(sessionId?: string): PerformanceMetrics | undefined {
		return this.metrics.get(sessionId || this.getCurrentSessionId())
	}

	/**
	 * Get all metrics
	 */
	getAllMetrics(): Map<string, PerformanceMetrics> {
		return new Map(this.metrics)
	}

	/**
	 * Get performance alerts
	 */
	getAlerts(): PerformanceAlert[] {
		return [...this.alerts]
	}

	/**
	 * Clear alerts
	 */
	clearAlerts(): void {
		this.alerts = []
	}

	/**
	 * Update thresholds
	 */
	updateThresholds(newThresholds: Record<string, number>): void {
		Object.entries(newThresholds).forEach(([key, value]) => {
			if (typeof value === 'number') {
				this.thresholds[key] = value
			}
		})
	}

	/**
	 * Generate performance report
	 */
	generateReport(): {
		metrics: PerformanceMetrics
		alerts: PerformanceAlert[]
		recommendations: string[]
	} {
		const metrics = this.getMetrics() || {}
		const alerts = this.getAlerts()
		const recommendations = this.generateRecommendations(metrics, alerts)

		return {
			metrics,
			alerts,
			recommendations
		}
	}

	/**
	 * Generate performance recommendations
	 */
	private generateRecommendations(metrics: PerformanceMetrics, alerts: PerformanceAlert[]): string[] {
		const recommendations: string[] = []

		// Check Core Web Vitals
		if (metrics.LCP && metrics.LCP > 2500) {
			recommendations.push('Optimize Largest Contentful Paint (LCP) - consider image optimization and server response time')
		}

		if (metrics.FID && metrics.FID > 100) {
			recommendations.push('Improve First Input Delay (FID) - reduce JavaScript execution time and use code splitting')
		}

		if (metrics.CLS && metrics.CLS > 0.1) {
			recommendations.push('Fix Cumulative Layout Shift (CLS) - ensure proper sizing for images and ads')
		}

		// Check custom metrics
		if (metrics.componentRenderTime && metrics.componentRenderTime > 16) {
			recommendations.push('Optimize component rendering - consider memoization and virtualization')
		}

		if (metrics.apiResponseTime && metrics.apiResponseTime > 1000) {
			recommendations.push('Optimize API responses - implement caching and reduce payload size')
		}

		if (metrics.databaseQueryTime && metrics.databaseQueryTime > 500) {
			recommendations.push('Optimize database queries - add indexes and reduce query complexity')
		}

		// Check for patterns in alerts
		const criticalAlerts = alerts.filter(a => a.type === 'critical')
		if (criticalAlerts.length > 0) {
			recommendations.push('Address critical performance issues immediately')
		}

		return recommendations
	}

	/**
	 * Cleanup resources
	 */
	destroy(): void {
		this.observers.forEach(observer => observer.disconnect())
		this.observers = []
		this.metrics.clear()
		this.marks.clear()
		this.measures.clear()
		this.alerts = []
	}
}

// Export singleton instance
export const unifiedPerformanceMonitor = UnifiedPerformanceMonitor.getInstance()

// React hook for performance monitoring
export function usePerformanceMonitor() {
	const monitor = UnifiedPerformanceMonitor.getInstance()

	return {
		mark: (name: string) => monitor.mark(name),
		measure: (name: string, startMark: string, endMark?: string) => 
			monitor.measure(name, startMark, endMark),
		trackComponentRender: (componentName: string, renderTime: number) => 
			monitor.trackComponentRender(componentName, renderTime),
		trackApiResponse: (endpoint: string, responseTime: number) => 
			monitor.trackApiResponse(endpoint, responseTime),
		getMetrics: () => monitor.getMetrics(),
		getAlerts: () => monitor.getAlerts(),
		generateReport: () => monitor.generateReport()
	}
}

// Initialize performance monitoring
export function initializePerformanceMonitoring() {
	if (typeof window !== 'undefined') {
		UnifiedPerformanceMonitor.getInstance()
	}
}
