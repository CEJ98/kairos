'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CreditCard,
  Crown,
  Check,
  X,
  Zap,
  Users,
  BarChart3,
  Shield,
  Settings,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Calendar,
  DollarSign,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { PRICING_PLANS } from '@/lib/stripe'
import { toast } from 'react-hot-toast'

export default function BillingPage() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState('')
  
  // Mock subscription data - en producción vendría de API
  const currentSubscription = {
    planType: 'FREE',
    status: 'ACTIVE',
    currentPeriodStart: new Date('2024-01-01'),
    currentPeriodEnd: new Date('2024-12-31'),
    cancelAtPeriodEnd: false,
    stripeCustomerId: null,
    usageStats: {
      workouts: 2,
      maxWorkouts: 3,
      clients: 0,
      maxClients: 0,
      storage: 45, // MB
      maxStorage: 100 // MB
    }
  }

  const isTrainer = session?.user?.role === 'TRAINER'
  const currentPlan = PRICING_PLANS[currentSubscription.planType as keyof typeof PRICING_PLANS]

  const handleUpgrade = async (planType: string) => {
    setIsLoading(planType)
    
    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planType,
        })
      })

      if (response.ok) {
        const { url } = await response.json()
        if (url) window.location.href = url
      } else {
        toast.error('Error al procesar el pago')
      }
    } catch (error) {
      toast.error('Error al conectar con Stripe')
    } finally {
      setIsLoading('')
    }
  }

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: window.location.href
        })
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      }
    } catch (error) {
      toast.error('Error al abrir portal de facturación')
    }
  }

  const getUsagePercentage = (used: number, max: number) => {
    if (max === -1) return 0 // Unlimited
    return Math.min((used / max) * 100, 100)
  }

  const formatUsage = (used: number, max: number, unit: string) => {
    if (max === -1) return `${used} ${unit} (Ilimitado)`
    return `${used} / ${max} ${unit}`
  }

  return (
    <div className="page-container mobile-spacing mobile-gap-y">
      {/* Header */}
      <div className="text-center mobile-gap-y">
        <h1 className="responsive-heading font-bold text-gray-900">Suscripción y Facturación</h1>
        <p className="responsive-body text-gray-600">
          Gestiona tu plan y desbloquea todas las funcionalidades premium
        </p>
      </div>

      {/* Current Plan Status */}
      <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50 mobile-card">
        <CardHeader className="mobile-spacing-x">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mobile-gap">
            <div className="flex items-center mobile-gap">
              <div className="p-2 bg-green-600 rounded-full">
                <Crown className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div className="min-w-0">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center mobile-gap responsive-subheading">
                  Plan {currentPlan.name}
                  <Badge 
                    variant={currentSubscription.status === 'ACTIVE' ? 'success' : 'destructive'}
                    className="responsive-caption w-fit"
                  >
                    {currentSubscription.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                  </Badge>
                </CardTitle>
                <CardDescription className="responsive-caption">
                  {currentSubscription.planType === 'FREE' 
                    ? 'Plan gratuito - Actualiza para desbloquear más funcionalidades'
                    : `$${currentPlan.price / 100}/mes • Renovación: ${currentSubscription.currentPeriodEnd.toLocaleDateString()}`
                  }
                </CardDescription>
              </div>
            </div>
            
            {currentSubscription.stripeCustomerId && (
              <Button variant="outline" onClick={handleManageBilling} className="mobile-button-sm responsive-body">
                <Settings className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                Gestionar
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="mobile-spacing-x mobile-gap-y">
          {/* Usage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 mobile-gap">
            <div className="mobile-gap-y">
              <div className="flex justify-between responsive-caption">
                <span>Rutinas creadas</span>
                <span>{formatUsage(
                  currentSubscription.usageStats.workouts,
                  currentPlan.limits.workouts,
                  'rutinas'
                )}</span>
              </div>
              <Progress 
                value={getUsagePercentage(
                  currentSubscription.usageStats.workouts, 
                  currentPlan.limits.workouts
                )} 
                className="h-2" 
              />
            </div>

            <div className="mobile-gap-y">
              <div className="flex justify-between responsive-caption">
                <span>Clientes activos</span>
                <span>{formatUsage(
                  currentSubscription.usageStats.clients,
                  currentPlan.limits.clients,
                  'clientes'
                )}</span>
              </div>
              <Progress 
                value={getUsagePercentage(
                  currentSubscription.usageStats.clients, 
                  currentPlan.limits.clients
                )} 
                className="h-2" 
              />
            </div>

            <div className="mobile-gap-y">
              <div className="flex justify-between responsive-caption">
                <span>Almacenamiento</span>
                <span>{currentSubscription.usageStats.storage} MB / {currentPlan.limits.storage}</span>
              </div>
              <Progress 
                value={(currentSubscription.usageStats.storage / 
                  parseInt(currentPlan.limits.storage)) * 100} 
                className="h-2" 
              />
            </div>
          </div>

          {/* Current Plan Features */}
          <div>
            <h4 className="responsive-body font-semibold mb-3">Tu plan incluye:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 mobile-gap">
              {currentPlan.features.map((feature, index) => (
                <div key={index} className="flex items-center mobile-gap responsive-caption">
                  <Check className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade CTA */}
          {currentSubscription.planType === 'FREE' && (
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white mobile-spacing rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mobile-gap">
                <div className="min-w-0">
                  <h4 className="responsive-subheading font-semibold mb-2">
                    ¡Desbloquea todo el potencial de Kairos!
                  </h4>
                  <p className="text-green-100 responsive-caption">
                    Rutinas ilimitadas, análisis avanzado y mucho más
                  </p>
                </div>
                <Button 
                  size="lg" 
                  className="bg-white text-green-600 hover:bg-gray-100 mobile-button responsive-body"
                  onClick={() => handleUpgrade(isTrainer ? 'TRAINER' : 'BASIC')}
                >
                  Actualizar Ahora
                  <ArrowRight className="h-3 w-3 md:h-4 md:w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isTrainer && (
        <Card className="mobile-card">
          <CardHeader className="mobile-spacing-x">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Estado de suscripción (Entrenador)
            </CardTitle>
            <CardDescription className="responsive-caption">
              Consulta tu estado actual de suscripción en Stripe
            </CardDescription>
          </CardHeader>
          <CardContent className="mobile-spacing-x mobile-gap-y">
            <Button
              variant="outline"
              className="w-fit"
              onClick={async () => {
                try {
                  const res = await fetch('/api/billing/status')
                  const data = await res.json()
                  if (data?.subscription) {
                    const sub = data.subscription
                    toast.success(`Plan: ${sub.planType} • Estado: ${sub.status}`)
                  } else {
                    toast('Sin suscripción activa')
                  }
                } catch {
                  toast.error('No se pudo obtener el estado')
                }
              }}
            >
              Actualizar estado
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pricing Plans */}
      <div>
        <div className="text-center mobile-spacing">
          <h2 className="responsive-heading font-bold text-gray-900 mb-4">
            Elige el Plan Perfecto para Ti
          </h2>
          <p className="responsive-body text-gray-600">
            Todos los planes incluyen 14 días de prueba gratuita
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 mobile-gap">
          {/* Basic Plan */}
          <Card className="hover:shadow-lg transition-shadow mobile-card">
            <CardHeader className="text-center mobile-spacing-x">
              <div className="p-2 md:p-3 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                <Zap className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
              </div>
              <CardTitle className="responsive-title">Básico</CardTitle>
              <CardDescription className="responsive-caption">Perfecto para usuarios individuales</CardDescription>
              <div className="py-4">
                <span className="text-2xl md:text-4xl font-bold">$9.99</span>
                <span className="text-gray-600 responsive-caption">/mes</span>
              </div>
            </CardHeader>
            <CardContent className="mobile-spacing-x mobile-gap-y">
              <ul className="mobile-gap-y">
                {PRICING_PLANS.BASIC.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 responsive-caption">
                    <Check className="h-3 w-3 md:h-4 md:w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full mt-6 mobile-button responsive-body" 
                variant={currentSubscription.planType === 'BASIC' ? 'outline' : 'default'}
                onClick={() => handleUpgrade('BASIC')}
                disabled={isLoading === 'BASIC' || currentSubscription.planType === 'BASIC'}
              >
                {isLoading === 'BASIC' ? 'Procesando...' : 
                 currentSubscription.planType === 'BASIC' ? 'Plan Actual' : 'Comenzar Prueba Gratis'}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="border-2 border-green-500 hover:shadow-lg transition-shadow relative mobile-card">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-green-600 text-white px-3 md:px-4 py-1 responsive-caption">
                <Sparkles className="h-2 w-2 md:h-3 md:w-3 mr-1" />
                Más Popular
              </Badge>
            </div>
            
            <CardHeader className="text-center mobile-spacing-x">
              <div className="p-2 md:p-3 bg-green-100 rounded-full w-fit mx-auto mb-4">
                <BarChart3 className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
              </div>
              <CardTitle className="responsive-title">Pro</CardTitle>
              <CardDescription className="responsive-caption">Para usuarios serios sobre fitness</CardDescription>
              <div className="py-4">
                <span className="text-2xl md:text-4xl font-bold">$19.99</span>
                <span className="text-gray-600 responsive-caption">/mes</span>
              </div>
            </CardHeader>
            <CardContent className="mobile-spacing-x mobile-gap-y">
              <ul className="mobile-gap-y">
                {PRICING_PLANS.PRO.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 responsive-caption">
                    <Check className="h-3 w-3 md:h-4 md:w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full mt-6 mobile-button responsive-body" 
                variant="gradient"
                onClick={() => handleUpgrade('PRO')}
                disabled={isLoading === 'PRO' || currentSubscription.planType === 'PRO'}
              >
                {isLoading === 'PRO' ? 'Procesando...' : 
                 currentSubscription.planType === 'PRO' ? 'Plan Actual' : 'Comenzar Prueba Gratis'}
              </Button>
            </CardContent>
          </Card>

          {/* Trainer Plan */}
          <Card className={`hover:shadow-lg transition-shadow mobile-card ${
            isTrainer ? 'border-2 border-purple-500' : ''
          }`}>
            <CardHeader className="text-center mobile-spacing-x">
              <div className="p-2 md:p-3 bg-purple-100 rounded-full w-fit mx-auto mb-4">
                <Users className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
              </div>
              <CardTitle className="responsive-title">Entrenador</CardTitle>
              <CardDescription className="responsive-caption">Dashboard profesional para coaches</CardDescription>
              <div className="py-4">
                <span className="text-2xl md:text-4xl font-bold">$49.99</span>
                <span className="text-gray-600 responsive-caption">/mes</span>
              </div>
            </CardHeader>
            <CardContent className="mobile-spacing-x mobile-gap-y">
              <ul className="mobile-gap-y">
                {PRICING_PLANS.TRAINER.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 responsive-caption">
                    <Check className="h-3 w-3 md:h-4 md:w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full mt-6 mobile-button responsive-body" 
                variant={currentSubscription.planType === 'TRAINER' ? 'outline' : 'default'}
                onClick={() => handleUpgrade('TRAINER')}
                disabled={isLoading === 'TRAINER' || currentSubscription.planType === 'TRAINER'}
              >
                {isLoading === 'TRAINER' ? 'Procesando...' : 
                 currentSubscription.planType === 'TRAINER' ? 'Plan Actual' : 'Comenzar Prueba Gratis'}
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Ver todos los planes */}
        <div className="text-center mt-8">
          <Button asChild variant="outline" size="lg">
            <Link href="/pricing">
              <Eye className="h-4 w-4 mr-2" />
              Ver Todos los Planes
            </Link>
          </Button>
        </div>
      </div>

      {/* Enterprise CTA */}
      <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white mobile-card">
        <CardContent className="mobile-spacing text-center mobile-gap-y">
          <Shield className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-6 text-gray-300" />
          <h3 className="responsive-title font-bold mb-4">¿Necesitas algo más potente?</h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto responsive-body">
            Nuestro plan Enterprise incluye clientes ilimitados, API completa, white label, 
            integraciones personalizadas y soporte dedicado.
          </p>
          <div className="flex flex-col sm:flex-row mobile-gap justify-center items-center">
            <div className="text-2xl md:text-3xl font-bold">$99.99<span className="text-base md:text-lg text-gray-300">/mes</span></div>
            <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-gray-100 mobile-button responsive-body">
              <Link href="/contact">
                Contactar Ventas
                <ExternalLink className="h-3 w-3 md:h-4 md:w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      {currentSubscription.stripeCustomerId && (
        <Card className="mobile-card">
          <CardHeader className="mobile-spacing-x">
            <CardTitle className="flex items-center mobile-gap responsive-subheading">
              <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
              Historial de Facturación
            </CardTitle>
            <CardDescription className="responsive-caption">
              Revisa tus pagos recientes y descargar facturas
            </CardDescription>
          </CardHeader>
          <CardContent className="mobile-spacing-x mobile-gap-y">
            {/* Mock billing history */}
            <div className="mobile-gap-y">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mobile-spacing border rounded-lg mobile-gap">
                <div className="flex items-center mobile-gap">
                  <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
                    <Check className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium responsive-body">Plan Pro - Enero 2024</p>
                    <p className="text-gray-600 responsive-caption">Pagado el 01 Enero 2024</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right">
                  <p className="font-semibold responsive-body">$19.99</p>
                  <Button variant="ghost" size="sm" className="mobile-button-sm responsive-caption">
                    <ExternalLink className="h-2 w-2 md:h-3 md:w-3 mr-1" />
                    Factura
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mobile-spacing border rounded-lg mobile-gap">
                <div className="flex items-center mobile-gap">
                  <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
                    <Check className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium responsive-body">Plan Pro - Diciembre 2023</p>
                    <p className="text-gray-600 responsive-caption">Pagado el 01 Diciembre 2023</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right">
                  <p className="font-semibold responsive-body">$19.99</p>
                  <Button variant="ghost" size="sm" className="mobile-button-sm responsive-caption">
                    <ExternalLink className="h-2 w-2 md:h-3 md:w-3 mr-1" />
                    Factura
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Button variant="outline" onClick={handleManageBilling} className="mobile-button responsive-body">
                Ver Todo el Historial
                <ExternalLink className="h-3 w-3 md:h-4 md:w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQ */}
      <Card className="mobile-card">
        <CardHeader className="mobile-spacing-x">
          <CardTitle className="responsive-subheading">Preguntas Frecuentes</CardTitle>
        </CardHeader>
        <CardContent className="mobile-spacing-x mobile-gap-y">
          <div className="mobile-gap-y">
            <div>
              <h4 className="font-semibold mb-2 responsive-body">¿Puedo cambiar de plan en cualquier momento?</h4>
              <p className="text-gray-600 responsive-caption">
                Sí, puedes actualizar o degradar tu plan cuando quieras. Los cambios se reflejarán 
                inmediatamente y ajustaremos la facturación proporcionalmente.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 responsive-body">¿Ofrecen descuentos anuales?</h4>
              <p className="text-gray-600 responsive-caption">
                Sí, ahorra 20% pagando anualmente. El descuento se aplica automáticamente al elegir 
                facturación anual durante el checkout.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 responsive-body">¿Qué incluye la prueba gratuita?</h4>
              <p className="text-gray-600 responsive-caption">
                Todas las funcionalidades del plan elegido durante 14 días. No se requiere tarjeta 
                de crédito para comenzar.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
