import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { websocketService } from '@/lib/websocket';

// PUT /api/notifications/[notificationId]/read - Marcar notificación como leída
export async function PUT(
	request: NextRequest,
	{ params }: any
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
		}

		// Verificar que la notificación existe y pertenece al usuario
		const _p = (params && typeof (params as any).then === 'function') ? await params : params
		const notification = await prisma.notification.findUnique({
			where: {
				id: _p.notificationId
			}
		});

		if (!notification) {
			return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 });
		}

		// Verificar que el usuario puede marcar esta notificación
		if (notification.userId !== session.user.id && session.user.role !== 'ADMIN') {
			return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
		}

		// Marcar como leída
		const updatedNotification = await prisma.notification.update({
			where: {
				id: _p.notificationId
			},
			data: {
				isRead: true,
				readAt: new Date()
			}
		});

		// Notificar via WebSocket que la notificación fue leída
		try {
			websocketService.markNotificationAsRead(session.user.id, _p.notificationId);
		} catch (wsError) {
			logger.warn('Failed to send WebSocket notification read status:', wsError);
		}

		logger.info(`Notification ${_p.notificationId} marked as read by user ${session.user.id}`);

		return NextResponse.json({
			message: 'Notificación marcada como leída',
			notification: updatedNotification
		});
	} catch (error) {
		logger.error('Error marking notification as read:', error);
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
