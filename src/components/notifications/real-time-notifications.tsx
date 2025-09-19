'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Check, Archive, Settings, Filter, MoreVertical, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNotifications, Notification } from '@/hooks/use-notifications'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface RealTimeNotificationsProps {
	className?: string
}

const getNotificationIcon = (type: string) => {
	switch (type) {
		case 'workout_reminder':
			return '🏋️'
		case 'achievement':
			return '🏆'
		case 'progress_update':
			return '📈'
		case 'system':
			return '⚙️'
		case 'social':
			return '👥'
		default:
			return '🔔'
	}
}

const getPriorityColor = (priority: string) => {
	switch (priority) {
		case 'urgent':
			return 'bg-red-500'
		case 'high':
			return 'bg-orange-500'
		case 'medium':
			return 'bg-blue-500'
		case 'low':
			return 'bg-gray-500'
		default:
			return 'bg-gray-500'
	}
}

function NotificationItem({ 
	notification, 
	onMarkRead, 
	onArchive, 
	onDelete 
}: {
	notification: Notification
	onMarkRead: (id: string) => void
	onArchive: (id: string) => void
	onDelete: (id: string) => void
}) {
	const [isExpanded, setIsExpanded] = useState(false)

	const handleAction = () => {
		if (notification.actionUrl) {
			window.open(notification.actionUrl, '_blank')
			if (!notification.isRead) {
				onMarkRead(notification.id)
			}
		}
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, x: -100 }}
			transition={{ duration: 0.2 }}
			className={cn(
				'p-4 border rounded-lg hover:bg-muted/50 transition-colors',
				!notification.isRead && 'bg-blue-50 border-blue-200 dark:bg-blue-950/20'
			)}
		>
			<div className="flex items-start gap-3">
				<div className="flex-shrink-0 text-2xl">
					{getNotificationIcon(notification.type)}
				</div>
				
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						<h4 className="text-sm font-medium truncate">
							{notification.title}
						</h4>
						<div className={cn('w-2 h-2 rounded-full', getPriorityColor(notification.priority))} />
						{!notification.isRead && (
							<div className="w-2 h-2 bg-blue-500 rounded-full" />
						)}
					</div>
					
					<p className={cn(
						'text-xs text-muted-foreground mb-2',
						isExpanded ? 'line-clamp-none' : 'line-clamp-2'
					)}>
						{notification.message}
					</p>
					
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground">
							{formatDistanceToNow(new Date(notification.createdAt), { 
								addSuffix: true, 
								locale: es 
							})}
						</span>
						
						<div className="flex gap-1">
							{notification.message.length > 100 && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setIsExpanded(!isExpanded)}
									className="h-6 px-2 text-xs"
								>
									{isExpanded ? 'Menos' : 'Más'}
								</Button>
							)}
							
							{notification.actionUrl && (
								<Button
									variant="ghost"
									size="sm"
									onClick={handleAction}
									className="h-6 px-2 text-xs"
								>
									<ExternalLink className="w-3 h-3 mr-1" />
									{notification.actionLabel || 'Ver'}
								</Button>
							)}
							
							{!notification.isRead && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onMarkRead(notification.id)}
									className="h-6 w-6 p-0"
								>
									<Check className="w-3 h-3" />
								</Button>
							)}
							
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onArchive(notification.id)}
								className="h-6 w-6 p-0"
							>
								<Archive className="w-3 h-3" />
							</Button>
							
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onDelete(notification.id)}
								className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
							>
								<X className="w-3 h-3" />
							</Button>
						</div>
					</div>
				</div>
			</div>
		</motion.div>
	)
}

