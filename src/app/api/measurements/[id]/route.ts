import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

import { logger } from '@/lib/logger'
// GET /api/measurements/[id] - Obtener medición específica
export async function GET(
	req: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const params = await context.params
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		const measurement = await prisma.bodyMeasurement.findFirst({
			where: {
				id: params.id,
				userId: session.user.id
			}
		})

		if (!measurement) {
			return NextResponse.json(
				{ error: 'Medición no encontrada' },
				{ status: 404 }
			)
		}

		return NextResponse.json(measurement)

	} catch (error) {
		logger.error('Error fetching measurement:', error, 'API')
		return NextResponse.json(
			{ error: 'Error al obtener medición' },
			{ status: 500 }
		)
	}
}

// PUT /api/measurements/[id] - Actualizar medición
export async function PUT(
	req: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const params = await context.params
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		// Verificar que la medición existe y pertenece al usuario
		const existingMeasurement = await prisma.bodyMeasurement.findFirst({
			where: {
				id: params.id,
				userId: session.user.id
			}
		})

		if (!existingMeasurement) {
			return NextResponse.json(
				{ error: 'Medición no encontrada' },
				{ status: 404 }
			)
		}

		const body = await req.json()
		const {
			weight,
			bodyFat,
			muscle,
			chest,
			waist,
			hips,
			arms,
			thighs,
			measuredAt,
			notes
		} = body

		// Actualizar medición
		const updatedMeasurement = await prisma.bodyMeasurement.update({
			where: { id: params.id },
			data: {
				weight: weight !== undefined ? (weight ? parseFloat(weight) : null) : undefined,
				bodyFat: bodyFat !== undefined ? (bodyFat ? parseFloat(bodyFat) : null) : undefined,
				muscle: muscle !== undefined ? (muscle ? parseFloat(muscle) : null) : undefined,
				chest: chest !== undefined ? (chest ? parseFloat(chest) : null) : undefined,
				waist: waist !== undefined ? (waist ? parseFloat(waist) : null) : undefined,
				hips: hips !== undefined ? (hips ? parseFloat(hips) : null) : undefined,
				arms: arms !== undefined ? (arms ? parseFloat(arms) : null) : undefined,
				thighs: thighs !== undefined ? (thighs ? parseFloat(thighs) : null) : undefined,
				measuredAt: measuredAt ? new Date(measuredAt) : undefined,
				notes: notes !== undefined ? notes : undefined
			}
		})

		return NextResponse.json(updatedMeasurement)

	} catch (error) {
		logger.error('Error updating measurement:', error, 'API')
		return NextResponse.json(
			{ error: 'Error al actualizar medición' },
			{ status: 500 }
		)
	}
}

// DELETE /api/measurements/[id] - Eliminar medición
export async function DELETE(
	req: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const params = await context.params
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		// Verificar que la medición existe y pertenece al usuario
		const existingMeasurement = await prisma.bodyMeasurement.findFirst({
			where: {
				id: params.id,
				userId: session.user.id
			}
		})

		if (!existingMeasurement) {
			return NextResponse.json(
				{ error: 'Medición no encontrada' },
				{ status: 404 }
			)
		}

		// Eliminar medición
		await prisma.bodyMeasurement.delete({
			where: { id: params.id }
		})

		return NextResponse.json({ message: 'Medición eliminada correctamente' })

	} catch (error) {
		logger.error('Error deleting measurement:', error, 'API')
		return NextResponse.json(
			{ error: 'Error al eliminar medición' },
			{ status: 500 }
		)
	}
}