'use client'

import { ChatSystem } from '@/components/chat/chat-system'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Users, Wifi, WifiOff } from 'lucide-react'

export default function ChatPage() {
	const { isConnected, connectedUsers } = useWebSocket()

	return (
		<div className="container mx-auto p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<MessageCircle className="h-6 w-6" />
					<h1 className="text-2xl font-bold">Chat en Tiempo Real</h1>
				</div>
				<div className="flex items-center space-x-4">
					<Badge variant={isConnected ? 'default' : 'destructive'} className="flex items-center space-x-1">
						{isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
						<span>{isConnected ? 'Conectado' : 'Desconectado'}</span>
					</Badge>
					<Badge variant="outline" className="flex items-center space-x-1">
						<Users className="h-3 w-3" />
						<span>{connectedUsers.length} usuarios conectados</span>
					</Badge>
				</div>
			</div>

			<Card className="h-[calc(100vh-200px)]">
				<CardHeader>
					<CardTitle>Sistema de Chat</CardTitle>
				</CardHeader>
				<CardContent className="h-full p-0">
					<ChatSystem />
				</CardContent>
			</Card>
		</div>
	)
}