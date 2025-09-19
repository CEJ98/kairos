'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PushNotificationManager } from '@/components/notifications/push-notification-manager'
import { toast } from 'sonner'
import { Bell, Send, TestTube } from 'lucide-react'

export default function TestNotificationsPage() {
	const [isTestingNotification, setIsTestingNotification] = useState(false)

	const sendTestNotification = async () => {
		setIsTestingNotification(true)
		try {
			const response = await fetch('/api/notifications/test', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			})

			const data = await response.json()

			if (response.ok) {
				toast.success('¡Notificación de prueba enviada!')
			} else {
				toast.error(data.error || 'Error al enviar notificación')
			}
		} catch (error) {
			console.error('Error sending test notification:', error)
			toast.error('Error de conexión')
		} finally {
			setIsTestingNotification(false)
		}
	}

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="max-w-4xl mx-auto space-y-8">
				{/* Header */}
				<div className="text-center space-y-4">
					<h1 className="text-3xl font-bold flex items-center justify-center gap-2">
						<TestTube className="h-8 w-8" />
						Prueba de Notificaciones Push
					</h1>
					<p className="text-muted-foreground max-w-2xl mx-auto">
						Esta página te permite probar el sistema de notificaciones push de Kairos Fitness.
						Primero activa las notificaciones y luego envía una notificación de prueba.
					</p>
				</div>

				{/* Push Notification Manager */}
				<div className="flex justify-center">
					<PushNotificationManager className="w-full max-w-md" />
				</div>

				{/* Test Notification Button */}
				<div className="flex justify-center">
					<Card className="w-full max-w-md">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Send className="h-5 w-5" />
								Enviar Notificación de Prueba
							</CardTitle>
							<CardDescription>
								Envía una notificación de prueba para verificar que todo funciona correctamente
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button
								onClick={sendTestNotification}
								disabled={isTestingNotification}
								className="w-full"
							>
								<Bell className="h-4 w-4 mr-2" />
								{isTestingNotification ? 'Enviando...' : 'Enviar Notificación de Prueba'}
							</Button>
						</CardContent>
					</Card>
				</div>

				{/* Instructions */}
				<Card className="max-w-2xl mx-auto">
					<CardHeader>
						<CardTitle>Instrucciones</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<h4 className="font-semibold">1. Activar Notificaciones</h4>
							<p className="text-sm text-muted-foreground">
								Haz clic en &quot;Activar&quot; en la tarjeta de notificaciones push. Tu navegador te pedirá permisos.
							</p>
						</div>
						<div className="space-y-2">
							<h4 className="font-semibold">2. Enviar Prueba</h4>
							<p className="text-sm text-muted-foreground">
								Una vez activadas, haz clic en &quot;Enviar Notificación de Prueba&quot; para recibir una notificación.
							</p>
						</div>
						<div className="space-y-2">
							<h4 className="font-semibold">3. Verificar Funcionamiento</h4>
							<p className="text-sm text-muted-foreground">
								Deberías recibir una notificación push en tu navegador. Si no la recibes, verifica los permisos.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}