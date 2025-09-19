import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import { User, Mail, Calendar, Shield, Clock, Database } from "lucide-react"
import Link from "next/link"

/**
 * Página de ejemplo que demuestra el uso seguro de sesiones en Next.js con NextAuth
 * 
 * Características de seguridad implementadas:
 * - Validación de sesión del lado del servidor con getServerSession
 * - Redirección automática si no hay sesión activa
 * - Manejo seguro de datos de usuario
 * - Protección contra acceso no autorizado
 */
export default async function SessionExamplePage() {
	// Obtener sesión del lado del servidor - MÁS SEGURO
	const session = await getServerSession(authOptions)

	// Redireccionar si no hay sesión activa
	if (!session) {
		redirect('/signin')
	}

	// Formatear fecha de creación de la sesión
	const formatDate = (date: string | Date) => {
		return new Date(date).toLocaleDateString('es-ES', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	// Obtener iniciales del usuario
	const getUserInitials = (name?: string | null) => {
		if (!name) return 'U'
		return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
	}

	return (
		<div className="min-h-screen bg-gray-50 p-4">
			<div className="max-w-4xl mx-auto space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-gray-900">Ejemplo de Sesión Segura</h1>
						<p className="text-gray-600 mt-1">Demostración del uso de NextAuth con validación del servidor</p>
					</div>
					<Link href="/dashboard">
						<Button variant="outline">
							Volver al Dashboard
						</Button>
					</Link>
				</div>

				{/* Información de Seguridad */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Shield className="w-5 h-5 text-green-600" />
							Estado de Seguridad
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
									<Shield className="w-5 h-5 text-green-600" />
								</div>
								<div>
									<p className="font-medium text-gray-900">Sesión Válida</p>
									<p className="text-sm text-gray-500">Autenticado correctamente</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
									<Database className="w-5 h-5 text-blue-600" />
								</div>
								<div>
									<p className="font-medium text-gray-900">Servidor Seguro</p>
									<p className="text-sm text-gray-500">Validación SSR</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
									<Clock className="w-5 h-5 text-purple-600" />
								</div>
								<div>
									<p className="font-medium text-gray-900">Tiempo Real</p>
									<p className="text-sm text-gray-500">Renderizado en servidor</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Información del Usuario */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<User className="w-5 h-5 text-blue-600" />
							Información del Usuario
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-start gap-6">
							<Avatar className="w-20 h-20">
								<AvatarImage 
									src={session.user?.image || "/fitness-user-avatar.png"} 
									alt={session.user?.name || "Usuario"} 
								/>
								<AvatarFallback className="text-lg">
									{getUserInitials(session.user?.name)}
								</AvatarFallback>
							</Avatar>
							<div className="flex-1 space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<div className="flex items-center gap-2">
											<User className="w-4 h-4 text-gray-500" />
											<span className="text-sm font-medium text-gray-700">Nombre:</span>
										</div>
										<p className="text-lg font-semibold text-gray-900">
											{session.user?.name || 'No disponible'}
										</p>
									</div>
									<div className="space-y-2">
										<div className="flex items-center gap-2">
											<Mail className="w-4 h-4 text-gray-500" />
											<span className="text-sm font-medium text-gray-700">Email:</span>
										</div>
										<p className="text-lg font-semibold text-gray-900">
											{session.user?.email || 'No disponible'}
										</p>
									</div>
								</div>
								<div className="flex flex-wrap gap-2">
									<Badge variant="secondary">
										ID: {session.user?.id || 'N/A'}
									</Badge>
									<Badge variant="outline">
										Rol: {(session.user as any)?.role || 'Usuario'}
									</Badge>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Información de la Sesión */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Calendar className="w-5 h-5 text-purple-600" />
							Detalles de la Sesión
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-4">
								<div>
									<h4 className="font-medium text-gray-900 mb-2">Información Técnica</h4>
									<div className="space-y-2 text-sm">
										<div className="flex justify-between">
											<span className="text-gray-600">Estrategia:</span>
											<span className="font-medium">JWT</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Proveedor:</span>
											<span className="font-medium">Credentials</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Adaptador:</span>
											<span className="font-medium">Prisma (PostgreSQL)</span>
										</div>
									</div>
								</div>
							</div>
							<div className="space-y-4">
								<div>
									<h4 className="font-medium text-gray-900 mb-2">Seguridad</h4>
									<div className="space-y-2 text-sm">
										<div className="flex justify-between">
											<span className="text-gray-600">Validación:</span>
											<Badge variant="secondary" className="bg-green-100 text-green-700">
												Servidor
											</Badge>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Middleware:</span>
											<Badge variant="secondary" className="bg-blue-100 text-blue-700">
												Activo
											</Badge>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Protección:</span>
											<Badge variant="secondary" className="bg-purple-100 text-purple-700">
												/dashboard/*
											</Badge>
										</div>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Datos de Sesión Raw (para desarrollo) */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Database className="w-5 h-5 text-gray-600" />
							Datos de Sesión (Desarrollo)
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="bg-gray-50 rounded-lg p-4 overflow-auto">
							<pre className="text-sm text-gray-700">
								{JSON.stringify(session, null, 2)}
							</pre>
						</div>
						<p className="text-xs text-gray-500 mt-2">
							⚠️ Esta información solo debe mostrarse en entornos de desarrollo
						</p>
					</CardContent>
				</Card>

				{/* Mejores Prácticas */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Shield className="w-5 h-5 text-green-600" />
							Mejores Prácticas Implementadas
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-3">
								<h4 className="font-medium text-gray-900">Seguridad del Servidor</h4>
								<ul className="space-y-2 text-sm text-gray-600">
									<li className="flex items-center gap-2">
										<div className="w-2 h-2 bg-green-500 rounded-full"></div>
										Validación con getServerSession
									</li>
									<li className="flex items-center gap-2">
										<div className="w-2 h-2 bg-green-500 rounded-full"></div>
										Redirección automática sin sesión
									</li>
									<li className="flex items-center gap-2">
										<div className="w-2 h-2 bg-green-500 rounded-full"></div>
										Middleware de protección de rutas
									</li>
								</ul>
							</div>
							<div className="space-y-3">
								<h4 className="font-medium text-gray-900">Configuración</h4>
								<ul className="space-y-2 text-sm text-gray-600">
									<li className="flex items-center gap-2">
										<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
										Variables de entorno seguras
									</li>
									<li className="flex items-center gap-2">
										<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
										Adaptador PostgreSQL con Prisma
									</li>
									<li className="flex items-center gap-2">
										<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
										Estrategia JWT para sesiones
									</li>
								</ul>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}