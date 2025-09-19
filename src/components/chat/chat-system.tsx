/**
 * Sistema de Chat en Tiempo Real para Kairos Fitness
 * Chat entre entrenadores y clientes con notificaciones en tiempo real
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSession } from 'next-auth/react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
	Send, 
	MessageSquare, 
	Phone, 
	Video, 
	MoreVertical, 
	Paperclip, 
	Smile,
	Check,
	CheckCheck,
	Clock,
	X,
	Minimize2,
	Maximize2,
	AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import { chatMessageSchema, type ChatMessageFormData, chatValidationUtils } from '@/lib/validations/chat'

// Tipos para el sistema de chat
export interface ChatMessage {
	id: string
	conversationId: string
	senderId: string
	content: string
	type: 'TEXT' | 'WORKOUT_ASSIGNMENT' | 'IMAGE' | 'FILE'
	isRead: boolean
	createdAt: string
	updatedAt?: string
	metadata?: Record<string, any>
	sender?: {
		id: string
		name: string
		avatar?: string
	}
}

export interface ChatUser {
	id: string
	name: string
	email: string
	avatar?: string
	role: 'CLIENT' | 'TRAINER'
	isOnline: boolean
	lastSeen?: string
}

export interface ChatConversation {
	id: string
	participant: ChatUser
	lastMessage?: {
		content: string
		createdAt: string
		senderId: string
	}
	unreadCount: number
	updatedAt: string
}

// Props del componente principal
interface ChatSystemProps {
	isMinimized?: boolean
	onToggleMinimize?: () => void
	selectedConversationId?: string
	onConversationSelect?: (conversationId: string) => void
}

// Componente de mensaje individual
function MessageBubble({ message, currentUserId, otherUser }: {
	message: ChatMessage
	currentUserId: string
	otherUser: ChatUser
}) {
	const isOwn = message.senderId === currentUserId
	const formatTime = (dateString: string) => {
		const date = new Date(dateString)
		return new Intl.DateTimeFormat('es-ES', {
			hour: '2-digit',
			minute: '2-digit'
		}).format(date)
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
			className={cn(
				'flex gap-2 mb-4',
				isOwn ? 'justify-end' : 'justify-start'
			)}
		>
			{!isOwn && (
				<Avatar className="w-8 h-8 mt-1">
					<AvatarImage src={message.sender?.avatar || otherUser.avatar} />
					<AvatarFallback>{(message.sender?.name || otherUser.name).charAt(0)}</AvatarFallback>
				</Avatar>
			)}
			
			<div className={cn(
				'max-w-[70%] space-y-1',
				isOwn ? 'items-end' : 'items-start'
			)}>
				<div className={cn(
					'px-4 py-2 rounded-2xl text-sm',
					isOwn 
						? 'bg-green-600 text-white rounded-br-md' 
						: 'bg-gray-100 text-gray-900 rounded-bl-md'
				)}>
					{message.type === 'WORKOUT_ASSIGNMENT' ? (
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<Badge variant="secondary">Rutina Asignada</Badge>
							</div>
							<p>{message.content}</p>
						</div>
					) : (
						<p>{message.content}</p>
					)}
				</div>
				
				<div className={cn(
					'flex items-center gap-1 text-xs text-gray-500',
					isOwn ? 'justify-end' : 'justify-start'
				)}>
					<span>{formatTime(message.createdAt)}</span>
					{isOwn && (
						<div className="flex items-center">
							{message.isRead ? (
								<CheckCheck className="w-3 h-3 text-green-600" />
							) : (
								<Check className="w-3 h-3" />
							)}
						</div>
					)}
				</div>
			</div>
		</motion.div>
	)
}

// Lista de conversaciones
function ConversationList({ 
	conversations, 
	selectedId, 
	onSelect,
	currentUserId 
}: {
	conversations: ChatConversation[]
	selectedId?: string
	onSelect: (id: string) => void
	currentUserId: string
}) {
	return (
		<div className="space-y-2">
			{conversations.map((conversation) => {
				const otherUser = conversation.participant
				if (!otherUser) return null

				return (
					<motion.div
						key={conversation.id}
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						className={cn(
							'p-3 rounded-lg cursor-pointer transition-colors',
							selectedId === conversation.id 
								? 'bg-green-50 border border-green-200' 
								: 'hover:bg-gray-50'
						)}
						onClick={() => onSelect(conversation.id)}
					>
						<div className="flex items-center gap-3">
							<div className="relative">
								<Avatar className="w-10 h-10">
									<AvatarImage src={otherUser.avatar} />
									<AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
								</Avatar>
								{otherUser.isOnline && (
									<div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
								)}
							</div>
							
							<div className="flex-1 min-w-0">
								<div className="flex items-center justify-between">
								<h4 className="font-medium text-sm truncate">{otherUser.name}</h4>
								{conversation.unreadCount > 0 && (
										<Badge variant="destructive" className="text-xs px-2 py-0">
											{conversation.unreadCount}
										</Badge>
									)}
								</div>
								{conversation.lastMessage && (
									<p className="text-xs text-gray-500 truncate mt-1">
										{conversation.lastMessage.content}
									</p>
								)}
							</div>
						</div>
					</motion.div>
				)
			})}
		</div>
	)
}

// Componente principal del sistema de chat
export function ChatSystem({ 
	isMinimized = false, 
	onToggleMinimize,
	selectedConversationId,
	onConversationSelect 
}: ChatSystemProps) {
	const { data: session } = useSession()
	const [conversations, setConversations] = useState<ChatConversation[]>([])
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null)
	const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	const typingTimeoutRef = useRef<NodeJS.Timeout>()

	// Form validation para mensajes
	const messageForm = useForm<ChatMessageFormData>({
		resolver: zodResolver(chatMessageSchema),
		defaultValues: {
			content: '',
			type: 'TEXT',
			recipientId: '',
			metadata: {
				isUrgent: false,
				hasAttachment: false,
				mentions: []
			}
		}
	})
	
	// WebSocket integration
	const {
		isConnected,
		connectedUsers,
		joinConversation,
		leaveConversation,
		sendMessage: sendWebSocketMessage,
		markMessagesRead,
		startTyping,
		stopTyping,
		onNewMessage,
		onMessageRead,
		onUserTyping,
		onUserStoppedTyping,
		onUserOnline,
		onUserOffline
	} = useWebSocket()

	// Scroll automático al final de los mensajes
	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [])

	useEffect(() => {
		scrollToBottom()
	}, [messages, scrollToBottom])

	// Cargar conversaciones
	useEffect(() => {
		if (!session?.user?.id) return

		const loadConversations = async () => {
			try {
				const response = await fetch('/api/chat/conversations')
				if (response.ok) {
					const data = await response.json()
					setConversations(data)
				}
			} catch (error) {
				logger.error('Error loading conversations:', error)
			}
		}

		loadConversations()
	}, [session?.user?.id])

	// WebSocket event handlers
	useEffect(() => {
		let unsubscribeNewMessage: (() => void) | undefined
		let unsubscribeMessageRead: (() => void) | undefined
		let unsubscribeTyping: (() => void) | undefined
		let unsubscribeStoppedTyping: (() => void) | undefined
		let unsubscribeUserOnline: (() => void) | undefined
		let unsubscribeUserOffline: (() => void) | undefined

		unsubscribeNewMessage = onNewMessage((message: ChatMessage) => {
			setMessages(prev => {
				// Evitar duplicados
				if (prev.find(m => m.id === message.id)) return prev
				return [...prev, message]
			})
			
			// Actualizar última mensaje en conversaciones
			setConversations(prev => prev.map(conv => {
				if (conv.id === message.conversationId) {
					return {
						...conv,
						lastMessage: {
							content: message.content,
							createdAt: message.createdAt,
							senderId: message.senderId
						},
						unreadCount: message.senderId !== session?.user?.id ? conv.unreadCount + 1 : conv.unreadCount,
						updatedAt: message.createdAt
					}
				}
				return conv
			}))
		})

		unsubscribeMessageRead = onMessageRead((data) => {
			if (data.conversationId === selectedConversationId) {
				setMessages(prev => prev.map(msg => ({
					...msg,
					isRead: msg.senderId === session?.user?.id ? true : msg.isRead
				})))
			}
		})

		unsubscribeTyping = onUserTyping((data) => {
			if (data.conversationId === selectedConversationId && data.userId !== session?.user?.id) {
				setTypingUsers(prev => new Set([...prev, data.userId]))
			}
		})

		unsubscribeStoppedTyping = onUserStoppedTyping((data) => {
			if (data.conversationId === selectedConversationId) {
				setTypingUsers(prev => {
					const newSet = new Set(prev)
					newSet.delete(data.userId)
					return newSet
				})
			}
		})

		unsubscribeUserOnline = onUserOnline((user) => {
			setConversations(prev => prev.map(conv => ({
				...conv,
				participant: conv.participant.id === user.id ? { ...conv.participant, isOnline: true } : conv.participant
			})))
		})

		unsubscribeUserOffline = onUserOffline((data) => {
			setConversations(prev => prev.map(conv => ({
				...conv,
				participant: conv.participant.id === data.userId ? { ...conv.participant, isOnline: false, lastSeen: new Date().toISOString() } : conv.participant
			})))
		})

		return () => {
			if (unsubscribeNewMessage) unsubscribeNewMessage()
			if (unsubscribeMessageRead) unsubscribeMessageRead()
			if (unsubscribeTyping) unsubscribeTyping()
			if (unsubscribeStoppedTyping) unsubscribeStoppedTyping()
			if (unsubscribeUserOnline) unsubscribeUserOnline()
			if (unsubscribeUserOffline) unsubscribeUserOffline()
		}
	}, [onNewMessage, onMessageRead, onUserTyping, onUserStoppedTyping, onUserOnline, onUserOffline, selectedConversationId, session?.user?.id])

	// Cargar mensajes de la conversación seleccionada
	useEffect(() => {
		if (!selectedConversationId) {
			leaveConversation(selectedConversationId || '')
			return
		}

		const loadMessages = async () => {
			setIsLoading(true)
			try {
				const response = await fetch(`/api/chat/messages/${selectedConversationId}`)
				if (response.ok) {
					const data = await response.json()
					setMessages(data)
					
					// Unirse a la conversación via WebSocket
					joinConversation(selectedConversationId)
					
					// Marcar mensajes como leídos
					markMessagesRead(selectedConversationId)
					await fetch(`/api/chat/messages/${selectedConversationId}/read`, {
						method: 'POST'
					})
				}
			} catch (error) {
				logger.error('Error loading messages:', error)
			} finally {
				setIsLoading(false)
			}
		}

		loadMessages()
		setSelectedConversation(conversations.find(c => c.id === selectedConversationId) || null)
	}, [selectedConversationId, conversations, joinConversation, leaveConversation, markMessagesRead])



	// Manejar typing indicators
	useEffect(() => {
		const subscription = messageForm.watch((value, { name }) => {
			if (name === 'content' && selectedConversationId) {
				const content = value.content || ''
				
				if (content.trim()) {
					// Usuario está escribiendo
					startTyping(selectedConversationId)
					
					// Reiniciar timeout
					if (typingTimeoutRef.current) {
						clearTimeout(typingTimeoutRef.current)
					}
					typingTimeoutRef.current = setTimeout(() => {
						stopTyping(selectedConversationId)
						typingTimeoutRef.current = undefined
					}, 2000)
				} else {
					// Usuario dejó de escribir
					stopTyping(selectedConversationId)
					if (typingTimeoutRef.current) {
						clearTimeout(typingTimeoutRef.current)
						typingTimeoutRef.current = undefined
					}
				}
			}
		})
		
		return () => subscription.unsubscribe()
	}, [messageForm, selectedConversationId, startTyping, stopTyping])

	// Enviar mensaje con validación
	const sendMessage = useCallback(async () => {
		if (!selectedConversationId || !session?.user?.id) return

		const messageContent = messageForm.watch('content')
		if (!messageContent?.trim()) return

		try {
			// Validar el mensaje
			const validatedData = chatMessageSchema.parse({
				content: messageContent.trim(),
				type: 'TEXT' as const,
				recipientId: selectedConversationId,
				metadata: {
					isUrgent: false,
					hasAttachment: false,
					mentions: chatValidationUtils.detectMentions(messageContent)
				}
			})

			// Sanitizar el mensaje
			const sanitizedData = chatValidationUtils.sanitizeMessage(validatedData)

			// Limpiar el formulario
			messageForm.reset({ content: '', type: 'TEXT', recipientId: '' })
			inputRef.current?.focus()

			// Detener typing indicator
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current)
				typingTimeoutRef.current = undefined
			}
			stopTyping(selectedConversationId)

			// Enviar mensaje
			if (isConnected) {
				sendWebSocketMessage(selectedConversationId, sanitizedData.content || '', 'TEXT')
			} else {
				const messageData = {
					conversationId: selectedConversationId,
					content: sanitizedData.content || '',
					type: 'TEXT'
				}

				const response = await fetch('/api/chat/messages', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(messageData)
				})

				if (response.ok) {
					const newMsg = await response.json()
					setMessages(prev => [...prev, newMsg])
				} else {
					throw new Error('Failed to send message via REST API')
				}
			}
		} catch (error) {
			if (error instanceof Error) {
				toast.error(`Error de validación: ${error.message}`)
			} else {
				logger.error('Error sending message:', error)
				toast.error('Error al enviar el mensaje')
			}
		}
	}, [messageForm, selectedConversationId, session?.user?.id, isConnected, sendWebSocketMessage, stopTyping])

	// Manejar Enter para enviar
	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			messageForm.handleSubmit(() => sendMessage())()
		}
	}

	const otherUser = selectedConversation?.participant

	if (isMinimized) {
		return (
			<motion.div
				initial={{ scale: 0 }}
				animate={{ scale: 1 }}
				className="fixed bottom-4 right-4 z-50"
			>
				<Button
					size="lg"
					className="rounded-full w-14 h-14 shadow-lg"
					onClick={onToggleMinimize}
				>
					<MessageSquare className="w-6 h-6" />
					{Array.isArray(conversations) && conversations.reduce((acc, conv) => acc + conv.unreadCount, 0) > 0 && (
						<Badge 
							variant="destructive" 
							className="absolute -top-2 -right-2 px-2 py-1 text-xs"
						>
							{Array.isArray(conversations) ? conversations.reduce((acc, conv) => acc + conv.unreadCount, 0) : 0}
						</Badge>
					)}
				</Button>
			</motion.div>
		)
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="fixed bottom-4 right-4 w-96 h-[600px] z-50"
		>
			<Card className="h-full flex flex-col shadow-xl">
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<MessageSquare className="w-5 h-5" />
							<CardTitle className="text-lg">
								{selectedConversation ? otherUser?.name : 'Chat'}
							</CardTitle>
							{!isConnected && (
								<Badge variant="outline" className="text-xs">
									Desconectado
								</Badge>
							)}
							{isConnected && otherUser?.isOnline && (
								<Badge variant="secondary" className="text-xs">
									En línea
								</Badge>
							)}
						</div>
						<div className="flex items-center gap-1">
							<Button variant="ghost" size="sm" onClick={onToggleMinimize}>
								<Minimize2 className="w-4 h-4" />
							</Button>
						</div>
					</div>
				</CardHeader>

				<CardContent className="flex-1 flex flex-col p-0">
					{!selectedConversationId ? (
						<div className="flex-1 p-4">
							<h3 className="font-medium mb-3">Conversaciones</h3>
							<ScrollArea className="h-full">
								<ConversationList
									conversations={conversations}
									selectedId={selectedConversationId}
									onSelect={onConversationSelect || (() => {})}
									currentUserId={session?.user?.id || ''}
								/>
							</ScrollArea>
						</div>
					) : (
						<>
							{/* Área de mensajes */}
							<div className="flex-1 p-4">
								<ScrollArea className="h-full">
									{isLoading ? (
										<div className="flex justify-center items-center h-32">
											<Clock className="w-6 h-6 animate-spin" />
										</div>
									) : (
										<div className="space-y-4">
											{messages.map((message) => (
												<MessageBubble
													key={message.id}
													message={message}
													currentUserId={session?.user?.id || ''}
													otherUser={otherUser!}
												/>
											))}
											<div ref={messagesEndRef} />
										</div>
									)}
								</ScrollArea>
							</div>

							{/* Input de mensaje */}
							<div className="p-4 border-t">
								<div className="flex items-center gap-2">
									{typingUsers.size > 0 && (
										<div className="text-xs text-gray-500 mb-2">
											{Array.from(typingUsers).length === 1 ? 'Escribiendo...' : 'Varios usuarios escribiendo...'}
										</div>
									)}
									<Input
					{...messageForm.register('content', {
						setValueAs: (value) => value?.trim() || ''
					})}
					ref={(e) => {
						messageForm.register('content').ref(e)
						if (inputRef && e) {
							(inputRef as React.MutableRefObject<HTMLInputElement | null>).current = e
						}
					}}
					onKeyPress={handleKeyPress}
					placeholder="Escribe un mensaje..."
					className="flex-1"
				/>
							{messageForm.formState.errors.content && (
								<div className="text-red-500 text-xs mt-1 flex items-center gap-1">
									<AlertCircle className="w-3 h-3" />
									{messageForm.formState.errors.content.message}
								</div>
							)}
							<Button 
								size="sm" 
								onClick={sendMessage}
								disabled={!messageForm.watch('content')?.trim()}
							>
										<Send className="w-4 h-4" />
									</Button>
								</div>
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</motion.div>
	)
}

// Hook para usar el sistema de chat
export function useChatSystem() {
	const [isMinimized, setIsMinimized] = useState(true)
	const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>()

	const toggleMinimize = useCallback(() => {
		setIsMinimized(prev => !prev)
	}, [])

	const selectConversation = useCallback((conversationId: string) => {
		setSelectedConversationId(conversationId)
	}, [])

	return {
		isMinimized,
		selectedConversationId,
		toggleMinimize,
		selectConversation
	}
}