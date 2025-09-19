import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const completeOnboardingSchema = z.object({
	fitnessLevel: z.string().optional(),
	goals: z.array(z.string()).optional(),
	preferences: z.object({
		workoutFrequency: z.number().min(1).max(7).optional(),
		sessionDuration: z.number().min(15).max(180).optional(),
		preferredTime: z.string().optional()
	}).optional(),
	age: z.number().min(13).max(120).optional(),
	weight: z.number().min(20).max(500).optional(),
	height: z.number().min(100).max(250).optional(),
	gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
	fitnessGoal: z.string().optional(),
	activityLevel: z.string().optional()
})

export async function POST(request: NextRequest) {
	try {
		// Verificar autenticación
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: 'No autorizado' },
				{ status: 401 }
			)
		}

		const body = await request.json()
		const validation = completeOnboardingSchema.safeParse(body)
		
		if (!validation.success) {
			return NextResponse.json(
				{ error: 'Datos inválidos', details: validation.error.errors },
				{ status: 400 }
			)
		}

		const data = validation.data
		const userId = session.user.id

		// Buscar o crear perfil de cliente
		let clientProfile = await prisma.clientProfile.findFirst({
			where: { userId }
		})

		if (!clientProfile) {
			// Crear nuevo perfil de cliente
			clientProfile = await prisma.clientProfile.create({
				data: {
					userId,
					age: data.age,
					weight: data.weight,
					height: data.height,
					gender: data.gender,
					fitnessGoal: data.fitnessGoal,
					activityLevel: data.activityLevel
				}
			})
		} else {
			// Actualizar perfil existente
			clientProfile = await prisma.clientProfile.update({
				where: { id: clientProfile.id },
				data: {
					age: data.age ?? clientProfile.age,
					weight: data.weight ?? clientProfile.weight,
					height: data.height ?? clientProfile.height,
					gender: data.gender ?? clientProfile.gender,
					fitnessGoal: data.fitnessGoal ?? clientProfile.fitnessGoal,
					activityLevel: data.activityLevel ?? clientProfile.activityLevel
				}
			})
		}

		// Marcar usuario como verificado si no lo está
		await prisma.user.update({
			where: { id: userId },
			data: { isVerified: true }
		})

		logger.info(`Onboarding completed for user: ${userId}`)

		return NextResponse.json({
			success: true,
			message: 'Onboarding completado exitosamente',
			profile: {
				...clientProfile,
				onboarding_completed: true,
				fitness_level: data.fitnessLevel,
				goals: data.goals,
				preferences: data.preferences
			}
		})

	} catch (error) {
		logger.error('Error completing onboarding:', error)
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		)
	}
}