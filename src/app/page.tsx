import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Demo autologin se maneja en cliente via /demo/auto-login

export default function LandingPage() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
			{/* Header */}
			<header className="container mx-auto px-4 py-6">
				<nav className="flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
							<span className="text-white font-bold text-lg">K</span>
						</div>
						<span className="text-xl font-bold text-gray-900">Kairos</span>
					</div>
					<div className="flex items-center space-x-4">
						<Button variant="ghost" asChild>
							<Link href="/auth">Iniciar Sesión</Link>
						</Button>
						<Button asChild>
							<Link href="/auth">Registrarse</Link>
						</Button>
					</div>
				</nav>
			</header>

			{/* Hero Section */}
			<main className="container mx-auto px-4 py-16">
				<div className="text-center max-w-4xl mx-auto">
					<Badge className="mb-4" variant="outline">
						🚀 Plataforma de Entrenamiento Inteligente
					</Badge>
					
					<h1 className="text-5xl font-bold text-gray-900 mb-6">
						Transforma tu entrenamiento con
						<span className="text-blue-600"> Kairos Fitness</span>
					</h1>
					
					<p className="text-xl text-gray-600 mb-8 leading-relaxed">
						Planifica, ejecuta y analiza tus entrenamientos con inteligencia artificial. 
						Progresión automática, seguimiento detallado y insights personalizados.
					</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            	<Link href="/demo/auto-login">
            		<Button size="lg" className="text-lg px-8 py-3">
            			Probar Demo
            		</Button>
            	</Link>
						<Button size="lg" variant="outline" className="text-lg px-8 py-3" asChild>
							<Link href="/auth">Crear Cuenta Gratis</Link>
						</Button>
					</div>

					{/* Features Grid */}
					<div className="grid md:grid-cols-3 gap-8 mt-16">
						<div className="bg-white p-6 rounded-xl shadow-sm border">
							<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
								<span className="text-2xl">📊</span>
							</div>
							<h3 className="text-xl font-semibold mb-2">Seguimiento Inteligente</h3>
							<p className="text-gray-600">
								Registra tus entrenamientos y observa tu progreso con gráficos detallados y métricas avanzadas.
							</p>
						</div>

						<div className="bg-white p-6 rounded-xl shadow-sm border">
							<div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
								<span className="text-2xl">🎯</span>
							</div>
							<h3 className="text-xl font-semibold mb-2">Progresión Automática</h3>
							<p className="text-gray-600">
								Algoritmos que ajustan automáticamente tus cargas y repeticiones basándose en tu rendimiento.
							</p>
						</div>

						<div className="bg-white p-6 rounded-xl shadow-sm border">
							<div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
								<span className="text-2xl">📈</span>
							</div>
							<h3 className="text-xl font-semibold mb-2">Análisis Profundo</h3>
							<p className="text-gray-600">
								Insights detallados sobre tu adherencia, volumen de entrenamiento y composición corporal.
							</p>
						</div>
					</div>

					{/* Stats */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t">
						<div className="text-center">
							<div className="text-3xl font-bold text-blue-600">500+</div>
							<div className="text-gray-600">Ejercicios</div>
						</div>
						<div className="text-center">
							<div className="text-3xl font-bold text-green-600">95%</div>
							<div className="text-gray-600">Adherencia</div>
						</div>
						<div className="text-center">
							<div className="text-3xl font-bold text-purple-600">24/7</div>
							<div className="text-gray-600">Disponible</div>
						</div>
						<div className="text-center">
							<div className="text-3xl font-bold text-orange-600">AI</div>
							<div className="text-gray-600">Powered</div>
						</div>
					</div>
				</div>
			</main>

			{/* Footer */}
			<footer className="container mx-auto px-4 py-8 mt-16 border-t">
				<div className="text-center text-gray-600">
					<p>&copy; 2024 Kairos Fitness. Construido con Next.js, Prisma y ❤️</p>
				</div>
			</footer>
		</div>
	);
}
