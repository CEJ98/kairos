// @ts-nocheck
/**
 * Mobile Compatibility and PWA Features
 * Enhanced mobile experience and offline capabilities
 */

import { logger } from '../logger'
import { unifiedCache } from '../cache/consolidated-cache'

// Device Detection
export interface DeviceInfo {
	isMobile: boolean
	isTablet: boolean
	isDesktop: boolean
	isIOS: boolean
	isAndroid: boolean
	isStandalone: boolean
	supportsServiceWorker: boolean
	supportsNotifications: boolean
	supportsOffline: boolean
	viewportWidth: number
	viewportHeight: number
	devicePixelRatio: number
	orientation: 'portrait' | 'landscape'
	connection?: {
		effectiveType: string
		downlink: number
		rtt: number
		saveData: boolean
	}
}

// PWA Installation
export interface PWAInstallPrompt {
	canInstall: boolean
	isInstalled: boolean
	prompt: () => Promise<void>
	dismiss: () => void
}

// Offline Status
export interface OfflineStatus {
	isOnline: boolean
	lastOnline: Date | null
	pendingSyncs: number
	offlineActions: OfflineAction[]
}

interface OfflineAction {
	id: string
	type: string
	data: any
	timestamp: Date
	retries: number
	maxRetries: number
}

// Mobile Compatibility Manager
export class MobileCompatibilityManager {
	private static instance: MobileCompatibilityManager
	private deviceInfo: DeviceInfo | null = null
	private installPrompt: BeforeInstallPromptEvent | null = null
	private offlineActions: OfflineAction[] = []
	private syncInProgress = false

	static getInstance(): MobileCompatibilityManager {
		if (!MobileCompatibilityManager.instance) {
			MobileCompatibilityManager.instance = new MobileCompatibilityManager()
		}
		return MobileCompatibilityManager.instance
	}

	private constructor() {
		this.initializeDeviceDetection()
		this.setupPWAListeners()
		this.setupOfflineHandling()
	}

