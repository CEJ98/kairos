/**
 * Hook para gestionar acciones de notificaciones
 * Maneja recordatorios de entrenamientos y notificaciones de asignaciones
 */

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

export interface NotificationActionData {
	workoutId?: string
	workoutName?: string
	trainerId?: string
	trainerName?: string
	planId?: string
	planName?: string
	message?: string
}

export interface UseNotificationActionsReturn {
	// Estados
	isLoading: boolean
	error: string | null

	// Acciones para recordatorios de entrenamiento
	scheduleWorkoutReminder: (workoutId: string, scheduledTime: Date, reminderMinutes?: number) => Promise<void>
	cancelWorkoutReminder: (workoutId: string) => Promise<void>

	// Acciones para asignaciones
	notifyWorkoutAssignment: (clientId: string, workoutData: NotificationActionData) => Promise<void>
	notifyNutritionAssignment: (clientId: string, nutritionData: NotificationActionData) => Promise<void>
	sendTrainerMessage: (clientId: string, messageData: NotificationActionData) => Promise<void>

	// Acciones para logros
	notifyAchievement: (userId: string, achievementName: string, achievementData?: any) => Promise<void>

	// Utilidades
	clearError: () => void
}

export function useNotificationActions(): UseNotificationActionsReturn {
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const clearError = useCallback(() => {
		setError(null)
	}, [])

	// Función genérica para hacer llamadas a la API
	const makeApiCall = useCallback(async (
		url: string,
		method: 'POST' | 'DELETE' = 'POST',
		body?: any
	) => {
		setIsLoading(true)
		setError(null)

		try {
			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
				},
				body: body ? JSON.stringify(body) : undefined,
			})

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
				throw new Error(errorData.message || `Error ${response.status}`)
			}

			return await response.json()
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
			setError(errorMessage)
			logger.error('API call failed:', { url, method, error: err })
			throw err
		} finally {
			setIsLoading(false)
		}
	}, [])

	// Programar recordatorio de entrenamiento
	const scheduleWorkoutReminder = useCallback(async (
		workoutId: string,
		scheduledTime: Date,
		reminderMinutes: number = 30
	) => {
		try {
			await makeApiCall('/api/notifications/workout-reminder', 'POST', {
				workoutId,
				scheduledTime: scheduledTime.toISOString(),
				reminderMinutes
			})

			toast.success('Recordatorio programado correctamente')
		} catch (error) {
			toast.error('Error al programar recordatorio')
		}
	}, [makeApiCall])

	// Cancelar recordatorio de entrenamiento
	const cancelWorkoutReminder = useCallback(async (workoutId: string) => {
		try {
			await makeApiCall(`/api/notifications/workout-reminder/${workoutId}`, 'DELETE')
			toast.success('Recordatorio cancelado')
		} catch (error) {
			toast.error('Error al cancelar recordatorio')
		}
	}, [makeApiCall])

	// Notificar asignación de rutina
	const notifyWorkoutAssignment = useCallback(async (
		clientId: string,
		workoutData: NotificationActionData
	) => {
		try {
			await makeApiCall('/api/notifications/workout-assignment', 'POST', {
				clientId,
				...workoutData
			})

			toast.success(`Notificación enviada a ${workoutData.trainerName || 'el cliente'}`)
		} catch (error) {
			toast.error('Error al enviar notificación de asignación')
		}
	}, [makeApiCall])

	// Notificar asignación de plan nutricional
	const notifyNutritionAssignment = useCallback(async (
		clientId: string,
		nutritionData: NotificationActionData
	) => {
		try {
			await makeApiCall('/api/notifications/nutrition-assignment', 'POST', {
				clientId,
				...nutritionData
			})

			toast.success(`Plan de nutrición asignado a ${nutritionData.trainerName || 'el cliente'}`)
		} catch (error) {
			toast.error('Error al asignar plan nutricional')
		}
	}, [makeApiCall])

	// Enviar mensaje del trainer
	const sendTrainerMessage = useCallback(async (
		clientId: string,
		messageData: NotificationActionData
	) => {
		try {
			await makeApiCall('/api/notifications/trainer-message', 'POST', {
				clientId,
				...messageData
			})

			toast.success('Mensaje enviado correctamente')
		} catch (error) {
			toast.error('Error al enviar mensaje')
		}
	}, [makeApiCall])

	// Notificar logro conseguido
	const notifyAchievement = useCallback(async (
		userId: string,
		achievementName: string,
		achievementData?: any
	) => {
		try {
			await makeApiCall('/api/notifications/achievement', 'POST', {
				userId,
				achievementName,
				...achievementData
			})

			toast.success(`¡Logro desbloqueado: ${achievementName}!`)
		} catch (error) {
			toast.error('Error al notificar logro')
		}
	}, [makeApiCall])

	return {
		// Estados
		isLoading,
		error,

		// Acciones para recordatorios
		scheduleWorkoutReminder,
		cancelWorkoutReminder,

		// Acciones para asignaciones
		notifyWorkoutAssignment,
		notifyNutritionAssignment,
		sendTrainerMessage,

		// Acciones para logros
		notifyAchievement,

		// Utilidades
		clearError,
	}
}

// Hook simplificado para recordatorios de entrenamiento
export function useWorkoutReminders() {
	const { scheduleWorkoutReminder, cancelWorkoutReminder, isLoading, error } = useNotificationActions()

	return {
		scheduleReminder: scheduleWorkoutReminder,
		cancelReminder: cancelWorkoutReminder,
		isLoading,
		error
	}
}

// Hook simplificado para notificaciones de trainer
export function useTrainerNotifications() {
	const {
		notifyWorkoutAssignment,
		notifyNutritionAssignment,
		sendTrainerMessage,
		isLoading,
		error
	} = useNotificationActions()

	return {
		notifyWorkout: notifyWorkoutAssignment,
		notifyNutrition: notifyNutritionAssignment,
		sendMessage: sendTrainerMessage,
		isLoading,
		error
	}
}