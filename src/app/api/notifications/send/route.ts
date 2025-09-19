import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import webpush from 'web-push'

// Configurar web-push
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const rawVapidEmail = process.env.VAPID_EMAIL || 'mailto:support@kairos-fitness.com'
// Normalizar a URL válida con esquema mailto:
const vapidEmail = rawVapidEmail.startsWith('mailto:') ? rawVapidEmail : `mailto:${rawVapidEmail}`

// Validar y configurar VAPID solo si las claves están presentes y son válidas
let vapidConfigured = false
if (vapidPublicKey && vapidPrivateKey) {
  try {
    // Verificar que la clave pública tenga el formato correcto (debe ser base64url de 65 bytes)
    const publicKeyBuffer = Buffer.from(vapidPublicKey.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
    if (publicKeyBuffer.length === 65) {
      webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)
      vapidConfigured = true
    } else {
      logger.error('VAPID public key has incorrect length', { length: publicKeyBuffer.length, expected: 65 })
    }
  } catch (error) {
    logger.error('Failed to configure VAPID keys', error)
  }
}

interface SendNotificationRequest {
  userId?: string
  userIds?: string[]
  title: string
  body: string
  icon?: string
  data?: Record<string, any>
  tag?: string
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo permitir a usuarios con rol ADMIN o TRAINER enviar notificaciones masivas
    if (session.user.role !== 'ADMIN' && session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    if (!vapidConfigured) {
      return NextResponse.json(
        { error: 'Servicio de notificaciones no configurado correctamente' },
        { status: 500 }
      )
    }

    const notificationData: SendNotificationRequest = await request.json()
    const { userId, userIds, title, body, icon, data, tag, actions } = notificationData

    if (!title || !body) {
      return NextResponse.json(
        { error: 'Título y mensaje son requeridos' },
        { status: 400 }
      )
    }

    // Determinar usuarios objetivo
    let targetUserIds: string[] = []
    if (userId) {
      targetUserIds = [userId]
    } else if (userIds && userIds.length > 0) {
      targetUserIds = userIds
    } else {
      return NextResponse.json(
        { error: 'Usuario(s) objetivo requerido(s)' },
        { status: 400 }
      )
    }

    // Obtener suscripciones activas de los usuarios objetivo
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: { in: targetUserIds },
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay suscripciones activas para los usuarios especificados',
        sent: 0
      })
    }

    // Preparar payload de notificación
    const notificationPayload = {
      title,
      body,
      icon: icon || '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: tag || 'kairos-notification',
      data: {
        ...data,
        timestamp: Date.now(),
        url: data?.url || '/dashboard'
      },
      actions: actions || [],
      requireInteraction: false,
      silent: false
    }

    let sentCount = 0
    let failedCount = 0
    const results: Array<{ userId: string, success: boolean, error?: string }> = []

    // Enviar notificaciones a cada suscripción
    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        }

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(notificationPayload),
          {
            TTL: 24 * 60 * 60, // 24 horas
            urgency: 'normal'
          }
        )

        sentCount++
        results.push({ userId: subscription.userId, success: true })

        // Guardar notificación en la base de datos
        await prisma.notification.create({
          data: {
            userId: subscription.userId,
            title,
            message: body,
            type: data?.type || 'general',
            priority: data?.priority || 'medium',
            metadata: JSON.stringify(data || {})
          }
        })

        logger.info(`Push notification sent to user ${subscription.userId}`)

      } catch (error: any) {
        failedCount++
        results.push({ 
          userId: subscription.userId, 
          success: false, 
          error: error.message 
        })

        // Si la suscripción es inválida (410), desactivarla
        if (error.statusCode === 410) {
          await prisma.pushSubscription.update({
            where: { id: subscription.id },
            data: { isActive: false }
          })
          logger.info(`Deactivated invalid push subscription for user ${subscription.userId}`)
        } else {
          logger.error(`Failed to send push notification to user ${subscription.userId}:`, error)
        }
      }
    }

    logger.info(`Push notifications batch completed: ${sentCount} sent, ${failedCount} failed`)

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      total: subscriptions.length,
      results: process.env.NODE_ENV === 'development' ? results : undefined
    })

  } catch (error) {
    logger.error('Error sending push notifications:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
