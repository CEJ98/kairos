'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Bell, X, Check, AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface Notification {
	id: string
	title: string
	message: string
	type: 'info' | 'success' | 'warning' | 'error'
	timestamp: Date
	read: boolean
	actionUrl?: string
	actionLabel?: string
	priority: 'low' | 'medium' | 'high'
	category: 'workout' | 'client' | 'payment' | 'system' | 'achievement'
}

interface NotificationSystemProps {
	userId?: string
	userRole?: 'client' | 'trainer'
}

const mockNotifications: Notification[] = [
	{
		id: '1',
		title: 'Nuevo cliente asignado',
		message: 'Ana García se ha registrado y te ha sido asignada como entrenadora',
		type: 'info',
		timestamp: new Date(Date.now() - 5 * 60 * 1000),
		read: false,
		actionUrl: '/dashboard/trainer/clients/ana-garcia',
		actionLabel: 'Ver perfil',
		priority: 'medium',
		category: 'client'
	},
	{
		id: '2',
		title: 'Entrenamiento completado',
		message: 'Carlos López completó su rutina de fuerza con excelentes resultados',
		type: 'success',
		timestamp: new Date(Date.now() - 15 * 60 * 1000),
		read: false,
		actionUrl: '/dashboard/trainer/workouts/session-123',
		actionLabel: 'Ver detalles',
		priority: 'low',
		category: 'workout'
	},
	{
		id: '3',
		title: 'Pago pendiente',
		message: 'El pago de María Rodríguez está vencido desde hace 3 días',
		type: 'warning',
		timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
		read: true,
		actionUrl: '/dashboard/trainer/billing',
		actionLabel: 'Gestionar',
		priority: 'high',
		category: 'payment'
	},
	{
		id: '4',
		title: '¡Nuevo récord personal!',
		message: 'Juan Martínez estableció un nuevo récord en press de banca: 120kg',
		type: 'success',
		timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
		read: true,
		actionUrl: '/dashboard/trainer/clients/juan-martinez/progress',
		actionLabel: 'Ver progreso',
		priority: 'medium',
		category: 'achievement'
	},
	{
		id: '5',
		title: 'Error de sincronización',
		message: 'No se pudieron sincronizar los datos de la sesión de Laura Sánchez',
		type: 'error',
		timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
		read: false,
		actionUrl: '/dashboard/settings/sync',
		actionLabel: 'Resolver',
		priority: 'high',
		category: 'system'
	}
]

