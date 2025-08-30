'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
	Check, 
	Star, 
	Zap, 
	Users, 
	BarChart3, 
	Shield,
	Crown,
	ArrowRight,
	Loader2
} from 'lucide-react'
import Link from 'next/link'
import { PRICING_PLANS } from '@/lib/stripe'
import { toast } from 'sonner'

interface PlanFeature {
	icon: any
	color: string
	bgColor: string
	borderColor: string
	buttonVariant: 'outline' | 'default'
	buttonText: string
	popular?: boolean
}

const PLAN_FEATURES: Record<string, PlanFeature> = {
	FREE: {
		icon: Shield,
		color: 'text-gray-600',
		bgColor: 'bg-gray-50',
		borderColor: 'border-gray-200',
		buttonVariant: 'outline' as const,
		buttonText: 'Plan Actual'
	},
	BASIC: {
		icon: Zap,
		color: 'text-blue-600',
		bgColor: 'bg-blue-50',
		borderColor: 'border-blue-200',
		buttonVariant: 'default' as const,
		buttonText: 'Comenzar Prueba Gratis'
	},
	PRO: {
		icon: Star,
		color: 'text-purple-600',
		bgColor: 'bg-purple-50',
		borderColor: 'border-purple-200',
		buttonVariant: 'default' as const,
		buttonText: 'Comenzar Prueba Gratis',
		popular: true
	},
	TRAINER: {
		icon: Users,
		color: 'text-green-600',
		bgColor: 'bg-green-50',
		borderColor: 'border-green-200',
		buttonVariant: 'default' as const,
		buttonText: 'Comenzar Prueba Gratis'
	},
	ENTERPRISE: {
		icon: Crown,
		color: 'text-yellow-600',
		bgColor: 'bg-yellow-50',
		borderColor: 'border-yellow-200',
		buttonVariant: 'default' as const,
		buttonText: 'Contactar Ventas'
	}
}

