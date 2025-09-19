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
	Shield,
	Zap,
	Eye,
	EyeOff
} from 'lucide-react'
import { toast } from 'sonner'

interface WebhookStatus {
	configured: boolean
	url: string
	activeWebhooks: Array<{
		id: string
		url: string
		status: string
		enabled_events: number
		created: string
	}>
	requiredEvents: string[]
	environment: string
	hasWebhookSecret: boolean
}

interface ProductionConfig {
	stripeConfigured: boolean
	webhooksConfigured: boolean
	environmentVariables: {
		STRIPE_PUBLISHABLE_KEY: boolean
		STRIPE_SECRET_KEY: boolean
		STRIPE_WEBHOOK_SECRET: boolean
	}
}

export default function StripeWebhookSetup() {
	const { data: session } = useSession()
	const [webhookStatus, setWebhookStatus] = useState<WebhookStatus | null>(null)
	const [config, setConfig] = useState<ProductionConfig | null>(null)
	const [loading, setLoading] = useState(true)
	const [creating, setCreating] = useState(false)
	const [testing, setTesting] = useState(false)
	const [showSecret, setShowSecret] = useState(false)
	const [webhookSecret, setWebhookSecret] = useState('')
	const [siteUrl, setSiteUrl] = useState('')

	useEffect(() => {
		if (session?.user?.role === 'ADMIN') {
			fetchWebhookStatus()
			fetchProductionConfig()
		}
	}, [session])

	const fetchWebhookStatus = async () => {
		try {
			const response = await fetch('/api/stripe/webhook-status')
			if (response.ok) {
				const data = await response.json()
				setWebhookStatus(data)
				setSiteUrl(data.url.replace('/api/stripe/webhooks', ''))
			}
		} catch (error) {
			console.error('Error fetching webhook status:', error)
		} finally {
			setLoading(false)
		}
	}

	const fetchProductionConfig = async () => {
		try {
			const response = await fetch('/api/admin/production-status')
			if (response.ok) {
				const data = await response.json()
				setConfig(data)
			}
		} catch (error) {
			console.error('Error fetching production config:', error)
		}
	}

	const createWebhook = async () => {
		setCreating(true)
		try {
			const response = await fetch('/api/stripe/create-webhook', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					url: `${siteUrl}/api/stripe/webhooks`,
					description: 'Kairos Fitness - Production Webhook'
				})
			})

			const data = await response.json()

			if (response.ok) {
				setWebhookSecret(data.webhook.secret)
				toast.success('Webhook creado exitosamente')
				await fetchWebhookStatus()
			} else {
				toast.error(data.error || 'Error creando webhook')
			}
		} catch (error) {
			console.error('Error creating webhook:', error)
			toast.error('Error de conexión')
		} finally {
			setCreating(false)
		}
	}

	const testWebhook = async () => {
		setTesting(true)
		try {
			const response = await fetch('/api/stripe/test-webhook', {
				method: 'POST'
			})

			const data = await response.json()

			if (response.ok) {
				toast.success('Webhook probado exitosamente')
			} else {
				toast.error(data.error || 'Error probando webhook')
			}
		} catch (error) {
			console.error('Error testing webhook:', error)
			toast.error('Error de conexión')
		} finally {
			setTesting(false)
		}
	}

	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard.writeText(text)
		toast.success(`${label} copiado al portapapeles`)
	}

	const getEnvironmentBadge = (env: string) => {
		if (env === 'production') {
			return <Badge variant="destructive">🔴 PRODUCCIÓN</Badge>
		}
		return <Badge variant="secondary">🟡 DESARROLLO</Badge>
	}

	const getStatusBadge = (status: boolean) => {
		return status ? (
			<Badge variant="default" className="bg-green-500">
				<CheckCircle className="h-3 w-3 mr-1" />
				Configurado
			</Badge>
		) : (
			<Badge variant="destructive">
				<XCircle className="h-3 w-3 mr-1" />
				Faltante
			</Badge>
		)
	}

	if (!session?.user || session.user.role !== 'ADMIN') {
		return (
			<Alert>
				<Shield className="h-4 w-4" />
				<AlertDescription>
					Acceso restringido. Solo administradores pueden configurar webhooks.
				</AlertDescription>
			</Alert>
		)
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<RefreshCw className="h-6 w-6 animate-spin mr-2" />
				Cargando configuración...
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Zap className="h-6 w-6 text-blue-500" />
				<div>
					<h2 className="text-2xl font-bold">Configuración de Webhooks de Stripe</h2>
					<p className="text-muted-foreground">
						Configura y gestiona webhooks para pagos en producción
					</p>
				</div>
			</div>

			{/* Estado General */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Settings className="h-5 w-5" />
						Estado de Configuración
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="flex items-center justify-between p-3 border rounded-lg">
							<span className="font-medium">Entorno</span>
							{getEnvironmentBadge(webhookStatus?.environment || 'development')}
						</div>
						<div className="flex items-center justify-between p-3 border rounded-lg">
							<span className="font-medium">Stripe Keys</span>
							{getStatusBadge(config?.stripeConfigured || false)}
						</div>
						<div className="flex items-center justify-between p-3 border rounded-lg">
							<span className="font-medium">Webhook Secret</span>
							{getStatusBadge(webhookStatus?.hasWebhookSecret || false)}
						</div>
					</div>

					{!config?.stripeConfigured && (
						<Alert>
							<AlertTriangle className="h-4 w-4" />
							<AlertDescription>
								<strong>Configuración incompleta:</strong> Las claves de Stripe no están configuradas correctamente.
								Asegúrate de tener STRIPE_SECRET_KEY y NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY en tus variables de entorno.
							</AlertDescription>
						</Alert>
					)}
				</CardContent>
			</Card>

			{/* Webhooks Activos */}
			{webhookStatus && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Server className="h-5 w-5" />
							Webhooks Activos
						</CardTitle>
						<CardDescription>
							Webhooks configurados en tu cuenta de Stripe
						</CardDescription>
					</CardHeader>
					<CardContent>
						{webhookStatus.activeWebhooks.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								<Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
								<p>No hay webhooks configurados</p>
								<p className="text-sm">Crea uno usando el botón de abajo</p>
							</div>
						) : (
							<div className="space-y-3">
								{webhookStatus.activeWebhooks.map((webhook) => (
									<div key={webhook.id} className="border rounded-lg p-4">
										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center gap-2">
												<Badge variant="outline">{webhook.id}</Badge>
												<Badge 
													variant={webhook.status === 'enabled' ? 'default' : 'secondary'}
												>
													{webhook.status}
												</Badge>
											</div>
											<Button
												variant="outline"
												size="sm"
												asChild
											>
												<a 
													href={`https://dashboard.stripe.com/webhooks/${webhook.id}`}
													target="_blank"
													rel="noopener noreferrer"
												>
													<ExternalLink className="h-4 w-4 mr-1" />
													Ver en Stripe
												</a>
											</Button>
										</div>
										<div className="text-sm text-muted-foreground space-y-1">
											<p><strong>URL:</strong> {webhook.url}</p>
											<p><strong>Eventos:</strong> {webhook.enabled_events}/{webhookStatus.requiredEvents.length}</p>
											<p><strong>Creado:</strong> {new Date(webhook.created).toLocaleDateString()}</p>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Configuración de Webhook */}
			<Card>
				<CardHeader>
					<CardTitle>Crear/Configurar Webhook</CardTitle>
					<CardDescription>
						Configura un nuevo webhook o actualiza uno existente
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="site-url">URL del Sitio</Label>
						<div className="flex gap-2">
							<Input
								id="site-url"
								value={siteUrl}
								onChange={(e) => setSiteUrl(e.target.value)}
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
						<Label>URL del Webhook</Label>
						<div className="flex gap-2">
							<Input
								value={`${siteUrl}/api/stripe/webhooks`}
								readOnly
								className="bg-gray-50"
							/>
							<Button
								variant="outline"
								size="icon"
								onClick={() => copyToClipboard(`${siteUrl}/api/stripe/webhooks`, 'URL del webhook')}
							>
								<Copy className="h-4 w-4" />
							</Button>
						</div>
					</div>

					<div className="flex gap-2">
						<Button
							onClick={createWebhook}
							disabled={creating || !siteUrl || !config?.stripeConfigured}
							className="flex-1"
						>
							{creating ? (
								<RefreshCw className="h-4 w-4 animate-spin mr-2" />
							) : null}
							Crear Webhook
						</Button>
						<Button
							variant="outline"
							onClick={testWebhook}
							disabled={testing || !webhookStatus?.configured}
						>
							{testing ? (
								<RefreshCw className="h-4 w-4 animate-spin mr-2" />
							) : null}
							Probar
						</Button>
					</div>

					{webhookSecret && (
						<Alert>
							<CheckCircle className="h-4 w-4" />
							<AlertDescription>
								<div className="space-y-2">
									<p><strong>¡Webhook creado exitosamente!</strong></p>
									<p>Copia este secreto y agrégalo como <code>STRIPE_WEBHOOK_SECRET</code> en tus variables de entorno:</p>
									<div className="flex items-center gap-2 mt-2">
										<Input
											value={webhookSecret}
											readOnly
											type={showSecret ? 'text' : 'password'}
											className="font-mono text-sm"
										/>
										<Button
											variant="outline"
											size="icon"
											onClick={() => setShowSecret(!showSecret)}
										>
											{showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
										</Button>
										<Button
											variant="outline"
											size="icon"
											onClick={() => copyToClipboard(webhookSecret, 'Secreto del webhook')}
										>
											<Copy className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</AlertDescription>
						</Alert>
					)}
				</CardContent>
			</Card>

			{/* Instrucciones */}
			<Card>
				<CardHeader>
					<CardTitle>Guía de Configuración</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-4">
						<div>
							<h4 className="font-medium mb-2">1. 🔑 Variables de Entorno Requeridas</h4>
							<div className="space-y-2 text-sm">
								<div className="flex items-center gap-2">
									<code className="bg-muted px-2 py-1 rounded">STRIPE_SECRET_KEY</code>
									{getStatusBadge(config?.environmentVariables.STRIPE_SECRET_KEY || false)}
								</div>
								<div className="flex items-center gap-2">
									<code className="bg-muted px-2 py-1 rounded">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>
									{getStatusBadge(config?.environmentVariables.STRIPE_PUBLISHABLE_KEY || false)}
								</div>
								<div className="flex items-center gap-2">
									<code className="bg-muted px-2 py-1 rounded">STRIPE_WEBHOOK_SECRET</code>
									{getStatusBadge(config?.environmentVariables.STRIPE_WEBHOOK_SECRET || false)}
								</div>
							</div>
						</div>

						<Separator />

						<div>
							<h4 className="font-medium mb-2">2. 🚀 Pasos de Configuración</h4>
							<ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
								<li>Configura las claves de Stripe en variables de entorno</li>
								<li>Crea el webhook usando el botón de arriba</li>
								<li>Copia el secreto generado a STRIPE_WEBHOOK_SECRET</li>
								<li>Redeploya tu aplicación</li>
								<li>Prueba con una transacción real</li>
							</ol>
						</div>

						<Separator />

						<div>
							<h4 className="font-medium mb-2">3. 📚 Recursos Adicionales</h4>
							<div className="flex flex-wrap gap-2">
								<Button size="sm" variant="outline" asChild>
									<a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer">
										<ExternalLink className="h-4 w-4 mr-2" />
										Stripe Dashboard
									</a>
								</Button>
								<Button size="sm" variant="outline" asChild>
									<a href="/docs/STRIPE_WEBHOOKS_PRODUCTION.md" target="_blank">
										<ExternalLink className="h-4 w-4 mr-2" />
										Guía Completa
									</a>
								</Button>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}