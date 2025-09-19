/**
 * WebSocket Service for Real-time Chat (CommonJS, robust)
 * Versión unificada con autenticación básica y soporte de notificaciones.
 */

const { Server: SocketServer } = require('socket.io')

class WebSocketService {
  constructor() {
    /** @type {import('socket.io').Server | null} */
    this.io = null
    /** @type {Map<string, { userId: string, socketId: string, name: string, role: string }>} */
    this.connectedUsers = new Map()
  }

  initialize(httpServer) {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      },
      path: '/api/socket'
    })

    this.setupEventHandlers()
    console.log('WebSocket server initialized')
  }

  setupEventHandlers() {
    if (!this.io) return

    this.io.on('connection', async (socket) => {
      console.log(`Socket connected: ${socket.id}`)

      // Autenticación del socket
      socket.on('authenticate', async (userId) => {
        try {
          if (!userId) {
            socket.emit('auth_error', 'UserId requerido')
            socket.disconnect()
            return
          }

          // Validación ligera: en prod, valida JWT. Aquí consultamos usuario si Prisma está disponible.
          let user = null
          try {
            const { prisma } = require('./db')
            user = await prisma.user.findUnique({
              where: { id: userId },
              select: { id: true, name: true, role: true, avatar: true }
            })
          } catch (_e) {
            // Si prisma no está inicializado en este contexto, continuamos con valores por defecto
          }

          if (user == null) {
            user = { id: userId, name: `User ${userId}`, role: 'CLIENT', avatar: null }
          }

          const socketUser = {
            userId: user.id,
            socketId: socket.id,
            name: user.name || '',
            role: user.role || 'CLIENT'
          }

          this.connectedUsers.set(socket.id, socketUser)

          // Intentar marcar online en BD si es posible
          try {
            const { prisma } = require('./db')
            await prisma.user.update({
              where: { id: user.id },
              data: { isOnline: true, lastSeen: new Date() }
            })
          } catch (_e) { /* no-op */ }

          const connectedUsersFormatted = Array.from(this.connectedUsers.values()).map(u => ({
            userId: u.userId,
            id: u.userId,
            name: u.name,
            role: u.role,
            isOnline: true
          }))

          socket.emit('authenticated', {
            userId: user.id,
            connectedUsers: connectedUsersFormatted
          })

          socket.broadcast.emit('user_online', {
            userId: user.id,
            id: user.id,
            name: user.name,
            role: user.role,
            isOnline: true
          })

          console.log(`User ${user.id} authenticated and connected`)
        } catch (error) {
          console.error('Socket authentication error:', error)
          socket.emit('auth_error', 'Error de autenticación')
          socket.disconnect()
        }
      })

      // Unirse a una conversación específica
      socket.on('join_conversation', async (conversationId) => {
        const user = this.connectedUsers.get(socket.id)
        if (!user) return

        try {
          let isAllowed = true
          try {
            const { prisma } = require('./db')
            const conversation = await prisma.conversation.findUnique({
              where: { id: conversationId },
              select: { user1Id: true, user2Id: true }
            })
            isAllowed = !!conversation && (conversation.user1Id === user.userId || conversation.user2Id === user.userId)
          } catch (_e) { /* fallback: allow join in dev */ }

          if (!isAllowed) {
            socket.emit('error', 'No autorizado para esta conversación')
            return
          }

          socket.join(conversationId)
          console.log(`User ${user.userId} joined conversation ${conversationId}`)
        } catch (error) {
          console.error('Error joining conversation:', error)
          socket.emit('error', 'Error al unirse a la conversación')
        }
      })

      // Enviar mensaje en tiempo real
      socket.on('send_message', async (data) => {
        const user = this.connectedUsers.get(socket.id)
        if (!user) return

        try {
          let conversation = null
          try {
            const { prisma } = require('./db')
            conversation = await prisma.conversation.findUnique({
              where: { id: data.conversationId },
              select: { user1Id: true, user2Id: true }
            })
          } catch (_e) { /* allow in dev */ }

          if (conversation && (conversation.user1Id !== user.userId && conversation.user2Id !== user.userId)) {
            socket.emit('error', 'No autorizado para esta conversación')
            return
          }

          let formattedMessage = {
            id: Date.now().toString(),
            conversationId: data.conversationId,
            senderId: user.userId,
            content: String(data.content || '').trim(),
            type: data.type || 'TEXT',
            isRead: false,
            createdAt: new Date().toISOString(),
            sender: { id: user.userId, name: user.name }
          }

          try {
            const { prisma } = require('./db')
            const message = await prisma.message.create({
              data: {
                conversationId: data.conversationId,
                senderId: user.userId,
                content: String(data.content || '').trim(),
                type: data.type || 'TEXT',
                isRead: false
              },
              include: {
                sender: { select: { id: true, name: true, avatar: true } }
              }
            })
            await prisma.conversation.update({
              where: { id: data.conversationId },
              data: { lastMessage: message.content, updatedAt: new Date() }
            })
            formattedMessage = {
              id: message.id,
              conversationId: message.conversationId,
              senderId: message.senderId,
              content: message.content,
              type: message.type,
              isRead: message.isRead,
              createdAt: message.createdAt,
              sender: message.sender
            }
          } catch (_e) { /* DB optional */ }

          this.io.to(data.conversationId).emit('new_message', formattedMessage)

          try {
            if (conversation) {
              const recipientId = conversation.user1Id === user.userId ? conversation.user2Id : conversation.user1Id
              const recipientSocket = this.findUserSocket(recipientId)
              if (recipientSocket && !recipientSocket.rooms.has(data.conversationId)) {
                recipientSocket.emit('new_message_notification', {
                  conversationId: data.conversationId,
                  fromUser: { id: user.userId, name: user.name },
                  message: formattedMessage
                })
              } else if (!recipientSocket) {
                this.sendPushNotification(recipientId, user.name, formattedMessage.content)
              }
            }
          } catch (_e) { /* optional notify */ }

          console.log(`Real-time message sent from ${user.userId} in conversation ${data.conversationId}`)
        } catch (error) {
          console.error('Error sending real-time message:', error)
          socket.emit('error', 'Error al enviar mensaje')
        }
      })

      // Marcar mensajes como leídos
      socket.on('mark_messages_read', async (data) => {
        const user = this.connectedUsers.get(socket.id)
        if (!user) return
        try {
          try {
            const { prisma } = require('./db')
            const conversation = await prisma.conversation.findUnique({
              where: { id: data.conversationId },
              select: { user1Id: true, user2Id: true }
            })
            if (!conversation || (conversation.user1Id !== user.userId && conversation.user2Id !== user.userId)) return
            await prisma.message.updateMany({
              where: { conversationId: data.conversationId, senderId: { not: user.userId }, isRead: false },
              data: { isRead: true }
            })
          } catch (_e) { /* optional DB */ }

          this.io.to(data.conversationId).emit('messages_read', { readBy: user.userId, conversationId: data.conversationId })
        } catch (error) {
          console.error('Error marking messages as read:', error)
        }
      })

      // Indicadores de escritura
      socket.on('typing_start', (conversationId) => {
        const user = this.connectedUsers.get(socket.id)
        if (!user) return
        socket.to(conversationId).emit('user_typing', { userId: user.userId, name: user.name, conversationId })
      })

      socket.on('typing_stop', (conversationId) => {
        const user = this.connectedUsers.get(socket.id)
        if (!user) return
        socket.to(conversationId).emit('user_stopped_typing', { userId: user.userId, conversationId })
      })

      // Desconexión
      socket.on('disconnect', async () => {
        const user = this.connectedUsers.get(socket.id)
        if (user) {
          try {
            const { prisma } = require('./db')
            await prisma.user.update({
              where: { id: user.userId },
              data: { isOnline: false, lastSeen: new Date() }
            })
          } catch (_e) { /* optional DB */ }

          this.connectedUsers.delete(socket.id)
          socket.broadcast.emit('user_offline', { userId: user.userId })
          console.log(`User ${user.userId} disconnected`)
        }
      })
    })
  }

  findUserSocket(userId) {
    for (const [socketId, user] of this.connectedUsers.entries()) {
      if (user.userId === userId) {
        return this.io?.sockets?.sockets?.get(socketId) || null
      }
    }
    return null
  }

  // Método para enviar notificaciones desde APIs REST
  notifyNewMessage(conversationId, message) {
    if (this.io) {
      this.io.to(conversationId).emit('new_message', message)
    }
  }

  // Notificaciones a usuarios
  sendNotificationToUser(userId, notification) {
    if (!this.io) return
    this.io.to(`user:${userId}`).emit('notification', notification)
    console.log(`Notification sent to user ${userId}: ${notification.title}`)
  }

  sendNotificationToUsers(userIds, notification) {
    userIds.forEach((userId) => this.sendNotificationToUser(userId, notification))
  }

  markNotificationAsRead(userId, notificationId) {
    if (!this.io) return
    this.io.to(`user:${userId}`).emit('notificationRead', notificationId)
  }

  getConnectedUsers() {
    return Array.from(this.connectedUsers.values())
  }

  isUserOnline(userId) {
    for (const user of this.connectedUsers.values()) {
      if (user.userId === userId) return true
    }
    return false
  }

  async sendPushNotification(userId, senderName, message) {
    try {
      const baseUrl = process.env.NEXTAUTH_URL || ''
      if (!baseUrl) return
      await fetch(`${baseUrl}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_API_SECRET || ''}`
        },
        body: JSON.stringify({
          userId,
          title: `💬 Mensaje de ${senderName}`,
          body: message.length > 50 ? message.substring(0, 50) + '...' : message,
          icon: '/icons/message-icon.png',
          tag: 'new-message',
          data: { type: 'new_message', senderId: userId, senderName, url: '/chat' },
          actions: [
            { action: 'reply', title: 'Responder', icon: '/icons/reply.png' },
            { action: 'view', title: 'Ver', icon: '/icons/view.png' }
          ]
        })
      })
    } catch (error) {
      console.error('Error sending push notification:', error)
    }
  }
}

const websocketService = new WebSocketService()
module.exports = { websocketService }
