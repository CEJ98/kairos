'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Copy, 
  ExternalLink,
  RefreshCw,
  Shield
} from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

interface WebhookStatus {
  configured: boolean
  url: string
  activeWebhooks: Array<{
    id: string
    url: string
    status: string
    enabled_events: number
    created: string
    isOurs?: boolean
  }>
  requiredEvents: string[]
  environment: string
  hasWebhookSecret: boolean
}

interface StripeConfig {
  hasPublishableKey: boolean
  hasSecretKey: boolean
  hasWebhookSecret: boolean
  environment: 'development' | 'production'
  keysValid: boolean
}

export default function StripeWebhooksPage() {
  const { data: session } = useSession()
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus | null>(null)
  const [stripeConfig, setStripeConfig] = useState<StripeConfig | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [productionUrl, setProductionUrl] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')

  // Cargar estado de webhooks
  const loadWebhookStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/stripe/webhook-status')
      if (response.ok) {
        const data = await response.json()
        setWebhookStatus(data)
      } else {
        toast.error('Error al cargar estado de webhooks')
      }
    } catch (error) {
      console.error('Error loading webhook status:', error)
      toast.error('Error de conexion')
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar configuracion de Stripe
  const loadStripeConfig = async () => {
    try {
      const response = await fetch('/api/stripe/config-status')
      if (response.ok) {
        const data = await response.json()
        setStripeConfig(data)
      }
    } catch (error) {
      console.error('Error loading stripe config:', error)
    }
  }

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      loadWebhookStatus()
      loadStripeConfig()
    }
  }, [session?.user?.role])

  // Verificar si el usuario es admin
  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Acceso denegado. Solo los administradores pueden acceder a esta pagina.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Copiar al portapapeles
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado al portapapeles')
  }

  // Probar webhook
  const testWebhook = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/stripe/test-webhook', {
        method: 'POST'
      })
      const result = await response.json()
      
      if (response.ok) {
        toast.success('Webhook probado exitosamente')
      } else {
        toast.error(result.error || 'Error al probar webhook')
      }
    } catch (error) {
      toast.error('Error al probar webhook')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Configuracion de Stripe Webhooks</h1>
        </div>
        <Button onClick={loadWebhookStatus} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <Tabs defaultValue="status" className="space-y-6">
        <TabsList>
          <TabsTrigger value="status">Estado Actual</TabsTrigger>
          <TabsTrigger value="setup">Configuracion</TabsTrigger>
          <TabsTrigger value="testing">Pruebas</TabsTrigger>
        </TabsList>

        {/* Estado Actual */}
        <TabsContent value="status" className="space-y-6">
          {/* Resumen de Estado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Configuracion de Stripe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {stripeConfig?.keysValid ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-sm">
                    {stripeConfig?.keysValid ? 'Configurado' : 'No configurado'}
                  </span>
                </div>
                <Badge variant={stripeConfig?.environment === 'production' ? 'default' : 'secondary'}>
                  {stripeConfig?.environment === 'production' ? 'Produccion' : 'Desarrollo'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {webhookStatus?.configured ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-sm">
                    {webhookStatus?.configured ? 'Activo' : 'No configurado'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {webhookStatus?.activeWebhooks?.length || 0} webhooks encontrados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Secreto de Webhook</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {webhookStatus?.hasWebhookSecret ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                  <span className="text-sm">
                    {webhookStatus?.hasWebhookSecret ? 'Configurado' : 'Faltante'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Webhooks */}
          {webhookStatus?.activeWebhooks && webhookStatus.activeWebhooks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Webhooks Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {webhookStatus.activeWebhooks.map((webhook) => (
                    <div key={webhook.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant={webhook.isOurs ? 'default' : 'secondary'}>
                            {webhook.isOurs ? 'Nuestro' : 'Externo'}
                          </Badge>
                          <Badge variant={webhook.status === 'enabled' ? 'default' : 'destructive'}>
                            {webhook.status}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(webhook.id)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          ID
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>URL:</strong> {webhook.url}
                      </p>
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>Eventos:</strong> {webhook.enabled_events}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Creado:</strong> {new Date(webhook.created).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Configuracion */}
        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuracion para Produccion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Para configurar webhooks en produccion, necesitas:
                  <br />1. Claves de Stripe de produccion (pk_live_ y sk_live_)
                  <br />2. URL de produccion con HTTPS
                  <br />3. Configurar el webhook en el dashboard de Stripe
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">URL de Produccion</label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      value={productionUrl}
                      onChange={(e) => setProductionUrl(e.target.value)}
                      placeholder="https://tu-app.vercel.app"
                    />
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(`${productionUrl}/api/webhooks/stripe`)}
                      disabled={!productionUrl}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    URL del webhook: {productionUrl}/api/webhooks/stripe
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Eventos Requeridos</label>
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {webhookStatus?.requiredEvents?.map((event) => (
                        <div key={event} className="flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>{event}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => window.open('https://dashboard.stripe.com/webhooks', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Dashboard de Stripe
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pruebas */}
        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Probar Webhooks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Prueba la conectividad y funcionamiento de los webhooks.
              </p>
              
              <Button onClick={testWebhook} disabled={isLoading}>
                {isLoading ? 'Probando...' : 'Probar Webhook'}
              </Button>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Esta prueba solo funciona si tienes claves de Stripe validas configuradas.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}