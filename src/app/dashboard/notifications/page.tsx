/**
 * Página de Notificaciones del Dashboard
 * Muestra el centro de notificaciones completo con todas las funcionalidades
 */

'use client'

import { useState } from 'react'
import { Bell, Settings, Plus, Clock, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { NotificationCenter } from '@/components/dashboard/notification-center'
import { useNotificationActions } from '@/hooks/use-notification-actions'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

export default function NotificationsPage() {
	const { 
		scheduleWorkoutReminder, 
		notifyWorkoutAssignment, 
		notifyNutritionAssignment,
		sendTrainerMessage,
		notifyAchievement,
		isLoading 
	} = useNotificationActions()

	const [demoLoading, setDemoLoading] = useState(false)

	// Crear notificación de prueba - Recordatorio de entrenamiento
	const createTestWorkoutReminder = async () => {
		setDemoLoading(true)
		try {
			// Programar para dentro de 1 minuto
			const scheduledTime = new Date(Date.now() + 60 * 1000)
			
			await scheduleWorkoutReminder('demo-workout-1', scheduledTime, 1)
			
			toast.success('Recordatorio de entrenamiento programado para dentro de 1 minuto')
		} catch (error) {
			logger.error('Error creating test workout reminder:', error)
			toast.error('Error al crear recordatorio de prueba')
		} finally {
			setDemoLoading(false)
		}
	}

	// Crear notificación de prueba - Asignación de entrenamiento
	const createTestWorkoutAssignment = async () => {
		setDemoLoading(true)
		try {
			await notifyWorkoutAssignment('demo-client-1', {
				workoutId: 'demo-workout-2',
				workoutName: 'Rutina de Fuerza - Día 1'
			})
			
			toast.success('Notificación de asignación de entrenamiento creada')
		} catch (error) {
			logger.error('Error creating test workout assignment:', error)
			toast.error('Error al crear asignación de prueba')
		} finally {
			setDemoLoading(false)
		}
	}

	// Crear notificación de prueba - Asignación de nutrición
	const createTestNutritionAssignment = async () => {
		setDemoLoading(true)
		try {
			await notifyNutritionAssignment('demo-client-1', {
				planId: 'demo-nutrition-1',
				planName: 'Plan de Definición - 2000 kcal'
			})
			
			toast.success('Notificación de asignación de nutrición creada')
		} catch (error) {
			logger.error('Error creating test nutrition assignment:', error)
			toast.error('Error al crear asignación de nutrición de prueba')
		} finally {
			setDemoLoading(false)
		}
	}

	// Crear notificación de prueba - Mensaje del entrenador
	const createTestTrainerMessage = async () => {
		setDemoLoading(true)
		try {
			await sendTrainerMessage('demo-client-1', {
				message: '¡Excelente progreso esta semana! Sigue así y ajustaremos la intensidad la próxima semana.'
			})
			
			toast.success('Mensaje del entrenador enviado')
		} catch (error) {
			logger.error('Error creating test trainer message:', error)
			toast.error('Error al enviar mensaje de prueba')
		} finally {
			setDemoLoading(false)
		}
	}

	// Crear notificación de prueba - Logro
	const createTestAchievement = async () => {
		setDemoLoading(true)
		try {
			await notifyAchievement('current-user', 'Nuevo récord personal en Press de Banca: 80kg x 5 reps')
			
			toast.success('Notificación de logro creada')
		} catch (error) {
			logger.error('Error creating test achievement:', error)
			toast.error('Error al crear logro de prueba')
		} finally {
			setDemoLoading(false)
		}
	}

	return (
		<div className="container mx-auto p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Notificaciones</h1>
					<p className="text-gray-600 mt-1">
						Gestiona tus notificaciones de recordatorios y asignaciones
					</p>
				</div>
				<Badge variant="outline" className="text-sm">
					<Bell className="h-4 w-4 mr-1" />
					Sistema de Notificaciones
				</Badge>
			</div>

			{/* Panel de pruebas de notificaciones */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Plus className="h-5 w-5" />
						Crear Notificaciones de Prueba
					</CardTitle>
					<p className="text-sm text-gray-600">
						Utiliza estos botones para probar el sistema de notificaciones
					</p>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{/* Recordatorio de entrenamiento */}
						<Card className="p-4">
							<div className="flex items-center gap-3 mb-3">
								<Clock className="h-5 w-5 text-blue-500" />
								<h3 className="font-medium">Recordatorio</h3>
							</div>
							<p className="text-sm text-gray-600 mb-4">
								Crea un recordatorio de entrenamiento programado
							</p>
							<Button
								size="sm"
								variant="outline"
								className="w-full"
								onClick={createTestWorkoutReminder}
								disabled={isLoading || demoLoading}
							>
								{demoLoading ? 'Creando...' : 'Crear Recordatorio'}
							</Button>
						</Card>

						{/* Asignación de entrenamiento */}
						<Card className="p-4">
							<div className="flex items-center gap-3 mb-3">
								<Dumbbell className="h-5 w-5 text-green-500" />
								<h3 className="font-medium">Entrenamiento</h3>
							</div>
							<p className="text-sm text-gray-600 mb-4">
								Notifica la asignación de una nueva rutina
							</p>
							<Button
								size="sm"
								variant="outline"
								className="w-full"
								onClick={createTestWorkoutAssignment}
								disabled={isLoading || demoLoading}
							>
								{demoLoading ? 'Creando...' : 'Asignar Rutina'}
							</Button>
						</Card>

						{/* Asignación de nutrición */}
						<Card className="p-4">
							<div className="flex items-center gap-3 mb-3">
								<Bell className="h-5 w-5 text-orange-500" />
								<h3 className="font-medium">Nutrición</h3>
							</div>
							<p className="text-sm text-gray-600 mb-4">
								Notifica la asignación de un plan nutricional
							</p>
							<Button
								size="sm"
								variant="outline"
								className="w-full"
								onClick={createTestNutritionAssignment}
								disabled={isLoading || demoLoading}
							>
								{demoLoading ? 'Creando...' : 'Asignar Plan'}
							</Button>
						</Card>

						{/* Mensaje del entrenador */}
						<Card className="p-4">
							<div className="flex items-center gap-3 mb-3">
								<Settings className="h-5 w-5 text-purple-500" />
								<h3 className="font-medium">Mensaje</h3>
							</div>
							<p className="text-sm text-gray-600 mb-4">
								Envía un mensaje del entrenador al cliente
							</p>
							<Button
								size="sm"
								variant="outline"
								className="w-full"
								onClick={createTestTrainerMessage}
								disabled={isLoading || demoLoading}
							>
								{demoLoading ? 'Enviando...' : 'Enviar Mensaje'}
							</Button>
						</Card>

						{/* Logro */}
						<Card className="p-4">
							<div className="flex items-center gap-3 mb-3">
								<Bell className="h-5 w-5 text-yellow-500" />
								<h3 className="font-medium">Logro</h3>
							</div>
							<p className="text-sm text-gray-600 mb-4">
								Celebra un nuevo récord personal
							</p>
							<Button
								size="sm"
								variant="outline"
								className="w-full"
								onClick={createTestAchievement}
								disabled={isLoading || demoLoading}
							>
								{demoLoading ? 'Creando...' : 'Crear Logro'}
							</Button>
						</Card>
					</div>
				</CardContent>
			</Card>

			<Separator />

			{/* Centro de notificaciones */}
			<NotificationCenter 
				compact={false}
				showSettings={true}
				defaultTab="unread"
			/>
		</div>
	)
}