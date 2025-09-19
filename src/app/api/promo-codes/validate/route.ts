import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkoutValidationUtils } from '@/lib/validations/checkout'
import { z } from 'zod'

// Validation schema for the request
const validatePromoCodeSchema = z.object({
	code: z.string().min(1, 'Promo code is required'),
	planType: z.enum(['FREE', 'BASIC', 'PRO', 'TRAINER', 'ENTERPRISE'])
})

// Mock promo codes for demonstration
// In production, this would come from a database
const MOCK_PROMO_CODES = {
	'WELCOME10': {
		code: 'WELCOME10',
		discountPercent: 10,
		validPlans: ['BASIC', 'PRO', 'TRAINER', 'ENTERPRISE'],
		validUntil: new Date('2024-12-31'),
		maxUses: 1000,
		currentUses: 45,
		isActive: true
	},
	'SAVE20': {
		code: 'SAVE20',
		discountPercent: 20,
		validPlans: ['PRO', 'TRAINER', 'ENTERPRISE'],
		validUntil: new Date('2024-11-30'),
		maxUses: 500,
		currentUses: 123,
		isActive: true
	},
	'TRAINER50': {
		code: 'TRAINER50',
		discountPercent: 50,
		validPlans: ['TRAINER'],
		validUntil: new Date('2024-12-15'),
		maxUses: 100,
		currentUses: 67,
		isActive: true
	},
	'EXPIRED': {
		code: 'EXPIRED',
		discountPercent: 25,
		validPlans: ['BASIC', 'PRO'],
		validUntil: new Date('2024-01-01'),
		maxUses: 200,
		currentUses: 200,
		isActive: false
	}
}

export async function POST(req: NextRequest) {
	try {
		// Check authentication
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json(
				{ error: 'Unauthorized', valid: false },
				{ status: 401 }
			)
		}

		// Parse and validate request body
		const body = await req.json()
		const validation = validatePromoCodeSchema.safeParse(body)

		if (!validation.success) {
			return NextResponse.json(
				{
					error: 'Invalid request data',
					valid: false,
					details: validation.error.errors
				},
				{ status: 400 }
			)
		}

		const { code, planType } = validation.data

		// Validate promo code format
		const codeValidation = checkoutValidationUtils.validatePromoCode(code)
		if (!codeValidation.success) {
			return NextResponse.json(
				{
					error: 'Invalid promo code format',
					valid: false,
					message: codeValidation.error.errors[0]?.message || 'Invalid format'
				},
				{ status: 400 }
			)
		}

		// Normalize code to uppercase
		const normalizedCode = code.toUpperCase().trim()

		// Check if promo code exists
		const promoCode = MOCK_PROMO_CODES[normalizedCode as keyof typeof MOCK_PROMO_CODES]

		if (!promoCode) {
			return NextResponse.json(
				{
					valid: false,
					message: 'Promo code not found'
				},
				{ status: 200 }
			)
		}

		// Check if promo code is active
		if (!promoCode.isActive) {
			return NextResponse.json(
				{
					valid: false,
					message: 'This promo code is no longer active'
				},
				{ status: 200 }
			)
		}

		// Check if promo code has expired
		if (new Date() > promoCode.validUntil) {
			return NextResponse.json(
				{
					valid: false,
					message: 'This promo code has expired'
				},
				{ status: 200 }
			)
		}

		// Check if promo code has reached max uses
		if (promoCode.currentUses >= promoCode.maxUses) {
			return NextResponse.json(
				{
					valid: false,
					message: 'This promo code has reached its usage limit'
				},
				{ status: 200 }
			)
		}

		// Check if promo code is valid for the selected plan
		if (!promoCode.validPlans.includes(planType)) {
			return NextResponse.json(
				{
					valid: false,
					message: `This promo code is not valid for the ${planType} plan`
				},
				{ status: 200 }
			)
		}

		// Promo code is valid
		return NextResponse.json(
			{
				valid: true,
				code: promoCode.code,
				discount: promoCode.discountPercent,
				message: `${promoCode.discountPercent}% discount applied!`
			},
			{ status: 200 }
		)

	} catch (error) {
		console.error('Promo code validation error:', error)
		return NextResponse.json(
			{
				error: 'Internal server error',
				valid: false,
				message: 'Failed to validate promo code'
			},
			{ status: 500 }
		)
	}
}

// GET endpoint to list available promo codes (for admin/testing)
export async function GET(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			)
		}

		// Only return active promo codes without sensitive data
		const activePromoCodes = Object.values(MOCK_PROMO_CODES)
			.filter(promo => promo.isActive && new Date() <= promo.validUntil)
			.map(promo => ({
				code: promo.code,
				discountPercent: promo.discountPercent,
				validPlans: promo.validPlans,
				validUntil: promo.validUntil.toISOString(),
				usageRemaining: promo.maxUses - promo.currentUses
			}))

		return NextResponse.json(
			{
				promoCodes: activePromoCodes,
				count: activePromoCodes.length
			},
			{ status: 200 }
		)

	} catch (error) {
		console.error('Get promo codes error:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}