'use client'

import { useNotifications as useRealTimeNotifications } from '@/hooks/use-notifications'
import RealTimeNotifications from './real-time-notifications'

// Legacy notification interface for backward compatibility
interface LegacyNotification {
	id: string
	title: string
	message: string
	type: 'info' | 'success' | 'warning' | 'error'
	timestamp: Date
	isRead: boolean
	priority: 'low' | 'medium' | 'high'
	actionUrl?: string
	actionLabel?: string
}

interface NotificationSystemProps {
	className?: string
}

// Main notification system component using the new real-time implementation
export default function NotificationSystem({ className }: NotificationSystemProps) {
	return (
		<RealTimeNotifications className={className} />
	)
}

// Legacy hook for backward compatibility
export function useNotifications(): {
	notifications: LegacyNotification[]
	unreadCount: number
	addNotification: (notification: Omit<LegacyNotification, 'id' | 'timestamp' | 'isRead'>) => Promise<string>
	markAsRead: (id: string) => Promise<void>
	removeNotification: (id: string) => Promise<void>
	clearAll: () => Promise<void>
} {
	const realTimeHook = useRealTimeNotifications()
	
	// Map new notification format to legacy format for backward compatibility
	const legacyNotifications: LegacyNotification[] = realTimeHook.notifications.map((n: any) => ({
		id: n.id,
		title: n.title,
		message: n.message,
		type: n.type === 'workout_reminder' ? 'info' : 
			  n.type === 'achievement' ? 'success' : 
			  n.type === 'system' ? 'warning' : 'info',
		timestamp: new Date(n.createdAt),
		isRead: n.isRead,
		priority: n.priority as 'low' | 'medium' | 'high',
		actionUrl: n.actionUrl,
		actionLabel: n.actionLabel
	}))
	
	return {
		notifications: legacyNotifications,
		unreadCount: realTimeHook.stats.unread,
		addNotification: async (notification: Omit<LegacyNotification, 'id' | 'timestamp' | 'isRead'>) => {
			return await realTimeHook.createNotification({
				title: notification.title,
				message: notification.message,
				type: notification.type === 'success' ? 'achievement' : 
					  notification.type === 'warning' ? 'system' : 'workout_reminder',
				priority: notification.priority,
				actionUrl: notification.actionUrl,
				actionLabel: notification.actionLabel
			})
		},
		markAsRead: async (id: string) => {
			await realTimeHook.markAsRead([id])
		},
		removeNotification: async (id: string) => {
			await realTimeHook.deleteNotifications([id])
		},
		clearAll: async () => {
			const allIds = realTimeHook.notifications.map((n: any) => n.id)
			await realTimeHook.deleteNotifications(allIds)
		}
	}
}