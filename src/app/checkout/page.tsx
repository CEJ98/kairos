'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
	CreditCard, 
	Shield, 
	Check, 
	Loader2, 
	ArrowLeft,
	Lock,
	Star
} from 'lucide-react'
import Link from 'next/link'
import { PRICING_PLANS } from '@/lib/stripe'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutFormProps {
	clientSecret: string
	planType: string
	returnUrl: string
}

function CheckoutForm({ clientSecret, planType, returnUrl }: CheckoutFormProps) {
	const stripe = useStripe()
	const elements = useElements()
	const [isLoading, setIsLoading] = useState(false)
	const [message, setMessage] = useState('')
	const router = useRouter()

	const plan = PRICING_PLANS[planType as keyof typeof PRICING_PLANS]

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault()

		if (!stripe || !elements) {
			return
		}

		setIsLoading(true)

		const { error } = await stripe.confirmPayment({
			elements,
			confirmParams: {
				return_url: returnUrl,
			},
		})

		if (error) {
			if (error.type === 'card_error' || error.type === 'validation_error') {
				setMessage(error.message || 'Error en el pago')
				toast.error(error.message || 'Error en el pago')
			} else {
				setMessage('Error inesperado. Inténtalo de nuevo.')
				toast.error('Error inesperado. Inténtalo de nuevo.')
			}
		} else {
			// El pago fue exitoso, redirigir
			toast.success('¡Suscripción activada exitosamente!')
			router.push('/dashboard/billing?success=true')
		}

		setIsLoading(false)
	}

	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
			{/* Plan Summary */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Star className="h-5 w-5 text-yellow-500" />
						Plan {plan.name}
					</CardTitle>
					<CardDescription>
						Resumen de tu suscripción
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Pricing */}
					<div className="text-center space-y-2">
						<div className="text-3xl font-bold">
							${plan.price / 100}
							<span className="text-lg font-normal text-gray-600">/mes</span>
						</div>
						<Badge variant="secondary" className="bg-green-100 text-green-800">
							14 días de prueba gratis
						</Badge>
					</div>

					<Separator />

					{/* Features */}
					<div className="space-y-3">
						<h4 className="font-semibold">Incluye:</h4>
						<ul className="space-y-2">
							{plan.features.map((feature, index) => (
								<li key={index} className="flex items-start gap-2 text-sm">
									<Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
									<span>{feature}</span>
								</li>
							))}
						</ul>
					</div>

					<Separator />

					{/* Billing Info */}
					<div className="space-y-2 text-sm text-gray-600">
						<p>• Cancela en cualquier momento</p>
						<p>• Sin compromisos a largo plazo</p>
						<p>• Soporte 24/7 incluido</p>
					</div>
				</CardContent>
			</Card>

			{/* Payment Form */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CreditCard className="h-5 w-5" />
						Información de Pago
					</CardTitle>
					<CardDescription>
						Completa tu información de pago de forma segura
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Security Badge */}
						<div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
							<Shield className="h-4 w-4 text-green-600" />
							<span className="text-sm text-gray-700">
								Pago seguro procesado por Stripe
							</span>
							<Lock className="h-4 w-4 text-gray-500" />
						</div>

						{/* Payment Element */}
						<div className="space-y-4">
							<PaymentElement 
								options={{
									layout: 'tabs'
								}}
							/>
						</div>

						{/* Error Message */}
						{message && (
							<div className="p-3 bg-red-50 border border-red-200 rounded-lg">
								<p className="text-sm text-red-700">{message}</p>
							</div>
						)}

						{/* Submit Button */}
						<Button 
							type="submit" 
							disabled={!stripe || !elements || isLoading}
							size="lg"
							className="w-full"
						>
							{isLoading ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Procesando...
								</>
							) : (
								`Iniciar Prueba Gratis - $${plan.price / 100}/mes`
							)}
						</Button>

						{/* Terms */}
						<p className="text-xs text-gray-600 text-center">
							Al continuar, aceptas nuestros{' '}
							<Link href="/terms" className="underline hover:text-gray-900">
								Términos de Servicio
							</Link>{' '}
							y{' '}
							<Link href="/privacy" className="underline hover:text-gray-900">
								Política de Privacidad
							</Link>
						</p>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}

function CheckoutPageContent() {
	const { data: session } = useSession()
	const searchParams = useSearchParams()
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')

	const clientSecret = searchParams.get('client_secret')
	const planType = searchParams.get('plan') || 'BASIC'
	const returnUrl = `${window.location.origin}/dashboard/billing?success=true`

	useEffect(() => {
		if (!session) {
			router.push('/signin?callbackUrl=/checkout')
			return
		}

		if (!clientSecret) {
			setError('No se encontró información de pago válida')
			setIsLoading(false)
			return
		}

		setIsLoading(false)
	}, [session, clientSecret, router])

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center space-y-4">
					<Loader2 className="h-8 w-8 animate-spin mx-auto" />
					<p className="text-gray-600">Cargando información de pago...</p>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Card className="max-w-md mx-auto">
					<CardHeader>
						<CardTitle className="text-red-600">Error</CardTitle>
						<CardDescription>{error}</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild className="w-full">
							<Link href="/dashboard/billing">
								<ArrowLeft className="h-4 w-4 mr-2" />
								Volver a Facturación
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (!clientSecret) {
		return null
	}

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-6xl mx-auto px-4">
				{/* Header */}
				<div className="mb-8">
					<Link 
						href="/dashboard/billing" 
						className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
					>
						<ArrowLeft className="h-4 w-4" />
						Volver a Facturación
					</Link>
					<h1 className="text-3xl font-bold text-gray-900">Completar Suscripción</h1>
					<p className="text-gray-600 mt-2">
						Finaliza tu suscripción y comienza a disfrutar de todas las funcionalidades premium
					</p>
				</div>

				{/* Checkout Form */}
				<Elements 
					stripe={stripePromise} 
					options={{
						clientSecret,
						appearance: {
							theme: 'stripe',
							variables: {
								colorPrimary: '#0f172a',
								colorBackground: '#ffffff',
								colorText: '#1f2937',
								colorDanger: '#ef4444',
								fontFamily: 'Inter, system-ui, sans-serif',
								borderRadius: '8px'
							}
						}
					}}
				>
					<CheckoutForm 
						clientSecret={clientSecret} 
						planType={planType}
						returnUrl={returnUrl}
					/>
				</Elements>
			</div>
		</div>
	)
}

export default function CheckoutPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center space-y-4">
					<Loader2 className="h-8 w-8 animate-spin mx-auto" />
					<p className="text-gray-600">Cargando información de pago...</p>
				</div>
			</div>
		}>
			<CheckoutPageContent />
		</Suspense>
	)
}