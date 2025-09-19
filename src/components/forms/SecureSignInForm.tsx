/**
 * Secure Sign In Form Component
 * Formulario de inicio de sesión con validación de seguridad avanzada
 */

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { signInSchema, SignInFormData } from '@/lib/validations/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SecureTextField } from '@/components/ui/secure-form-field'
import { Loader2, Mail, Lock, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface SecureSignInFormProps {
  onSuccess?: () => void
  defaultValues?: Partial<SignInFormData>
  title?: string
  description?: string
  showCard?: boolean
}

export function SecureSignInForm({
  onSuccess,
  defaultValues,
  title = 'Iniciar Sesión',
  description = 'Ingresa tus credenciales para acceder a tu cuenta',
  showCard = true
}: SecureSignInFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  // Mostrar mensaje de éxito si viene del registro
  useEffect(() => {
    const message = searchParams?.get('message')
    if (message === 'account-created') {
      setShowSuccessMessage(true)
      toast.success('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión')
    }
  }, [searchParams])

  const {
    control,
    handleSubmit,
    formState: { isValid, isDirty },
    reset
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    mode: 'onChange',
    defaultValues: {
      email: defaultValues?.email || '',
      password: defaultValues?.password || ''
    }
  })

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true)

    try {
      // Validaciones adicionales del lado cliente
      if (!data.email?.trim()) {
        toast.error('El email es obligatorio')
        setIsLoading(false)
        return
      }

      if (!data.password?.trim()) {
        toast.error('La contraseña es obligatoria')
        setIsLoading(false)
        return
      }

      // Validación básica de formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email.trim())) {
        toast.error('Por favor, ingresa un email válido')
        setIsLoading(false)
        return
      }

      const result = await signIn('credentials', {
        email: data.email.trim().toLowerCase(),
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        // Manejo más específico de errores
        if (result.error === 'CredentialsSignin') {
          toast.error('Credenciales inválidas. Verifica tu email y contraseña.')
        } else if (result.error === 'AccessDenied') {
          toast.error('Acceso denegado. Tu cuenta puede estar desactivada.')
        } else {
          toast.error('Error de autenticación. Por favor, intenta nuevamente.')
        }
      } else {
        toast.success('¡Inicio de sesión exitoso!')
        
        if (onSuccess) {
          onSuccess()
        } else {
          // NextAuth ya maneja la redirección automáticamente
          router.push('/es/dashboard')
          router.refresh()
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Error de conexión. Verifica tu conexión a internet e intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const FormContent = (
    <div className="space-y-6">
      {showSuccessMessage && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">¡Cuenta creada exitosamente! Ahora puedes iniciar sesión</span>
        </div>
      )}
      
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

      <SecureTextField
        control={control}
        name="password"
        label="Contraseña"
        placeholder="Tu contraseña"
        type="password"
        autoComplete="current-password"
        leftIcon={<Lock className="w-4 h-4" />}
        disabled={isLoading}
        required
        showPasswordToggle
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
            Recordarme
          </label>
        </div>

        <div className="text-sm">
          <Link
            href="/forgot-password"
            className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>

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
              Iniciando sesión...
            </>
          ) : (
            'Iniciar sesión'
          )}
        </Button>
      </div>

      <div className="text-center text-sm text-gray-600 mt-4">
        ¿No tienes una cuenta?{' '}
        <Link 
          href="/es/signup" 
          className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline transition-colors"
        >
          Regístrate
        </Link>
      </div>
    </form>
    </div>
  )

  if (!showCard) {
    return FormContent
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="text-center space-y-1">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
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

export default SecureSignInForm