'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
	CheckCircle, 
	XCircle, 
	AlertTriangle, 
	RefreshCw, 
	Copy, 
	ExternalLink,
	Settings,
	Server,
	Shield
} from 'lucide-react'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

interface ProductionConfig {
	stripeConfigured: boolean
	webhooksConfigured: boolean
	databaseConfigured: boolean
	authConfigured: boolean
	environmentVariables: {
		STRIPE_PUBLISHABLE_KEY: boolean
		STRIPE_SECRET_KEY: boolean
		STRIPE_WEBHOOK_SECRET: boolean
		NEXTAUTH_SECRET: boolean
		DATABASE_URL: boolean
		NEXT_PUBLIC_SITE_URL: boolean
	}
}

export default function ProductionSetup() {
	const { data: session } = useSession()
	const [config, setConfig] = useState<ProductionConfig | null>(null)
	const [loading, setLoading] = useState(true)
	const [creating, setCreating] = useState(false)
	const [webhookUrl, setWebhookUrl] = useState('')
	const [siteUrl, setSiteUrl] = useState('')

	useEffect(() => {
		if (session?.user?.role === 'ADMIN') {
			fetchProductionConfig()
		}
	}, [session])

	useEffect(() => {
		// Auto-detectar URLs
		const detectedSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
		setSiteUrl(detectedSiteUrl)
		setWebhookUrl(`${detectedSiteUrl}/api/stripe/webhooks`)
	}, [])

	const fetchProductionConfig = async () => {
		try {
			setLoading(true)
			const response = await fetch('/api/admin/production-status')
			if (response.ok) {
				const data = await response.json()
				setConfig(data)
			} else {
				throw new Error('Error al obtener configuración')
			}
		} catch (error) {
			logger.error('Error fetching production config:', error)
			toast.error('Error al cargar configuración de producción')
		} finally {
			setLoading(false)
		}
	}

	const createWebhook = async () => {
		try {
			setCreating(true)
			
			const response = await fetch('/api/stripe/create-webhook', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					url: webhookUrl,
					description: 'Kairos Fitness - Production Webhook'
				})
			})

			const data = await response.json()

			if (response.ok) {
				toast.success('Webhook creado exitosamente')
				
				// Mostrar el secreto para que lo copie
				if (data.webhook?.secret) {
					navigator.clipboard.writeText(data.webhook.secret)
					toast.info('Secreto del webhook copiado al portapapeles')
				}

				await fetchProductionConfig()
			} else {
				throw new Error(data.error || 'Error al crear webhook')
			}
		} catch (error: any) {
			logger.error('Error creating webhook:', error)
			toast.error(error.message || 'Error al crear webhook')
		} finally {
			setCreating(false)
		}
	}

	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard.writeText(text)
		toast.success(`${label} copiado al portapapeles`)
	}

	if (!session?.user || session.user.role !== 'ADMIN') {
		return (
			<Alert>
				<Shield className="h-4 w-4" />
				<AlertDescription>
					Solo los administradores pueden acceder a la configuración de producción.
				</AlertDescription>
			</Alert>
		)
	}

	if (loading) {
		return (
			<Card>
				<CardContent className="flex items-center justify-center p-6">
					<RefreshCw className="h-6 w-6 animate-spin mr-2" />
					Cargando configuración...
				</CardContent>
			</Card>
		)
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Settings className="h-5 w-5" />
						Configuración de Producción
					</CardTitle>
					<CardDescription>
						Configura tu aplicación para producción paso a paso
					</CardDescription>
				</CardHeader>
			</Card>

			{/* Variables de Entorno */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Server className="h-5 w-5" />
						Variables de Entorno
					</CardTitle>
					<CardDescription>
						Verifica que todas las variables necesarias estén configuradas
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{config && (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{Object.entries(config.environmentVariables).map(([key, configured]) => (
								<div key={key} className="flex items-center justify-between p-3 border rounded-lg">
									<span className="font-mono text-sm">{key}</span>
									{configured ? (
										<Badge variant="default" className="bg-green-100 text-green-800">
											<CheckCircle className="h-3 w-3 mr-1" />
											Configurado
										</Badge>
									) : (
										<Badge variant="destructive">
											<XCircle className="h-3 w-3 mr-1" />
											Faltante
										</Badge>
									)}
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Configuración de Webhooks */}
			<Card>
				<CardHeader>
					<CardTitle>Webhooks de Stripe</CardTitle>
					<CardDescription>
						Configura los webhooks para recibir eventos de Stripe
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="site-url">URL del Sitio</Label>
						<div className="flex gap-2">
							<Input
								id="site-url"
								value={siteUrl}
								onChange={(e) => {
									setSiteUrl(e.target.value)
									setWebhookUrl(`${e.target.value}/api/stripe/webhooks`)
								}}
								placeholder="https://tu-dominio.com"
							/>
							<Button
								variant="outline"
								size="icon"
								onClick={() => copyToClipboard(siteUrl, 'URL del sitio')}
							>
								<Copy className="h-4 w-4" />
							</Button>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="webhook-url">URL del Webhook</Label>
						<div className="flex gap-2">
							<Input
								id="webhook-url"
								value={webhookUrl}
								readOnly
								className="bg-gray-50"
							/>
							<Button
								variant="outline"
								size="icon"
								onClick={() => copyToClipboard(webhookUrl, 'URL del webhook')}
							>
								<Copy className="h-4 w-4" />
							</Button>
						</div>
					</div>

					<Button
						onClick={createWebhook}
						disabled={creating || !siteUrl}
						className="w-full"
					>
						{creating ? (
							<RefreshCw className="h-4 w-4 animate-spin mr-2" />
						) : null}
						Crear Webhook en Stripe
					</Button>

					<Alert>
						<AlertTriangle className="h-4 w-4" />
						<AlertDescription>
							<strong>Importante:</strong> Después de crear el webhook, copia el secreto generado 
							y agrégalo como <code>STRIPE_WEBHOOK_SECRET</code> en tus variables de entorno.
						</AlertDescription>
					</Alert>
				</CardContent>
			</Card>

			{/* Instrucciones Adicionales */}
			<Card>
				<CardHeader>
					<CardTitle>Pasos Adicionales</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex items-start gap-3">
							<div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
								1
							</div>
							<div>
								<h4 className="font-semibold">Configurar Variables de Entorno</h4>
								<p className="text-sm text-gray-600">
								Asegúrate de que todas las variables marcadas como &quot;Faltante&quot; estén configuradas en tu plataforma de despliegue.
							</p>
							</div>
						</div>

						<div className="flex items-start gap-3">
							<div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
								2
							</div>
							<div>
								<h4 className="font-semibold">Verificar Base de Datos</h4>
								<p className="text-sm text-gray-600">
									Ejecuta las migraciones de Prisma en producción: <code>npx prisma migrate deploy</code>
								</p>
							</div>
						</div>

						<div className="flex items-start gap-3">
							<div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
								3
							</div>
							<div>
								<h4 className="font-semibold">Probar Webhooks</h4>
								<p className="text-sm text-gray-600">
									Usa el panel de Stripe para enviar eventos de prueba y verificar que los webhooks funcionen correctamente.
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}