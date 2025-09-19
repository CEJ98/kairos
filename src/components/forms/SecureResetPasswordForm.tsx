/**
 * Secure Reset Password Form Component
 * Formulario de restablecimiento de contraseña con validación de seguridad avanzada
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetPasswordSchema, ResetPasswordFormData } from '@/lib/validations/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SecureTextField } from '@/components/ui/secure-form-field'
import { Loader2, Lock, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface SecureResetPasswordFormProps {
  onSuccess?: () => void
  token?: string | null
  onInvalidToken?: () => void
  defaultValues?: Partial<ResetPasswordFormData>
  title?: string
  description?: string
  showCard?: boolean
}

// Función para calcular la fortaleza de la contraseña
const getPasswordStrength = (password: string) => {
  if (!password) return { score: 0, label: 'Muy débil', color: 'bg-red-500' }
  
  let score = 0
  
  // Longitud mínima
  if (password.length >= 8) score += 1
  
  // Contiene letras minúsculas
  if (/[a-z]/.test(password)) score += 1
  
  // Contiene letras mayúsculas
  if (/[A-Z]/.test(password)) score += 1
  
  // Contiene números
  if (/[0-9]/.test(password)) score += 1
  
  // Contiene caracteres especiales
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  
  // Determinar etiqueta y color basado en la puntuación
  let label = 'Muy débil'
  let color = 'bg-red-500'
  
  if (score === 5) {
    label = 'Muy fuerte'
    color = 'bg-green-600'
  } else if (score === 4) {
    label = 'Fuerte'
    color = 'bg-green-500'
  } else if (score === 3) {
    label = 'Media'
    color = 'bg-yellow-500'
  } else if (score === 2) {
    label = 'Débil'
    color = 'bg-orange-500'
  } else if (score === 1) {
    label = 'Muy débil'
    color = 'bg-red-500'
  }
  
  return { score, label, color }
}

export function SecureResetPasswordForm({
  onSuccess,
  token,
  defaultValues,
  title = 'Restablecer Contraseña',
  description = 'Crea una nueva contraseña segura para tu cuenta',
  showCard = true
}: SecureResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { isValid, isDirty },
    watch,
    reset
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      password: defaultValues?.password || '',
      confirmPassword: defaultValues?.confirmPassword || ''
    }
  })

  // Watch password to show strength indicator
  const password = watch('password')
  const passwordStrength = getPasswordStrength(password || '')

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)

    try {
      if (!token) {
        throw new Error('Token de restablecimiento no válido')
      }

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: data.password
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('¡Contraseña actualizada exitosamente!')
        setIsSubmitted(true)
        
        if (onSuccess) {
          onSuccess()
        }
      } else {
        if (response.status === 400 && result.error?.includes('Token inválido')) {
          // Redirigir a página de token inválido
          window.location.href = '/reset-password?invalid=true'
          return
        }
        throw new Error(result.error || 'Error al restablecer la contraseña')
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Error al restablecer la contraseña')
      }
      console.error('Password reset error:', error)
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
            ¡Contraseña actualizada!
          </CardTitle>
          <CardDescription className="text-base">
            Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button 
            className="w-full"
            onClick={() => {
              if (onSuccess) {
                onSuccess()
              } else {
                window.location.href = '/es/signin'
              }
            }}
          >
            Ir a inicio de sesión
          </Button>
        </CardContent>
      </Card>
    )
  }

  const FormContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" aria-busy={isLoading}>
      <div className="space-y-3">
        <SecureTextField
          control={control}
          name="password"
          label="Nueva contraseña"
          placeholder="Mínimo 8 caracteres"
          type="password"
          autoComplete="new-password"
          leftIcon={<Lock className="w-4 h-4" />}
          disabled={isLoading}
          required
          showPasswordToggle={true}
          securityTip="Usa una contraseña única que no hayas usado en otros sitios"
          description="Crea una contraseña segura con al menos 8 caracteres, incluyendo letras mayúsculas, minúsculas y números"
        />
        
        {password && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Seguridad:</span>
              <span className={passwordStrength.score >= 3 ? 'text-green-600' : passwordStrength.score >= 2 ? 'text-yellow-600' : 'text-red-600'}>
                {passwordStrength.label}
              </span>
            </div>
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-full rounded transition-colors ${i < passwordStrength.score ? passwordStrength.color : 'bg-gray-200'}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <SecureTextField
        control={control}
        name="confirmPassword"
        label="Confirmar contraseña"
        placeholder="Repite tu contraseña"
        type="password"
        autoComplete="new-password"
        leftIcon={<Lock className="w-4 h-4" />}
        disabled={isLoading}
        required
        showPasswordToggle={true}
      />

      <div className="pt-2">
        <Button 
          type="submit" 
          size="lg"
          className="w-full"
          disabled={isLoading || (!isValid && isDirty) || passwordStrength.score < 3}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Actualizando...
            </>
          ) : (
            'Actualizar contraseña'
          )}
        </Button>
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