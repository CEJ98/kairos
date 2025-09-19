/**
 * Secure Settings Form Component
 * Formulario seguro para configuraciones de usuario con validación Zod
 */

'use client'

import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userSettingsSchema, type UserSettingsInput } from '@/lib/validations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
	Settings, 
	Bell, 
	Shield, 
	Save, 
	Loader2,
	Moon,
	Sun,
	Monitor,
	Mail,
	Smartphone
} from 'lucide-react'

interface SecureSettingsFormProps {
	initialData?: Partial<UserSettingsInput>
	onSubmit: (data: UserSettingsInput) => Promise<void>
	isLoading?: boolean
}

export function SecureSettingsForm({ 
	initialData, 
	onSubmit, 
	isLoading = false 
}: SecureSettingsFormProps) {
	const {
		control,
		handleSubmit,
		formState: { errors, isSubmitting },
		watch,
		reset
	} = useForm<UserSettingsInput>({
		resolver: zodResolver(userSettingsSchema),
		defaultValues: {
			notifications: {
				email: true,
				push: true,
				workoutReminders: true,
				progressUpdates: true,
				...initialData?.notifications
			},
			privacy: {
				profileVisibility: 'PUBLIC',
				showProgress: true,
				allowMessages: true,
				...initialData?.privacy
			},
			preferences: {
				theme: 'SYSTEM',
				language: 'es',
				timezone: 'America/Mexico_City',
				measurementUnit: 'METRIC',
				...initialData?.preferences
			}
		},
		mode: 'onChange'
	})

	const onFormSubmit = async (data: UserSettingsInput) => {
		try {
			// Validaciones adicionales antes del envío
			if (!data.preferences?.language) {
				toast.error('El idioma es obligatorio')
				return
			}

			if (!data.preferences?.theme) {
				toast.error('El tema es obligatorio')
				return
			}

			if (!data.preferences?.measurementUnit) {
				toast.error('La unidad de medida es obligatoria')
				return
			}

			if (!data.privacy?.profileVisibility) {
				toast.error('La visibilidad del perfil es obligatoria')
				return
			}

			await onSubmit(data)
			toast.success('Configuraciones guardadas exitosamente')
		} catch (error) {
			console.error('Error saving settings:', error)
			toast.error('Error al guardar las configuraciones')
		}
	}

	return (
		<form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
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
								<Label htmlFor="notifications.email">Notificaciones por email</Label>
							</div>
							<Controller
								name="notifications.email"
								control={control}
								render={({ field }) => (
									<Switch
										checked={field.value}
										onCheckedChange={field.onChange}
										id="notifications.email"
									/>
								)}
							/>
						</div>
						{errors.notifications?.email && (
							<p className="text-sm text-red-600">{errors.notifications.email.message}</p>
						)}

						<Separator />

						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Smartphone className="w-4 h-4 text-gray-500" />
								<Label htmlFor="notifications.push">Notificaciones push</Label>
							</div>
							<Controller
								name="notifications.push"
								control={control}
								render={({ field }) => (
									<Switch
										checked={field.value}
										onCheckedChange={field.onChange}
										id="notifications.push"
									/>
								)}
							/>
						</div>
						{errors.notifications?.push && (
							<p className="text-sm text-red-600">{errors.notifications.push.message}</p>
						)}

						<Separator />

						<div className="flex items-center justify-between">
							<Label htmlFor="notifications.workoutReminders">Recordatorios de entrenamiento</Label>
							<Controller
								name="notifications.workoutReminders"
								control={control}
								render={({ field }) => (
									<Switch
										checked={field.value}
										onCheckedChange={field.onChange}
										id="notifications.workoutReminders"
									/>
								)}
							/>
						</div>
						{errors.notifications?.workoutReminders && (
							<p className="text-sm text-red-600">{errors.notifications.workoutReminders.message}</p>
						)}

						<Separator />

						<div className="flex items-center justify-between">
							<Label htmlFor="notifications.progressUpdates">Actualizaciones de progreso</Label>
							<Controller
								name="notifications.progressUpdates"
								control={control}
								render={({ field }) => (
									<Switch
										checked={field.value}
										onCheckedChange={field.onChange}
										id="notifications.progressUpdates"
									/>
								)}
							/>
						</div>
						{errors.notifications?.progressUpdates && (
							<p className="text-sm text-red-600">{errors.notifications.progressUpdates.message}</p>
						)}
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
							<Label htmlFor="privacy.profileVisibility">Visibilidad del perfil</Label>
							<Controller
								name="privacy.profileVisibility"
								control={control}
								render={({ field }) => (
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="PUBLIC">Público</SelectItem>
											<SelectItem value="FRIENDS_ONLY">Solo amigos</SelectItem>
											<SelectItem value="PRIVATE">Privado</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
							{errors.privacy?.profileVisibility && (
								<p className="text-sm text-red-600">{errors.privacy.profileVisibility.message}</p>
							)}
						</div>

						<Separator />

						<div className="flex items-center justify-between">
							<Label htmlFor="privacy.showProgress">Mostrar progreso público</Label>
							<Controller
								name="privacy.showProgress"
								control={control}
								render={({ field }) => (
									<Switch
										checked={field.value}
										onCheckedChange={field.onChange}
										id="privacy.showProgress"
									/>
								)}
							/>
						</div>
						{errors.privacy?.showProgress && (
							<p className="text-sm text-red-600">{errors.privacy.showProgress.message}</p>
						)}

						<Separator />

						<div className="flex items-center justify-between">
							<Label htmlFor="privacy.allowMessages">Permitir mensajes</Label>
							<Controller
								name="privacy.allowMessages"
								control={control}
								render={({ field }) => (
									<Switch
										checked={field.value}
										onCheckedChange={field.onChange}
										id="privacy.allowMessages"
									/>
								)}
							/>
						</div>
						{errors.privacy?.allowMessages && (
							<p className="text-sm text-red-600">{errors.privacy.allowMessages.message}</p>
						)}
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
							<Label htmlFor="preferences.theme">Tema</Label>
							<Controller
								name="preferences.theme"
								control={control}
								render={({ field }) => (
									<Select value={field.value} onValueChange={field.onChange}>
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
								)}
							/>
							{errors.preferences?.theme && (
								<p className="text-sm text-red-600">{errors.preferences.theme.message}</p>
							)}
						</div>

						<div>
							<Label htmlFor="preferences.language">Idioma</Label>
							<Controller
								name="preferences.language"
								control={control}
								render={({ field }) => (
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="es">Español</SelectItem>
											<SelectItem value="en">English</SelectItem>
											<SelectItem value="fr">Français</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
							{errors.preferences?.language && (
								<p className="text-sm text-red-600">{errors.preferences.language.message}</p>
							)}
						</div>

						<div>
							<Label htmlFor="preferences.measurementUnit">Unidad de medida</Label>
							<Controller
								name="preferences.measurementUnit"
								control={control}
								render={({ field }) => (
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="METRIC">Métrico (kg, cm)</SelectItem>
											<SelectItem value="IMPERIAL">Imperial (lb, ft)</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
							{errors.preferences?.measurementUnit && (
								<p className="text-sm text-red-600">{errors.preferences.measurementUnit.message}</p>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Submit Button */}
			<div className="flex justify-end">
				<Button 
					type="submit"
					disabled={isSubmitting || isLoading}
					size="lg"
				>
					{(isSubmitting || isLoading) ? (
						<Loader2 className="w-4 h-4 mr-2 animate-spin" />
					) : (
						<Save className="w-4 h-4 mr-2" />
					)}
					Guardar Cambios
				</Button>
			</div>
		</form>
	)
}