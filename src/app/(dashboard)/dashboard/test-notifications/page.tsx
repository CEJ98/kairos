'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Bell, BellOff, Send, TestTube, Wifi, WifiOff } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

export default function TestNotificationsPage() {
	const { data: session } = useSession()
	const [isSubscribed, setIsSubscribed] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [notificationData, setNotificationData] = useState({
		title: 'Notificacion de prueba',
		body: 'Esta es una notificacion de prueba desde Kairos Fitness',
		icon: '/icons/icon-192x192.png'
	})

	// Verificar soporte de notificaciones
	const isSupported = typeof window !== 'undefined' && 
		'Notification' in window && 
		'serviceWorker' in navigator && 
		'PushManager' in window

	// Suscribirse a notificaciones push
	const subscribeToPush = async () => {
		if (!isSupported) {
			toast.error('Las notificaciones push no estan soportadas en este navegador')
			return
		}

		setIsLoading(true)

		try {
			// Solicitar permisos
			const permission = await Notification.requestPermission()
			if (permission !== 'granted') {
				toast.error('Permisos de notificacion denegados')
				return
			}

			// Registrar service worker
			const registration = await navigator.serviceWorker.register('/sw.js')
			await navigator.serviceWorker.ready

			// Suscribirse a push notifications
			const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
			if (!vapidPublicKey) {
				throw new Error('VAPID key no configurada')
			}

			const applicationServerKey = urlB64ToUint8Array(vapidPublicKey)
			
			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: applicationServerKey as BufferSource
			})

			// Enviar suscripcion al servidor
			const response = await fetch('/api/notifications/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					subscription: subscription.toJSON(),
					userAgent: navigator.userAgent
				})
			})

			if (!response.ok) {
				throw new Error('Error al suscribirse')
			}

			setIsSubscribed(true)
			toast.success('Notificaciones push activadas!')

		} catch (error) {
			console.error('Error subscribing to push notifications:', error)
			toast.error('Error al activar notificaciones push')
		} finally {
			setIsLoading(false)
		}
	}

	// Enviar notificacion de prueba
	const sendTestNotification = async () => {
		if (!isSubscribed) {
			toast.error('Primero debes activar las notificaciones')
			return
		}

		setIsLoading(true)

		try {
			const response = await fetch('/api/notifications/send', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: session?.user?.id,
					title: notificationData.title,
					body: notificationData.body,
					icon: notificationData.icon,
					data: {
						type: 'test',
						url: '/dashboard/test-notifications'
					}
				})
			})

			if (!response.ok) {
				throw new Error('Error al enviar notificacion')
			}

			const result = await response.json()
			toast.success(`Notificacion enviada: ${result.sent} exitosas, ${result.failed} fallidas`)

		} catch (error) {
			console.error('Error sending test notification:', error)
			toast.error('Error al enviar notificacion de prueba')
		} finally {
			setIsLoading(false)
		}
	}

	// Convertir VAPID key de base64url a Uint8Array
	function urlB64ToUint8Array(base64String: string) {
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

	return (
		<div className="container mx-auto p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<TestTube className="h-6 w-6" />
					<h1 className="text-2xl font-bold">Prueba de Notificaciones Push</h1>
				</div>
				<div className="flex items-center space-x-4">
					<Badge variant={isSupported ? 'default' : 'destructive'} className="flex items-center space-x-1">
						{isSupported ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
						<span>{isSupported ? 'Soportado' : 'No soportado'}</span>
					</Badge>
					<Badge variant={isSubscribed ? 'default' : 'secondary'} className="flex items-center space-x-1">
						{isSubscribed ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
						<span>{isSubscribed ? 'Suscrito' : 'No suscrito'}</span>
					</Badge>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center space-x-2">
							<Bell className="h-5 w-5" />
							<span>Suscripcion a Notificaciones</span>
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-sm text-muted-foreground">
							Primero debes suscribirte a las notificaciones push para poder recibir notificaciones.
						</p>
						<Button 
							onClick={subscribeToPush}
							disabled={!isSupported || isSubscribed || isLoading}
							className="w-full"
						>
							{isLoading ? 'Suscribiendo...' : isSubscribed ? 'Ya suscrito' : 'Suscribirse a Notificaciones'}
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center space-x-2">
							<Send className="h-5 w-5" />
							<span>Enviar Notificacion de Prueba</span>
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">Titulo</label>
							<Input
								value={notificationData.title}
								onChange={(e) => setNotificationData(prev => ({ ...prev, title: e.target.value }))}
								placeholder="Titulo de la notificacion"
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium">Mensaje</label>
							<Textarea
								value={notificationData.body}
								onChange={(e) => setNotificationData(prev => ({ ...prev, body: e.target.value }))}
								placeholder="Contenido de la notificacion"
								rows={3}
							/>
						</div>
						<Button 
							onClick={sendTestNotification}
							disabled={!isSubscribed || isLoading}
							className="w-full"
						>
							{isLoading ? 'Enviando...' : 'Enviar Notificacion de Prueba'}
						</Button>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Informacion del Sistema</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
						<div>
							<strong>Soporte de Notificaciones:</strong>
							<p className={isSupported ? 'text-green-600' : 'text-red-600'}>
								{isSupported ? 'Soportado' : 'No soportado'}
							</p>
						</div>
						<div>
							<strong>Service Worker:</strong>
							<p className={typeof window !== 'undefined' && 'serviceWorker' in navigator ? 'text-green-600' : 'text-red-600'}>
								{typeof window !== 'undefined' && 'serviceWorker' in navigator ? 'Disponible' : 'No disponible'}
							</p>
						</div>
						<div>
							<strong>Push Manager:</strong>
							<p className={typeof window !== 'undefined' && 'PushManager' in window ? 'text-green-600' : 'text-red-600'}>
								{typeof window !== 'undefined' && 'PushManager' in window ? 'Disponible' : 'No disponible'}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}