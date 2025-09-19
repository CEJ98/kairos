'use client'

import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { SecureForgotPasswordForm } from '@/components/forms/SecureForgotPasswordForm'

function ForgotPasswordContent() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
			<div className="w-full max-w-md">
				<SecureForgotPasswordForm 
					title="Recuperar contraseña"
					description="Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña"
				/>
			</div>
		</div>
	)
}

export default function ForgotPasswordPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
					<p className="text-gray-600">Cargando...</p>
				</div>
			</div>
		}>
			<ForgotPasswordContent />
		</Suspense>
	)
}