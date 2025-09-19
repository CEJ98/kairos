/**
 * Secure Sign Up Form Component
 * Formulario de registro con validación de seguridad avanzada
 */

'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { signUpSchema, SignUpFormData } from '@/lib/validations/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SecureTextField } from '@/components/ui/secure-form-field'
import { Loader2, Mail, Lock, User, Users, Dumbbell } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { UserRole } from '@/types/user'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface SecureSignUpFormProps {
  onSuccess?: () => void
  defaultValues?: Partial<SignUpFormData>
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

export function SecureSignUpForm({
  onSuccess,
  defaultValues,
  title = 'Crear Cuenta',
  description = 'Únete a Kairos Fitness y comienza tu journey 💪',
  showCard = true
}: SecureSignUpFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { isValid, isDirty },
    watch,
    reset
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange',
    defaultValues: {
      name: defaultValues?.name || '',
      email: defaultValues?.email || '',
      password: defaultValues?.password || '',
      confirmPassword: defaultValues?.confirmPassword || '',
      role: defaultValues?.role || UserRole.CLIENT
    }
  })

  // Watch password to show strength indicator
  const password = watch('password')
  const passwordStrength = getPasswordStrength(password || '')

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Error al crear la cuenta')
      }

      toast.success('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión 🎉')
      
      if (onSuccess) {
        onSuccess()
      } else {
        // Redirigir al login después del registro exitoso
        router.push('/es/signin?message=account-created')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la cuenta'
      toast.error(errorMessage)
      console.error('Signup error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const FormContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" aria-busy={isLoading}>
      <SecureTextField
        control={control}
        name="name"
        label="Nombre completo"
        placeholder="Tu nombre completo"
        type="text"
        autoComplete="name"
        leftIcon={<User className="w-4 h-4" />}
        disabled={isLoading}
        required
        showSuccessState
        maxLength={50}
        showCharacterCount
      />

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

      <div className="space-y-3">
        <SecureTextField
          control={control}
          name="password"
          label="Contraseña"
          placeholder="Crea una contraseña segura"
          type="password"
          autoComplete="new-password"
          leftIcon={<Lock className="w-4 h-4" />}
          disabled={isLoading}
          required
          showPasswordToggle={true}
          description="Debe contener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial"
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
        placeholder="Confirma tu contraseña"
        type="password"
        autoComplete="new-password"
        leftIcon={<Lock className="w-4 h-4" />}
        disabled={isLoading}
        required
        showPasswordToggle={true}
      />

      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">
          Tipo de cuenta *
        </Label>
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="grid grid-cols-1 gap-4"
              disabled={isLoading}
            >
              <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <RadioGroupItem value={UserRole.CLIENT} id="client" />
                <Users className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <Label htmlFor="client" className="font-medium cursor-pointer">
                    Cliente
                  </Label>
                  <p className="text-sm text-gray-600">
                    Accede a rutinas personalizadas y seguimiento de progreso
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <RadioGroupItem value={UserRole.TRAINER} id="trainer" />
                <Dumbbell className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <Label htmlFor="trainer" className="font-medium cursor-pointer">
                    Entrenador
                  </Label>
                  <p className="text-sm text-gray-600">
                    Gestiona clientes, crea rutinas y supervisa el progreso
                  </p>
                </div>
              </div>
            </RadioGroup>
          )}
        />
      </div>

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
              Creando cuenta...
            </>
          ) : (
            'Crear cuenta'
          )}
        </Button>
      </div>

      <div className="text-center text-sm text-gray-600 mt-4">
        ¿Ya tienes una cuenta?{' '}
        <Link 
          href="/es/signin" 
          className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline transition-colors"
        >
          Inicia sesión
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
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
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