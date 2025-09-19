/**
 * Secure Checkout Form Component
 * Implements comprehensive validation and security measures for payment processing
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { 
	CreditCard, 
	Shield, 
	Check, 
	Loader2, 
	Lock,
	AlertTriangle,
	Percent,
	X
} from 'lucide-react'
import { 
	checkoutFormSchema, 
	type CheckoutFormData,
	checkoutValidationUtils
} from '@/lib/validations/checkout'
import { PRICING_PLANS } from '@/lib/stripe'

interface SecureCheckoutFormProps {
	clientSecret: string
	planType: string
	returnUrl: string
	onSuccess?: () => void
	onError?: (error: string) => void
}

interface PromoCodeState {
	code: string
	isValid: boolean | null
	discount: number
	isLoading: boolean
	error: string | null
}

export function SecureCheckoutForm({
	clientSecret,
	planType,
	returnUrl,
	onSuccess,
	onError
}: SecureCheckoutFormProps) {
	const stripe = useStripe()
	const elements = useElements()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [promoCode, setPromoCode] = useState<PromoCodeState>({
		code: '',
		isValid: null,
		discount: 0,
		isLoading: false,
		error: null
	})

	const plan = PRICING_PLANS[planType as keyof typeof PRICING_PLANS]

	const form = useForm<CheckoutFormData>({
		resolver: zodResolver(checkoutFormSchema),
		defaultValues: {
			planType: planType as any,
			acceptTerms: false,
			acceptPrivacy: false,
			marketingEmails: false,
			confirmPurchase: false,
			promoCode: '',
			billingEmail: ''
		},
		mode: 'onChange'
	})

	const { handleSubmit, formState: { errors, isValid }, watch, setValue } = form

	// Watch for promo code changes
	const watchedPromoCode = watch('promoCode')

	// Validate promo code
	const validatePromoCode = useCallback(async (code: string) => {
		if (!code.trim()) {
			setPromoCode(prev => ({ ...prev, isValid: null, discount: 0, error: null }))
			return
		}

		setPromoCode(prev => ({ ...prev, isLoading: true, error: null }))

		try {
			// Validate format first
			const validation = checkoutValidationUtils.validatePromoCode(code)
			if (!validation.success) {
				setPromoCode(prev => ({
					...prev,
					isLoading: false,
					isValid: false,
					error: validation.error.errors[0]?.message || 'Invalid promo code format'
				}))
				return
			}

			// Check with backend
			const response = await fetch('/api/promo-codes/validate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code: code.toUpperCase(), planType })
			})

			const result = await response.json()

			if (response.ok && result.valid) {
				setPromoCode(prev => ({
					...prev,
					isLoading: false,
					isValid: true,
					discount: result.discount || 0,
					error: null
				}))
				toast.success(`Promo code applied! ${result.discount}% discount`)
			} else {
				setPromoCode(prev => ({
					...prev,
					isLoading: false,
					isValid: false,
					discount: 0,
					error: result.message || 'Invalid or expired promo code'
				}))
			}
		} catch (error) {
			console.error('Promo code validation error:', error)
			setPromoCode(prev => ({
				...prev,
				isLoading: false,
				isValid: false,
				error: 'Failed to validate promo code'
			}))
		}
	}, [planType])

	// Debounced promo code validation
	useEffect(() => {
		const timer = setTimeout(() => {
			if (watchedPromoCode !== promoCode.code) {
				setPromoCode(prev => ({ ...prev, code: watchedPromoCode || '' }))
				validatePromoCode(watchedPromoCode || '')
			}
		}, 500)

		return () => clearTimeout(timer)
	}, [watchedPromoCode, promoCode.code, validatePromoCode])

	// Calculate final price
	const calculateFinalPrice = () => {
		const basePrice = plan.price / 100
		if (promoCode.isValid && promoCode.discount > 0) {
			return basePrice * (1 - promoCode.discount / 100)
		}
		return basePrice
	}

	const onSubmit = async (data: CheckoutFormData) => {
		if (!stripe || !elements) {
			toast.error('Payment system not ready. Please try again.')
			return
		}

		setIsSubmitting(true)

		try {
			// Sanitize data
			const sanitizedData = checkoutValidationUtils.sanitizeCheckoutData(data)

			// Log checkout attempt (without sensitive data)
			console.log('Checkout attempt:', {
				planType: sanitizedData.planType,
				promoCode: sanitizedData.promoCode,
				marketingEmails: sanitizedData.marketingEmails,
				timestamp: new Date().toISOString()
			})

			// Confirm payment with Stripe
			const { error } = await stripe.confirmPayment({
				elements,
				confirmParams: {
					return_url: returnUrl,
					payment_method_data: {
						billing_details: {
							email: sanitizedData.billingEmail || undefined
						}
					}
				}
			})

			if (error) {
				const errorMessage = error.message || 'Payment failed. Please try again.'
				toast.error(errorMessage)
				onError?.(errorMessage)
				
				// Log error (without sensitive data)
				console.error('Payment error:', {
					type: error.type,
					code: error.code,
					message: error.message,
					timestamp: new Date().toISOString()
				})
			} else {
				// Payment successful
				toast.success('Payment successful! Redirecting...')
				onSuccess?.()
			}
		} catch (error) {
			console.error('Checkout error:', error)
			const errorMessage = 'An unexpected error occurred. Please try again.'
			toast.error(errorMessage)
			onError?.(errorMessage)
		} finally {
			setIsSubmitting(false)
		}
	}

	const removePromoCode = () => {
		setValue('promoCode', '')
		setPromoCode({
			code: '',
			isValid: null,
			discount: 0,
			isLoading: false,
			error: null
		})
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			{/* Security Badge */}
			<div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
				<Shield className="h-4 w-4 text-green-600" />
				<span className="text-sm text-green-800 font-medium">
					Secure payment processed by Stripe
				</span>
				<Lock className="h-4 w-4 text-green-600" />
			</div>

			{/* Plan Summary */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CreditCard className="h-5 w-5" />
						Plan Summary
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex justify-between items-center">
						<span className="font-medium">{plan.name} Plan</span>
						<div className="text-right">
							{promoCode.isValid && promoCode.discount > 0 && (
								<div className="text-sm text-gray-500 line-through">
									${(plan.price / 100).toFixed(2)}/month
								</div>
							)}
							<div className="font-bold text-lg">
								${calculateFinalPrice().toFixed(2)}/month
							</div>
						</div>
					</div>

					{promoCode.isValid && promoCode.discount > 0 && (
						<div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
							<div className="flex items-center gap-2">
								<Percent className="h-4 w-4 text-green-600" />
								<span className="text-sm text-green-800">
									Promo code applied: {promoCode.discount}% off
								</span>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={removePromoCode}
								className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
							>
								<X className="h-3 w-3" />
							</Button>
						</div>
					)}

					<Badge variant="secondary" className="bg-blue-100 text-blue-800">
						14 days free trial included
					</Badge>
				</CardContent>
			</Card>

			{/* Promo Code */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Promotional Code</CardTitle>
					<CardDescription>
						Have a promo code? Enter it below to get a discount.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<Label htmlFor="promoCode">Promo Code</Label>
						<div className="relative">
							<Input
								id="promoCode"
								{...form.register('promoCode')}
								placeholder="Enter promo code"
								className={`pr-10 ${
									promoCode.isValid === true ? 'border-green-500' :
									promoCode.isValid === false ? 'border-red-500' : ''
								}`}
								disabled={isSubmitting}
							/>
							{promoCode.isLoading && (
								<Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
							)}
							{promoCode.isValid === true && (
								<Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
							)}
							{promoCode.isValid === false && (
								<AlertTriangle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
							)}
						</div>
						{errors.promoCode && (
							<p className="text-sm text-red-600">{errors.promoCode.message}</p>
						)}
						{promoCode.error && (
							<p className="text-sm text-red-600">{promoCode.error}</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Payment Element */}
			<Card>
				<CardHeader>
					<CardTitle>Payment Information</CardTitle>
					<CardDescription>
						Enter your payment details securely
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{/* Billing Email */}
						<div className="space-y-2">
							<Label htmlFor="billingEmail">Billing Email (Optional)</Label>
							<Input
								id="billingEmail"
								{...form.register('billingEmail')}
								type="email"
								placeholder="billing@example.com"
								disabled={isSubmitting}
							/>
							{errors.billingEmail && (
								<p className="text-sm text-red-600">{errors.billingEmail.message}</p>
							)}
						</div>

						{/* Stripe Payment Element */}
						<div className="space-y-2">
							<Label>Payment Details</Label>
							<div className="border rounded-md p-3">
								<PaymentElement 
									options={{
										layout: 'tabs'
									}}
								/>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Terms and Conditions */}
			<Card>
				<CardHeader>
					<CardTitle>Terms and Conditions</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Accept Terms */}
					<div className="flex items-start space-x-2">
						<Checkbox
							id="acceptTerms"
							{...form.register('acceptTerms')}
							disabled={isSubmitting}
							className="mt-1"
						/>
						<div className="space-y-1">
							<Label htmlFor="acceptTerms" className="text-sm font-normal cursor-pointer">
								I accept the{' '}
								<a href="/terms" target="_blank" className="text-blue-600 hover:underline">
									Terms of Service
								</a>
							</Label>
							{errors.acceptTerms && (
								<p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
							)}
						</div>
					</div>

					{/* Accept Privacy */}
					<div className="flex items-start space-x-2">
						<Checkbox
							id="acceptPrivacy"
							{...form.register('acceptPrivacy')}
							disabled={isSubmitting}
							className="mt-1"
						/>
						<div className="space-y-1">
							<Label htmlFor="acceptPrivacy" className="text-sm font-normal cursor-pointer">
								I accept the{' '}
								<a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
									Privacy Policy
								</a>
							</Label>
							{errors.acceptPrivacy && (
								<p className="text-sm text-red-600">{errors.acceptPrivacy.message}</p>
							)}
						</div>
					</div>

					{/* Marketing Emails */}
					<div className="flex items-start space-x-2">
						<Checkbox
							id="marketingEmails"
							{...form.register('marketingEmails')}
							disabled={isSubmitting}
							className="mt-1"
						/>
						<Label htmlFor="marketingEmails" className="text-sm font-normal cursor-pointer">
							I would like to receive marketing emails and updates (optional)
						</Label>
					</div>

					{/* Confirm Purchase */}
					<div className="flex items-start space-x-2">
						<Checkbox
							id="confirmPurchase"
							{...form.register('confirmPurchase')}
							disabled={isSubmitting}
							className="mt-1"
						/>
						<div className="space-y-1">
							<Label htmlFor="confirmPurchase" className="text-sm font-normal cursor-pointer">
								I confirm that I want to purchase the {plan.name} plan for ${calculateFinalPrice().toFixed(2)}/month
							</Label>
							{errors.confirmPurchase && (
								<p className="text-sm text-red-600">{errors.confirmPurchase.message}</p>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Submit Button */}
			<div className="space-y-4">
				{!isValid && (
					<Alert>
						<AlertTriangle className="h-4 w-4" />
						<AlertDescription>
							Please complete all required fields and accept the terms to proceed.
						</AlertDescription>
					</Alert>
				)}

				<Button
					type="submit"
					disabled={!stripe || !elements || isSubmitting || !isValid}
					size="lg"
					className="w-full"
				>
					{isSubmitting ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Processing Payment...
						</>
					) : (
						<>
							<Lock className="mr-2 h-4 w-4" />
							Secure Payment - ${calculateFinalPrice().toFixed(2)}/month
						</>
					)}
				</Button>

				<div className="text-center text-sm text-gray-600">
					<div className="flex items-center justify-center gap-2">
						<Shield className="h-4 w-4" />
						Secured by Stripe • 256-bit SSL encryption
					</div>
					<p className="mt-1">
						Your payment information is encrypted and secure.
					</p>
				</div>
			</div>
		</form>
	)
}