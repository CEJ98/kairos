/**
 * Push Notifications Service
 * Sistema completo de notificaciones push para web y móvil
 */

import { logger } from './logger'

// Tipos de notificaciones
export interface PushNotification {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, any>
  actions?: NotificationAction[]
  requireInteraction?: boolean
  silent?: boolean
}

interface NotificationAction {
  action: string
  title: string
  icon?: string
}

// Configuración de notificaciones
const NOTIFICATION_CONFIG = {
  vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
  gcmSenderId: process.env.GCM_SENDER_ID,
  applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
}

class NotificationService {
  private registration: ServiceWorkerRegistration | null = null
  private permission: NotificationPermission = 'default'

  async initialize(): Promise<boolean> {
    if (typeof window === 'undefined') return false
    
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      logger.warn('Push notifications not supported')
      return false
    }

    try {
      // Registrar service worker
      this.registration = await navigator.serviceWorker.register('/sw.js')
      logger.info('Service worker registered')

      // Obtener permisos actuales
      this.permission = Notification.permission
      
      return true
    } catch (error) {
      logger.error('Failed to initialize notifications:', error)
      return false
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false
    
    if (!('Notification' in window)) {
      return false
    }

    if (this.permission === 'granted') {
      return true
    }

    if (this.permission === 'denied') {
      logger.warn('Notification permission denied')
      return false
    }

    try {
      this.permission = await Notification.requestPermission()
      return this.permission === 'granted'
    } catch (error) {
      logger.error('Failed to request permission:', error)
      return false
    }
  }

  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.initialize()
    }

    if (!this.registration || this.permission !== 'granted') {
      return null
    }

    try {
      const applicationServerKey = this.urlB64ToUint8Array(
        NOTIFICATION_CONFIG.applicationServerKey || ''
      )

      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      })

      // Enviar suscripción al servidor
      await this.sendSubscriptionToServer(subscription)
      
      logger.info('Push subscription successful')
      return subscription
    } catch (error) {
      logger.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.registration) {
      return false
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        await this.removeSubscriptionFromServer(subscription)
        logger.info('Push subscription cancelled')
      }
      return true
    } catch (error) {
      logger.error('Failed to unsubscribe from push notifications:', error)
      return false
    }
  }

  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.initialize()
    }

    if (!this.registration) {
      return null
    }

    try {
      return await this.registration.pushManager.getSubscription()
    } catch (error) {
      logger.error('Failed to get subscription:', error)
      return null
    }
  }

  async showNotification(notification: PushNotification): Promise<void> {
    if (!this.registration || this.permission !== 'granted') {
      return
    }

    try {
      const options: NotificationOptions & { actions?: NotificationAction[] } = {
        body: notification.body,
        icon: notification.icon || '/icons/icon-192x192.png',
        badge: notification.badge || '/icons/badge-72x72.png',
        tag: notification.tag,
        data: notification.data,
        requireInteraction: notification.requireInteraction,
        silent: notification.silent,
      }
      
      if (notification.actions) {
        options.actions = notification.actions
      }
      
      await this.registration.showNotification(notification.title, options)
    } catch (error) {
      logger.error('Failed to show notification:', error)
    }
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
        }),
      })
    } catch (error) {
      logger.error('Failed to send subscription to server:', error)
    }
  }

  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      })
    } catch (error) {
      logger.error('Failed to remove subscription from server:', error)
    }
  }

  private urlB64ToUint8Array(base64String: string): Uint8Array {
    if (typeof window === 'undefined') return new Uint8Array()
    
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  isSupported(): boolean {
    if (typeof window === 'undefined') return false
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
  }

  getPermissionStatus(): NotificationPermission {
    return this.permission
  }
}

// Tipos de notificaciones predefinidas para la app
export const NotificationTemplates = {
  workoutReminder: (workoutName: string, time: string): PushNotification => ({
    title: '🏋️‍♂️ ¡Hora de entrenar!',
    body: `Tu rutina "${workoutName}" está programada a las ${time}`,
    icon: '/icons/workout-icon.png',
    tag: 'workout-reminder',
    data: { type: 'workout_reminder', workoutName, time },
    actions: [
      { action: 'start', title: 'Comenzar', icon: '/icons/play.png' },
      { action: 'postpone', title: 'Posponer', icon: '/icons/clock.png' },
    ],
    requireInteraction: true,
  }),

  newMessage: (senderName: string, message: string): PushNotification => ({
    title: `💬 Mensaje de ${senderName}`,
    body: message,
    icon: '/icons/message-icon.png',
    tag: 'new-message',
    data: { type: 'new_message', senderName },
    actions: [
      { action: 'reply', title: 'Responder', icon: '/icons/reply.png' },
      { action: 'view', title: 'Ver', icon: '/icons/view.png' },
    ],
  }),

  achievement: (title: string, description: string): PushNotification => ({
    title: `🏆 ${title}`,
    body: description,
    icon: '/icons/achievement-icon.png',
    tag: 'achievement',
    data: { type: 'achievement', title },
    requireInteraction: true,
    actions: [
      { action: 'celebrate', title: '¡Celebrar!', icon: '/icons/celebrate.png' },
      { action: 'share', title: 'Compartir', icon: '/icons/share.png' },
    ],
  }),
}

// Exportar instancia singleton
export const notificationService = new NotificationService()

// Funciones de utilidad
export const createWorkoutReminderNotification = (workoutName: string, time: string) => {
  return NotificationTemplates.workoutReminder(workoutName, time)
}

export const createNewMessageNotification = (senderName: string, message: string) => {
  return NotificationTemplates.newMessage(senderName, message.length > 50 ? message.substring(0, 50) + '...' : message)
}

export const createAchievementNotification = (title: string, description: string) => {
  return NotificationTemplates.achievement(title, description)
}