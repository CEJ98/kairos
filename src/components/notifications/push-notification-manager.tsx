'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, BellOff, Settings, Check, X, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'

interface PushNotificationManagerProps {
	className?: string
	showSettings?: boolean
}

export function PushNotificationManager({ 
	className, 
	showSettings = true 
}: PushNotificationManagerProps) {
	const [isSupported, setIsSupported] = useState(false)
	const [permission, setPermission] = useState<NotificationPermission>('default')
	const [isSubscribed, setIsSubscribed] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [subscription, setSubscription] = useState<PushSubscription | null>(null)

	// Check current subscription status
	const checkSubscription = useCallback(async () => {
		if (!isSupported) return

		try {
			const registration = await navigator.serviceWorker.ready
			const currentSubscription = await registration.pushManager.getSubscription()
			
			setSubscription(currentSubscription)
			setIsSubscribed(!!currentSubscription)
		} catch (error) {
			logger.error('Error checking subscription:', error)
		}
	}, [isSupported])

	// Check if push notifications are supported
	useEffect(() => {
		const checkSupport = () => {
			const supported = 
				typeof window !== 'undefined' &&
				'Notification' in window &&
				'serviceWorker' in navigator &&
				'PushManager' in window
			
			setIsSupported(supported)
			
			if (supported) {
				setPermission(Notification.permission)
				checkSubscription()
			}
		}

		checkSupport()
	}, [checkSubscription])

	// Request notification permission
	const requestPermission = useCallback(async () => {
		if (!isSupported) {
			toast.error('Las notificaciones push no están soportadas en este navegador')
			return false
		}

		try {
			const result = await Notification.requestPermission()
			setPermission(result)
			
			if (result === 'granted') {
				toast.success('Permisos de notificación concedidos')
				return true
			} else {
				toast.error('Permisos de notificación denegados')
				return false
			}
		} catch (error) {
			logger.error('Error requesting permission:', error)
			toast.error('Error al solicitar permisos')
			return false
		}
	}, [isSupported])

	// Subscribe to push notifications
	const subscribe = useCallback(async () => {
		if (!isSupported || permission !== 'granted') {
			const granted = await requestPermission()
			if (!granted) return
		}

		setIsLoading(true)

		try {
			const registration = await navigator.serviceWorker.ready
			
			// Convert VAPID key to Uint8Array
			const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
			if (!vapidPublicKey) {
				throw new Error('VAPID public key not configured')
			}

			const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)

			const newSubscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: applicationServerKey as BufferSource
			})

			// Send subscription to server
			const response = await fetch('/api/notifications/subscribe', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					subscription: newSubscription.toJSON(),
					userAgent: navigator.userAgent
				})
			})

			if (!response.ok) {
				throw new Error('Failed to save subscription')
			}

			setSubscription(newSubscription)
			setIsSubscribed(true)
			toast.success('¡Notificaciones push activadas!')
			
			logger.info('Push notifications subscribed successfully')

		} catch (error) {
			logger.error('Error subscribing to push notifications:', error)
			toast.error('Error al activar notificaciones push')
		} finally {
			setIsLoading(false)
		}
	}, [isSupported, permission, requestPermission])

	// Unsubscribe from push notifications
	const unsubscribe = useCallback(async () => {
		if (!subscription) return

		setIsLoading(true)

		try {
			// Unsubscribe from browser
			await subscription.unsubscribe()

			// Notify server
			await fetch('/api/notifications/unsubscribe', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					subscription: subscription.toJSON()
				})
			})

			setSubscription(null)
			setIsSubscribed(false)
			toast.success('Notificaciones push desactivadas')
			
			logger.info('Push notifications unsubscribed successfully')

		} catch (error) {
			logger.error('Error unsubscribing from push notifications:', error)
			toast.error('Error al desactivar notificaciones push')
		} finally {
			setIsLoading(false)
		}
	}, [subscription])

	// Test notification
	const testNotification = useCallback(async () => {
		if (!isSubscribed) {
			toast.error('Primero debes activar las notificaciones')
			return
		}

		try {
			const response = await fetch('/api/notifications/send', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					title: '🧪 Notificación de prueba',
					body: 'Esta es una notificación de prueba de Kairos Fitness',
					data: {
						type: 'test',
						url: '/dashboard'
					}
				})
			})

			if (response.ok) {
				toast.success('Notificación de prueba enviada')
			} else {
				toast.error('Error al enviar notificación de prueba')
			}
		} catch (error) {
			logger.error('Error sending test notification:', error)
			toast.error('Error al enviar notificación de prueba')
		}
	}, [isSubscribed])

	// Helper function to convert VAPID key
	const urlBase64ToUint8Array = (base64String: string): ArrayBufferView => {
		const padding = '='.repeat((4 - base64String.length % 4) % 4)
		const base64 = (base64String + padding)
			.replace(/-/g, '+')
			.replace(/_/g, '/')

		const rawData = window.atob(base64)
		const outputArray = new Uint8Array(rawData.length)

		for (let i = 0; i < rawData.length; ++i) {
			outputArray[i] = rawData.charCodeAt(i)
		}
		return outputArray
	}

	if (!showSettings) {
		return (
			<Button
				variant={isSubscribed ? "default" : "outline"}
				size="sm"
				onClick={isSubscribed ? unsubscribe : subscribe}
				disabled={!isSupported || isLoading}
				className={className}
			>
				{isSubscribed ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
				{isLoading ? 'Procesando...' : isSubscribed ? 'Activadas' : 'Activar'}
			</Button>
		)
	}

	return (
		<Card className={cn("w-full max-w-md", className)}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Bell className="h-5 w-5" />
					Notificaciones Push
				</CardTitle>
				<CardDescription>
					Recibe notificaciones instantáneas sobre mensajes, entrenamientos y logros
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{!isSupported ? (
					<div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
						<AlertTriangle className="h-4 w-4 text-yellow-600" />
						<span className="text-sm text-yellow-800">
							Las notificaciones push no están soportadas en este navegador
						</span>
					</div>
				) : (
					<>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span className="text-sm font-medium">Estado:</span>
								<Badge 
									variant={isSubscribed ? "default" : "secondary"}
									className={cn(
										isSubscribed ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
									)}
								>
									{isSubscribed ? (
								<span className="flex items-center"><Check className="h-3 w-3 mr-1" /> Activadas</span>
							) : (
								<span className="flex items-center"><X className="h-3 w-3 mr-1" /> Desactivadas</span>
							)}
								</Badge>
							</div>
							<Button
								variant={isSubscribed ? "default" : "outline"}
								size="sm"
								onClick={isSubscribed ? unsubscribe : subscribe}
								disabled={isLoading}
							>
								{isSubscribed ? 'Desactivar' : 'Activar'}
							</Button>
						</div>

						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={testNotification}
								disabled={!isSubscribed || isLoading}
								className="flex-1"
							>
								<Settings className="h-4 w-4 mr-2" />
								Probar
							</Button>
						</div>

						{permission === 'denied' && (
							<div className="p-3 bg-red-50 border border-red-200 rounded-lg">
								<p className="text-sm text-red-800">
									Los permisos de notificación están bloqueados. 
									Puedes habilitarlos en la configuración de tu navegador.
								</p>
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	)
}