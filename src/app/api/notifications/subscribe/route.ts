import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

// Interfaz para los datos de suscripción recibidos
interface PushSubscriptionData {
	subscription: {
		endpoint: string
		keys: {
			p256dh: string
			auth: string
		}
	}
	userAgent?: string
}

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		const { subscription, userAgent }: PushSubscriptionData = await request.json()

		if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
			return NextResponse.json(
				{ error: 'Datos de suscripción inválidos' },
				{ status: 400 }
			)
		}

		// Guardar o actualizar suscripción en la base de datos
		const pushSubscription = await prisma.pushSubscription.upsert({
			where: {
				userId_endpoint: {
					userId: session.user.id,
					endpoint: subscription.endpoint
				}
			},
			update: {
				p256dh: subscription.keys.p256dh,
				auth: subscription.keys.auth,
				userAgent: userAgent || null,
				isActive: true,
				updatedAt: new Date()
			},
			create: {
				userId: session.user.id,
				endpoint: subscription.endpoint,
				p256dh: subscription.keys.p256dh,
				auth: subscription.keys.auth,
				userAgent: userAgent || null,
				isActive: true
			}
		})

		logger.info(`Push subscription registered for user ${session.user.id}`, {
			userId: session.user.id,
			endpoint: subscription.endpoint,
			subscriptionId: pushSubscription.id
		})

		// Crear una notificación de bienvenida
		await prisma.notification.create({
			data: {
				userId: session.user.id,
				title: '¡Notificaciones activadas!',
				message: 'Ahora recibirás notificaciones push sobre tus entrenamientos y progreso.',
				type: 'system',
				priority: 'low'
			}
		})

		return NextResponse.json({ success: true })

	} catch (error) {
		logger.error('Error subscribing to push notifications:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		// En una implementación real, eliminarías la suscripción de la base de datos
		logger.info(`Push subscription removed for user ${session.user.id}`)

		return NextResponse.json({ success: true })

	} catch (error) {
		logger.error('Error unsubscribing from push notifications:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}