	/**
	 * Initialize device detection
	 */
	private initializeDeviceDetection(): void {
		if (typeof window === 'undefined') return

		const userAgent = navigator.userAgent.toLowerCase()
		const isIOS = /iphone|ipad|ipod/.test(userAgent)
		const isAndroid = /android/.test(userAgent)
		const isMobile = /mobi|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent)
		const isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)
		const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
								(window.navigator as any).standalone === true

		// Get connection info if available
		const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

		this.deviceInfo = {
			isMobile,
			isTablet,
			isDesktop: !isMobile && !isTablet,
			isIOS,
			isAndroid,
			isStandalone,
			supportsServiceWorker: 'serviceWorker' in navigator,
			supportsNotifications: 'Notification' in window,
			supportsOffline: 'caches' in window && 'serviceWorker' in navigator,
			viewportWidth: window.innerWidth,
			viewportHeight: window.innerHeight,
			devicePixelRatio: window.devicePixelRatio || 1,
			orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
			connection: connection ? {
				effectiveType: connection.effectiveType || 'unknown',
				downlink: connection.downlink || 0,
				rtt: connection.rtt || 0,
				saveData: connection.saveData || false
			} : undefined
		}

		// Listen for orientation changes
		window.addEventListener('orientationchange', () => {
			setTimeout(() => {
				if (this.deviceInfo) {
					this.deviceInfo.viewportWidth = window.innerWidth
					this.deviceInfo.viewportHeight = window.innerHeight
					this.deviceInfo.orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
				}
			}, 100)
		})

		// Listen for viewport changes
		window.addEventListener('resize', () => {
			if (this.deviceInfo) {
				this.deviceInfo.viewportWidth = window.innerWidth
				this.deviceInfo.viewportHeight = window.innerHeight
				this.deviceInfo.orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
			}
		})
	}

	/**
	 * Setup PWA installation listeners
	 */
	private setupPWAListeners(): void {
		if (typeof window === 'undefined') return

		// Listen for install prompt
		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault()
			this.installPrompt = e as BeforeInstallPromptEvent
			logger.info('PWA install prompt available')
		})

		// Listen for app installed
		window.addEventListener('appinstalled', () => {
			this.installPrompt = null
			logger.info('PWA installed successfully')
		})
	}

	/**
	 * Setup offline handling
	 */
	private setupOfflineHandling(): void {
		if (typeof window === 'undefined') return

		// Listen for online/offline events
		window.addEventListener('online', () => {
			logger.info('Connection restored')
			this.syncOfflineActions()
		})

		window.addEventListener('offline', () => {
			logger.warn('Connection lost - entering offline mode')
		})

		// Load offline actions from storage
		this.loadOfflineActions()
	}

	/**
	 * Get device information
	 */
	getDeviceInfo(): DeviceInfo | null {
		return this.deviceInfo
	}

	/**
	 * Check if device is mobile
	 */
	isMobile(): boolean {
		return this.deviceInfo?.isMobile || false
	}

	/**
	 * Check if app is running in standalone mode (installed PWA)
	 */
	isStandalone(): boolean {
		return this.deviceInfo?.isStandalone || false
	}

	/**
	 * Get PWA installation status
	 */
	getPWAInstallPrompt(): PWAInstallPrompt {
		return {
			canInstall: !!this.installPrompt,
			isInstalled: this.isStandalone(),
			prompt: async () => {
				if (this.installPrompt) {
					const result = await this.installPrompt.prompt()
					logger.info('PWA install prompt result:', result)
					this.installPrompt = null
				}
			},
			dismiss: () => {
				this.installPrompt = null
			}
		}
	}

	/**
	 * Get offline status
	 */
	getOfflineStatus(): OfflineStatus {
		const lastOnline = unifiedCache.get<string>('system', 'lastOnline')
		return {
			isOnline: navigator.onLine,
			lastOnline: lastOnline ? new Date(lastOnline) : null,
			pendingSyncs: this.offlineActions.length,
			offlineActions: [...this.offlineActions]
		}
	}

	/**
	 * Add offline action for later sync
	 */
	addOfflineAction(type: string, data: any): string {
		const action: OfflineAction = {
			id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			type,
			data,
			timestamp: new Date(),
			retries: 0,
			maxRetries: 3
		}

		this.offlineActions.push(action)
		this.saveOfflineActions()
		logger.info(`Added offline action: ${type}`, action.id)

		return action.id
	}

	/**
	 * Remove offline action
	 */
	removeOfflineAction(actionId: string): void {
		this.offlineActions = this.offlineActions.filter(action => action.id !== actionId)
		this.saveOfflineActions()
	}

	/**
	 * Sync offline actions when online
	 */
	private async syncOfflineActions(): Promise<void> {
		if (this.syncInProgress || !navigator.onLine || this.offlineActions.length === 0) {
			return
		}

		this.syncInProgress = true
		unifiedCache.set('system', 'lastOnline', new Date().toISOString())

		try {
			const actionsToSync = [...this.offlineActions]
			logger.info(`Syncing ${actionsToSync.length} offline actions`)

			for (const action of actionsToSync) {
				try {
					await this.syncAction(action)
					this.removeOfflineAction(action.id)
					logger.info(`Synced offline action: ${action.type}`, action.id)
				} catch (error) {
					action.retries++
					if (action.retries >= action.maxRetries) {
						logger.error(`Failed to sync action after ${action.maxRetries} retries:`, action.id, error)
						this.removeOfflineAction(action.id)
					} else {
						logger.warn(`Retry ${action.retries}/${action.maxRetries} for action:`, action.id, error)
					}
				}
			}

			this.saveOfflineActions()
		} finally {
			this.syncInProgress = false
		}
	}

	/**
	 * Sync individual action
	 */
	private async syncAction(action: OfflineAction): Promise<void> {
		// This would be implemented based on your API structure
		// For now, we'll simulate the sync
		switch (action.type) {
			case 'workout_session':
				// Sync workout session data
				await this.syncWorkoutSession(action.data)
				break
			case 'exercise_log':
				// Sync exercise log data
				await this.syncExerciseLog(action.data)
				break
			case 'body_measurement':
				// Sync body measurement data
				await this.syncBodyMeasurement(action.data)
				break
			default:
				logger.warn(`Unknown action type: ${action.type}`)
		}
	}

	/**
	 * Sync workout session (placeholder)
	 */
	private async syncWorkoutSession(data: unknown): Promise<void> {
		// Implement actual API call
		await new Promise(resolve => setTimeout(resolve, 100))
	}

	/**
	 * Sync exercise log (placeholder)
	 */
	private async syncExerciseLog(data: unknown): Promise<void> {
		// Implement actual API call
		await new Promise(resolve => setTimeout(resolve, 100))
	}

	/**
	 * Sync body measurement (placeholder)
	 */
	private async syncBodyMeasurement(data: unknown): Promise<void> {
		// Implement actual API call
		await new Promise(resolve => setTimeout(resolve, 100))
	}

	/**
	 * Save offline actions to storage
	 */
	private saveOfflineActions(): void {
		try {
			localStorage.setItem('kairos_offline_actions', JSON.stringify(this.offlineActions))
		} catch (error) {
			logger.error('Failed to save offline actions:', error)
		}
	}

	/**
	 * Load offline actions from storage
	 */
	private loadOfflineActions(): void {
		try {
			const stored = localStorage.getItem('kairos_offline_actions')
			if (stored) {
				this.offlineActions = JSON.parse(stored).map((action: any) => ({
					...action,
					timestamp: new Date(action.timestamp)
				}))
				logger.info(`Loaded ${this.offlineActions.length} offline actions from storage`)
			}
		} catch (error) {
			logger.error('Failed to load offline actions:', error)
			this.offlineActions = []
		}
	}

	/**
	 * Request notification permission
	 */
	async requestNotificationPermission(): Promise<NotificationPermission> {
		if (!this.deviceInfo?.supportsNotifications) {
			return 'denied'
		}

		if (Notification.permission === 'granted') {
			return 'granted'
		}

		if (Notification.permission === 'denied') {
			return 'denied'
		}

		try {
			const permission = await Notification.requestPermission()
			logger.info('Notification permission:', permission)
			return permission
		} catch (error) {
			logger.error('Failed to request notification permission:', error)
			return 'denied'
		}
	}

	/**
	 * Show local notification
	 */
	showNotification(title: string, options?: NotificationOptions): void {
		if (Notification.permission !== 'granted') {
			return
		}

		try {
			const notification = new Notification(title, {
				icon: '/icons/icon-192x192.png',
				badge: '/icons/badge-72x72.png',
				...options
			})

			// Auto-close after 5 seconds
			setTimeout(() => {
				notification.close()
			}, 5000)

		} catch (error) {
			logger.error('Failed to show notification:', error)
		}
	}

	/**
	 * Check if device supports haptic feedback
	 */
	supportsHaptics(): boolean {
		return 'vibrate' in navigator
	}

	/**
	 * Trigger haptic feedback
	 */
	hapticFeedback(pattern: number | number[] = 100): void {
		if (this.supportsHaptics()) {
			navigator.vibrate(pattern)
		}
	}

	/**
	 * Get network quality assessment
	 */
	getNetworkQuality(): 'fast' | 'slow' | 'offline' {
		if (!navigator.onLine) {
			return 'offline'
		}

		const connection = this.deviceInfo?.connection
		if (!connection) {
			return 'fast' // Assume fast if no connection info
		}

		// Assess based on effective type and save data preference
		if (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
			return 'slow'
		}

		if (connection.effectiveType === '3g' && connection.downlink < 1.5) {
			return 'slow'
		}

		return 'fast'
	}

	/**
	 * Optimize for mobile performance
	 */
	optimizeForMobile(): {
		reduceAnimations: boolean
		limitImages: boolean
		preloadCritical: boolean
		useCompression: boolean
	} {
		const networkQuality = this.getNetworkQuality()
		const isMobile = this.isMobile()
		const connection = this.deviceInfo?.connection

		return {
			reduceAnimations: isMobile && (networkQuality === 'slow' || connection?.saveData === true),
			limitImages: networkQuality === 'slow' || connection?.saveData === true,
			preloadCritical: networkQuality === 'fast' && !connection?.saveData,
			useCompression: networkQuality === 'slow' || connection?.saveData === true
		}
	}
}

