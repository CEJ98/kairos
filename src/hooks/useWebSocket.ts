/**
 * React Hook for WebSocket Real-time Chat
 * Maneja conexiones WebSocket para chat en tiempo real
 */

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'
import { logger } from '@/lib/logger'
import { ChatMessage, ChatUser } from '@/components/chat/chat-system'

interface UseWebSocketReturn {
  socket: Socket | null
  isConnected: boolean
  connectedUsers: ChatUser[]
  joinConversation: (conversationId: string) => void
  leaveConversation: (conversationId: string) => void
  sendMessage: (conversationId: string, content: string, type?: string) => void
  markMessagesRead: (conversationId: string) => void
  startTyping: (conversationId: string) => void
  stopTyping: (conversationId: string) => void
  onNewMessage: (callback: (message: ChatMessage) => void) => () => void
  onMessageRead: (callback: (data: { readBy: string, conversationId: string }) => void) => () => void
  onUserTyping: (callback: (data: { userId: string, name: string, conversationId: string }) => void) => () => void
  onUserStoppedTyping: (callback: (data: { userId: string, conversationId: string }) => void) => () => void
  onUserOnline: (callback: (user: ChatUser) => void) => () => void
  onUserOffline: (callback: (data: { userId: string }) => void) => () => void
}

export function useWebSocket(): UseWebSocketReturn {
  const { data: session, status } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectedUsers, setConnectedUsers] = useState<ChatUser[]>([])
  
  const newMessageCallbacks = useRef<((message: ChatMessage) => void)[]>([])
  const messageReadCallbacks = useRef<((data: { readBy: string, conversationId: string }) => void)[]>([])
  const userTypingCallbacks = useRef<((data: { userId: string, name: string, conversationId: string }) => void)[]>([])
  const userStoppedTypingCallbacks = useRef<((data: { userId: string, conversationId: string }) => void)[]>([])
  const userOnlineCallbacks = useRef<((user: ChatUser) => void)[]>([])
  const userOfflineCallbacks = useRef<((data: { userId: string }) => void)[]>([])

  // Inicializar conexión WebSocket
  useEffect(() => {
    if (status === 'loading' || !session?.user?.id) return

    const initSocket = async () => {
      try {
        // Temporalmente deshabilitado para pruebas
        logger.info('WebSocket temporarily disabled for testing')
        return null
        
        /*
        const socketConnection = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
          path: '/api/socket',
          transports: ['websocket', 'polling'],
          timeout: 20000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        })

        // Event listeners para conexión
        socketConnection.on('connect', () => {
          logger.info('WebSocket connected')
          setIsConnected(true)
          
          // Autenticar con el ID del usuario
          if (session?.user?.id) {
            socketConnection.emit('authenticate', session.user.id)
          }
        })

        socketConnection.on('disconnect', () => {
          logger.info('WebSocket disconnected')
          setIsConnected(false)
          setConnectedUsers([])
        })

        socketConnection.on('authenticated', (data: { userId: string, connectedUsers: ChatUser[] }) => {
          logger.info('WebSocket authenticated')
          setConnectedUsers(data.connectedUsers || [])
        })

        socketConnection.on('auth_error', (error: string) => {
          logger.error('WebSocket auth error:', error)
          setIsConnected(false)
        })

        // Event listeners para mensajes
        socketConnection.on('new_message', (message: ChatMessage) => {
          newMessageCallbacks.current.forEach(callback => callback(message))
        })

        socketConnection.on('messages_read', (data: { readBy: string, conversationId: string }) => {
          messageReadCallbacks.current.forEach(callback => callback(data))
        })

        // Event listeners para typing indicators
        socketConnection.on('user_typing', (data: { userId: string, name: string, conversationId: string }) => {
          userTypingCallbacks.current.forEach(callback => callback(data))
        })

        socketConnection.on('user_stopped_typing', (data: { userId: string, conversationId: string }) => {
          userStoppedTypingCallbacks.current.forEach(callback => callback(data))
        })

        // Event listeners para estado online/offline
        socketConnection.on('user_online', (user: ChatUser) => {
          setConnectedUsers(prev => {
            const exists = prev.find(u => u.id === user.id)
            if (exists) return prev
            return [...prev, { ...user, isOnline: true }]
          })
          userOnlineCallbacks.current.forEach(callback => callback(user))
        })

        socketConnection.on('user_offline', (data: { userId: string }) => {
          setConnectedUsers(prev => 
            prev.map(user => 
              user.id === data.userId ? { ...user, isOnline: false } : user
            )
          )
          userOfflineCallbacks.current.forEach(callback => callback(data))
        })

        // Error handling
        socketConnection.on('error', (error: string) => {
          logger.error('WebSocket error:', error)
        })

        setSocket(socketConnection)

        return socketConnection
        */

      } catch (error) {
        logger.error('Failed to initialize WebSocket:', error)
        return null
      }
    }

    initSocket()

    return () => {
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
        setConnectedUsers([])
      }
    }
  }, [session?.user?.id, status, socket])

  // Unirse a una conversación
  const joinConversation = useCallback((conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('join_conversation', conversationId)
      logger.info(`Joined conversation: ${conversationId}`)
    }
  }, [socket, isConnected])

  // Salir de una conversación
  const leaveConversation = useCallback((conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_conversation', { conversationId })
      logger.info(`Left conversation: ${conversationId}`)
    }
  }, [socket, isConnected])

  // Enviar mensaje
  const sendMessage = useCallback((conversationId: string, content: string, type: string = 'TEXT') => {
    if (socket && isConnected && content.trim()) {
      socket.emit('send_message', {
        conversationId,
        content: content.trim(),
        type
      })
    }
  }, [socket, isConnected])

  // Marcar mensajes como leídos
  const markMessagesRead = useCallback((conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('mark_messages_read', { conversationId })
    }
  }, [socket, isConnected])

  // Indicador de escritura
  const startTyping = useCallback((conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('typing_start', conversationId)
    }
  }, [socket, isConnected])

  const stopTyping = useCallback((conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', conversationId)
    }
  }, [socket, isConnected])

  // Event callbacks
  const onNewMessage = useCallback((callback: (message: ChatMessage) => void) => {
    newMessageCallbacks.current.push(callback)
    return () => {
      newMessageCallbacks.current = newMessageCallbacks.current.filter(cb => cb !== callback)
    }
  }, [])

  const onMessageRead = useCallback((callback: (data: { readBy: string, conversationId: string }) => void) => {
    messageReadCallbacks.current.push(callback)
    return () => {
      messageReadCallbacks.current = messageReadCallbacks.current.filter(cb => cb !== callback)
    }
  }, [])

  const onUserTyping = useCallback((callback: (data: { userId: string, name: string, conversationId: string }) => void) => {
    userTypingCallbacks.current.push(callback)
    return () => {
      userTypingCallbacks.current = userTypingCallbacks.current.filter(cb => cb !== callback)
    }
  }, [])

  const onUserStoppedTyping = useCallback((callback: (data: { userId: string, conversationId: string }) => void) => {
    userStoppedTypingCallbacks.current.push(callback)
    return () => {
      userStoppedTypingCallbacks.current = userStoppedTypingCallbacks.current.filter(cb => cb !== callback)
    }
  }, [])

  const onUserOnline = useCallback((callback: (user: ChatUser) => void) => {
    userOnlineCallbacks.current.push(callback)
    return () => {
      userOnlineCallbacks.current = userOnlineCallbacks.current.filter(cb => cb !== callback)
    }
  }, [])

  const onUserOffline = useCallback((callback: (data: { userId: string }) => void) => {
    userOfflineCallbacks.current.push(callback)
    return () => {
      userOfflineCallbacks.current = userOfflineCallbacks.current.filter(cb => cb !== callback)
    }
  }, [])

  return {
    socket,
    isConnected,
    connectedUsers,
    joinConversation,
    leaveConversation,
    sendMessage,
    markMessagesRead,
    startTyping,
    stopTyping,
    onNewMessage,
    onMessageRead,
    onUserTyping,
    onUserStoppedTyping,
    onUserOnline,
    onUserOffline
  }
}