export default function NotificationSystem({ userId, userRole = 'trainer' }: NotificationSystemProps) {
	const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
	const [isOpen, setIsOpen] = useState(false)

	const showToast = useCallback((notification: Notification) => {
		const toastConfig = {
			title: notification.title,
			description: notification.message,
			action: notification.actionUrl ? {
				label: notification.actionLabel || 'Ver',
				onClick: () => window.location.href = notification.actionUrl!
			} : undefined
		}

		switch (notification.type) {
			case 'success':
				toast.success(notification.title, toastConfig)
				break
			case 'error':
				toast.error(notification.title, toastConfig)
				break
			case 'warning':
				toast.warning(notification.title, toastConfig)
				break
			default:
				toast.info(notification.title, toastConfig)
		}
	}, [])

	// Simular notificaciones en tiempo real
	useEffect(() => {
		const interval = setInterval(() => {
			// Simular nueva notificación cada 30 segundos (solo para demo)
			if (Math.random() > 0.7) {
				const newNotification: Notification = {
					id: Date.now().toString(),
					title: 'Nueva actividad',
					message: 'Se ha registrado nueva actividad en tu dashboard',
					type: 'info',
					timestamp: new Date(),
					read: false,
					priority: 'low',
					category: 'system'
				}
				setNotifications(prev => [newNotification, ...prev])
				
				// Mostrar toast para notificaciones de alta prioridad
				if (newNotification.priority === 'high') {
					showToast(newNotification)
				}
			}
		}, 30000)

		return () => clearInterval(interval)
	}, [showToast])

	const unreadCount = notifications.filter(n => !n.read).length

	const markAsRead = (id: string) => {
		setNotifications(prev => 
			prev.map(n => n.id === id ? { ...n, read: true } : n)
		)
	}

	const markAllAsRead = () => {
		setNotifications(prev => 
			prev.map(n => ({ ...n, read: true }))
		)
	}

	const deleteNotification = (id: string) => {
		setNotifications(prev => prev.filter(n => n.id !== id))
	}

	const getNotificationIcon = (type: Notification['type']) => {
		switch (type) {
			case 'success':
				return <CheckCircle className="h-4 w-4 text-green-500" />
			case 'error':
				return <XCircle className="h-4 w-4 text-red-500" />
			case 'warning':
				return <AlertCircle className="h-4 w-4 text-yellow-500" />
			default:
				return <Info className="h-4 w-4 text-blue-500" />
		}
	}

	const getPriorityColor = (priority: Notification['priority']) => {
		switch (priority) {
			case 'high':
				return 'bg-red-500'
			case 'medium':
				return 'bg-yellow-500'
			default:
				return 'bg-green-500'
		}
	}

	const formatTimestamp = (timestamp: Date) => {
		const now = new Date()
		const diff = now.getTime() - timestamp.getTime()
		const minutes = Math.floor(diff / (1000 * 60))
		const hours = Math.floor(diff / (1000 * 60 * 60))
		const days = Math.floor(diff / (1000 * 60 * 60 * 24))

		if (minutes < 1) return 'Ahora'
		if (minutes < 60) return `Hace ${minutes}m`
		if (hours < 24) return `Hace ${hours}h`
		return `Hace ${days}d`
	}

	return (
		<div className="relative">
			<Button 
				variant="ghost" 
				size="sm" 
				className="relative"
				onClick={() => setIsOpen(!isOpen)}
			>
				<Bell className="h-5 w-5" />
				{unreadCount > 0 && (
					<Badge 
						variant="destructive" 
						className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
					>
						{unreadCount > 99 ? '99+' : unreadCount}
					</Badge>
				)}
			</Button>
			
			{isOpen && (
				<div className="absolute right-0 top-full mt-2 w-80 bg-background border rounded-lg shadow-lg z-50">
					<div className="flex items-center justify-between p-4">
						<h3 className="font-semibold">Notificaciones</h3>
						{unreadCount > 0 && (
							<Button 
								variant="ghost" 
								size="sm" 
								onClick={markAllAsRead}
								className="text-xs"
							>
								Marcar todas como leídas
							</Button>
						)}
					</div>
					<Separator />
					<div className="max-h-96 overflow-y-auto">
						{notifications.length === 0 ? (
							<div className="p-4 text-center text-muted-foreground">
								No hay notificaciones
							</div>
						) : (
							<div className="space-y-1">
								{notifications.map((notification) => (
									<div
										key={notification.id}
										className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors ${
											!notification.read ? 'bg-muted/30' : ''
										}`}
										onClick={() => markAsRead(notification.id)}
									>
										<div className="flex items-start gap-3">
											<div className="flex-shrink-0 mt-0.5">
												{getNotificationIcon(notification.type)}
											</div>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-1">
													<h4 className="text-sm font-medium truncate">
														{notification.title}
													</h4>
													<div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`} />
													{!notification.read && (
														<div className="w-2 h-2 bg-blue-500 rounded-full" />
													)}
												</div>
												<p className="text-xs text-muted-foreground mb-2 line-clamp-2">
													{notification.message}
												</p>
												<div className="flex items-center justify-between">
													<span className="text-xs text-muted-foreground">
														{formatTimestamp(notification.timestamp)}
													</span>
													<div className="flex gap-1">
														{notification.actionUrl && (
															<Button
																variant="ghost"
																size="sm"
																className="h-6 px-2 text-xs"
																onClick={(e) => {
																	e.stopPropagation()
																	window.location.href = notification.actionUrl!
																}}
															>
																{notification.actionLabel || 'Ver'}
															</Button>
														)}
														<Button
															variant="ghost"
															size="sm"
															className="h-6 w-6 p-0"
															onClick={(e) => {
																e.stopPropagation()
																deleteNotification(notification.id)
															}}
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
						)}
					</div>
				</div>
			)}
		</div>
	)
}

// Hook para usar el sistema de notificaciones
export function useNotifications() {
	const [notifications, setNotifications] = useState<Notification[]>([])

	const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
		const newNotification: Notification = {
			...notification,
			id: Date.now().toString(),
			timestamp: new Date(),
			read: false
		}
		setNotifications(prev => [newNotification, ...prev])
		return newNotification.id
	}, [])

	const removeNotification = useCallback((id: string) => {
		setNotifications(prev => prev.filter(n => n.id !== id))
	}, [])

	const markAsRead = useCallback((id: string) => {
		setNotifications(prev => 
			prev.map(n => n.id === id ? { ...n, read: true } : n)
		)
	}, [])

	return {
		notifications,
		addNotification,
		removeNotification,
		markAsRead,
		unreadCount: notifications.filter(n => !n.read).length
	}
}