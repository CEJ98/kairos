/**
 * API para gestionar las preferencias de notificaciones del usuario
 * GET: Obtener preferencias actuales
 * POST: Actualizar preferencias
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Schema de validación para las preferencias
const preferencesSchema = z.object({
	preferences: z.object({
		// Tipos de notificaciones
		workoutReminders: z.boolean().optional(),
		workoutAssignments: z.boolean().optional(),
		nutritionAssignments: z.boolean().optional(),
		trainerMessages: z.boolean().optional(),
		achievements: z.boolean().optional(),
		progressUpdates: z.boolean().optional(),
		
		// Canales de notificación
		pushNotifications: z.boolean().optional(),
		emailNotifications: z.boolean().optional(),
		
		// Configuración de horarios
		quietHoursEnabled: z.boolean().optional(),
		quietHoursStart: z.string().optional(),
		quietHoursEnd: z.string().optional(),
		
		// Configuración de sonido
		soundEnabled: z.boolean().optional(),
		vibrationEnabled: z.boolean().optional()
	})
})

// Preferencias por defecto
const defaultPreferences = {
	workoutReminders: true,
	workoutAssignments: true,
	nutritionAssignments: true,
	trainerMessages: true,
	achievements: true,
	progressUpdates: false,
	pushNotifications: true,
	emailNotifications: false,
	quietHoursEnabled: false,
	quietHoursStart: '22:00',
	quietHoursEnd: '08:00',
	soundEnabled: true,
	vibrationEnabled: true
}

// GET: Obtener preferencias de notificaciones
export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}

		// Buscar preferencias del usuario
		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: {
				id: true,
				notificationPreferences: true
			}
		})

		if (!user) {
			return NextResponse.json(
				{ error: 'Usuario no encontrado' },
				{ status: 404 }
			)
		}

		// Parsear preferencias o usar las por defecto
		let preferences = defaultPreferences
		if (user.notificationPreferences) {
			try {
				const parsed = JSON.parse(user.notificationPreferences)
				preferences = { ...defaultPreferences, ...parsed }
			} catch (error) {
				logger.error('Error parsing notification preferences:', error)
			}
		}

		return NextResponse.json({
			preferences,
			success: true
		})

	} catch (error) {
		logger.error('Error fetching notification preferences:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}

// POST: Actualizar preferencias de notificaciones
export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}

		const body = await request.json()
		
		// Validar datos de entrada
		const validation = preferencesSchema.safeParse(body)
		if (!validation.success) {
			return NextResponse.json(
				{ 
					error: 'Datos inválidos',
					details: validation.error.errors
				},
				{ status: 400 }
			)
		}

		const { preferences } = validation.data

		// Verificar que el usuario existe
		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { id: true }
		})

		if (!user) {
			return NextResponse.json(
				{ error: 'Usuario no encontrado' },
				{ status: 404 }
			)
		}

		// Actualizar preferencias en la base de datos
		await prisma.user.update({
			where: { id: session.user.id },
			data: {
				notificationPreferences: JSON.stringify(preferences)
			}
		})

		logger.info(`Notification preferences updated for user ${session.user.id}`, {
			userId: session.user.id,
			preferences
		})

		return NextResponse.json({
			message: 'Preferencias actualizadas correctamente',
			preferences,
			success: true
		})

	} catch (error) {
		logger.error('Error updating notification preferences:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}