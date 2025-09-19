import { Metadata } from 'next'
import { TrainerSearch } from '@/components/trainer/trainer-search'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Search, Star } from 'lucide-react'

export const metadata: Metadata = {
	title: 'Buscar Entrenadores | Kairos Fitness',
	description: 'Encuentra el entrenador perfecto para alcanzar tus objetivos de fitness'
}

export default function TrainersPage() {
	return (
		<div className="container mx-auto py-8 space-y-8">
			{/* Header */}
			<div className="text-center space-y-4">
				<h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-3">
					<Users className="h-8 w-8 text-primary" />
					Encuentra tu Entrenador Ideal
				</h1>
				<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
					Conecta con entrenadores profesionales que te ayudarán a alcanzar tus objetivos de fitness
				</p>
			</div>

			{/* Información destacada */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card>
					<CardHeader className="text-center">
						<Search className="h-8 w-8 text-blue-600 mx-auto mb-2" />
						<CardTitle className="text-lg">Búsqueda Personalizada</CardTitle>
					</CardHeader>
					<CardContent>
						<CardDescription className="text-center">
							Filtra por especialidad, ubicación, experiencia y presupuesto para encontrar el entrenador perfecto
						</CardDescription>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="text-center">
						<Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
						<CardTitle className="text-lg">Entrenadores Verificados</CardTitle>
					</CardHeader>
					<CardContent>
						<CardDescription className="text-center">
							Todos nuestros entrenadores están certificados y tienen experiencia comprobada
						</CardDescription>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="text-center">
						<Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
						<CardTitle className="text-lg">Seguimiento Personalizado</CardTitle>
					</CardHeader>
					<CardContent>
						<CardDescription className="text-center">
							Recibe planes de entrenamiento personalizados y seguimiento continuo de tu progreso
						</CardDescription>
					</CardContent>
				</Card>
			</div>

			{/* Componente de búsqueda */}
			<TrainerSearch />
		</div>
	)
}