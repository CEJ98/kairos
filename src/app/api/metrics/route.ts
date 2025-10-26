import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/clients/prisma';
import { z } from 'zod';

const bodyMetricSchema = z.object({
  date: z.string().datetime().optional(),
  weightKg: z.number().positive().optional(),
  bodyFat: z.number().min(0).max(100).optional(),
  neckCm: z.number().positive().optional(),
  waistCm: z.number().positive().optional(),
  hipCm: z.number().positive().optional()
});

/**
 * GET /api/metrics
 * Obtiene las métricas corporales del usuario autenticado
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '30');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Obtener métricas del usuario
    const metrics = await prisma.bodyMetric.findMany({
      where: { userId: session.user.id },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        date: true,
        weightKg: true,
        bodyFat: true,
        neckCm: true,
        waistCm: true,
        hipCm: true,
        createdAt: true
      }
    });

    const total = await prisma.bodyMetric.count({
      where: { userId: session.user.id }
    });

    return NextResponse.json({
      success: true,
      data: metrics,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Error obteniendo métricas:', error);
    return NextResponse.json(
      { error: 'Error al obtener métricas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/metrics
 * Crea una nueva métrica corporal para el usuario autenticado
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = bodyMetricSchema.parse(body);

    // Validar que al menos una métrica esté presente
    if (!validatedData.weightKg && !validatedData.bodyFat &&
        !validatedData.neckCm && !validatedData.waistCm && !validatedData.hipCm) {
      return NextResponse.json(
        { error: 'Debe proporcionar al menos una métrica' },
        { status: 400 }
      );
    }

    // Crear métrica
    const metric = await prisma.bodyMetric.create({
      data: {
        userId: session.user.id,
        date: validatedData.date ? new Date(validatedData.date) : new Date(),
        weightKg: validatedData.weightKg,
        bodyFat: validatedData.bodyFat,
        neckCm: validatedData.neckCm,
        waistCm: validatedData.waistCm,
        hipCm: validatedData.hipCm
      },
      select: {
        id: true,
        date: true,
        weightKg: true,
        bodyFat: true,
        neckCm: true,
        waistCm: true,
        hipCm: true,
        createdAt: true
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Métrica creada exitosamente',
        data: metric
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creando métrica:', error);
    return NextResponse.json(
      { error: 'Error al crear métrica' },
      { status: 500 }
    );
  }
}
