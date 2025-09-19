/**
 * Centro de Notificaciones para el Dashboard
 * Componente principal que integra notificaciones de recordatorios y asignaciones
 */

'use client'

import { useState, useEffect } from 'react'
import { Bell, Settings, MoreVertical, Filter, Archive, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationReminders } from '@/components/notifications/notification-reminders'
import { NotificationSettings } from '@/components/notifications/notification-settings'
import { useNotifications } from '@/hooks/use-notifications'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

interface NotificationCenterProps {
	compact?: boolean
	showSettings?: boolean
	defaultTab?: 'all' | 'unread' | 'reminders' | 'assignments'
}

export function NotificationCenter({
	compact = false,
	showSettings = true,
	defaultTab = 'unread'
}: NotificationCenterProps) {
	const { notifications, stats, loading, markAsRead, archiveNotifications, fetchNotifications } = useNotifications()
	const [activeTab, setActiveTab] = useState(defaultTab)
	const [showSettingsPanel, setShowSettingsPanel] = useState(false)
	const [actionLoading, setActionLoading] = useState(false)

	// Filtrar notificaciones por tipo
	const reminderNotifications = notifications?.filter(n => 
		n.type === 'workout_reminder'
	) || []

	const assignmentNotifications = notifications?.filter(n => 
		['workout_assigned', 'nutrition_assigned', 'trainer_message'].includes(n.type)
	) || []

	const unreadNotifications = notifications?.filter(n => !n.isRead) || []

	// Marcar todas como leídas
	const handleMarkAllAsRead = async () => {
		if (unreadNotifications.length === 0) {
			toast.info('No hay notificaciones sin leer')
			return
		}

		setActionLoading(true)
		try {
			const unreadIds = unreadNotifications.map(n => n.id)
			await markAsRead(unreadIds)
			toast.success(`${unreadIds.length} notificaciones marcadas como leídas`)
		} catch (error) {
			logger.error('Error marking all as read:', error)
			toast.error('Error al marcar como leídas')
		} finally {
			setActionLoading(false)
		}
	}

	// Archivar todas las leídas
	const handleArchiveRead = async () => {
		const readNotifications = notifications?.filter(n => n.isRead && !n.isArchived) || []
		
		if (readNotifications.length === 0) {
			toast.info('No hay notificaciones leídas para archivar')
			return
		}

		setActionLoading(true)
		try {
			const readIds = readNotifications.map(n => n.id)
			await archiveNotifications(readIds)
			toast.success(`${readIds.length} notificaciones archivadas`)
		} catch (error) {
			logger.error('Error archiving notifications:', error)
			toast.error('Error al archivar notificaciones')
		} finally {
			setActionLoading(false)
		}
	}

	// Refrescar notificaciones
	const handleRefresh = async () => {
		setActionLoading(true)
		try {
			await fetchNotifications({ limit: 50 })
			toast.success('Notificaciones actualizadas')
		} catch (error) {
			logger.error('Error refreshing notifications:', error)
			toast.error('Error al actualizar notificaciones')
		} finally {
			setActionLoading(false)
		}
	}

	if (showSettingsPanel) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-semibold">Configuración de Notificaciones</h2>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowSettingsPanel(false)}
					>
						Volver
					</Button>
				</div>
				<NotificationSettings />
			</div>
		)
	}

	return (
		<Card className={compact ? 'h-full' : ''}>
			<CardHeader className={compact ? 'pb-3' : 'pb-4'}>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<Bell className="h-5 w-5" />
						Centro de Notificaciones
						{stats.unread > 0 && (
							<Badge variant="destructive" className="ml-2">
								{stats.unread}
							</Badge>
						)}
					</CardTitle>

					<div className="flex items-center gap-2">
						{/* Botón de refrescar */}
						<Button
							variant="ghost"
							size="sm"
							onClick={handleRefresh}
							disabled={loading || actionLoading}
							className="h-8 w-8 p-0"
						>
							<Bell className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />
						</Button>

						{/* Menú de acciones */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 w-8 p-0"
									disabled={actionLoading}
								>
									<MoreVertical className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={handleMarkAllAsRead}
									disabled={unreadNotifications.length === 0 || actionLoading}
								>
									<CheckCheck className="h-4 w-4 mr-2" />
									Marcar todas como leídas
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={handleArchiveRead}
									disabled={actionLoading}
								>
									<Archive className="h-4 w-4 mr-2" />
									Archivar leídas
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								{showSettings && (
									<DropdownMenuItem onClick={() => setShowSettingsPanel(true)}>
										<Settings className="h-4 w-4 mr-2" />
										Configuración
									</DropdownMenuItem>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				{/* Estadísticas rápidas */}
				{!compact && (
					<div className="flex gap-4 mt-3">
						<div className="text-center">
							<div className="text-2xl font-bold text-blue-600">{stats.total}</div>
							<div className="text-xs text-gray-600">Total</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-orange-600">{stats.unread}</div>
							<div className="text-xs text-gray-600">Sin leer</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-green-600">{reminderNotifications.length}</div>
							<div className="text-xs text-gray-600">Recordatorios</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-purple-600">{assignmentNotifications.length}</div>
							<div className="text-xs text-gray-600">Asignaciones</div>
						</div>
					</div>
				)}
			</CardHeader>

			<CardContent className={compact ? 'pt-0' : ''}>
				<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full">
					<TabsList className="grid w-full grid-cols-4">
						<TabsTrigger value="all" className="text-xs">
							Todas
							{stats.total > 0 && (
								<Badge variant="secondary" className="ml-1 text-xs">
									{stats.total}
								</Badge>
							)}
						</TabsTrigger>
						<TabsTrigger value="unread" className="text-xs">
							Sin leer
							{stats.unread > 0 && (
								<Badge variant="destructive" className="ml-1 text-xs">
									{stats.unread}
								</Badge>
							)}
						</TabsTrigger>
						<TabsTrigger value="reminders" className="text-xs">
							Recordatorios
							{reminderNotifications.length > 0 && (
								<Badge variant="outline" className="ml-1 text-xs">
									{reminderNotifications.length}
								</Badge>
							)}
						</TabsTrigger>
						<TabsTrigger value="assignments" className="text-xs">
							Asignaciones
							{assignmentNotifications.length > 0 && (
								<Badge variant="outline" className="ml-1 text-xs">
									{assignmentNotifications.length}
								</Badge>
							)}
						</TabsTrigger>
					</TabsList>

					<TabsContent value="all" className="mt-4">
						<NotificationReminders
							showOnlyUnread={false}
							maxItems={compact ? 5 : 10}
							compact={compact}
						/>
					</TabsContent>

					<TabsContent value="unread" className="mt-4">
						<NotificationReminders
							showOnlyUnread={true}
							maxItems={compact ? 5 : 10}
							compact={compact}
						/>
					</TabsContent>

					<TabsContent value="reminders" className="mt-4">
						<div className="space-y-3">
							{reminderNotifications.length === 0 ? (
								<div className="text-center py-8 text-gray-500">
									<Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
									<p className="text-sm">No tienes recordatorios activos</p>
								</div>
							) : (
								<NotificationReminders
									showOnlyUnread={false}
									maxItems={compact ? 5 : 10}
									compact={compact}
								/>
							)}
						</div>
					</TabsContent>

					<TabsContent value="assignments" className="mt-4">
						<div className="space-y-3">
							{assignmentNotifications.length === 0 ? (
								<div className="text-center py-8 text-gray-500">
									<Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
									<p className="text-sm">No tienes asignaciones pendientes</p>
								</div>
							) : (
								<NotificationReminders
									showOnlyUnread={false}
									maxItems={compact ? 5 : 10}
									compact={compact}
								/>
							)}
						</div>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	)
}

export default NotificationCenter