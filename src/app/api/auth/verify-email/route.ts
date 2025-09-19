import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token es requerido'),
  email: z.string().email('Email inválido')
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const email = searchParams.get('email')

    // Validar parámetros
    const validation = verifyEmailSchema.safeParse({ token, email })
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { token: validToken, email: validEmail } = validation.data

    // Buscar usuario con el token de verificación
    const user = await prisma.user.findFirst({
      where: {
        email: validEmail.toLowerCase(),
        resetToken: validToken, // Usar resetToken para verificación
        isVerified: false // Solo usuarios no verificados
      }
    })

    if (!user) {
      logger.security(`Invalid email verification attempt: ${validEmail} with token: ${validToken}`)
      return NextResponse.json(
        { error: 'Token de verificación inválido o expirado' },
        { status: 400 }
      )
    }

    // Verificar si el token ha expirado (24 horas)
    const tokenAge = Date.now() - user.createdAt.getTime()
    const maxAge = 24 * 60 * 60 * 1000 // 24 horas en milisegundos
    
    if (tokenAge > maxAge) {
      logger.security(`Expired email verification token for: ${validEmail}`)
      return NextResponse.json(
        { error: 'Token de verificación expirado' },
        { status: 400 }
      )
    }

    // Verificar el email del usuario
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        resetToken: null // Limpiar el token
      }
    })

    logger.info(`Email verified successfully for user: ${validEmail}`)

    return NextResponse.json({
      success: true,
      message: 'Email verificado exitosamente'
    })

  } catch (error) {
    logger.error('Error verifying email:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = verifyEmailSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { token, email } = validation.data

    // Buscar usuario con el token de verificación
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        resetToken: token,
        isVerified: false
      }
    })

    if (!user) {
      logger.security(`Invalid email verification attempt via POST: ${email}`)
      return NextResponse.json(
        { error: 'Token de verificación inválido o expirado' },
        { status: 400 }
      )
    }

    // Verificar si el token ha expirado
    const tokenAge = Date.now() - user.createdAt.getTime()
    const maxAge = 24 * 60 * 60 * 1000
    
    if (tokenAge > maxAge) {
      logger.security(`Expired email verification token via POST for: ${email}`)
      return NextResponse.json(
        { error: 'Token de verificación expirado' },
        { status: 400 }
      )
    }

    // Verificar el email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        resetToken: null
      }
    })

    logger.info(`Email verified successfully via POST for user: ${email}`)

    return NextResponse.json({
      success: true,
      message: 'Email verificado exitosamente'
    })

  } catch (error) {
    logger.error('Error verifying email via POST:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}