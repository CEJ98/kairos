'use client'

import { useState, useEffect, useCallback } from 'react'

interface PWAInstallPrompt {
	prompt: () => Promise<void>
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface UsePWAReturn {
	isInstallable: boolean
	isInstalled: boolean
	isOnline: boolean
	installApp: () => Promise<void>
	registerSW: () => Promise<ServiceWorkerRegistration | null>
	unregisterSW: () => Promise<boolean>
	requestNotificationPermission: () => Promise<NotificationPermission>
	subscribeToPush: () => Promise<PushSubscription | null>
	unsubscribeFromPush: () => Promise<boolean>
	sendNotification: (title: string, options?: NotificationOptions) => void
}

export function usePWA(): UsePWAReturn {
	const [isInstallable, setIsInstallable] = useState(false)
	const [isInstalled, setIsInstalled] = useState(false)
	const [isOnline, setIsOnline] = useState(true)
	const [deferredPrompt, setDeferredPrompt] = useState<PWAInstallPrompt | null>(null)
	const [swRegistration, setSWRegistration] = useState<ServiceWorkerRegistration | null>(null)

	// Detectar si la app está instalada
	useEffect(() => {
		const checkInstalled = () => {
			if (typeof window !== 'undefined') {
				// Verificar si está en modo standalone
				const isStandalone = window.matchMedia('(display-mode: standalone)').matches
				const isIOSStandalone = (window.navigator as any).standalone === true
				setIsInstalled(isStandalone || isIOSStandalone)
			}
		}

		checkInstalled()
		window.addEventListener('appinstalled', checkInstalled)
		return () => window.removeEventListener('appinstalled', checkInstalled)
	}, [])

	// Detectar estado de conexión
	useEffect(() => {
		const updateOnlineStatus = () => setIsOnline(navigator.onLine)
		
		updateOnlineStatus()
		window.addEventListener('online', updateOnlineStatus)
		window.addEventListener('offline', updateOnlineStatus)
		
		return () => {
			window.removeEventListener('online', updateOnlineStatus)
			window.removeEventListener('offline', updateOnlineStatus)
		}
	}, [])

	// Escuchar evento de instalación
	useEffect(() => {
		const handleBeforeInstallPrompt = (e: Event) => {
			e.preventDefault()
			setDeferredPrompt(e as any)
			setIsInstallable(true)
		}

		window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
		return () => {
			window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
		}
	}, [])

	// Instalar la aplicación
	const installApp = useCallback(async () => {
		if (!deferredPrompt) {
			throw new Error('No install prompt available')
		}

		try {
			await deferredPrompt.prompt()
			const choiceResult = await deferredPrompt.userChoice
			
			if (choiceResult.outcome === 'accepted') {
				console.log('PWA installation accepted')
				setIsInstalled(true)
			} else {
				console.log('PWA installation dismissed')
			}
			
			setDeferredPrompt(null)
			setIsInstallable(false)
		} catch (error) {
			console.error('Error installing PWA:', error)
			throw error
		}
	}, [deferredPrompt])

	// Registrar Service Worker
	const registerSW = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
		if (!('serviceWorker' in navigator)) {
			console.log('Service Worker not supported')
			return null
		}

		try {
			const registration = await navigator.serviceWorker.register('/sw.js', {
				scope: '/'
			})
			
			console.log('Service Worker registered:', registration)
			setSWRegistration(registration)
			
			// Escuchar actualizaciones
			registration.addEventListener('updatefound', () => {
				const newWorker = registration.installing
				if (newWorker) {
					newWorker.addEventListener('statechange', () => {
						if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
							// Nueva versión disponible
							console.log('New service worker version available')
							// Aquí podrías mostrar una notificación al usuario
						}
					})
				}
			})
			
			return registration
		} catch (error) {
			console.error('Service Worker registration failed:', error)
			return null
		}
	}, [])

	// Desregistrar Service Worker
	const unregisterSW = useCallback(async (): Promise<boolean> => {
		if (!('serviceWorker' in navigator)) {
			return false
		}

		try {
			const registration = await navigator.serviceWorker.getRegistration()
			if (registration) {
				const result = await registration.unregister()
				setSWRegistration(null)
				return result
			}
			return false
		} catch (error) {
			console.error('Service Worker unregistration failed:', error)
			return false
		}
	}, [])

	// Solicitar permiso para notificaciones
	const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
		if (!('Notification' in window)) {
			throw new Error('Notifications not supported')
		}

		if (Notification.permission === 'granted') {
			return 'granted'
		}

		if (Notification.permission === 'denied') {
			return 'denied'
		}

		const permission = await Notification.requestPermission()
		return permission
	}, [])

	// Suscribirse a notificaciones push
	const subscribeToPush = useCallback(async (): Promise<PushSubscription | null> => {
		if (!swRegistration) {
			throw new Error('Service Worker not registered')
		}

		if (!('PushManager' in window)) {
			throw new Error('Push messaging not supported')
		}

		try {
			const permission = await requestNotificationPermission()
			if (permission !== 'granted') {
				throw new Error('Notification permission denied')
			}

			const subscription = await swRegistration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
			})

			// Enviar suscripción al servidor
			await fetch('/api/push/subscribe', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(subscription)
			})

			return subscription
		} catch (error) {
			console.error('Push subscription failed:', error)
			return null
		}
	}, [swRegistration, requestNotificationPermission])

	// Desuscribirse de notificaciones push
	const unsubscribeFromPush = useCallback(async (): Promise<boolean> => {
		if (!swRegistration) {
			return false
		}

		try {
			const subscription = await swRegistration.pushManager.getSubscription()
			if (subscription) {
				// Notificar al servidor
				await fetch('/api/push/unsubscribe', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ endpoint: subscription.endpoint })
				})

				return await subscription.unsubscribe()
			}
			return false
		} catch (error) {
			console.error('Push unsubscription failed:', error)
			return false
		}
	}, [swRegistration])

	// Enviar notificación local
	const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
		if (!('Notification' in window)) {
			console.warn('Notifications not supported')
			return
		}

		if (Notification.permission === 'granted') {
			new Notification(title, {
				icon: '/icons/icon-192x192.png',
				badge: '/icons/badge-72x72.png',
				...options
			})
		}
	}, [])

	// Auto-registrar Service Worker al montar
	useEffect(() => {
		if (typeof window !== 'undefined') {
			registerSW()
		}
	}, [registerSW])

	return {
		isInstallable,
		isInstalled,
		isOnline,
		installApp,
		registerSW,
		unregisterSW,
		requestNotificationPermission,
		subscribeToPush,
		unsubscribeFromPush,
		sendNotification
	}
}

// Hook para detectar si es móvil
export function useIsMobile() {
	const [isMobile, setIsMobile] = useState(false)

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768)
		}

		checkMobile()
		window.addEventListener('resize', checkMobile)
		return () => window.removeEventListener('resize', checkMobile)
	}, [])

	return isMobile
}

// Hook para detectar orientación
export function useOrientation() {
	const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

	useEffect(() => {
		const checkOrientation = () => {
			setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
		}

		checkOrientation()
		window.addEventListener('resize', checkOrientation)
		window.addEventListener('orientationchange', checkOrientation)
		
		return () => {
			window.removeEventListener('resize', checkOrientation)
			window.removeEventListener('orientationchange', checkOrientation)
		}
	}, [])

	return orientation
}