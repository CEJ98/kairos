'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
	Settings, 
	Bell, 
	Shield, 
	CreditCard, 
	LogOut, 
	Trash2, 
	Save, 
	Loader2,
	Moon,
	Sun,
	Monitor,
	Globe,
	Lock,
	Mail,
	Smartphone
} from 'lucide-react'
import { logger } from '@/lib/logger'
import { useRouter } from 'next/navigation'

interface UserSettings {
	notifications: {
		email: boolean
		push: boolean
		workoutReminders: boolean
		ProgressUpdates: boolean
	}
	privacy: {
		profileVisibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY'
		showProgress: boolean
		allowMessages: boolean
	}
	preferences: {
		theme: 'LIGHT' | 'DARK' | 'SYSTEM'
		language: string
		timezone: string
		measurementUnit: 'METRIC' | 'IMPERIAL'
	}
}

export default function SettingsPage() {
	const { data: session } = useSession()
	const router = useRouter()
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [settings, setSettings] = useState<UserSettings>({
		notifications: {
			email: true,
			push: true,
			workoutReminders: true,
			ProgressUpdates: true
		},
		privacy: {
			profileVisibility: 'PUBLIC',
			showProgress: true,
			allowMessages: true
		},
		preferences: {
			theme: 'SYSTEM',
			language: 'es',
			timezone: 'America/Mexico_City',
			measurementUnit: 'METRIC'
		}
	})

	useEffect(() => {
		// Simular carga de configuraciones
		setTimeout(() => {
			setLoading(false)
		}, 1000)
	}, [])

	const handleSaveSettings = async () => {
		setSaving(true)
		try {
			// Aquí iría la llamada a la API para guardar configuraciones
			await new Promise(resolve => setTimeout(resolve, 1000))
			toast.success('Configuraciones guardadas exitosamente')
		} catch (error) {
			logger.error('Error saving settings:', error)
			toast.error('Error al guardar las configuraciones')
		} finally {
			setSaving(false)
		}
	}

	const handleSignOut = async () => {
		try {
			await signOut({ redirect: false })
			router.push('/signin')
			toast.success('Sesión cerrada exitosamente')
		} catch (error) {
			logger.error('Error signing out:', error)
			toast.error('Error al cerrar sesión')
		}
	}

	const handleDeleteAccount = async () => {
		if (confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
			try {
				// Aquí iría la llamada a la API para eliminar cuenta
				toast.success('Cuenta eliminada exitosamente')
				router.push('/signin')
			} catch (error) {
				logger.error('Error deleting account:', error)
				toast.error('Error al eliminar la cuenta')
			}
		}
	}

	const updateNotificationSetting = (key: keyof UserSettings['notifications'], value: boolean) => {
		setSettings(prev => ({
			...prev,
			notifications: {
				...prev.notifications,
				[key]: value
			}
		}))
	}

	const updatePrivacySetting = (key: keyof UserSettings['privacy'], value: any) => {
		setSettings(prev => ({
			...prev,
			privacy: {
				...prev.privacy,
				[key]: value
			}
		}))
	}

	const updatePreferenceSetting = (key: keyof UserSettings['preferences'], value: any) => {
		setSettings(prev => ({
			...prev,
			preferences: {
				...prev.preferences,
				[key]: value
			}
		}))
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="flex items-center gap-2">
					<Loader2 className="w-6 h-6 animate-spin text-blue-600" />
					<span className="text-gray-600">Cargando configuraciones...</span>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50 p-4">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Configuraciones</h1>
					<p className="text-gray-600">Personaliza tu experiencia en Kairos</p>
				</div>
				<Button 
					onClick={handleSaveSettings}
					disabled={saving}
				>
					{saving ? (
						<Loader2 className="w-4 h-4 mr-2 animate-spin" />
					) : (
						<Save className="w-4 h-4 mr-2" />
					)}
					Guardar Cambios
				</Button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Notificaciones */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Bell className="w-5 h-5" />
							Notificaciones
						</CardTitle>
						<CardDescription>
							Configura cómo y cuándo recibir notificaciones
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Mail className="w-4 h-4 text-gray-500" />
								<span>Notificaciones por email</span>
							</div>
							<Button
								variant={settings.notifications.email ? "default" : "outline"}
								size="sm"
								onClick={() => updateNotificationSetting('email', !settings.notifications.email)}
							>
								{settings.notifications.email ? 'Activado' : 'Desactivado'}
							</Button>
						</div>
						<Separator />
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Smartphone className="w-4 h-4 text-gray-500" />
								<span>Notificaciones push</span>
							</div>
							<Button
								variant={settings.notifications.push ? "default" : "outline"}
								size="sm"
								onClick={() => updateNotificationSetting('push', !settings.notifications.push)}
							>
								{settings.notifications.push ? 'Activado' : 'Desactivado'}
							</Button>
						</div>
						<Separator />
						<div className="flex items-center justify-between">
							<span>Recordatorios de entrenamiento</span>
							<Button
								variant={settings.notifications.workoutReminders ? "default" : "outline"}
								size="sm"
								onClick={() => updateNotificationSetting('workoutReminders', !settings.notifications.workoutReminders)}
							>
								{settings.notifications.workoutReminders ? 'Activado' : 'Desactivado'}
							</Button>
						</div>
						<Separator />
						<div className="flex items-center justify-between">
							<span>Actualizaciones de progreso</span>
							<Button
								variant={settings.notifications.ProgressUpdates ? "default" : "outline"}
								size="sm"
								onClick={() => updateNotificationSetting('ProgressUpdates', !settings.notifications.ProgressUpdates)}
							>
								{settings.notifications.ProgressUpdates ? 'Activado' : 'Desactivado'}
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Privacidad */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Shield className="w-5 h-5" />
							Privacidad
						</CardTitle>
						<CardDescription>
							Controla quién puede ver tu información
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<Label htmlFor="profileVisibility">Visibilidad del perfil</Label>
							<Select 
								value={settings.privacy.profileVisibility}
								onValueChange={(value) => updatePrivacySetting('profileVisibility', value)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="PUBLIC">Público</SelectItem>
									<SelectItem value="FRIENDS_ONLY">Solo amigos</SelectItem>
									<SelectItem value="PRIVATE">Privado</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<Separator />
						<div className="flex items-center justify-between">
							<span>Mostrar progreso público</span>
							<Button
								variant={settings.privacy.showProgress ? "default" : "outline"}
								size="sm"
								onClick={() => updatePrivacySetting('showProgress', !settings.privacy.showProgress)}
							>
								{settings.privacy.showProgress ? 'Activado' : 'Desactivado'}
							</Button>
						</div>
						<Separator />
						<div className="flex items-center justify-between">
							<span>Permitir mensajes</span>
							<Button
								variant={settings.privacy.allowMessages ? "default" : "outline"}
								size="sm"
								onClick={() => updatePrivacySetting('allowMessages', !settings.privacy.allowMessages)}
							>
								{settings.privacy.allowMessages ? 'Activado' : 'Desactivado'}
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Preferencias */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Settings className="w-5 h-5" />
							Preferencias
						</CardTitle>
						<CardDescription>
							Personaliza la apariencia y comportamiento
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<Label htmlFor="theme">Tema</Label>
							<Select 
								value={settings.preferences.theme}
								onValueChange={(value) => updatePreferenceSetting('theme', value)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="LIGHT">
										<div className="flex items-center gap-2">
											<Sun className="w-4 h-4" />
											Claro
										</div>
									</SelectItem>
									<SelectItem value="DARK">
										<div className="flex items-center gap-2">
											<Moon className="w-4 h-4" />
											Oscuro
										</div>
									</SelectItem>
									<SelectItem value="SYSTEM">
										<div className="flex items-center gap-2">
											<Monitor className="w-4 h-4" />
											Sistema
										</div>
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label htmlFor="language">Idioma</Label>
							<Select 
								value={settings.preferences.language}
								onValueChange={(value) => updatePreferenceSetting('language', value)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="es">Español</SelectItem>
									<SelectItem value="en">English</SelectItem>
									<SelectItem value="fr">Français</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label htmlFor="measurementUnit">Unidad de medida</Label>
							<Select 
								value={settings.preferences.measurementUnit}
								onValueChange={(value) => updatePreferenceSetting('measurementUnit', value)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="METRIC">Métrico (kg, cm)</SelectItem>
									<SelectItem value="IMPERIAL">Imperial (lb, ft)</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>

				{/* Cuenta y Seguridad */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Lock className="w-5 h-5" />
							Cuenta y Seguridad
						</CardTitle>
						<CardDescription>
							Gestiona tu cuenta y configuraciones de seguridad
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<h4 className="font-medium">Cambiar contraseña</h4>
								<p className="text-sm text-gray-600">Actualiza tu contraseña regularmente</p>
							</div>
							<Button variant="outline" size="sm">
								Cambiar
							</Button>
						</div>
						<Separator />
						<div className="flex items-center justify-between">
							<div>
								<h4 className="font-medium">Autenticación de dos factores</h4>
								<p className="text-sm text-gray-600">Añade una capa extra de seguridad</p>
							</div>
							<Badge variant="outline">Próximamente</Badge>
						</div>
						<Separator />
						<div className="flex items-center justify-between">
							<div>
								<h4 className="font-medium">Cerrar sesión</h4>
								<p className="text-sm text-gray-600">Cierra sesión en todos los dispositivos</p>
							</div>
							<Button 
								variant="outline" 
								size="sm"
								onClick={handleSignOut}
							>
								<LogOut className="w-4 h-4 mr-2" />
								Cerrar Sesión
							</Button>
						</div>
						<Separator />
						<div className="flex items-center justify-between">
							<div>
								<h4 className="font-medium text-red-600">Eliminar cuenta</h4>
								<p className="text-sm text-gray-600">Elimina permanentemente tu cuenta</p>
							</div>
							<Button 
								variant="destructive" 
								size="sm"
								onClick={handleDeleteAccount}
							>
								<Trash2 className="w-4 h-4 mr-2" />
								Eliminar
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}