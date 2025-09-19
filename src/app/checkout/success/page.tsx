'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
	CheckCircle, 
	Star, 
	ArrowRight, 
	Home,
	CreditCard,
	Calendar,
	Loader2
} from 'lucide-react'
import { logger } from '@/lib/logger'
import Link from 'next/link'
import { toast } from 'sonner'

function CheckoutSuccessPageContent() {
	const { data: session } = useSession()
    const searchParams = useSearchParams()
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(true)
	const [subscriptionData, setSubscriptionData] = useState<any>(null)

    const sessionId = searchParams?.get('session_id') || ''
    const paymentIntent = searchParams?.get('payment_intent') || ''

	useEffect(() => {
		if (!session) {
			router.push('/es/signin')
			return
		}

		// Verificar el estado del pago y actualizar la suscripción
		const verifyPayment = async () => {
			try {
				const response = await fetch('/api/stripe/verify-payment', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ 
						sessionId, 
						paymentIntent 
					})
				})

				if (response.ok) {
					const data = await response.json()
					setSubscriptionData(data)
					toast.success('¡Suscripción activada exitosamente!')
				} else {
					toast.error('Error al verificar el pago')
				}
			} catch (error) {
				logger.error('Error verifying payment:', error)
				toast.error('Error al verificar el pago')
			} finally {
				setIsLoading(false)
			}
		}

		verifyPayment()
	}, [session, sessionId, paymentIntent, router])

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center space-y-4">
					<Loader2 className="h-8 w-8 animate-spin mx-auto" />
					<p className="text-gray-600">Verificando tu pago...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
			<div className="max-w-4xl mx-auto px-4">
				{/* Success Header */}
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
						<CheckCircle className="h-8 w-8 text-green-600" />
					</div>
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						¡Bienvenido a Kairos Premium!
					</h1>
					<p className="text-gray-600 text-lg">
						Tu suscripción ha sido activada exitosamente
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Subscription Details */}
					<Card className="border-green-200">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Star className="h-5 w-5 text-yellow-500" />
								Detalles de tu Suscripción
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex justify-between items-center">
								<span className="text-gray-600">Plan:</span>
								<Badge variant="secondary" className="bg-green-100 text-green-800">
									{subscriptionData?.planType || 'Premium'}
								</Badge>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-gray-600">Estado:</span>
								<Badge className="bg-green-600">
									Activo
								</Badge>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-gray-600">Prueba gratis hasta:</span>
								<span className="font-medium">
									{subscriptionData?.trialEnd || 'En 14 días'}
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-gray-600">Próxima facturación:</span>
								<span className="font-medium">
									{subscriptionData?.nextBilling || 'Después de la prueba'}
								</span>
							</div>
						</CardContent>
					</Card>

					{/* Next Steps */}
					<Card>
						<CardHeader>
							<CardTitle>¿Qué sigue?</CardTitle>
							<CardDescription>
								Comienza a aprovechar al máximo tu suscripción
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-3">
								<div className="flex items-start gap-3">
									<div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
										<span className="text-xs font-semibold text-blue-600">1</span>
									</div>
									<div>
										<h4 className="font-medium">Explora tu Dashboard</h4>
										<p className="text-sm text-gray-600">Descubre todas las nuevas funcionalidades disponibles</p>
									</div>
								</div>

								<div className="flex items-start gap-3">
									<div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
										<span className="text-xs font-semibold text-blue-600">2</span>
									</div>
									<div>
										<h4 className="font-medium">Crea tu primera rutina premium</h4>
										<p className="text-sm text-gray-600">Accede a ejercicios avanzados y análisis detallados</p>
									</div>
								</div>

								<div className="flex items-start gap-3">
									<div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
										<span className="text-xs font-semibold text-blue-600">3</span>
									</div>
									<div>
										<h4 className="font-medium">Configura tus preferencias</h4>
										<p className="text-sm text-gray-600">Personaliza tu experiencia en la configuración</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Action Buttons */}
				<div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
					<Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
						<Link href="/dashboard">
							<Home className="h-4 w-4 mr-2" />
							Ir al Dashboard
						</Link>
					</Button>

					<Button asChild variant="outline" size="lg">
						<Link href="/dashboard/billing">
							<CreditCard className="h-4 w-4 mr-2" />
							Gestionar Suscripción
						</Link>
					</Button>

					<Button asChild variant="outline" size="lg">
						<Link href="/dashboard/workouts/new">
							<ArrowRight className="h-4 w-4 mr-2" />
							Crear Rutina
						</Link>
					</Button>
				</div>

				{/* Support Info */}
				<Card className="mt-8 bg-blue-50 border-blue-200">
					<CardContent className="pt-6">
						<div className="text-center space-y-2">
							<h3 className="font-semibold text-blue-900">¿Necesitas ayuda?</h3>
							<p className="text-blue-700 text-sm">
								Nuestro equipo de soporte está disponible 24/7 para ayudarte.
								Contáctanos en{' '}
								<a href="mailto:support@kairosfit.com" className="underline font-medium">
									support@kairosfit.com
								</a>
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

export default function CheckoutSuccessPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center space-y-4">
					<Loader2 className="h-8 w-8 animate-spin mx-auto" />
					<p className="text-gray-600">Verificando pago...</p>
				</div>
			</div>
		}>
			<CheckoutSuccessPageContent />
		</Suspense>
	)
}