export default function RealTimeNotifications({ className }: RealTimeNotificationsProps) {
	const {
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
	} = useNotifications()

	const [isOpen, setIsOpen] = useState(false)
	const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all')
	const [typeFilter, setTypeFilter] = useState<string>('all')
	const [pushEnabled, setPushEnabled] = useState(false)

	// Filter notifications
	const filteredNotifications = notifications.filter(notification => {
		if (filter === 'unread' && notification.isRead) return false
		if (filter === 'archived' && !notification.isArchived) return false
		if (filter === 'all' && notification.isArchived) return false
		if (typeFilter !== 'all' && notification.type !== typeFilter) return false
		return true
	})

	// Handle single notification actions
	const handleMarkAsRead = (id: string) => {
		markAsRead([id])
	}

	const handleArchive = (id: string) => {
		archiveNotifications([id])
	}

	const handleDelete = (id: string) => {
		deleteNotifications([id])
	}

	// Handle bulk actions
	const handleMarkAllAsRead = () => {
		const unreadIds = filteredNotifications
			.filter(n => !n.isRead)
			.map(n => n.id)
		if (unreadIds.length > 0) {
			markAsRead(unreadIds)
		}
	}

	const handleEnablePush = async () => {
		const success = await subscribeToPush()
		setPushEnabled(success)
	}

	// Demo: Create test notification
	const handleCreateTestNotification = () => {
		createNotification({
			title: 'Notificación de prueba',
			message: 'Esta es una notificación de prueba para demostrar el sistema en tiempo real.',
			type: 'system',
			priority: 'medium'
		})
	}

	return (
		<div className={cn('relative', className)}>
			<Popover open={isOpen} onOpenChange={setIsOpen}>
				<PopoverTrigger asChild>
					<Button variant="ghost" size="sm" className="relative">
						<Bell className="w-5 h-5" />
						{stats.unread > 0 && (
							<Badge 
								variant="destructive" 
								className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
							>
								<span>{stats.unread > 99 ? '99+' : stats.unread}</span>
							</Badge>
						)}
					</Button>
				</PopoverTrigger>
				
				<PopoverContent className="w-96 p-0" align="end">
					<Card className="border-0 shadow-lg">
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="text-lg">Notificaciones</CardTitle>
								<div className="flex gap-2">
									<Button
										variant="ghost"
										size="sm"
										onClick={handleCreateTestNotification}
										className="text-xs"
									>
										Prueba
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setIsOpen(false)}
									>
										<X className="w-4 h-4" />
									</Button>
								</div>
							</div>
							
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<span>{stats.total} total</span>
								<span>•</span>
								<span>{stats.unread} sin leer</span>
								{stats.unread > 0 && (
									<>
										<span>•</span>
										<Button
											variant="ghost"
											size="sm"
											onClick={handleMarkAllAsRead}
											className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
										>
											Marcar todas como leídas
										</Button>
									</>
								)}
							</div>
						</CardHeader>
						
						<div className="px-6 pb-3">
							<Tabs value={filter} onValueChange={(value: string) => setFilter(value as 'all' | 'unread' | 'archived')}>
								<TabsList className="grid w-full grid-cols-3">
									<TabsTrigger value="all">Todas</TabsTrigger>
									<TabsTrigger value="unread">Sin leer</TabsTrigger>
									<TabsTrigger value="archived">Archivadas</TabsTrigger>
								</TabsList>
							</Tabs>
							
							<div className="flex items-center gap-2 mt-3">
								<Select value={typeFilter} onValueChange={setTypeFilter}>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Filtrar por tipo" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Todos los tipos</SelectItem>
										<SelectItem value="workout_reminder">Recordatorios</SelectItem>
										<SelectItem value="achievement">Logros</SelectItem>
										<SelectItem value="progress_update">Progreso</SelectItem>
										<SelectItem value="system">Sistema</SelectItem>
										<SelectItem value="social">Social</SelectItem>
									</SelectContent>
								</Select>
								
								{!pushEnabled && (
									<Button
										variant="outline"
										size="sm"
										onClick={handleEnablePush}
										className="whitespace-nowrap"
									>
										🔔 Push
									</Button>
								)}
							</div>
						</div>
						
						<Separator />
						
						<CardContent className="p-0">
							<ScrollArea className="h-96">
								{loading ? (
									<div className="flex items-center justify-center h-32">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
									</div>
								) : error ? (
									<div className="flex items-center justify-center h-32 text-red-500">
										<p className="text-sm">{error}</p>
									</div>
								) : filteredNotifications.length === 0 ? (
									<div className="flex items-center justify-center h-32 text-muted-foreground">
										<p className="text-sm">No hay notificaciones</p>
									</div>
								) : (
									<div className="p-4 space-y-3">
										<AnimatePresence>
											{filteredNotifications.map((notification) => (
												<NotificationItem
													key={notification.id}
													notification={notification}
													onMarkRead={handleMarkAsRead}
													onArchive={handleArchive}
													onDelete={handleDelete}
												/>
											))}
										</AnimatePresence>
									</div>
								)}
							</ScrollArea>
						</CardContent>
					</Card>
				</PopoverContent>
			</Popover>
		</div>
	)
}