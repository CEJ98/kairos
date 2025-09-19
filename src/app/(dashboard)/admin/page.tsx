'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
	Settings, 
	Server, 
	Shield, 
	Database,
	Webhook,
	Monitor
} from 'lucide-react'
import WebhookManager from '@/components/admin/webhook-manager'
import ProductionSetup from '@/components/admin/production-setup'
import StripeWebhookSetup from '@/components/admin/stripe-webhook-setup'

export default function AdminPage() {
	const { data: session } = useSession()

	if (!session?.user || session.user.role !== 'ADMIN') {
		return (
			<div className="container mx-auto px-4 py-8">
				<Alert>
					<Shield className="h-4 w-4" />
					<AlertDescription>
						Solo los administradores pueden acceder a esta página.
					</AlertDescription>
				</Alert>
			</div>
		)
	}

	return (
		<div className="container mx-auto px-4 py-8 space-y-6">
			{/* Header */}
			<div className="space-y-2">
				<h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
					<Settings className="h-8 w-8 text-primary" />
					Panel de Administración
				</h1>
				<p className="text-gray-600">
					Configura y administra tu aplicación Kairos Fitness
				</p>
			</div>

			{/* Admin Tabs */}
			<Tabs defaultValue="production" className="space-y-6">
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="production" className="flex items-center gap-2">
						<Server className="h-4 w-4" />
						Producción
					</TabsTrigger>
					<TabsTrigger value="webhooks" className="flex items-center gap-2">
						<Webhook className="h-4 w-4" />
						Webhooks
					</TabsTrigger>
					<TabsTrigger value="database" className="flex items-center gap-2">
						<Database className="h-4 w-4" />
						Base de Datos
					</TabsTrigger>
					<TabsTrigger value="monitoring" className="flex items-center gap-2">
						<Monitor className="h-4 w-4" />
						Monitoreo
					</TabsTrigger>
				</TabsList>

				{/* Configuración de Producción */}
				<TabsContent value="production" className="space-y-6">
					<ProductionSetup />
				</TabsContent>

				{/* Gestión de Webhooks */}
				<TabsContent value="webhooks" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Webhook className="h-5 w-5" />
								Configuración de Webhooks de Stripe
							</CardTitle>
							<CardDescription>
								Administra los webhooks de Stripe para pagos y suscripciones en producción
							</CardDescription>
						</CardHeader>
						<CardContent>
							<StripeWebhookSetup />
						</CardContent>
					</Card>
					
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Webhook className="h-5 w-5" />
								Gestión General de Webhooks
							</CardTitle>
							<CardDescription>
								Configuración y monitoreo de webhooks del sistema
							</CardDescription>
						</CardHeader>
						<CardContent>
							<WebhookManager />
						</CardContent>
					</Card>
				</TabsContent>

				{/* Base de Datos */}
				<TabsContent value="database" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Database className="h-5 w-5" />
								Gestión de Base de Datos
							</CardTitle>
							<CardDescription>
								Administra copias de seguridad y migraciones
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<Alert>
									<Database className="h-4 w-4" />
									<AlertDescription>
										La gestión de base de datos está disponible en la página de 
										<a href="/admin/backup" className="text-primary hover:underline font-medium">
											copias de seguridad
										</a>.
									</AlertDescription>
								</Alert>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Monitoreo */}
				<TabsContent value="monitoring" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Monitor className="h-5 w-5" />
								Monitoreo del Sistema
							</CardTitle>
							<CardDescription>
								Supervisa el rendimiento y estado de la aplicación
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<Alert>
									<Monitor className="h-4 w-4" />
									<AlertDescription>
										Las herramientas de monitoreo estarán disponibles próximamente.
										Incluirán métricas de rendimiento, logs del sistema y alertas.
									</AlertDescription>
								</Alert>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}