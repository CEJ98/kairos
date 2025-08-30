'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

function SignUpPageContent() {
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		confirmPassword: '',
	})

	const validateForm = () => {
		const newErrors: Record<string, string> = {}

		if (!formData.name.trim()) {
			newErrors.name = 'El nombre es requerido'
		}

		if (!formData.email.trim()) {
			newErrors.email = 'El correo electrónico es requerido'
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = 'Ingresa un correo electrónico válido'
		}

		if (!formData.password) {
			newErrors.password = 'La contraseña es requerida'
		} else if (formData.password.length < 8) {
			newErrors.password = 'La contraseña debe tener al menos 8 caracteres'
		}

		if (!formData.confirmPassword) {
			newErrors.confirmPassword = 'Confirma tu contraseña'
		} else if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = 'Las contraseñas no coinciden'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		
		if (!validateForm()) {
			return
		}

		setIsLoading(true)

		try {
			// Simulación de registro - en producción usarías Supabase
			toast.success('¡Cuenta creada exitosamente!')
			router.push('/dashboard')
		} catch (error) {
			toast.error('Error al crear la cuenta')
		} finally {
			setIsLoading(false)
		}
	}

	const handleInputChange = (field: string, value: string) => {
		setFormData({ ...formData, [field]: value })
		// Limpiar error cuando el usuario empiece a escribir
		if (errors[field]) {
			setErrors({ ...errors, [field]: '' })
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold">Crear Cuenta</CardTitle>
					<CardDescription>
						Únete a Kairos Fitness y comienza tu journey
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4" aria-busy={isLoading}>
						<div>
							<label htmlFor="name" className="sr-only">
								Nombre completo
							</label>
							<Input
								id="name"
								type="text"
								placeholder="Nombre completo"
								value={formData.name}
								onChange={(e) => handleInputChange('name', e.target.value)}
								required
								disabled={isLoading}
								autoComplete="name"
								aria-invalid={!!errors.name}
								aria-describedby={errors.name ? 'name-error' : undefined}
								className={`focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.name ? 'border-red-500' : ''}`}
							/>
							{errors.name && (
								<p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
									{errors.name}
								</p>
							)}
						</div>

						<div>
							<label htmlFor="email" className="sr-only">
								Correo electrónico
							</label>
							<Input
								id="email"
								type="email"
								placeholder="Correo electrónico"
								value={formData.email}
								onChange={(e) => handleInputChange('email', e.target.value)}
								required
								disabled={isLoading}
								autoComplete="email"
								aria-invalid={!!errors.email}
								aria-describedby={errors.email ? 'email-error' : undefined}
								className={`focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.email ? 'border-red-500' : ''}`}
							/>
							{errors.email && (
								<p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
									{errors.email}
								</p>
							)}
						</div>
						
						<div className="relative">
							<label htmlFor="password" className="sr-only">
								Contraseña
							</label>
							<Input
								id="password"
								type={showPassword ? 'text' : 'password'}
								placeholder="Contraseña"
								value={formData.password}
								onChange={(e) => handleInputChange('password', e.target.value)}
								required
								disabled={isLoading}
								autoComplete="new-password"
								aria-invalid={!!errors.password}
								aria-describedby={errors.password ? 'password-error' : 'password-help'}
								className={`focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-12 ${errors.password ? 'border-red-500' : ''}`}
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-sm p-1"
								disabled={isLoading}
								aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
							>
								{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
							</button>
							<p id="password-help" className="mt-1 text-xs text-gray-500">
								Mínimo 8 caracteres
							</p>
							{errors.password && (
								<p id="password-error" className="mt-1 text-sm text-red-600" role="alert">
									{errors.password}
								</p>
							)}
						</div>

						<div>
							<label htmlFor="confirmPassword" className="sr-only">
								Confirmar contraseña
							</label>
							<Input
								id="confirmPassword"
								type={showPassword ? 'text' : 'password'}
								placeholder="Confirmar contraseña"
								value={formData.confirmPassword}
								onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
								required
								disabled={isLoading}
								autoComplete="new-password"
								aria-invalid={!!errors.confirmPassword}
								aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
								className={`focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.confirmPassword ? 'border-red-500' : ''}`}
							/>
							{errors.confirmPassword && (
								<p id="confirm-password-error" className="mt-1 text-sm text-red-600" role="alert">
									{errors.confirmPassword}
								</p>
							)}
						</div>

						<Button 
							type="submit" 
							className="w-full focus:ring-2 focus:ring-green-500 focus:ring-offset-2" 
							disabled={isLoading}
							aria-describedby={isLoading ? 'loading-status' : undefined}
						>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
									<span>Creando cuenta...</span>
									<span id="loading-status" className="sr-only">
										Procesando registro, por favor espera
									</span>
								</>
							) : (
								'Crear Cuenta'
							)}
						</Button>
					</form>

					<div className="mt-6 text-center">
						<p className="text-sm text-gray-600">
							¿Ya tienes cuenta?{' '}
							<Link 
								href="/signin" 
								className="text-green-600 hover:underline focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-sm"
							>
								Inicia sesión aquí
							</Link>
						</p>
					</div>
				</CardContent>
			</Card>
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