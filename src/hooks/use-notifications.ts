'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

export interface Notification {
	id: string
	userId: string
	title: string
	message: string
	type: string
	priority: string
	isRead: boolean
	isArchived: boolean
	readAt: Date | null
	archivedAt: Date | null
	actionUrl: string | null
	actionLabel: string | null
	metadata: string | null
	createdAt: Date
	updatedAt: Date
}

export interface NotificationStats {
	total: number
	unread: number
	archived: number
}

export function useNotifications() {
	const { data: session } = useSession()
	const [notifications, setNotifications] = useState<Notification[]>([])
	const [stats, setStats] = useState<NotificationStats>({ total: 0, unread: 0, archived: 0 })
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Fetch notifications from API
	const fetchNotifications = useCallback(async (options?: {
		page?: number
		limit?: number
		unreadOnly?: boolean
		type?: string
	}) => {
		if (!session?.user?.id) return

		setLoading(true)
		setError(null)

		try {
			const params = new URLSearchParams()
			if (options?.page) params.append('page', options.page.toString())
			if (options?.limit) params.append('limit', options.limit.toString())
			if (options?.unreadOnly) params.append('unreadOnly', 'true')
			if (options?.type) params.append('type', options.type)

			const response = await fetch(`/api/notifications?${params}`)
			if (!response.ok) {
				throw new Error('Error al cargar notificaciones')
			}

			const data = await response.json()
			setNotifications(data.notifications)
			
			// Update stats
			setStats({
				total: data.total,
				unread: data.notifications.filter((n: Notification) => !n.isRead).length,
				archived: data.notifications.filter((n: Notification) => n.isArchived).length
			})

			return data
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
			setError(errorMessage)
			logger.error('Error fetching notifications:', err)
		} finally {
			setLoading(false)
		}
	}, [session?.user?.id])

	// Mark notifications as read
	const markAsRead = useCallback(async (notificationIds: string[]) => {
		try {
			const response = await fetch('/api/notifications', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ notificationIds, action: 'markAsRead' })
			})

			if (!response.ok) {
				throw new Error('Error al marcar como leído')
			}

			// Update local state
			setNotifications(prev => 
				prev.map(n => 
					notificationIds.includes(n.id) 
						? { ...n, isRead: true, readAt: new Date() }
						: n
				)
			)

			// Update stats
			setStats(prev => ({
				...prev,
				unread: prev.unread - notificationIds.length
			}))

			return true
		} catch (err) {
			logger.error('Error marking notifications as read:', err)
			toast.error('Error al marcar notificaciones como leídas')
			return false
		}
	}, [])

	// Archive notifications
	const archiveNotifications = useCallback(async (notificationIds: string[]) => {
		try {
			const response = await fetch('/api/notifications', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ notificationIds, action: 'archive' })
			})

			if (!response.ok) {
				throw new Error('Error al archivar')
			}

			// Update local state
			setNotifications(prev => 
				prev.map(n => 
					notificationIds.includes(n.id) 
						? { ...n, isArchived: true, archivedAt: new Date() }
						: n
				)
			)

			// Update stats
			setStats(prev => ({
				...prev,
				archived: prev.archived + notificationIds.length
			}))

			return true
		} catch (err) {
			logger.error('Error archiving notifications:', err)
			toast.error('Error al archivar notificaciones')
			return false
		}
	}, [])

	// Delete notifications
	const deleteNotifications = useCallback(async (notificationIds: string[]) => {
		try {
			const response = await fetch('/api/notifications', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ notificationIds })
			})

			if (!response.ok) {
				throw new Error('Error al eliminar')
			}

			// Update local state
			setNotifications(prev => 
				prev.filter(n => !notificationIds.includes(n.id))
			)

			// Update stats
			const deletedNotifications = notifications.filter(n => notificationIds.includes(n.id))
			const deletedUnread = deletedNotifications.filter(n => !n.isRead).length
			const deletedArchived = deletedNotifications.filter(n => n.isArchived).length

			setStats(prev => ({
				total: prev.total - notificationIds.length,
				unread: prev.unread - deletedUnread,
				archived: prev.archived - deletedArchived
			}))

			return true
		} catch (err) {
			logger.error('Error deleting notifications:', err)
			toast.error('Error al eliminar notificaciones')
			return false
		}
	}, [notifications])

	// Create new notification (for testing)
	const createNotification = useCallback(async (notification: {
		title: string
		message: string
		type: string
		priority?: string
		actionUrl?: string
		actionLabel?: string
	}) => {
		try {
			const response = await fetch('/api/notifications/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(notification)
			})

			if (!response.ok) {
				throw new Error('Error al crear notificación')
			}

			const newNotification = await response.json()
			
			// Add to local state
			setNotifications(prev => [newNotification, ...prev])
			
			// Update stats
			setStats(prev => ({
				total: prev.total + 1,
				unread: prev.unread + 1,
				archived: prev.archived
			}))

			// Show toast notification
			toast.success(newNotification.title, {
				description: newNotification.message
			})

			return newNotification
		} catch (err) {
			logger.error('Error creating notification:', err)
			toast.error('Error al crear notificación')
			return null
		}
	}, [])

	// Subscribe to push notifications
	const subscribeToPush = useCallback(async () => {
		if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
			toast.error('Las notificaciones push no están soportadas en este navegador')
			return false
		}

		try {
			const permission = await Notification.requestPermission()
			if (permission !== 'granted') {
				toast.error('Permisos de notificación denegados')
				return false
			}

			const registration = await navigator.serviceWorker.ready
			
			// Convertir VAPID key a Uint8Array
			const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
			if (!vapidPublicKey) {
				throw new Error('VAPID key no configurada')
			}

			const applicationServerKey = urlB64ToUint8Array(vapidPublicKey)
			
			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: applicationServerKey as BufferSource
			})

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

			toast.success('¡Notificaciones push activadas!')
			return true
		} catch (err) {
			logger.error('Error subscribing to push notifications:', err)
			toast.error('Error al activar notificaciones push')
			return false
		}
	}, [])

	// Helper function to convert VAPID key
	const urlB64ToUint8Array = (base64String: string): Uint8Array => {
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

	// Load notifications on mount
	useEffect(() => {
		if (session?.user?.id) {
			fetchNotifications({ limit: 20 })
		}
	}, [session?.user?.id, fetchNotifications])

	// Simulate real-time notifications (in production, use WebSockets or Server-Sent Events)
	useEffect(() => {
		if (!session?.user?.id) return

		const interval = setInterval(() => {
			// Simulate random notifications for demo
			if (Math.random() > 0.95) { // 5% chance every 10 seconds
				const demoNotifications = [
					{
						title: 'Recordatorio de entrenamiento',
						message: 'Tienes un entrenamiento programado en 30 minutos',
						type: 'workout_reminder',
						priority: 'medium'
					},
					{
						title: '¡Nuevo récord personal!',
						message: 'Has superado tu récord anterior en press de banca',
						type: 'achievement',
						priority: 'high'
					},
					{
						title: 'Progreso semanal',
						message: 'Has completado 4 de 5 entrenamientos esta semana',
						type: 'progress_update',
						priority: 'low'
					}
				]
				
				const randomNotification = demoNotifications[Math.floor(Math.random() * demoNotifications.length)]
				createNotification(randomNotification)
			}
		}, 10000) // Check every 10 seconds

		return () => clearInterval(interval)
	}, [session?.user?.id, createNotification])

	return {
		notifications,
		stats,
		loading,
		error,
		fetchNotifications,
		markAsRead,
		archiveNotifications,
		deleteNotifications,
		createNotification,
		subscribeToPush
	}
}