// Service Worker Registration
export class ServiceWorkerManager {
	private static instance: ServiceWorkerManager
	private registration: ServiceWorkerRegistration | null = null

	static getInstance(): ServiceWorkerManager {
		if (!ServiceWorkerManager.instance) {
			ServiceWorkerManager.instance = new ServiceWorkerManager()
		}
		return ServiceWorkerManager.instance
	}

	/**
	 * Register service worker
	 */
	async register(swPath: string = '/sw.js'): Promise<ServiceWorkerRegistration | null> {
		if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
			logger.warn('Service Worker not supported')
			return null
		}

		try {
			this.registration = await navigator.serviceWorker.register(swPath)
			logger.info('Service Worker registered successfully')

			// Listen for updates
			this.registration.addEventListener('updatefound', () => {
				logger.info('Service Worker update found')
				const newWorker = this.registration?.installing
				if (newWorker) {
					newWorker.addEventListener('statechange', () => {
						if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
							logger.info('New Service Worker available')
							// Notify user about update
							this.notifyUpdate()
						}
					})
				}
			})

			return this.registration
		} catch (error) {
			logger.error('Service Worker registration failed:', error)
			return null
		}
	}

	/**
	 * Update service worker
	 */
	async update(): Promise<void> {
		if (this.registration) {
			await this.registration.update()
			logger.info('Service Worker update triggered')
		}
	}

	/**
	 * Skip waiting and activate new service worker
	 */
	skipWaiting(): void {
		if (this.registration?.waiting) {
			this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
		}
	}

	/**
	 * Notify user about available update
	 */
	private notifyUpdate(): void {
		// This would integrate with your notification system
		const mobileManager = MobileCompatibilityManager.getInstance()
		mobileManager.showNotification('App Update Available', {
			body: 'A new version of the app is available. Refresh to update.',
			tag: 'app-update'
		})
	}
}

