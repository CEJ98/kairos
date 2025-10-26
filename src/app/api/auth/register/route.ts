import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/clients/prisma';
import { hashPassword } from '@/lib/auth/password';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const passwordHash = await hashPassword(validatedData.password);

    // Crear usuario con perfil inicial
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name || validatedData.email.split('@')[0],
        passwordHash,
        profile: {
          create: {
            progressionRule: 'VOLUME'
          }
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Usuario creado exitosamente',
        user
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

    console.error('Error en registro:', error);
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}