export default function PricingPage() {
	const { data: session } = useSession()
	const router = useRouter()
	const [isLoading, setIsLoading] = useState('')
	const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

	const handleSelectPlan = async (planType: string) => {
		if (!session) {
			router.push(`/signin?callbackUrl=/pricing`)
			return
		}

		if (planType === 'FREE') {
			router.push('/dashboard')
			return
		}

		if (planType === 'ENTERPRISE') {
			// Redirigir a contacto o calendly
			window.open('mailto:sales@kairosfit.com?subject=Enterprise Plan Inquiry', '_blank')
			return
		}

		setIsLoading(planType)
		
		try {
			const response = await fetch('/api/stripe/create-subscription', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					priceId: (PRICING_PLANS[planType as keyof typeof PRICING_PLANS] as any).stripeProductId || 'price_demo',
					trialDays: 14
				})
			})

			if (response.ok) {
				const { clientSecret } = await response.json()
				// Add loading state before redirect
				toast.success('Redirigiendo al checkout...')
				router.push(`/checkout?client_secret=${clientSecret}&plan=${planType}`)
			} else {
				const errorData = await response.json().catch(() => ({}))
				toast.error(errorData.message || 'Error al procesar la suscripción')
			}
		} catch (error) {
			console.error('Subscription error:', error)
			toast.error('Error al conectar con el servidor. Inténtalo de nuevo.')
		} finally {
			setIsLoading('')
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 sm:py-12">
			<div className="max-w-7xl mx-auto mobile-padding">
				{/* Header */}
				<div className="text-center mb-8 sm:mb-12">
					<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 text-balance">
						Elige el plan perfecto para ti
					</h1>
					<p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 text-balance">
						Comienza con 14 días gratis. Cancela en cualquier momento.
					</p>

					{/* Billing Toggle */}
					<div className="inline-flex items-center bg-white rounded-lg p-1 shadow-sm border" role="tablist" aria-label="Ciclo de facturación">
						<button
							onClick={() => setBillingCycle('monthly')}
							className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible touch-target ${
								billingCycle === 'monthly'
									? 'bg-blue-600 text-white'
									: 'text-gray-600 hover:text-gray-900'
							}`}
							role="tab"
							aria-selected={billingCycle === 'monthly'}
							aria-controls="pricing-content"
						>
							Mensual
						</button>
						<button
							onClick={() => setBillingCycle('yearly')}
							className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible touch-target ${
								billingCycle === 'yearly'
									? 'bg-blue-600 text-white'
									: 'text-gray-600 hover:text-gray-900'
							}`}
							role="tab"
							aria-selected={billingCycle === 'yearly'}
							aria-controls="pricing-content"
						>
							Anual
							<Badge className="ml-2 bg-green-100 text-green-800 text-xs">
								20% OFF
							</Badge>
						</button>
					</div>
				</div>

				{/* Pricing Cards */}
				<div id="pricing-content" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6" role="tabpanel" aria-live="polite">
					{Object.entries(PRICING_PLANS).map(([planKey, plan]) => {
						const planConfig = PLAN_FEATURES[planKey as keyof typeof PLAN_FEATURES]
						const Icon = planConfig.icon
						const price = billingCycle === 'yearly' ? plan.price * 10 : plan.price // 20% discount for yearly
						const originalPrice = billingCycle === 'yearly' ? plan.price * 12 : null

						return (
							<Card 
								key={planKey}
								className={`relative transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
									planConfig.popular 
										? 'ring-2 ring-purple-500 sm:scale-105' 
										: planConfig.borderColor
								}`}
								role="article"
								aria-labelledby={`plan-${planKey}-title`}
							>
								{planConfig.popular && (
									<div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
										<Badge className="bg-purple-600 text-white px-3 py-1 text-xs sm:text-sm">
											Más Popular
										</Badge>
									</div>
								)}

								<CardHeader className={`text-center ${planConfig.bgColor} p-4 sm:p-6`}>
									<div className="flex justify-center mb-3 sm:mb-4">
										<div className={`p-2 sm:p-3 rounded-full bg-white shadow-sm`}>
											<Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${planConfig.color}`} aria-hidden="true" />
										</div>
									</div>
									<CardTitle id={`plan-${planKey}-title`} className="text-lg sm:text-xl font-bold">
										{plan.name}
									</CardTitle>
									<div className="space-y-1 sm:space-y-2">
										<div className="text-3xl font-bold">
											{planKey === 'FREE' ? (
												'Gratis'
											) : (
												<>
													${price / 100}
													<span className="text-lg font-normal text-gray-600">
														/{billingCycle === 'yearly' ? 'año' : 'mes'}
													</span>
												</>
											)}
										</div>
										{billingCycle === 'yearly' && originalPrice && (
											<div className="text-sm text-gray-500">
												<span className="line-through">${originalPrice / 100}/año</span>
												<span className="ml-2 text-green-600 font-medium">
													Ahorra ${(originalPrice - price) / 100}
												</span>
											</div>
										)}
									</div>
								</CardHeader>

								<CardContent className="space-y-6">
									{/* Features */}
									<ul className="space-y-3">
										{plan.features.map((feature, index) => (
											<li key={index} className="flex items-start gap-2 text-sm">
												<Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
												<span>{feature}</span>
											</li>
										))}
									</ul>

									{/* Limits */}
									<div className="pt-4 border-t border-gray-200">
										<div className="space-y-2 text-xs text-gray-600">
											<div className="flex justify-between">
												<span>Rutinas:</span>
												<span className="font-medium">
													{plan.limits.workouts === -1 ? 'Ilimitadas' : plan.limits.workouts}
												</span>
											</div>
											{plan.limits.clients > 0 && (
												<div className="flex justify-between">
													<span>Clientes:</span>
													<span className="font-medium">
														{plan.limits.clients === -1 ? 'Ilimitados' : plan.limits.clients}
													</span>
												</div>
											)}
											<div className="flex justify-between">
												<span>Almacenamiento:</span>
												<span className="font-medium">{plan.limits.storage}</span>
											</div>
										</div>
									</div>

									{/* CTA Button */}
									<Button 
										onClick={() => handleSelectPlan(planKey)}
										disabled={isLoading === planKey}
										variant={planConfig.buttonVariant}
										size="lg"
										className={`w-full ${
											planConfig.popular 
												? 'bg-purple-600 hover:bg-purple-700 text-white' 
												: ''
										}`}
									>
										{isLoading === planKey ? (
											<>
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
												Cargando...
											</>
										) : (
											<>
												{planConfig.buttonText}
												{planKey !== 'FREE' && planKey !== 'ENTERPRISE' && (
													<ArrowRight className="h-4 w-4 ml-2" />
												)}
											</>
										)}
									</Button>
								</CardContent>
							</Card>
						)
					})}
				</div>

				{/* FAQ Section */}
				<div className="mt-16">
					<h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
						Preguntas Frecuentes
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
						<div className="space-y-4">
							<div>
								<h3 className="font-semibold text-gray-900 mb-2">
									¿Puedo cambiar de plan en cualquier momento?
								</h3>
								<p className="text-gray-600 text-sm">
									Sí, puedes actualizar o degradar tu plan en cualquier momento desde tu panel de facturación.
								</p>
							</div>
							<div>
								<h3 className="font-semibold text-gray-900 mb-2">
									¿Qué incluye la prueba gratis?
								</h3>
								<p className="text-gray-600 text-sm">
									Acceso completo a todas las funcionalidades del plan elegido durante 14 días, sin restricciones.
								</p>
							</div>
						</div>
						<div className="space-y-4">
							<div>
								<h3 className="font-semibold text-gray-900 mb-2">
									¿Cómo funciona la facturación?
								</h3>
								<p className="text-gray-600 text-sm">
									La facturación es automática y se procesa de forma segura a través de Stripe. Recibirás un recibo por email.
								</p>
							</div>
							<div>
								<h3 className="font-semibold text-gray-900 mb-2">
									¿Ofrecen reembolsos?
								</h3>
								<p className="text-gray-600 text-sm">
									Ofrecemos reembolso completo dentro de los primeros 30 días si no estás satisfecho.
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* CTA Section */}
				<div className="mt-16 text-center">
					<div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
						<h2 className="text-2xl font-bold text-gray-900 mb-4">
							¿Listo para transformar tu fitness?
						</h2>
						<p className="text-gray-600 mb-6">
							Únete a miles de usuarios que ya están alcanzando sus objetivos con Kairos.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Button 
								onClick={() => handleSelectPlan('PRO')}
								size="lg"
								className="bg-purple-600 hover:bg-purple-700"
							>
								Comenzar Prueba Gratis
								<ArrowRight className="h-4 w-4 ml-2" />
							</Button>
							<Button asChild variant="outline" size="lg">
								<Link href="/contact">
									Contactar Ventas
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}