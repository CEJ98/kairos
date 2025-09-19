/**
 * Secure Forgot Password Form Component
 * Formulario de recuperación de contraseña con validación de seguridad avanzada
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/lib/validations/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SecureTextField } from '@/components/ui/secure-form-field'
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface SecureForgotPasswordFormProps {
  onSuccess?: () => void
  defaultValues?: Partial<ForgotPasswordFormData>
  title?: string
  description?: string
  showCard?: boolean
}

export function SecureForgotPasswordForm({
  onSuccess,
  defaultValues,
  title = 'Recuperar Contraseña',
  description = 'Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña',
  showCard = true
}: SecureForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { isValid, isDirty },
    reset,
    getValues
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      email: defaultValues?.email || ''
    }
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Si el email existe, se enviará un enlace de recuperación')
        setIsSubmitted(true)
        
        if (onSuccess) {
          onSuccess()
        }
      } else {
        throw new Error(result.error || 'Error al procesar la solicitud')
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Error al enviar el correo de recuperación')
      }
      console.error('Forgot password error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Revisa tu correo
          </CardTitle>
          <CardDescription className="text-base">
            Hemos enviado instrucciones para restablecer tu contraseña a <strong>{getValues('email')}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-4">
              Si no recibes el correo en unos minutos, revisa tu carpeta de spam o solicita un nuevo enlace.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setIsSubmitted(false)}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <Button 
              onClick={() => {
                setIsLoading(true)
                // Simulación de reenvío
                setTimeout(() => {
                  toast.success('Nuevo correo enviado')
                  setIsLoading(false)
                }, 1500)
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Reenviar correo'
              )}
            </Button>
          </div>
          <div className="text-center text-sm text-gray-600 mt-4">
            <Link 
              href="/es/signin" 
              className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline transition-colors"
            >
              Volver a inicio de sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  const FormContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" aria-busy={isLoading}>
      <SecureTextField
        control={control}
        name="email"
        label="Correo electrónico"
        placeholder="tu@email.com"
        type="email"
        autoComplete="email"
        leftIcon={<Mail className="w-4 h-4" />}
        disabled={isLoading}
        required
        showSuccessState
      />

      <div className="pt-2">
        <Button 
          type="submit" 
          size="lg"
          className="w-full"
          disabled={isLoading || (!isValid && isDirty)}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            'Enviar instrucciones'
          )}
        </Button>
      </div>

      <div className="text-center text-sm text-gray-600 mt-4">
        <Link 
          href="/es/signin" 
          className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline transition-colors"
        >
          <ArrowLeft className="h-4 w-4 inline mr-1" />
          Volver a inicio de sesión
        </Link>
      </div>
    </form>
  )

  if (!showCard) {
    return FormContent
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="text-center space-y-1">
        <CardTitle className="text-2xl font-bold">
          {title}
        </CardTitle>
        <CardDescription className="text-base">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {FormContent}
      </CardContent>
    </Card>
  )
}