'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { SecureResetPasswordForm } from '@/components/forms/SecureResetPasswordForm'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token') || ''
  const isInvalid = searchParams?.get('invalid') === 'true'
  const [isSuccess, setIsSuccess] = useState(false)

  // Componente para mostrar cuando el token es inválido
  const InvalidTokenComponent = () => (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-900">Enlace inválido</CardTitle>
          <CardDescription>
            Este enlace de recuperación no es válido o ha expirado
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-medium text-red-900 mb-2">Posibles causas:</h3>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• El enlace ha expirado (válido por 1 hora)</li>
              <li>• Ya se utilizó para cambiar la contraseña</li>
              <li>• El enlace está incompleto o dañado</li>
              </ul>
            </div>

            <div className="text-center">
              <Link href="/es/signin">
                <Button
                  variant="outline"
                  className="w-full"
                >
                  Volver al inicio de sesión
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )

  // Componente para mostrar cuando la contraseña se ha actualizado exitosamente
  const SuccessComponent = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-900">¡Contraseña actualizada!</CardTitle>
          <CardDescription>
            Tu contraseña se ha cambiado exitosamente
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700 text-sm">
              Ya puedes iniciar sesión con tu nueva contraseña. Te recomendamos guardarla en un lugar seguro.
            </p>
          </div>

          <Button
            className="w-full"
            onClick={() => router.push('/es/signin')}
          >
            Iniciar sesión ahora
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  // Renderizado condicional basado en el estado
  if (isInvalid) {
    return <InvalidTokenComponent />
  }
  
  if (isSuccess) {
    return <SuccessComponent />
  }

  // Formulario de reset
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <SecureResetPasswordForm 
          title="Nueva contraseña"
          description="Crea una contraseña segura para tu cuenta"
          token={token}
          onSuccess={() => setIsSuccess(true)}
        />
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
