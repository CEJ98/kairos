'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { ChatSystem } from '@/components/chat/chat-system'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Users, Wifi, WifiOff } from 'lucide-react'
import { useWebSocket } from '@/hooks/useWebSocket'

export default function ChatPage() {
	const { data: session } = useSession()
	const { isConnected, connectedUsers } = useWebSocket()
	const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>()

	return (
		<div className="min-h-screen bg-gray-50 p-6">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
								<MessageSquare className="w-8 h-8 text-green-600" />
								Chat en Tiempo Real
							</h1>
							<p className="text-gray-600 mt-1">
								Comunícate con entrenadores y clientes en tiempo real
							</p>
						</div>
						
						{/* Status indicators */}
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-2">
								{isConnected ? (
									<>
										<Wifi className="w-5 h-5 text-green-600" />
										<Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
											Conectado
										</Badge>
									</>
								) : (
									<>
										<WifiOff className="w-5 h-5 text-red-600" />
										<Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
											Desconectado
										</Badge>
									</>
								)}
							</div>
							
							<div className="flex items-center gap-2">
								<Users className="w-5 h-5 text-blue-600" />
								<Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
									{connectedUsers.length} usuarios online
								</Badge>
							</div>
						</div>
					</div>
				</div>

				{/* Chat System */}
				<Card className="h-[calc(100vh-200px)]">
					<CardContent className="p-0 h-full">
						<ChatSystem 
							isMinimized={false}
							selectedConversationId={selectedConversationId}
							onConversationSelect={setSelectedConversationId}
						/>
					</CardContent>
				</Card>

				{/* Debug Info (solo en desarrollo) */}
				{process.env.NODE_ENV === 'development' && (
					<Card className="mt-6">
						<CardHeader>
							<CardTitle className="text-sm font-medium text-gray-600">
								Información de Debug
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<strong>Usuario:</strong> {session?.user?.name || 'No autenticado'}
								</div>
								<div>
									<strong>ID:</strong> {session?.user?.id || 'N/A'}
								</div>
								<div>
									<strong>WebSocket:</strong> {isConnected ? 'Conectado' : 'Desconectado'}
								</div>
								<div>
									<strong>Usuarios Online:</strong> {connectedUsers.length}
								</div>
							</div>
							{connectedUsers.length > 0 && (
								<div className="mt-4">
									<strong>Usuarios conectados:</strong>
									<ul className="mt-2 space-y-1">
										{connectedUsers.map((user) => (
											<li key={user.id} className="text-xs text-gray-600">
												{user.name} ({user.role}) - {user.isOnline ? 'Online' : 'Offline'}
											</li>
										))}
									</ul>
								</div>
							)}
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	)
}