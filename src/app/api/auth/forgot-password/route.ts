import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import crypto from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      )
    }

    // Verificar si el usuario existe
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    // Por seguridad, siempre devolvemos éxito (para no revelar si el email existe)
    if (!user) {
      logger.security(`Password reset attempted for non-existent email: ${email}`)
      return NextResponse.json(
        { success: true, message: 'Si el email existe, se enviará un enlace de recuperación' }
      )
    }

    // Generar token de reset seguro
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    // Guardar token en la base de datos
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    })

    // Enviar email de recuperación
    try {
      await sendPasswordResetEmail(email, resetToken)
      logger.info(`Password reset email sent to: ${email}`)
    } catch (emailError) {
      logger.error('Failed to send password reset email:', emailError)
      // No revelamos el error del email al usuario
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Si el email existe, se enviará un enlace de recuperación en los próximos minutos' 
      }
    )

  } catch (error) {
    logger.error('Password reset request error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}