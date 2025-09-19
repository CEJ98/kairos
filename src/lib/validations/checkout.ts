/**
 * Checkout and Payment Validation Schemas
 * Comprehensive validation for secure payment processing
 */

import { z } from 'zod'

// =================== CHECKOUT VALIDATIONS ===================

export const planTypeSchema = z.enum(['FREE', 'BASIC', 'PRO', 'TRAINER', 'ENTERPRISE'], {
	errorMap: () => ({ message: 'Plan type is required and must be valid' })
})

export const checkoutFormSchema = z.object({
	// Plan selection
	planType: planTypeSchema,
	
	// User agreement
	acceptTerms: z.boolean({
		required_error: 'You must accept the terms and conditions'
	}).refine(val => val === true, {
		message: 'You must accept the terms and conditions to proceed'
	}),
	
	acceptPrivacy: z.boolean({
		required_error: 'You must accept the privacy policy'
	}).refine(val => val === true, {
		message: 'You must accept the privacy policy to proceed'
	}),
	
	// Optional promotional code
	promoCode: z.string()
		.max(50, 'Promotional code is too long')
		.regex(/^[A-Z0-9_-]*$/i, 'Invalid promotional code format')
		.optional(),
	
	// Billing information (optional for Stripe Elements)
	billingEmail: z.string()
		.email('Invalid email format')
		.max(255, 'Email is too long')
		.optional(),
	
	// Marketing preferences
	marketingEmails: z.boolean().default(false),
	
	// Security confirmation
	confirmPurchase: z.boolean({
		required_error: 'You must confirm your purchase'
	}).refine(val => val === true, {
		message: 'Please confirm your purchase to proceed'
	})
})

// =================== PAYMENT INTENT VALIDATIONS ===================

export const paymentIntentSchema = z.object({
	paymentIntentId: z.string()
		.min(1, 'Payment intent ID is required')
		.regex(/^pi_[a-zA-Z0-9_]+$/, 'Invalid payment intent ID format'),
	
	clientSecret: z.string()
		.min(1, 'Client secret is required')
		.regex(/^pi_[a-zA-Z0-9_]+_secret_[a-zA-Z0-9_]+$/, 'Invalid client secret format')
})

export const checkoutSessionSchema = z.object({
	sessionId: z.string()
		.min(1, 'Session ID is required')
		.regex(/^cs_[a-zA-Z0-9_]+$/, 'Invalid checkout session ID format'),
	
	successUrl: z.string()
		.url('Invalid success URL')
		.max(2048, 'Success URL is too long'),
	
	cancelUrl: z.string()
		.url('Invalid cancel URL')
		.max(2048, 'Cancel URL is too long')
})

// =================== SUBSCRIPTION VALIDATIONS ===================

export const subscriptionCreateSchema = z.object({
	planType: planTypeSchema,
	
	stripeCustomerId: z.string()
		.regex(/^cus_[a-zA-Z0-9_]+$/, 'Invalid Stripe customer ID')
		.optional(),
	
	trialDays: z.number()
		.int('Trial days must be an integer')
		.min(0, 'Trial days cannot be negative')
		.max(365, 'Trial period cannot exceed 365 days')
		.default(14),
	
	promoCode: z.string()
		.max(50, 'Promotional code is too long')
		.regex(/^[A-Z0-9_-]*$/i, 'Invalid promotional code format')
		.optional(),
	
	metadata: z.record(z.string(), z.string())
		.optional()
})

export const subscriptionUpdateSchema = z.object({
	subscriptionId: z.string()
		.regex(/^sub_[a-zA-Z0-9_]+$/, 'Invalid subscription ID'),
	
	newPlanType: planTypeSchema.optional(),
	
	prorateBilling: z.boolean().default(true),
	
	effectiveDate: z.date().optional()
})

// =================== BILLING VALIDATIONS ===================

