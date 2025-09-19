import { Metadata } from 'next'
import AdaptiveWorkoutGenerator from '@/components/ai/adaptive-workout-generator'
import WorkoutRecommendations from '@/components/ai/workout-recommendations'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Sparkles, Target, TrendingUp } from 'lucide-react'

export const metadata: Metadata = {
	title: 'AI Workouts | Kairos Fitness',
	description: 'Genera workouts personalizados y obtén recomendaciones inteligentes con IA'
}

export default function AIWorkoutsPage() {
	return (
		<div className="container mx-auto p-6 space-y-6">
			{/* Header */}
			<div className="text-center space-y-4">
				<div className="flex items-center justify-center gap-3">
					<Brain className="h-8 w-8 text-purple-500" />
					<h1 className="text-3xl font-bold">AI Workouts</h1>
				</div>
				<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
					Utiliza inteligencia artificial para crear entrenamientos personalizados y obtener recomendaciones adaptadas a cada cliente
				</p>
			</div>

			{/* Features Overview */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-lg">
							<Sparkles className="h-5 w-5 text-yellow-500" />
							Generación Adaptativa
						</CardTitle>
					</CardHeader>
					<CardContent>
						<CardDescription>
							Crea workouts únicos basados en objetivos, equipamiento y nivel de experiencia
						</CardDescription>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-lg">
							<Target className="h-5 w-5 text-blue-500" />
							Recomendaciones Inteligentes
						</CardTitle>
					</CardHeader>
					<CardContent>
						<CardDescription>
							Obtén sugerencias personalizadas basadas en el historial y progreso de tus clientes
						</CardDescription>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-lg">
							<TrendingUp className="h-5 w-5 text-green-500" />
							Progresión Automática
						</CardTitle>
					</CardHeader>
					<CardContent>
						<CardDescription>
							Ajustes automáticos de intensidad y volumen basados en el rendimiento
						</CardDescription>
					</CardContent>
				</Card>
			</div>

			{/* Main Content */}
			<Tabs defaultValue="generator" className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="generator" className="flex items-center gap-2">
						<Sparkles className="h-4 w-4" />
						Generador Adaptativo
					</TabsTrigger>
					<TabsTrigger value="recommendations" className="flex items-center gap-2">
						<Target className="h-4 w-4" />
						Recomendaciones
					</TabsTrigger>
				</TabsList>

				<TabsContent value="generator" className="mt-6">
					<AdaptiveWorkoutGenerator />
				</TabsContent>

				<TabsContent value="recommendations" className="mt-6">
					<WorkoutRecommendations />
				</TabsContent>
			</Tabs>
		</div>
	)
}