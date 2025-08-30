import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { withSecurity, createRequestValidator } from '@/middleware/security-middleware'
import { createUserSchema, type CreateUserInput } from '@/lib/validations'

async function registerHandler(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Advanced validation with security checks
    const validator = createRequestValidator()
    const validationResult = validator.validateJSON(body, createUserSchema)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { message: validationResult.error },
        { status: 400 }
      )
    }
    
    const { name, email, password, role } = validationResult.data as CreateUserInput

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Ya existe una cuenta con este email' },
        { status: 400 }
      )
    }

    // Hash de la contraseña
    const hashedPassword = await hash(password, 12)

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role.toUpperCase(),
        isVerified: true, // En producción, enviar email de verificación
      },
    })

    // Crear perfil según el rol
    if (role.toUpperCase() === 'CLIENT') {
      await prisma.clientProfile.create({
        data: {
          userId: user.id,
        },
      })
    } else if (role.toUpperCase() === 'TRAINER') {
      await prisma.trainerProfile.create({
        data: {
          userId: user.id,
          isActive: true,
          maxClients: 50,
        },
      })
    }

    // Crear suscripción gratuita por defecto
    await prisma.subscription.create({
      data: {
        userId: user.id,
        planType: 'FREE',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año gratis
      },
    })

    // No devolver la contraseña
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      { 
        message: 'Usuario creado exitosamente',
        user: userWithoutPassword 
      },
      { status: 201 }
    )

  } catch (error) {
    logger.auth('Registration error', error)
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Export the secured handler
export const POST = withSecurity(registerHandler, {
  rateLimiting: {
    enabled: true,
    requests: 5,
    window: 15 * 60 * 1000 // 15 minutes
  },
  csrf: {
    enabled: true,
    methods: ['POST']
  },
  validation: {
    enabled: true,
    maxBodySize: 1024 // 1KB for registration
  },
  logging: {
    enabled: true,
    logLevel: 'HIGH'
  }
})