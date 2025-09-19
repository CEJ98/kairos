/**
 * Panel de Configuración de Notificaciones
 * Permite a los usuarios gestionar sus preferencias de notificaciones
 */

'use client'

import { useState, useEffect } from 'react'
import { Bell, Clock, Dumbbell, Apple, MessageSquare, Trophy, Volume2, VolumeX, Smartphone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useNotifications } from '@/hooks/use-notifications'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

interface NotificationPreferences {
	// Tipos de notificaciones
	workoutReminders: boolean
	workoutAssignments: boolean
	nutritionAssignments: boolean
	trainerMessages: boolean
	achievements: boolean
	progressUpdates: boolean
	
	// Canales de notificación
	pushNotifications: boolean
	emailNotifications: boolean
	
	// Configuración de horarios
	quietHoursEnabled: boolean
	quietHoursStart: string
	quietHoursEnd: string
	
	// Configuración de sonido
	soundEnabled: boolean
	vibrationEnabled: boolean
}

const defaultPreferences: NotificationPreferences = {
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

export function NotificationSettings() {
	const { subscribeToPush } = useNotifications()
	const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences)
	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)
	const [pushSupported, setPushSupported] = useState(false)
	const [pushSubscribed, setPushSubscribed] = useState(false)

	// Verificar soporte para notificaciones push
	useEffect(() => {
		if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
			setPushSupported(true)
			
			// Verificar si ya está suscrito
			navigator.serviceWorker.ready.then(registration => {
				return registration.pushManager.getSubscription()
			}).then(subscription => {
				setPushSubscribed(!!subscription)
			}).catch(err => {
				logger.error('Error checking push subscription:', err)
			})
		}
	}, [])

	// Cargar preferencias del usuario
	useEffect(() => {
		loadPreferences()
	}, [])

	const loadPreferences = async () => {
		setLoading(true)
		try {
			const response = await fetch('/api/user/notification-preferences')
			if (response.ok) {
				const data = await response.json()
				setPreferences({ ...defaultPreferences, ...data.preferences })
			}
		} catch (error) {
			logger.error('Error loading notification preferences:', error)
		} finally {
			setLoading(false)
		}
	}

	const savePreferences = async () => {
		setSaving(true)
		try {
			const response = await fetch('/api/user/notification-preferences', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ preferences })
			})

			if (response.ok) {
				toast.success('Preferencias guardadas correctamente')
			} else {
				throw new Error('Error al guardar preferencias')
			}
		} catch (error) {
			logger.error('Error saving notification preferences:', error)
			toast.error('Error al guardar las preferencias')
		} finally {
			setSaving(false)
		}
	}

	const handlePushSubscription = async () => {
		if (!pushSupported) {
			toast.error('Las notificaciones push no están soportadas en este navegador')
			return
		}

		try {
			if (pushSubscribed) {
				// Desuscribirse
				const registration = await navigator.serviceWorker.ready
				const subscription = await registration.pushManager.getSubscription()
				if (subscription) {
					await subscription.unsubscribe()
					setPushSubscribed(false)
					setPreferences(prev => ({ ...prev, pushNotifications: false }))
					toast.success('Notificaciones push desactivadas')
				}
			} else {
				// Suscribirse
				const success = await subscribeToPush()
				if (success) {
					setPushSubscribed(true)
					setPreferences(prev => ({ ...prev, pushNotifications: true }))
					toast.success('Notificaciones push activadas')
				}
			}
		} catch (error) {
			logger.error('Error managing push subscription:', error)
			toast.error('Error al gestionar las notificaciones push')
		}
	}

	const updatePreference = (key: keyof NotificationPreferences, value: boolean | string) => {
		setPreferences(prev => ({ ...prev, [key]: value }))
	}

	const notificationTypes = [
		{
			key: 'workoutReminders' as keyof NotificationPreferences,
			label: 'Recordatorios de entrenamiento',
			description: 'Recibe recordatorios antes de tus entrenamientos programados',
			icon: <Clock className="h-4 w-4 text-blue-500" />
		},
		{
			key: 'workoutAssignments' as keyof NotificationPreferences,
			label: 'Asignaciones de entrenamientos',
			description: 'Notificaciones cuando tu entrenador te asigne nuevos entrenamientos',
			icon: <Dumbbell className="h-4 w-4 text-green-500" />
		},
		{
			key: 'nutritionAssignments' as keyof NotificationPreferences,
			label: 'Planes de nutrición',
			description: 'Notificaciones sobre nuevos planes de nutrición asignados',
			icon: <Apple className="h-4 w-4 text-orange-500" />
		},
		{
			key: 'trainerMessages' as keyof NotificationPreferences,
			label: 'Mensajes del entrenador',
			description: 'Recibe notificaciones de mensajes de tu entrenador',
			icon: <MessageSquare className="h-4 w-4 text-purple-500" />
		},
		{
			key: 'achievements' as keyof NotificationPreferences,
			label: 'Logros y récords',
			description: 'Celebra tus logros y nuevos récords personales',
			icon: <Trophy className="h-4 w-4 text-yellow-500" />
		},
		{
			key: 'progressUpdates' as keyof NotificationPreferences,
			label: 'Actualizaciones de progreso',
			description: 'Resúmenes semanales y mensuales de tu progreso',
			icon: <Bell className="h-4 w-4 text-gray-500" />
		}
	]

	if (loading) {
		return (
			<Card>
				<div className="flex items-center justify-center p-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
					<span className="ml-3 text-gray-600">Cargando configuración...</span>
				</div>
			</Card>
		)
	}

	return (
		<div className="space-y-6">
			{/* Configuración de canales */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Bell className="h-5 w-5" />
						Canales de notificación
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Push Notifications */}
					<div className="flex items-center justify-between p-4 border rounded-lg">
						<div className="flex items-center gap-3">
							<Smartphone className="h-5 w-5 text-blue-500" />
							<div>
								<Label className="text-sm font-medium">Notificaciones Push</Label>
								<p className="text-xs text-gray-600 mt-1">
									Recibe notificaciones instantáneas en tu dispositivo
								</p>
								{!pushSupported && (
									<Badge variant="secondary" className="mt-1 text-xs">
										No soportado
									</Badge>
								)}
							</div>
						</div>
						<div className="flex items-center gap-2">
							{pushSubscribed && (
								<Badge variant="outline" className="text-xs text-green-600 border-green-200">
									Activo
								</Badge>
							)}
							<Button
								size="sm"
								variant={pushSubscribed ? "outline" : "default"}
								onClick={handlePushSubscription}
								disabled={!pushSupported || saving}
							>
								{pushSubscribed ? 'Desactivar' : 'Activar'}
							</Button>
						</div>
					</div>

					{/* Email Notifications */}
					<div className="flex items-center justify-between p-4 border rounded-lg">
						<div className="flex items-center gap-3">
							<Mail className="h-5 w-5 text-green-500" />
							<div>
								<Label className="text-sm font-medium">Notificaciones por Email</Label>
								<p className="text-xs text-gray-600 mt-1">
									Recibe resúmenes y notificaciones importantes por correo
								</p>
							</div>
						</div>
						<Switch
							checked={preferences.emailNotifications}
							onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
							disabled={saving}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Tipos de notificaciones */}
			<Card>
				<CardHeader>
					<CardTitle>Tipos de notificaciones</CardTitle>
					<p className="text-sm text-gray-600">
						Elige qué tipos de notificaciones quieres recibir
					</p>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{notificationTypes.map((type, index) => (
							<div key={type.key}>
								<div className="flex items-center justify-between p-4 border rounded-lg">
									<div className="flex items-center gap-3">
										{type.icon}
										<div>
											<Label className="text-sm font-medium">{type.label}</Label>
											<p className="text-xs text-gray-600 mt-1">{type.description}</p>
										</div>
									</div>
									<Switch
										checked={preferences[type.key] as boolean}
										onCheckedChange={(checked) => updatePreference(type.key, checked)}
										disabled={saving}
									/>
								</div>
								{index < notificationTypes.length - 1 && <Separator />}
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Configuración de sonido */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						{preferences.soundEnabled ? (
							<Volume2 className="h-5 w-5" />
						) : (
							<VolumeX className="h-5 w-5" />
						)}
						Sonido y vibración
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between p-4 border rounded-lg">
						<div>
							<Label className="text-sm font-medium">Sonido de notificaciones</Label>
							<p className="text-xs text-gray-600 mt-1">
								Reproducir sonido al recibir notificaciones
							</p>
						</div>
						<Switch
							checked={preferences.soundEnabled}
							onCheckedChange={(checked) => updatePreference('soundEnabled', checked)}
							disabled={saving}
						/>
					</div>

					<div className="flex items-center justify-between p-4 border rounded-lg">
						<div>
							<Label className="text-sm font-medium">Vibración</Label>
							<p className="text-xs text-gray-600 mt-1">
								Vibrar el dispositivo al recibir notificaciones
							</p>
						</div>
						<Switch
							checked={preferences.vibrationEnabled}
							onCheckedChange={(checked) => updatePreference('vibrationEnabled', checked)}
							disabled={saving}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Horarios silenciosos */}
			<Card>
				<CardHeader>
					<CardTitle>Horarios silenciosos</CardTitle>
					<p className="text-sm text-gray-600">
						Configura horarios en los que no quieres recibir notificaciones
					</p>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between p-4 border rounded-lg">
						<div>
							<Label className="text-sm font-medium">Activar horarios silenciosos</Label>
							<p className="text-xs text-gray-600 mt-1">
								No recibir notificaciones durante ciertas horas
							</p>
						</div>
						<Switch
							checked={preferences.quietHoursEnabled}
							onCheckedChange={(checked) => updatePreference('quietHoursEnabled', checked)}
							disabled={saving}
						/>
					</div>

					{preferences.quietHoursEnabled && (
						<div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
							<div>
								<Label className="text-sm font-medium">Hora de inicio</Label>
								<input
									type="time"
									value={preferences.quietHoursStart}
									onChange={(e) => updatePreference('quietHoursStart', e.target.value)}
									className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									disabled={saving}
								/>
							</div>
							<div>
								<Label className="text-sm font-medium">Hora de fin</Label>
								<input
									type="time"
									value={preferences.quietHoursEnd}
									onChange={(e) => updatePreference('quietHoursEnd', e.target.value)}
									className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									disabled={saving}
								/>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Botón de guardar */}
			<div className="flex justify-end">
				<Button
					onClick={savePreferences}
					disabled={saving}
					className="min-w-[120px]"
				>
					{saving ? (
						<>
							<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
							Guardando...
						</>
					) : (
						'Guardar cambios'
					)}
				</Button>
			</div>
		</div>
	)
}

export default NotificationSettings