import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		// Enviar notificación de prueba al usuario actual
		const testNotification = {
			userId: session.user.id,
			title: '🎉 Notificación de Prueba',
			body: 'Las notificaciones push están funcionando correctamente en Kairos Fitness',
			icon: '/icons/icon-192x192.png',
			data: {
				type: 'test',
				url: '/dashboard',
				timestamp: Date.now()
			}
		}

		// Llamar al endpoint de envío de notificaciones
		const sendResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/notifications/send`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Cookie': request.headers.get('cookie') || ''
			},
			body: JSON.stringify(testNotification)
		})

		if (!sendResponse.ok) {
			const errorData = await sendResponse.json()
			logger.error('Failed to send test notification:', errorData)
			return NextResponse.json(
				{ error: 'Error al enviar notificación de prueba', details: errorData },
				{ status: 500 }
			)
		}

		const result = await sendResponse.json()
		logger.info(`Test notification sent to user ${session.user.id}`, result)

		return NextResponse.json({
			success: true,
			message: 'Notificación de prueba enviada correctamente',
			result
		})

	} catch (error) {
		logger.error('Error sending test notification:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}