'use client';

import React, { useState } from 'react';
import { Bell, Check, CheckCheck, X, MessageSquare, Dumbbell, Apple, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const getNotificationIcon = (type: Notification['type']) => {
	switch (type) {
		case 'workout_assigned':
			return <Dumbbell className="h-4 w-4 text-blue-500" />;
		case 'nutrition_plan_assigned':
			return <Apple className="h-4 w-4 text-green-500" />;
		case 'progress_update':
			return <TrendingUp className="h-4 w-4 text-purple-500" />;
		case 'message':
			return <MessageSquare className="h-4 w-4 text-orange-500" />;
		case 'reminder':
			return <Bell className="h-4 w-4 text-yellow-500" />;
		default:
			return <Bell className="h-4 w-4 text-gray-500" />;
	}
};

const getNotificationColor = (type: Notification['type']) => {
	switch (type) {
		case 'workout_assigned':
			return 'border-l-blue-500';
		case 'nutrition_plan_assigned':
			return 'border-l-green-500';
		case 'progress_update':
			return 'border-l-purple-500';
		case 'message':
			return 'border-l-orange-500';
		case 'reminder':
			return 'border-l-yellow-500';
		default:
			return 'border-l-gray-500';
	}
};

interface NotificationItemProps {
	notification: Notification;
	onMarkAsRead: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead }) => {
	return (
		<div
			className={`p-3 border-l-4 ${getNotificationColor(notification.type)} ${
				!notification.read ? 'bg-muted/50' : 'bg-background'
			} hover:bg-muted/30 transition-colors cursor-pointer`}
			onClick={() => !notification.read && onMarkAsRead(notification.id)}
		>
			<div className="flex items-start gap-3">
				<div className="flex-shrink-0 mt-1">
					{getNotificationIcon(notification.type)}
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-center justify-between">
						<h4 className={`text-sm font-medium ${
							!notification.read ? 'text-foreground' : 'text-muted-foreground'
						}`}>
							{notification.title}
						</h4>
						{!notification.read && (
							<Badge variant="secondary" className="h-2 w-2 p-0 bg-blue-500" />
						)}
					</div>
					<p className="text-sm text-muted-foreground mt-1">
						{notification.message}
					</p>
					<p className="text-xs text-muted-foreground mt-2">
						{formatDistanceToNow(new Date(notification.created_at), {
							addSuffix: true,
							locale: es
						})}
					</p>
				</div>
			</div>
		</div>
	);
};

export const NotificationCenter: React.FC = () => {
	const {
		notifications,
		unreadCount,
		isConnected,
		loading,
		error,
		markAsRead,
		markAllAsRead,
		refresh
	} = useNotifications();

	const [isOpen, setIsOpen] = useState(false);

	const handleMarkAsRead = (id: string) => {
		markAsRead(id);
	};

	const handleMarkAllAsRead = () => {
		markAllAsRead();
	};

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm" className="relative">
					<Bell className="h-5 w-5" />
					{unreadCount > 0 && (
						<Badge 
							variant="destructive" 
							className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
						>
							{unreadCount > 99 ? '99+' : unreadCount}
						</Badge>
					)}
					{!isConnected && (
						<div className="absolute -bottom-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-background" />
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-80">
				<div className="p-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Bell className="h-4 w-4" />
							<span className="font-semibold">Notificaciones</span>
							{!isConnected && (
								<Badge variant="destructive" className="text-xs">
									Desconectado
								</Badge>
							)}
						</div>
						<div className="flex items-center gap-1">
							<Button
								variant="ghost"
								size="sm"
								onClick={refresh}
								disabled={loading}
								className="h-8 w-8 p-0"
							>
								<X className="h-4 w-4" />
							</Button>
							{unreadCount > 0 && (
								<Button
									variant="ghost"
									size="sm"
									onClick={handleMarkAllAsRead}
									className="h-8 w-8 p-0"
								>
									<CheckCheck className="h-4 w-4" />
								</Button>
							)}
						</div>
					</div>
				</div>
				<Separator />
				
				{loading ? (
					<div className="p-4 text-center text-sm text-muted-foreground">
						Cargando notificaciones...
					</div>
				) : error ? (
					<div className="p-4 text-center text-sm text-destructive">
						{error}
					</div>
				) : notifications.length === 0 ? (
					<div className="p-4 text-center text-sm text-muted-foreground">
						No hay notificaciones
					</div>
				) : (
					<ScrollArea className="h-96">
						<div className="space-y-1">
							{notifications.map((notification) => (
								<NotificationItem
									key={notification.id}
									notification={notification}
									onMarkAsRead={handleMarkAsRead}
								/>
							))}
						</div>
					</ScrollArea>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default NotificationCenter;