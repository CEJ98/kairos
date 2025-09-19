/**
 * useNotifications Hook
 * Manages real-time notifications via Server-Sent Events (SSE)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import type { NotificationEvent } from '@/app/api/notifications/sse/route'

export interface NotificationState {
	notifications: NotificationEvent[]
	unreadCount: number
	isConnected: boolean
	isConnecting: boolean
	error: string | null
}

export interface UseNotificationsReturn extends NotificationState {
	markAsRead: (notificationId: string) => Promise<void>
	markAllAsRead: () => Promise<void>
	clearNotification: (notificationId: string) => void
	clearAllNotifications: () => void
	refreshNotifications: () => Promise<void>
	reconnect: () => void
}

const MAX_NOTIFICATIONS = 50
const RECONNECT_DELAY = 3000
const MAX_RECONNECT_ATTEMPTS = 5

export function useNotifications(): UseNotificationsReturn {
	const { data: session, status } = useSession()
	const [state, setState] = useState<NotificationState>({
		notifications: [],
		unreadCount: 0,
		isConnected: false,
		isConnecting: false,
		error: null
	})

	const eventSourceRef = useRef<EventSource | null>(null)
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const reconnectAttemptsRef = useRef(0)
	const isUnmountedRef = useRef(false)

	// Handle new notification
	const handleNewNotification = useCallback((notification: NotificationEvent) => {
		setState(prev => {
			const existingIndex = prev.notifications.findIndex(n => n.id === notification.id)
			let newNotifications: NotificationEvent[]

			if (existingIndex >= 0) {
				// Update existing notification
				newNotifications = [...prev.notifications]
				newNotifications[existingIndex] = notification
			} else {
				// Add new notification at the beginning
				newNotifications = [notification, ...prev.notifications].slice(0, MAX_NOTIFICATIONS)
			}

			const unreadCount = newNotifications.filter(n => !n.read).length

			return {
				...prev,
				notifications: newNotifications,
				unreadCount
			}
		})

		// Show toast notification
		if (!notification.read) {
			showToastNotification(notification)
		}
	}, [])

	// Show toast notification
	const showToastNotification = useCallback((notification: NotificationEvent) => {
		const toastOptions = {
			duration: 5000,
			action: notification.data?.actionUrl ? {
				label: 'Ver',
				onClick: () => window.location.href = notification.data.actionUrl
			} : undefined
		}

		switch (notification.type) {
			case 'workout_assigned':
				toast.success(notification.message, toastOptions)
				break
			case 'progress_updated':
				toast.info(notification.message, toastOptions)
				break
			case 'achievement':
				toast.success(notification.message, { ...toastOptions, duration: 8000 })
				break
			case 'reminder':
				toast.warning(notification.message, toastOptions)
				break
			default:
				toast(notification.message, toastOptions)
		}
	}, [])

	// Initialize SSE connection
	const connect = useCallback(() => {
		if (!session?.user?.id || status !== 'authenticated') {
			return
		}

		if (eventSourceRef.current) {
			eventSourceRef.current.close()
		}

		setState(prev => ({ ...prev, isConnecting: true, error: null }))

		try {
			const eventSource = new EventSource('/api/notifications/sse', {
				withCredentials: true
			})

			eventSource.onopen = () => {
				if (isUnmountedRef.current) return
				
				setState(prev => ({
					...prev,
					isConnected: true,
					isConnecting: false,
					error: null
				}))
				reconnectAttemptsRef.current = 0
				console.log('SSE connection established')
			}

			eventSource.onmessage = (event) => {
				if (isUnmountedRef.current) return

				try {
					const data = JSON.parse(event.data)

					// Handle connection message
					if (data.type === 'connection') {
						console.log('SSE connection confirmed:', data.message)
						return
					}

					// Handle notification
					const notification: NotificationEvent = data
					handleNewNotification(notification)

				} catch (error) {
					console.error('Error parsing SSE message:', error)
				}
			}

			eventSource.onerror = (error) => {
				if (isUnmountedRef.current) return

				console.error('SSE connection error:', error)
				setState(prev => ({
					...prev,
					isConnected: false,
					isConnecting: false,
					error: 'Connection error'
				}))

				// Attempt to reconnect
				if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
					reconnectAttemptsRef.current++
					reconnectTimeoutRef.current = setTimeout(() => {
						if (!isUnmountedRef.current) {
							console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`)
							connect()
						}
					}, RECONNECT_DELAY)
				} else {
					setState(prev => ({
						...prev,
						error: 'Max reconnection attempts reached'
					}))
				}
			}

			eventSourceRef.current = eventSource

		} catch (error) {
			console.error('Error creating SSE connection:', error)
			setState(prev => ({
				...prev,
				isConnecting: false,
				error: 'Failed to establish connection'
			}))
		}
	}, [session?.user?.id, status, handleNewNotification])

	// Mark notification as read
	const markAsRead = useCallback(async (notificationId: string) => {
		try {
			const response = await fetch(`/api/notifications/${notificationId}/read`, {
				method: 'PATCH'
			})

			if (response.ok) {
				setState(prev => {
					const newNotifications = prev.notifications.map(n =>
						n.id === notificationId ? { ...n, read: true } : n
					)
					const unreadCount = newNotifications.filter(n => !n.read).length

					return {
						...prev,
						notifications: newNotifications,
						unreadCount
					}
				})
			}
		} catch (error) {
			console.error('Error marking notification as read:', error)
		}
	}, [])

	// Mark all notifications as read
	const markAllAsRead = useCallback(async () => {
		try {
			const unreadIds = state.notifications
				.filter(n => !n.read)
				.map(n => n.id)

			if (unreadIds.length === 0) return

			const response = await fetch('/api/notifications/mark-read', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ notificationIds: unreadIds })
			})

			if (response.ok) {
				setState(prev => ({
					...prev,
					notifications: prev.notifications.map(n => ({ ...n, read: true })),
					unreadCount: 0
				}))
			}
		} catch (error) {
			console.error('Error marking all notifications as read:', error)
		}
	}, [state.notifications])

	// Clear notification from local state
	const clearNotification = useCallback((notificationId: string) => {
		setState(prev => {
			const newNotifications = prev.notifications.filter(n => n.id !== notificationId)
			const unreadCount = newNotifications.filter(n => !n.read).length

			return {
				...prev,
				notifications: newNotifications,
				unreadCount
			}
		})
	}, [])

	// Clear all notifications from local state
	const clearAllNotifications = useCallback(() => {
		setState(prev => ({
			...prev,
			notifications: [],
			unreadCount: 0
		}))
	}, [])

	// Refresh notifications from server
	const refreshNotifications = useCallback(async () => {
		try {
			const response = await fetch('/api/notifications')
			if (response.ok) {
				const data = await response.json()
				setState(prev => ({
					...prev,
					notifications: data.notifications || [],
					unreadCount: data.unreadCount || 0
				}))
			}
		} catch (error) {
			console.error('Error refreshing notifications:', error)
		}
	}, [])

	// Manual reconnect
	const reconnect = useCallback(() => {
		reconnectAttemptsRef.current = 0
		connect()
	}, [connect])

	// Initialize connection when session is ready
	useEffect(() => {
		if (status === 'authenticated' && session?.user?.id) {
			connect()
			refreshNotifications()
		}

		return () => {
			isUnmountedRef.current = true
			if (eventSourceRef.current) {
				eventSourceRef.current.close()
			}
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current)
			}
		}
	}, [status, session?.user?.id, connect, refreshNotifications])

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			isUnmountedRef.current = true
			if (eventSourceRef.current) {
				eventSourceRef.current.close()
			}
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current)
			}
		}
	}, [])

	return {
		...state,
		markAsRead,
		markAllAsRead,
		clearNotification,
		clearAllNotifications,
		refreshNotifications,
		reconnect
	}
}