// Export singleton instances
export const mobileCompatibilityManager = MobileCompatibilityManager.getInstance()
export const serviceWorkerManager = ServiceWorkerManager.getInstance()

// Utility functions
export function isMobileDevice(): boolean {
	return mobileCompatibilityManager.isMobile()
}

export function isStandaloneApp(): boolean {
	return mobileCompatibilityManager.isStandalone()
}

export function getDeviceInfo(): DeviceInfo | null {
	return mobileCompatibilityManager.getDeviceInfo()
}

export function addOfflineAction(type: string, data: any): string {
	return mobileCompatibilityManager.addOfflineAction(type, data)
}

export function getOfflineStatus(): OfflineStatus {
	return mobileCompatibilityManager.getOfflineStatus()
}

export function optimizeForMobile() {
	return mobileCompatibilityManager.optimizeForMobile()
}

// React Hook for mobile compatibility
export function useMobileCompatibility() {
	const [deviceInfo, setDeviceInfo] = React.useState<DeviceInfo | null>(null)
	const [offlineStatus, setOfflineStatus] = React.useState<OfflineStatus>({
		isOnline: true,
		lastOnline: null,
		pendingSyncs: 0,
		offlineActions: []
	})
	const [pwaPrompt, setPwaPrompt] = React.useState<PWAInstallPrompt>({
		canInstall: false,
		isInstalled: false,
		prompt: async () => {},
		dismiss: () => {}
	})

	React.useEffect(() => {
		const manager = MobileCompatibilityManager.getInstance()
		
		// Initial state
		setDeviceInfo(manager.getDeviceInfo())
		setOfflineStatus(manager.getOfflineStatus())
		setPwaPrompt(manager.getPWAInstallPrompt())

		// Listen for online/offline changes
		const handleOnline = () => setOfflineStatus(manager.getOfflineStatus())
		const handleOffline = () => setOfflineStatus(manager.getOfflineStatus())

		window.addEventListener('online', handleOnline)
		window.addEventListener('offline', handleOffline)

		// Periodic updates
		const interval = setInterval(() => {
			setOfflineStatus(manager.getOfflineStatus())
			setPwaPrompt(manager.getPWAInstallPrompt())
		}, 5000)

		return () => {
			window.removeEventListener('online', handleOnline)
			window.removeEventListener('offline', handleOffline)
			clearInterval(interval)
		}
	}, [])

	return {
		deviceInfo,
		offlineStatus,
		pwaPrompt,
		isMobile: deviceInfo?.isMobile || false,
		isStandalone: deviceInfo?.isStandalone || false,
		networkQuality: mobileCompatibilityManager.getNetworkQuality(),
		optimizations: mobileCompatibilityManager.optimizeForMobile(),
		addOfflineAction: (type: string, data: any) => mobileCompatibilityManager.addOfflineAction(type, data),
		requestNotificationPermission: () => mobileCompatibilityManager.requestNotificationPermission(),
		showNotification: (title: string, options?: NotificationOptions) => 
			mobileCompatibilityManager.showNotification(title, options),
		hapticFeedback: (pattern?: number | number[]) => mobileCompatibilityManager.hapticFeedback(pattern)
	}
}

// Type declaration for BeforeInstallPromptEvent
declare global {
	interface BeforeInstallPromptEvent extends Event {
		prompt(): Promise<void>
		userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
	}

	interface WindowEventMap {
		beforeinstallprompt: BeforeInstallPromptEvent
	}
}

// Import React for the hook
import React from 'react'
