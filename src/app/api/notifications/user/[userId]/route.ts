import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// GET /api/notifications/user/[userId] - Obtener notificaciones del usuario
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ userId: string }> }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
		}

		const resolvedParams = await params;

		// Verificar que el usuario solo pueda acceder a sus propias notificaciones
		if (session.user.id !== resolvedParams.userId && session.user.role !== 'ADMIN') {
			return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
		}

		const notifications = await prisma.notification.findMany({
			where: {
				userId: resolvedParams.userId
			},
			orderBy: {
				createdAt: 'desc'
			},
			take: 50, // Limitar a las últimas 50 notificaciones
			include: {
				user: {
					select: {
						id: true,
						name: true,
						avatar: true
					}
				}
			}
		});

		logger.info(`Loaded ${notifications.length} notifications for user ${resolvedParams.userId}`);

		return NextResponse.json(notifications);
	} catch (error) {
		logger.error('Error loading notifications:', error);
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}

// PUT /api/notifications/user/[userId]/read-all - Marcar todas las notificaciones como leídas
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ userId: string }> }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
		}

		const resolvedParams = await params;

		// Verificar que el usuario solo pueda marcar sus propias notificaciones
		if (session.user.id !== resolvedParams.userId) {
			return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
		}

		const result = await prisma.notification.updateMany({
			where: {
				userId: resolvedParams.userId,
				isRead: false
			},
			data: {
				isRead: true
			}
		});

		logger.info(`Marked ${result.count} notifications as read for user ${resolvedParams.userId}`);

		return NextResponse.json({ 
			message: 'Notificaciones marcadas como leídas',
			count: result.count
		});
	} catch (error) {
		logger.error('Error marking notifications as read:', error);
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}