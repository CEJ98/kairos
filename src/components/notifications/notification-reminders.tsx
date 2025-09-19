/**
 * Componente de Notificaciones de Recordatorios y Asignaciones
 * Muestra notificaciones específicas para entrenamientos y asignaciones
 */

'use client'

import { useState, useEffect } from 'react'
import { Bell, Clock, Dumbbell, Apple, MessageSquare, Trophy, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useNotifications } from '@/hooks/use-notifications'
import { useNotificationActions } from '@/hooks/use-notification-actions'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface NotificationRemindersProps {
	showOnlyUnread?: boolean
	maxItems?: number
	compact?: boolean
}

export function NotificationReminders({
	showOnlyUnread = true,
	maxItems = 5,
	compact = false
}: NotificationRemindersProps) {
	const { notifications, loading, markAsRead, deleteNotifications, fetchNotifications } = useNotifications()
	const { isLoading: actionLoading } = useNotificationActions()

	// Filtrar notificaciones relevantes
	const relevantNotifications = notifications
		?.filter(notification => {
			const isRelevantType = [
				'workout_reminder',
				'workout_assigned',
				'nutrition_assigned',
				'trainer_message',
				'achievement'
			].includes(notification.type)
			
			return isRelevantType && (!showOnlyUnread || !notification.isRead)
		})
		?.slice(0, maxItems) || []

	// Obtener icono según tipo de notificación
	const getNotificationIcon = (type: string) => {
		switch (type) {
			case 'workout_reminder':
				return <Clock className="h-4 w-4 text-blue-500" />
			case 'workout_assigned':
				return <Dumbbell className="h-4 w-4 text-green-500" />
			case 'nutrition_assigned':
				return <Apple className="h-4 w-4 text-orange-500" />
			case 'trainer_message':
				return <MessageSquare className="h-4 w-4 text-purple-500" />
			case 'achievement':
				return <Trophy className="h-4 w-4 text-yellow-500" />
			default:
				return <Bell className="h-4 w-4 text-gray-500" />
		}
	}

	// Obtener color de prioridad
	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case 'urgent':
				return 'bg-red-100 text-red-800 border-red-200'
			case 'high':
				return 'bg-orange-100 text-orange-800 border-orange-200'
			case 'medium':
				return 'bg-blue-100 text-blue-800 border-blue-200'
			case 'low':
				return 'bg-gray-100 text-gray-800 border-gray-200'
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200'
		}
	}

	// Manejar acción de notificación
	const handleNotificationAction = async (notification: any) => {
		if (notification.actionUrl) {
			// Marcar como leída y navegar
			await markAsRead([notification.id])
			window.location.href = notification.actionUrl
		}
	}

	// Marcar como leída
	const handleMarkAsRead = async (notificationId: string) => {
		try {
			await markAsRead([notificationId])
			toast.success('Notificación marcada como leída')
		} catch (error) {
			toast.error('Error al marcar como leída')
		}
	}

	// Eliminar notificación
	const handleDelete = async (notificationId: string) => {
		try {
			await deleteNotifications([notificationId])
			toast.success('Notificación eliminada')
		} catch (error) {
			toast.error('Error al eliminar notificación')
		}
	}

	if (loading) {
		return (
			<Card className={compact ? 'p-4' : ''}>
				<div className="flex items-center justify-center p-4">
					<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
					<span className="ml-2 text-sm text-gray-600">Cargando notificaciones...</span>
				</div>
			</Card>
		)
	}

	if (relevantNotifications.length === 0) {
		return (
			<Card className={compact ? 'p-4' : ''}>
				<div className="flex flex-col items-center justify-center p-6 text-center">
					<Bell className="h-8 w-8 text-gray-400 mb-2" />
					<p className="text-sm text-gray-600">
						{showOnlyUnread ? 'No tienes notificaciones nuevas' : 'No hay notificaciones'}
					</p>
				</div>
			</Card>
		)
	}

	return (
		<Card className={compact ? 'p-2' : ''}>
			{!compact && (
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-lg">
						<Bell className="h-5 w-5" />
						Notificaciones
						{relevantNotifications.length > 0 && (
							<Badge variant="secondary" className="ml-auto">
								{relevantNotifications.length}
							</Badge>
						)}
					</CardTitle>
				</CardHeader>
			)}
			
			<CardContent className={compact ? 'p-2' : 'pt-0'}>
				<div className="space-y-3">
					{relevantNotifications.map((notification) => (
						<div
							key={notification.id}
							className={`
								relative p-3 rounded-lg border transition-all duration-200 hover:shadow-sm
								${!notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}
								${compact ? 'p-2' : 'p-3'}
							`}
						>
							{/* Indicador de no leída */}
							{!notification.isRead && (
								<div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
							)}

							<div className="flex items-start gap-3">
								{/* Icono */}
								<div className="flex-shrink-0 mt-0.5">
									{getNotificationIcon(notification.type)}
								</div>

								{/* Contenido */}
								<div className="flex-1 min-w-0">
									<div className="flex items-start justify-between gap-2">
										<div className="flex-1">
											<h4 className={`font-medium ${compact ? 'text-sm' : 'text-sm'} text-gray-900 line-clamp-1`}>
												{notification.title}
											</h4>
											<p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600 mt-1 line-clamp-2`}>
												{notification.message}
											</p>
										</div>

										{/* Prioridad */}
										{notification.priority !== 'low' && (
											<Badge 
												variant="outline" 
												className={`text-xs ${getPriorityColor(notification.priority)}`}
											>
												{notification.priority === 'urgent' ? 'Urgente' :
												 notification.priority === 'high' ? 'Alta' : 'Media'}
											</Badge>
										)}
									</div>

									{/* Tiempo y acciones */}
									<div className="flex items-center justify-between mt-2">
										<span className={`${compact ? 'text-xs' : 'text-xs'} text-gray-500`}>
											{formatDistanceToNow(new Date(notification.createdAt), {
												addSuffix: true,
												locale: es
											})}
										</span>

										<div className="flex items-center gap-1">
											{/* Botón de acción principal */}
											{notification.actionUrl && notification.actionLabel && (
												<Button
													size="sm"
													variant="outline"
													className="text-xs h-7 px-2"
													onClick={() => handleNotificationAction(notification)}
													disabled={actionLoading}
												>
													{notification.actionLabel}
												</Button>
											)}

											{/* Marcar como leída */}
											{!notification.isRead && (
												<Button
													size="sm"
													variant="ghost"
													className="h-7 w-7 p-0 text-gray-400 hover:text-green-600"
													onClick={() => handleMarkAsRead(notification.id)}
													disabled={actionLoading}
													title="Marcar como leída"
												>
													<Check className="h-3 w-3" />
												</Button>
											)}

											{/* Eliminar */}
											<Button
												size="sm"
												variant="ghost"
												className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
												onClick={() => handleDelete(notification.id)}
												disabled={actionLoading}
												title="Eliminar notificación"
											>
												<X className="h-3 w-3" />
											</Button>
										</div>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}

export default NotificationReminders