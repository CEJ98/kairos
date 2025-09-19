'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Plus, ExternalLink, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

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
  matchingWebhook?: {
    id: string
    enabled_events: string[]
    missing_events: string[]
    all_events_configured: boolean
  }
}

export default function WebhookManager() {
  const { data: session } = useSession()
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  const fetchWebhookStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stripe/webhook-status')
      if (response.ok) {
        const data = await response.json()
        setWebhookStatus(data)
      } else {
        throw new Error('Error al obtener estado de webhooks')
      }
    } catch (error) {
      logger.error('Error fetching webhook status:', error)
      toast.error('Error al cargar estado de webhooks')
    } finally {
      setLoading(false)
    }
  }

  const createWebhook = async () => {
    try {
      setCreating(true)
      
      // Obtener la URL base del sitio
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const webhookUrl = `${siteUrl}/api/stripe/webhooks`
      
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
          toast.info('Secreto del webhook copiado al portapapeles. Agrégalo como STRIPE_WEBHOOK_SECRET en tu .env')
        }

        await fetchWebhookStatus()
      } else {
        throw new Error(data.error || 'Error al crear webhook')
      }
    } catch (error) {
      logger.error('Error creating webhook:', error)
      toast.error(error instanceof Error ? error.message : 'Error al crear webhook')
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado al portapapeles`)
  }

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchWebhookStatus()
    }
  }, [session])

  if (!session?.user || session.user.role !== 'ADMIN') {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Solo los administradores pueden acceder a esta sección.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Webhooks de Stripe</h2>
          <p className="text-muted-foreground">
            Configura y verifica los webhooks para procesar eventos de Stripe
          </p>
        </div>
        <Button onClick={fetchWebhookStatus} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {webhookStatus && (
        <>
          {/* Estado general */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {webhookStatus.configured ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Estado de Configuración
              </CardTitle>
              <CardDescription>
                Entorno: {webhookStatus.environment} | 
                Secreto configurado: {webhookStatus.hasWebhookSecret ? 'Sí' : 'No'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">URL del Webhook</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 p-2 bg-muted rounded text-sm">
                      {webhookStatus.url}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(webhookStatus.url, 'URL')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {!webhookStatus.configured && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No se encontró un webhook configurado para esta URL. 
                      Los eventos de Stripe no se procesarán correctamente.
                    </AlertDescription>
                  </Alert>
                )}

                {webhookStatus.matchingWebhook?.missing_events && webhookStatus.matchingWebhook.missing_events.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Faltan eventos requeridos: {webhookStatus.matchingWebhook.missing_events.join(', ')}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Webhooks activos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Webhooks Activos</CardTitle>
                  <CardDescription>
                    {webhookStatus.activeWebhooks.length} webhooks configurados en Stripe
                  </CardDescription>
                </div>
                <Button onClick={createWebhook} disabled={creating} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {creating ? 'Creando...' : 'Crear Webhook'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {webhookStatus.activeWebhooks.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No hay webhooks configurados
                </p>
              ) : (
                <div className="space-y-3">
                  {webhookStatus.activeWebhooks.map((webhook) => (
                    <div key={webhook.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <code className="text-sm">{webhook.id}</code>
                            <Badge variant={webhook.status === 'enabled' ? 'default' : 'secondary'}>
                              {webhook.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {webhook.url}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {webhook.enabled_events} eventos • 
                            Creado: {new Date(webhook.created).toLocaleString()}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <a 
                            href={`https://dashboard.stripe.com/webhooks/${webhook.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Eventos requeridos */}
          <Card>
            <CardHeader>
              <CardTitle>Eventos Requeridos</CardTitle>
              <CardDescription>
                Estos eventos deben estar configurados en el webhook para el funcionamiento completo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {webhookStatus.requiredEvents.map((event) => {
                  const isConfigured = webhookStatus.matchingWebhook?.enabled_events.includes(event)
                  return (
                    <div key={event} className="flex items-center gap-2">
                      {isConfigured ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <code className="text-sm">{event}</code>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Instrucciones */}
          <Card>
            <CardHeader>
              <CardTitle>Instrucciones de Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">1. Configurar Webhook en Stripe</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Ve al dashboard de Stripe y crea un nuevo webhook endpoint con la URL mostrada arriba.
                </p>
                <Button size="sm" variant="outline" asChild>
                  <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Stripe Dashboard
                  </a>
                </Button>
              </div>
              
              <Separator />

              <div>
                <h4 className="font-medium mb-2">2. Variables de Entorno</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Asegúrate de tener configuradas estas variables de entorno:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">STRIPE_WEBHOOK_SECRET</code>
                    <Badge variant={webhookStatus.hasWebhookSecret ? 'default' : 'destructive'}>
                      {webhookStatus.hasWebhookSecret ? 'Configurado' : 'Faltante'}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">3. Testear Webhook</h4>
                <p className="text-sm text-muted-foreground">
                  Usa el Stripe CLI para probar los webhooks localmente:
                </p>
                <code className="block text-xs bg-muted p-2 rounded mt-2">
                  stripe listen --forward-to localhost:3000/api/stripe/webhooks
                </code>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}