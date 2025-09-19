'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

export interface ChatMessage {
	id: string
	conversationId: string
	senderId: string
	content: string
	type: 'TEXT' | 'WORKOUT_ASSIGNMENT' | 'IMAGE' | 'FILE'
	isRead: boolean
	createdAt: string
	metadata?: Record<string, any>
	sender?: {
		id: string
		name: string
		avatar?: string
	}
}

export interface ChatConversation {
	id: string
	participant: {
		id: string
		name: string
		email: string
		avatar: string | null
		role: string
		isOnline: boolean
		lastSeen?: string
	}
	lastMessage?: {
		content: string
		createdAt: string
		senderId: string
	}
	unreadCount: number
	updatedAt: string
}

export function useChat() {
	const { data: session } = useSession()
	const [conversations, setConversations] = useState<ChatConversation[]>([])
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [activeConversation, setActiveConversation] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [sending, setSending] = useState(false)

	// Cargar conversaciones
	const loadConversations = useCallback(async () => {
		if (!session?.user?.id) return

		try {
			setLoading(true)
			const response = await fetch('/api/chat/conversations')
			if (!response.ok) throw new Error('Error al cargar conversaciones')

			const data = await response.json()
			setConversations(data)
		} catch (error) {
			console.error('Error loading conversations:', error)
			toast.error('Error al cargar conversaciones')
		} finally {
			setLoading(false)
		}
	}, [session?.user?.id])

	// Marcar mensajes como leídos
	const markAsRead = useCallback(async (conversationId: string) => {
		if (!session?.user?.id) return

		try {
			await fetch(`/api/chat/messages/${conversationId}/read`, {
				method: 'POST'
			})

			// Actualizar el estado local
			setConversations(prev => 
				prev.map(conv => 
					conv.id === conversationId 
						? { ...conv, unreadCount: 0 }
						: conv
				)
			)
		} catch (error) {
			console.error('Error marking messages as read:', error)
		}
	}, [session?.user?.id])

	// Cargar mensajes de una conversación
	const loadMessages = useCallback(async (conversationId: string) => {
		if (!session?.user?.id) return

		try {
			setLoading(true)
			const response = await fetch(`/api/chat/messages/${conversationId}`)
			if (!response.ok) throw new Error('Error al cargar mensajes')

			const data = await response.json()
			setMessages(data)
			setActiveConversation(conversationId)

			// Marcar mensajes como leídos
			await markAsRead(conversationId)
		} catch (error) {
			console.error('Error loading messages:', error)
			toast.error('Error al cargar mensajes')
		} finally {
			setLoading(false)
		}
	}, [session?.user?.id, markAsRead])

	// Enviar mensaje
	const sendMessage = useCallback(async (
		toId: string,
		content: string,
		type: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT'
	) => {
		if (!session?.user?.id || !content.trim()) return

		try {
			setSending(true)
			const response = await fetch('/api/chat/messages', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					toId,
					content,
					type
				})
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Error al enviar mensaje')
			}

			const newMessage = await response.json()
			
			// Actualizar mensajes localmente
			setMessages(prev => [...prev, newMessage])
			
			// Recargar conversaciones para actualizar el último mensaje
			await loadConversations()

			return newMessage
		} catch (error) {
			console.error('Error sending message:', error)
			toast.error(error instanceof Error ? error.message : 'Error al enviar mensaje')
			throw error
		} finally {
			setSending(false)
		}
	}, [session?.user?.id, loadConversations])

	// Crear o obtener conversación
	const startConversation = useCallback(async (userId: string) => {
		if (!session?.user?.id) return

		try {
			const response = await fetch('/api/chat/conversations', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ otherUserId: userId })
			})

			if (!response.ok) throw new Error('Error al crear conversación')

			const conversation = await response.json()
			await loadMessages(conversation.id)
			await loadConversations()

			return conversation
		} catch (error) {
			console.error('Error starting conversation:', error)
			toast.error('Error al iniciar conversación')
			throw error
		}
	}, [session?.user?.id, loadMessages, loadConversations])

	// Cargar conversaciones al montar el componente
	useEffect(() => {
		if (session?.user?.id) {
			loadConversations()
		}
	}, [session?.user?.id, loadConversations])

	// Agregar mensaje a la lista actual
	const addMessage = useCallback((message: ChatMessage) => {
		setMessages(prev => [...prev, message])
	}, [])

	// Actualizar estado de conversación
	const updateConversation = useCallback((conversationId: string, updates: Partial<ChatConversation>) => {
		setConversations(prev => 
			prev.map(conv => 
				conv.id === conversationId 
					? { ...conv, ...updates }
					: conv
			)
		)
	}, [])

	return {
		conversations,
		messages,
		activeConversation,
		loading,
		sending,
		loadConversations,
		loadMessages,
		sendMessage,
		markAsRead,
		startConversation,
		addMessage,
		updateConversation,
		setActiveConversation: setActiveConversation
	}
}