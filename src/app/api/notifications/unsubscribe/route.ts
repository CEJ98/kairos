import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		const body = await request.json()
		const { subscription } = body

		if (!subscription?.endpoint) {
			return NextResponse.json(
				{ error: 'Endpoint de suscripción requerido' },
				{ status: 400 }
			)
		}

		// Desactivar suscripción en la base de datos
		const result = await prisma.pushSubscription.updateMany({
			where: {
				userId: session.user.id,
				endpoint: subscription.endpoint,
				isActive: true
			},
			data: {
				isActive: false,
				updatedAt: new Date()
			}
		})

		logger.info(`Push subscription deactivated for user ${session.user.id}`, {
			userId: session.user.id,
			endpoint: subscription.endpoint,
			affected: result.count
		})

		return NextResponse.json({ success: true })

	} catch (error) {
		logger.error('Error unsubscribing from push notifications:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}