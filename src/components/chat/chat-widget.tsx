'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Users, Circle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useChat, ChatConversation, ChatMessage } from '@/hooks/use-chat'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useSession } from 'next-auth/react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { chatMessageSchema, type ChatMessageFormData, chatValidationUtils } from '@/lib/validations/chat'
import { toast } from 'sonner'

interface ChatWidgetProps {
	position?: 'bottom-right' | 'bottom-left'
	className?: string
}

export function ChatWidget({ position = 'bottom-right', className }: ChatWidgetProps) {
	const { data: session } = useSession()
	const [isOpen, setIsOpen] = useState(false)
	const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
	const messagesEndRef = useRef<HTMLDivElement>(null)
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
	
	// Chat hooks
	const {
		conversations,
		messages,
		activeConversation,
		setActiveConversation,
		loading,
		sending,
		loadMessages,
		sendMessage: sendRestMessage,
		markAsRead,
		startConversation,
		addMessage,
		updateConversation
	} = useChat()
	
	// WebSocket hooks
	const {
		isConnected,
		connectedUsers,
		joinConversation,
		leaveConversation,
		sendMessage: sendSocketMessage,
		markMessagesRead,
		startTyping,
		stopTyping,
		onNewMessage,
		onMessageRead,
		onUserTyping,
		onUserStoppedTyping
	} = useWebSocket()

	// Auto scroll al final de los mensajes
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages])

	// Event listeners de WebSocket
	useEffect(() => {
		if (!isConnected) return

		// Manejar mensajes nuevos
		const unsubscribeNewMessage = onNewMessage((message) => {
			addMessage(message)
		})

		// Manejar mensajes leídos
		const unsubscribeMessageRead = onMessageRead(({ conversationId }) => {
			markAsRead(conversationId)
		})

		// Manejar indicadores de escritura
		const unsubscribeUserTyping = onUserTyping(({ userId, conversationId }) => {
			if (activeConversation === conversationId && userId !== session?.user?.id) {
				setTypingUsers(prev => new Set([...prev, userId]))
			}
		})

		const unsubscribeUserStoppedTyping = onUserStoppedTyping(({ userId, conversationId }) => {
			if (activeConversation === conversationId) {
				setTypingUsers(prev => {
					const newSet = new Set(prev)
					newSet.delete(userId)
					return newSet
				})
			}
		})

		return () => {
			unsubscribeNewMessage()
			unsubscribeMessageRead()
			unsubscribeUserTyping()
			unsubscribeUserStoppedTyping()
		}
	}, [isConnected, activeConversation, session?.user?.id, onNewMessage, onMessageRead, onUserTyping, onUserStoppedTyping, addMessage, markAsRead])

	// Unirse/salir de conversaciones
	useEffect(() => {
		if (activeConversation && isConnected) {
			joinConversation(activeConversation)
			markMessagesRead(activeConversation)

			return () => {
				if (activeConversation) {
					leaveConversation(activeConversation)
				}
			}
		}
	}, [activeConversation, isConnected, joinConversation, leaveConversation, markMessagesRead])

	// Calcular total de mensajes no leídos
	const totalUnread = Array.isArray(conversations) ? conversations.reduce((sum, conv) => sum + conv.unreadCount, 0) : 0

	// Manejar envío de mensaje con validación
	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!activeConversation || sending) return

		const messageContent = messageForm.watch('content')
		if (!messageContent?.trim()) return

		try {
			// Validar el mensaje
			const validatedData = chatMessageSchema.parse({
				content: messageContent.trim(),
				type: 'TEXT' as const,
				recipientId: activeConversation,
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

			// Detener indicador de escritura
			if (isConnected) {
				stopTyping(activeConversation)
			}

			// Enviar mensaje
			if (isConnected) {
				sendSocketMessage(activeConversation, sanitizedData.content || '')
			} else {
				await sendRestMessage(activeConversation, sanitizedData.content || '')
			}
		} catch (error) {
			if (error instanceof Error) {
				toast.error(`Error de validación: ${error.message}`)
			} else {
				toast.error('Error al enviar el mensaje')
				console.error('Error sending message:', error)
			}
		}
	}

	// Manejar cambios en el input (indicador de escritura)
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value
		messageForm.setValue('content', value)

		if (!activeConversation || !isConnected) return

		// Iniciar indicador de escritura si hay texto
		if (value.trim() && !typingTimeoutRef.current) {
			startTyping(activeConversation)
		}

		// Resetear timeout
		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current)
		}

		// Detener indicador después de 2 segundos de inactividad
		typingTimeoutRef.current = setTimeout(() => {
			if (activeConversation && isConnected) {
				stopTyping(activeConversation)
			}
			typingTimeoutRef.current = undefined
		}, 2000)
	}

	// Seleccionar conversación
	const selectConversation = (conversation: ChatConversation) => {
		loadMessages(conversation.id)
	}

	if (!session?.user) return null

	const positionClasses = {
		'bottom-right': 'bottom-4 right-4',
		'bottom-left': 'bottom-4 left-4'
	}

	return (
		<div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
			{/* Botón flotante */}
			<AnimatePresence>
				{!isOpen && (
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						exit={{ scale: 0 }}
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.9 }}
					>
						<Button
							size="lg"
							className="h-14 w-14 rounded-full shadow-lg relative"
							onClick={() => setIsOpen(true)}
						>
							<MessageSquare className="h-6 w-6" />
							{totalUnread > 0 && (
								<Badge 
									variant="destructive" 
									className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
								>
									{totalUnread > 99 ? '99+' : totalUnread}
								</Badge>
							)}
						</Button>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Panel de chat */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: 20, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 20, scale: 0.95 }}
						className="bg-background border rounded-lg shadow-xl w-80 h-96 flex flex-col mb-4"
					>
						{/* Header */}
						<div className="flex items-center justify-between p-4 border-b">
							<div className="flex items-center gap-2">
								<MessageSquare className="h-5 w-5" />
								<span className="font-semibold">Chat</span>
								{totalUnread > 0 && (
									<Badge variant="secondary" className="text-xs">
										{totalUnread}
									</Badge>
								)}
								{/* Indicador de conexión WebSocket */}
								<div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
									 title={isConnected ? 'Conectado' : 'Desconectado'} />
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsOpen(false)}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>

						{/* Contenido */}
						<div className="flex-1 flex">
							{!activeConversation ? (
								/* Lista de conversaciones */
								<div className="flex-1">
									<ScrollArea className="h-full">
										{loading ? (
											<div className="p-4 text-center text-muted-foreground">
												Cargando...
											</div>
										) : conversations.length === 0 ? (
											<div className="p-4 text-center text-muted-foreground">
												<Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
												<p className="text-sm">No hay conversaciones</p>
											</div>
										) : (
											conversations.map((conversation) => (
												<div
													key={conversation.id}
													className="p-3 border-b hover:bg-muted/50 cursor-pointer transition-colors"
													onClick={() => selectConversation(conversation)}
												>
													<div className="flex items-center gap-3">
														<div className="relative">
															<Avatar className="h-8 w-8">
																<AvatarImage src={conversation.participant.avatar || undefined} />
																<AvatarFallback className="text-xs">
																	{conversation.participant.name?.charAt(0) || '?'}
																</AvatarFallback>
															</Avatar>
															{/* Estado online usando datos de WebSocket */}
															{connectedUsers.some(u => u.id === conversation.participant.id) && (
																<Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-green-500 text-green-500" />
															)}
														</div>
														<div className="flex-1 min-w-0">
															<div className="flex items-center justify-between">
																<p className="font-medium text-sm truncate">
																	{conversation.participant.name}
																</p>
																{conversation.unreadCount > 0 && (
																	<Badge variant="destructive" className="text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
																		{conversation.unreadCount}
																	</Badge>
																)}
															</div>
															<p className="text-xs text-muted-foreground truncate">
																{conversation.lastMessage?.content || 'Sin mensajes'}
															</p>
															<p className="text-xs text-muted-foreground">
																{formatDistanceToNow(new Date(conversation.updatedAt), { 
																	addSuffix: true, 
																	locale: es 
																})}
															</p>
														</div>
													</div>
												</div>
											))
										)}
									</ScrollArea>
								</div>
							) : (
								/* Vista de mensajes */
								<div className="flex-1 flex flex-col">
									{/* Header de conversación */}
									<div className="p-3 border-b bg-muted/30">
										{(() => {
											const conversation = conversations.find(c => c.id === activeConversation)
											return conversation ? (
												<div className="flex items-center gap-2">
													<Button
																		variant="ghost"
																		size="sm"
																		onClick={() => setActiveConversation(null)}
																		className="h-6 w-6 p-0"
																	>
																		&larr;
																	</Button>
													<Avatar className="h-6 w-6">
														<AvatarImage src={conversation.participant.avatar || undefined} />
														<AvatarFallback className="text-xs">
															{conversation.participant.name?.charAt(0) || '?'}
														</AvatarFallback>
													</Avatar>
													<span className="font-medium text-sm">
														{conversation.participant.name}
													</span>
													{/* Estado online usando datos de WebSocket */}
													{connectedUsers.some(u => u.id === conversation.participant.id) && (
														<Circle className="h-2 w-2 fill-green-500 text-green-500" />
													)}
												</div>
											) : null
										})()}
									</div>

									{/* Mensajes */}
									<ScrollArea className="flex-1 p-3">
										{loading ? (
											<div className="text-center text-muted-foreground text-sm">
												Cargando mensajes...
											</div>
										) : messages.length === 0 ? (
											<div className="text-center text-muted-foreground text-sm">
												No hay mensajes aún
											</div>
										) : (
											<div className="space-y-2">
												{messages.map((message) => {
													const isOwn = message.senderId === session?.user?.id
													return (
														<div
															key={message.id}
															className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
														>
															<div
																className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
																	isOwn 
																		? 'bg-primary text-primary-foreground' 
																		: 'bg-muted'
																}`}
															>
																<p>{message.content}</p>
																<p className={`text-xs mt-1 opacity-70 ${
																	isOwn ? 'text-right' : 'text-left'
																}`}>
																	{formatDistanceToNow(new Date(message.createdAt), { 
																		addSuffix: true, 
																		locale: es 
																	})}
																</p>
															</div>
														</div>
													)
												})}
												
												{/* Indicador de escritura */}
												{typingUsers.size > 0 && (
													<div className="flex justify-start">
														<div className="bg-muted rounded-lg px-3 py-2 text-sm">
															<div className="flex items-center gap-1">
																<div className="flex gap-1">
																	<div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
																	<div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
																	<div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
																</div>
																<span className="text-xs text-muted-foreground ml-2">escribiendo...</span>
															</div>
														</div>
													</div>
												)}
												
												<div ref={messagesEndRef} />
											</div>
										)}
									</ScrollArea>

									{/* Input de mensaje */}
									<form onSubmit={handleSendMessage} className="p-3 border-t">
										<div className="flex gap-2">
											<div className="flex-1">
												<Input
													{...messageForm.register('content')}
													placeholder="Escribe un mensaje..."
													disabled={sending}
													className="text-sm"
													onChange={handleInputChange}
												/>
												{messageForm.formState.errors.content && (
													<div className="flex items-center gap-1 text-xs text-red-600 mt-1">
														<AlertCircle className="w-3 h-3" />
														<span>{messageForm.formState.errors.content.message}</span>
													</div>
												)}
											</div>
											<Button
												type="submit"
												size="sm"
												disabled={!messageForm.watch('content')?.trim() || sending}
											>
												<Send className="h-4 w-4" />
											</Button>
										</div>
									</form>
								</div>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}