'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

function SignInPageContent() {
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const [formData, setFormData] = useState({
		email: '',
		password: '',
	})

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)

		try {
			// Simulación de login - en producción usarías Supabase
			toast.success('¡Inicio de sesión exitoso!')
			router.push('/dashboard')
		} catch (error) {
			toast.error('Error al iniciar sesión')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
					<CardDescription>
						Bienvenido de vuelta a Kairos Fitness
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4" aria-busy={isLoading}>
						<div>
							<label htmlFor="email" className="sr-only">
								Correo electrónico
							</label>
							<Input
								id="email"
								type="email"
								placeholder="Correo electrónico"
								value={formData.email}
								onChange={(e) => setFormData({ ...formData, email: e.target.value })}
								required
								disabled={isLoading}
								autoComplete="email"
								className="focus:ring-2 focus:ring-green-500 focus:border-green-500"
							/>
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
								onChange={(e) => setFormData({ ...formData, password: e.target.value })}
								required
								disabled={isLoading}
								autoComplete="current-password"
								className="focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-12"
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
									<span>Iniciando sesión...</span>
									<span id="loading-status" className="sr-only">
										Procesando inicio de sesión, por favor espera
									</span>
								</>
							) : (
								'Iniciar Sesión'
							)}
						</Button>
					</form>

					<div className="mt-6 text-center">
						<p className="text-sm text-gray-600">
							¿No tienes cuenta?{' '}
							<Link 
								href="/signup" 
								className="text-green-600 hover:underline focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-sm"
							>
								Crea una cuenta aquí
							</Link>
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

export default function SignInPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
					<p className="text-gray-600">Cargando...</p>
				</div>
			</div>
		}>
			<SignInPageContent />
		</Suspense>
	)
}