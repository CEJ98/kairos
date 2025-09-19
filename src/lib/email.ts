/**
 * Email Service
 * Servicio para envío de emails transaccionales
 */

import { logger } from './logger'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

// Configuración de email (usar Resend, SendGrid, o Nodemailer)
const EMAIL_CONFIG = {
  from: process.env.SMTP_FROM || 'noreply@kairosfit.com',
  apiKey: process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY,
  service: process.env.EMAIL_SERVICE || 'resend' // 'resend', 'sendgrid', 'nodemailer'
}

async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  try {
    // En desarrollo, solo loggear el email
    if (process.env.NODE_ENV === 'development') {
      logger.info(`📧 EMAIL SENT (DEV MODE)`, {
        to,
        subject,
        preview: html.substring(0, 200) + '...'
      })
      return true
    }

    // Implementación real según el servicio configurado
    switch (EMAIL_CONFIG.service) {
      case 'resend':
        return await sendWithResend({ to, subject, html, text })
      case 'sendgrid':
        return await sendWithSendGrid({ to, subject, html, text })
      default:
        return await sendWithNodemailer({ to, subject, html, text })
    }
  } catch (error) {
    logger.error('Email sending failed:', error)
    return false
  }
}

async function sendWithResend({ to, subject, html }: EmailOptions): Promise<boolean> {
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(EMAIL_CONFIG.apiKey)

    const data = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: [to],
      subject,
      html
    })

    logger.info('Email sent with Resend:', { id: data.data?.id, to })
    return true
  } catch (error) {
    logger.error('Resend email error:', error)
    return false
  }
}

async function sendWithSendGrid({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  try {
    const sgMail = await import('@sendgrid/mail')
    sgMail.default.setApiKey(EMAIL_CONFIG.apiKey!)

    const msg = {
      to,
      from: EMAIL_CONFIG.from,
      subject,
      text: text || '',
      html
    }

    await sgMail.default.send(msg)
    logger.info('Email sent with SendGrid:', { to })
    return true
  } catch (error) {
    logger.error('SendGrid email error:', error)
    return false
  }
}

async function sendWithNodemailer({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  try {
    const nodemailer = await import('nodemailer')
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    })

    await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to,
      subject,
      text,
      html
    })

    logger.info('Email sent with Nodemailer:', { to })
    return true
  } catch (error) {
    logger.error('Nodemailer email error:', error)
    return false
  }
}

// Templates de email específicos
export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Recuperar Contraseña - Kairos Fitness</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 20px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        .security-note { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0; color: #856404; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏋️‍♂️ Kairos Fitness</h1>
        </div>
        <div class="content">
          <h2>Recuperar tu contraseña</h2>
          <p>Hola,</p>
          <p>Recibimos una solicitud para restablecer tu contraseña. Si no fuiste tú, puedes ignorar este email.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
          </div>
          
          <p>O copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
          
          <div class="security-note">
            <strong>⚠️ Nota de seguridad:</strong>
            <ul style="margin: 10px 0;">
              <li>Este enlace expira en <strong>1 hora</strong></li>
              <li>Solo funciona una vez</li>
              <li>Si no solicitaste esto, revisa la seguridad de tu cuenta</li>
            </ul>
          </div>
          
          <p>¿Necesitas ayuda? Responde a este email o contacta nuestro soporte.</p>
          
          <p>Saludos,<br><strong>El equipo de Kairos Fitness</strong></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Kairos Fitness. Todos los derechos reservados.</p>
          <p>Miami, FL • <a href="${process.env.NEXTAUTH_URL}">kairosfit.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
    Kairos Fitness - Recuperar Contraseña
    
    Hola,
    
    Recibimos una solicitud para restablecer tu contraseña.
    
    Para crear una nueva contraseña, visita: ${resetUrl}
    
    Este enlace expira en 1 hora y solo funciona una vez.
    
    Si no solicitaste esto, puedes ignorar este email.
    
    Saludos,
    El equipo de Kairos Fitness
  `

  return await sendEmail({
    to: email,
    subject: '🔐 Restablecer tu contraseña - Kairos Fitness',
    html,
    text
  })
}

export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>¡Bienvenido a Kairos Fitness!</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 20px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .features { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
        .feature { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 6px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏋️‍♂️ ¡Bienvenido a Kairos!</h1>
        </div>
        <div class="content">
          <h2>¡Hola ${name}! 🎉</h2>
          <p>Te damos la bienvenida a <strong>Kairos Fitness</strong>, tu nueva plataforma para transformar tu entrenamiento.</p>
          
          <div class="features">
            <div class="feature">
              <h3>💪 Rutinas Personalizadas</h3>
              <p>Crea workouts únicos para tus objetivos</p>
            </div>
            <div class="feature">
              <h3>📊 Progreso Detallado</h3>
              <p>Trackea cada logro y mejora continua</p>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Comenzar mi Journey</a>
          </div>
          
          <h3>🚀 Próximos pasos:</h3>
          <ol>
            <li>Completa tu perfil fitness</li>
            <li>Crea tu primera rutina</li>
            <li>Invita a un amigo y entrenen juntos</li>
          </ol>
          
          <p>¿Tienes preguntas? Estamos aquí para ayudarte. Solo responde a este email.</p>
          
          <p>¡Vamos a hacer de este el mejor año fitness de tu vida! 💪</p>
          
          <p>Saludos,<br><strong>El equipo de Kairos Fitness</strong></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Kairos Fitness • Miami, FL</p>
          <p><a href="${process.env.NEXTAUTH_URL}">Ir a la app</a> • <a href="${process.env.NEXTAUTH_URL}/contact">Soporte</a></p>
        </div>
      </div>
    </body>
    </html>
  `

  return await sendEmail({
    to: email,
    subject: '🎉 ¡Bienvenido a Kairos Fitness!',
    html
  })
}

export { sendEmail }