export const billingAddressSchema = z.object({
	line1: z.string()
		.min(1, 'Address line 1 is required')
		.max(200, 'Address line 1 is too long')
		.trim(),
	
	line2: z.string()
		.max(200, 'Address line 2 is too long')
		.trim()
		.optional(),
	
	city: z.string()
		.min(1, 'City is required')
		.max(100, 'City name is too long')
		.trim(),
	
	state: z.string()
		.min(1, 'State/Province is required')
		.max(100, 'State/Province is too long')
		.trim(),
	
	postalCode: z.string()
		.min(1, 'Postal code is required')
		.max(20, 'Postal code is too long')
		.regex(/^[A-Z0-9\s-]+$/i, 'Invalid postal code format')
		.trim(),
	
	country: z.string()
		.length(2, 'Country code must be 2 characters')
		.regex(/^[A-Z]{2}$/, 'Invalid country code format')
		.toUpperCase()
})

// =================== WEBHOOK VALIDATIONS ===================

export const stripeWebhookSchema = z.object({
	id: z.string().min(1, 'Event ID is required'),
	type: z.string().min(1, 'Event type is required'),
	data: z.object({
		object: z.record(z.any())
	}),
	created: z.number().int().positive('Invalid timestamp'),
	livemode: z.boolean()
})

// =================== PROMO CODE VALIDATIONS ===================

export const promoCodeInputSchema = z.object({
	code: z.string()
		.min(3, 'Promo code must be at least 3 characters')
		.max(50, 'Promo code is too long')
		.regex(/^[A-Z0-9_-]+$/i, 'Promo code can only contain letters, numbers, hyphens, and underscores')
		.toUpperCase()
		.trim()
})

export const promoCodeSchema = z.object({
	code: z.string()
		.min(3, 'Promo code must be at least 3 characters')
		.max(50, 'Promo code is too long')
		.regex(/^[A-Z0-9_-]+$/i, 'Promo code can only contain letters, numbers, hyphens, and underscores')
		.toUpperCase()
		.trim(),
	
	discountPercent: z.number()
		.min(1, 'Discount must be at least 1%')
		.max(100, 'Discount cannot exceed 100%')
		.optional(),
	
	discountAmount: z.number()
		.min(1, 'Discount amount must be positive')
		.optional(),
	
	validFrom: z.date(),
	validUntil: z.date(),
	
	maxUses: z.number()
		.int('Max uses must be an integer')
		.min(1, 'Max uses must be at least 1')
		.optional(),
	
	currentUses: z.number()
		.int('Current uses must be an integer')
		.min(0, 'Current uses cannot be negative')
		.default(0)
}).refine(data => {
	// Ensure valid date range
	return data.validFrom < data.validUntil
}, {
	message: 'Valid from date must be before valid until date',
	path: ['validUntil']
}).refine(data => {
	// Ensure either discount percent or amount is provided
	return data.discountPercent !== undefined || data.discountAmount !== undefined
}, {
	message: 'Either discount percentage or discount amount must be specified',
	path: ['discountPercent']
})

// =================== TYPE EXPORTS ===================

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>
export type PaymentIntentData = z.infer<typeof paymentIntentSchema>
export type CheckoutSessionData = z.infer<typeof checkoutSessionSchema>
export type SubscriptionCreateData = z.infer<typeof subscriptionCreateSchema>
export type SubscriptionUpdateData = z.infer<typeof subscriptionUpdateSchema>
export type BillingAddressData = z.infer<typeof billingAddressSchema>
export type StripeWebhookData = z.infer<typeof stripeWebhookSchema>
export type PromoCodeData = z.infer<typeof promoCodeSchema>

// =================== VALIDATION UTILITIES ===================

export const checkoutValidationUtils = {
	/**
	 * Validate checkout form data
	 */
	validateCheckoutForm: (data: unknown) => {
		return checkoutFormSchema.safeParse(data)
	},
	
	/**
	 * Validate payment intent data
	 */
	validatePaymentIntent: (data: unknown) => {
		return paymentIntentSchema.safeParse(data)
	},
	
	/**
	 * Validate subscription creation data
	 */
	validateSubscriptionCreate: (data: unknown) => {
		return subscriptionCreateSchema.safeParse(data)
	},
	
	/**
	 * Validate promo code
	 */
	validatePromoCode: (code: string) => {
		return promoCodeInputSchema.safeParse({ code })
	},
	
	/**
	 * Sanitize checkout form data
	 */
	sanitizeCheckoutData: (data: CheckoutFormData): CheckoutFormData => {
		return {
			...data,
			promoCode: data.promoCode?.trim().toUpperCase(),
			billingEmail: data.billingEmail?.trim().toLowerCase()
		}
	}
}