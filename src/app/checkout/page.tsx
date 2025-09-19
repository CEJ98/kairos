'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { toast } from 'sonner'
import { 
	ArrowLeft,
	Star,
	Loader2
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PRICING_PLANS } from '@/lib/stripe'
import { SecureCheckoutForm } from '@/components/forms/SecureCheckoutForm'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutFormWrapperProps {
	clientSecret: string
	planType: string
	returnUrl: string
}

function CheckoutFormWrapper({ clientSecret, planType, returnUrl }: CheckoutFormWrapperProps) {
	const router = useRouter()
	const plan = PRICING_PLANS[planType as keyof typeof PRICING_PLANS]

    const handleSuccess = () => {
        toast.success('¡Suscripción activada exitosamente!')
        router.push('/dashboard/billing')
    }

	const handleError = (error: string) => {
		console.error('Checkout error:', error)
		toast.error(error)
	}

	return (
		<div className="max-w-4xl mx-auto">
			{/* Plan Header */}
			<div className="mb-8 text-center">
				<div className="flex items-center justify-center gap-2 mb-2">
					<Star className="h-6 w-6 text-yellow-500" />
					<h2 className="text-2xl font-bold text-gray-900">
						Plan {plan.name}
					</h2>
				</div>
				<p className="text-gray-600">
					Complete your subscription to unlock all premium features
				</p>
			</div>

			{/* Secure Checkout Form */}
			<SecureCheckoutForm
				clientSecret={clientSecret}
				planType={planType}
				returnUrl={returnUrl}
				onSuccess={handleSuccess}
				onError={handleError}
			/>
		</div>
	)
}

function CheckoutPageContent() {
	const { data: session } = useSession()
    const searchParams = useSearchParams()
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')

    const clientSecret = searchParams?.get('client_secret') || ''
    const planType = searchParams?.get('plan') || 'BASIC'
	const returnUrl = `${window.location.origin}/dashboard/billing?success=true`

    useEffect(() => {
        if (!session) {
            router.push('/es/signin')
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
					<CheckoutFormWrapper 
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
