'use client'

import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { SecureSignUpForm } from '@/components/forms/SecureSignUpForm'

function SignUpPageContent() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
			<div className="w-full max-w-lg">
				<SecureSignUpForm 
					title="Crear Cuenta"
					description="Únete a Kairos Fitness y comienza tu journey 💪"
				/>
			</div>
		</div>
	)
}

export default function SignUpPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
					<p className="text-gray-600">Cargando...</p>
				</div>
			</div>
		}>
			<SignUpPageContent />
		</Suspense>
	)
}