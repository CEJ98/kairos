'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
	LogOut, 
	Trash2, 
	Loader2,
	Lock
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SecureSettingsForm } from '@/components/forms/SecureSettingsForm'
import { type UserSettingsInput } from '@/lib/validations'

export default function SettingsPage() {
	const { data: session } = useSession()
	const router = useRouter()
	const [loading, setLoading] = useState(true)
	const [initialSettings, setInitialSettings] = useState<Partial<UserSettingsInput>>({})

	useEffect(() => {
		// Simular carga de configuraciones desde la API
		const loadSettings = async () => {
			try {
				// Aquí iría la llamada a la API para cargar configuraciones
				await new Promise(resolve => setTimeout(resolve, 1000))
				
				// Configuraciones por defecto simuladas
				setInitialSettings({
					notifications: {
						email: true,
						push: true,
						workoutReminders: true,
						progressUpdates: true
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
			} catch (error) {
				console.error('Error loading settings:', error)
				toast.error('Error al cargar las configuraciones')
			} finally {
				setLoading(false)
			}
		}

		loadSettings()
	}, [])

	const handleSaveSettings = async (data: UserSettingsInput) => {
		try {
			// Aquí iría la llamada a la API para guardar configuraciones
			await new Promise(resolve => setTimeout(resolve, 1000))
			
			// Actualizar configuraciones locales
			setInitialSettings(data)
			
			console.log('Settings saved:', data)
		} catch (error) {
			console.error('Error saving settings:', error)
			throw error // Re-throw para que el formulario maneje el error
		}
	}

	const handleSignOut = async () => {
		try {
			await signOut({ redirect: false })
			router.push('/es/signin')
			toast.success('Sesión cerrada exitosamente')
		} catch (error) {
			console.error('Error signing out:', error)
			toast.error('Error al cerrar sesión')
		}
	}

	const handleDeleteAccount = async () => {
		if (confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
			try {
				// Aquí iría la llamada a la API para eliminar cuenta
				toast.success('Cuenta eliminada exitosamente')
				router.push('/es/signin')
			} catch (error) {
				console.error('Error deleting account:', error)
				toast.error('Error al eliminar la cuenta')
			}
		}
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
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-gray-900">Configuraciones</h1>
				<p className="text-gray-600">Personaliza tu experiencia en Kairos</p>
			</div>

			{/* Settings Form */}
			<div className="mb-8">
				<SecureSettingsForm 
					initialData={initialSettings}
					onSubmit={handleSaveSettings}
					isLoading={loading}
				/>
			</div>

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
	)
}