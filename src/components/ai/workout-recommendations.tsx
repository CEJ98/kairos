'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
	Brain, Zap, Target, Clock, TrendingUp, Star, 
	Play, Bookmark, RefreshCw, Sparkles, Activity,
	User, Calendar, Award, ChevronRight, Filter
} from 'lucide-react'
import { logger } from '@/lib/logger'
import { toast } from 'sonner'

interface UserProfile {
	id: string
	name: string
	age: number
	fitnessLevel: 'beginner' | 'intermediate' | 'advanced'
	goals: string[]
	availableTime: number // minutos por sesión
	frequency: number // días por semana
	equipment: string[]
	injuries: string[]
	preferences: string[]
}

interface WorkoutRecommendation {
	id: string
	title: string
	description: string
	duration: number
	difficulty: 'easy' | 'medium' | 'hard'
	category: string
	targetMuscles: string[]
	equipmentNeeded: string[]
	caloriesBurn: number
	confidenceScore: number
	reasons: string[]
	exercises: {
		name: string
		sets: number
		reps: string
		rest: number
	}[]
	aiInsights: string
}

interface AIRecommendationEngine {
	userProfile: UserProfile
	workoutHistory: any[]
	progressData: any[]
}

const mockUserProfile: UserProfile = {
	id: '1',
	name: 'Ana García',
	age: 28,
	fitnessLevel: 'intermediate',
	goals: ['weight_loss', 'muscle_tone', 'endurance'],
	availableTime: 45,
	frequency: 4,
	equipment: ['dumbbells', 'resistance_bands', 'yoga_mat'],
	injuries: ['lower_back'],
	preferences: ['hiit', 'strength_training']
}

const mockRecommendations: WorkoutRecommendation[] = [
	{
		id: '1',
		title: 'HIIT Cardio + Fuerza',
		description: 'Entrenamiento combinado perfecto para quemar grasa y tonificar músculos',
		duration: 42,
		difficulty: 'medium',
		category: 'Cardio + Fuerza',
		targetMuscles: ['core', 'legs', 'arms'],
		equipmentNeeded: ['dumbbells', 'yoga_mat'],
		caloriesBurn: 380,
		confidenceScore: 95,
		reasons: [
			'Coincide con tu objetivo de pérdida de peso',
			'Duración ideal para tu tiempo disponible',
			'Evita ejercicios que afecten la zona lumbar',
			'Combina tus preferencias de HIIT y fuerza'
		],
		exercises: [
			{ name: 'Burpees modificados', sets: 3, reps: '12-15', rest: 45 },
			{ name: 'Sentadillas con mancuernas', sets: 3, reps: '15-20', rest: 60 },
			{ name: 'Flexiones de rodillas', sets: 3, reps: '10-12', rest: 45 },
			{ name: 'Plancha', sets: 3, reps: '30-45 seg', rest: 60 }
		],
		aiInsights: 'Basado en tu progreso reciente, este entrenamiento está optimizado para maximizar la quema de calorías mientras respeta tu lesión lumbar. La IA sugiere aumentar la intensidad gradualmente.'
	},
	{
		id: '2',
		title: 'Tonificación Total',
		description: 'Rutina de fuerza enfocada en tonificar todo el cuerpo',
		duration: 38,
		difficulty: 'medium',
		category: 'Fuerza',
		targetMuscles: ['full_body'],
		equipmentNeeded: ['dumbbells', 'resistance_bands'],
		caloriesBurn: 280,
		confidenceScore: 88,
		reasons: [
			'Perfecto para tu objetivo de tonificación muscular',
			'Usa todo tu equipamiento disponible',
			'Adaptado a tu nivel intermedio',
			'Ejercicios seguros para tu espalda'
		],
		exercises: [
			{ name: 'Press de hombros', sets: 3, reps: '12-15', rest: 60 },
			{ name: 'Remo con banda', sets: 3, reps: '15-18', rest: 45 },
			{ name: 'Curl de bíceps', sets: 3, reps: '12-15', rest: 45 },
			{ name: 'Extensión de tríceps', sets: 3, reps: '10-12', rest: 60 }
		],
		aiInsights: 'Tu historial muestra buena respuesta a entrenamientos de fuerza. La IA recomienda incrementar el peso en un 5% la próxima semana para continuar progresando.'
	},
	{
		id: '3',
		title: 'Resistencia Cardiovascular',
		description: 'Entrenamiento de bajo impacto para mejorar tu resistencia',
		duration: 35,
		difficulty: 'easy',
		category: 'Cardio',
		targetMuscles: ['legs', 'core'],
		equipmentNeeded: ['yoga_mat'],
		caloriesBurn: 220,
		confidenceScore: 82,
		reasons: [
			'Ideal para días de recuperación activa',
			'Mejora tu resistencia cardiovascular',
			'Sin impacto en la zona lumbar',
			'Duración perfecta para sesiones ligeras'
		],
		exercises: [
			{ name: 'Marcha en el lugar', sets: 4, reps: '2 min', rest: 30 },
			{ name: 'Elevaciones de rodilla', sets: 3, reps: '20 cada pierna', rest: 45 },
			{ name: 'Círculos de brazos', sets: 3, reps: '15 cada dirección', rest: 30 },
			{ name: 'Respiración profunda', sets: 1, reps: '5 min', rest: 0 }
		],
		aiInsights: 'Perfecto para complementar tus entrenamientos intensos. La IA detectó que necesitas más trabajo cardiovascular de base para optimizar tu rendimiento general.'
	}
]

export default function WorkoutRecommendations({ userId }: { userId?: string }) {
	const [userProfile, setUserProfile] = useState<UserProfile>(mockUserProfile)
	const [recommendations, setRecommendations] = useState<WorkoutRecommendation[]>(mockRecommendations)
	const [selectedCategory, setSelectedCategory] = useState<string>('all')
	const [isGenerating, setIsGenerating] = useState(false)
	const [savedWorkouts, setSavedWorkouts] = useState<string[]>([])

	// Simular generación de recomendaciones con IA
	const generateRecommendations = async () => {
		setIsGenerating(true)
		try {
			// Simular llamada a API de IA
			await new Promise(resolve => setTimeout(resolve, 2000))
			
			// En una implementación real, aquí se haría la llamada a la API
			// const response = await fetch('/api/ai/recommendations', {
			//   method: 'POST',
			//   body: JSON.stringify({ userProfile, workoutHistory, progressData })
			// })
			
			setRecommendations(mockRecommendations)
			toast.success('¡Nuevas recomendaciones generadas!')
		} catch (error) {
			toast.error('Error al generar recomendaciones')
		} finally {
			setIsGenerating(false)
		}
	}

	const saveWorkout = (workoutId: string) => {
		if (savedWorkouts.includes(workoutId)) {
			setSavedWorkouts(prev => prev.filter(id => id !== workoutId))
			toast.success('Rutina eliminada de guardados')
		} else {
			setSavedWorkouts(prev => [...prev, workoutId])
			toast.success('Rutina guardada')
		}
	}

	const startWorkout = (workoutId: string) => {
		// Redirigir a la página de entrenamiento
		window.location.href = `/dashboard/workouts/${workoutId}/start`
	}

	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty) {
			case 'easy': return 'bg-green-500'
			case 'medium': return 'bg-yellow-500'
			case 'hard': return 'bg-red-500'
			default: return 'bg-gray-500'
		}
	}

	const getDifficultyText = (difficulty: string) => {
		switch (difficulty) {
			case 'easy': return 'Fácil'
			case 'medium': return 'Intermedio'
			case 'hard': return 'Difícil'
			default: return 'Desconocido'
		}
	}

	const filteredRecommendations = selectedCategory === 'all' 
		? recommendations 
		: recommendations.filter(rec => rec.category.toLowerCase().includes(selectedCategory.toLowerCase()))

	return (
		<div className="mobile-spacing">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mobile-gap">
				<div className="min-w-0">
					<h1 className="responsive-heading font-bold flex items-center gap-2">
						<Brain className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 flex-shrink-0" />
						<span className="truncate">Recomendaciones IA</span>
					</h1>
					<p className="responsive-body text-muted-foreground">Rutinas personalizadas basadas en tu perfil y progreso</p>
				</div>
				<Button onClick={generateRecommendations} disabled={isGenerating} className="mobile-button w-full sm:w-auto">
					{isGenerating ? (
						<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
					) : (
						<Sparkles className="h-4 w-4 mr-2" />
					)}
					{isGenerating ? 'Generando...' : 'Nuevas Recomendaciones'}
				</Button>
			</div>

			{/* Perfil del usuario */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<User className="h-5 w-5" />
						Tu Perfil de Entrenamiento
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div className="text-center">
							<div className="text-2xl font-bold text-blue-500">{userProfile.availableTime}min</div>
							<div className="text-sm text-muted-foreground">Por sesión</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-green-500">{userProfile.frequency}x</div>
							<div className="text-sm text-muted-foreground">Por semana</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-purple-500 capitalize">{userProfile.fitnessLevel}</div>
							<div className="text-sm text-muted-foreground">Nivel</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-orange-500">{userProfile.goals.length}</div>
							<div className="text-sm text-muted-foreground">Objetivos</div>
						</div>
					</div>
					<div className="mt-4 flex flex-wrap gap-2">
						{userProfile.goals.map((goal, index) => (
							<Badge key={index} variant="secondary">
								{goal.replace('_', ' ')}
							</Badge>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Filtros */}
			<Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
				<TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mobile-gap">
					<TabsTrigger value="all" className="mobile-button responsive-caption">Todas</TabsTrigger>
					<TabsTrigger value="cardio" className="mobile-button responsive-caption">Cardio</TabsTrigger>
					<TabsTrigger value="fuerza" className="mobile-button responsive-caption">Fuerza</TabsTrigger>
					<TabsTrigger value="hiit" className="mobile-button responsive-caption">HIIT</TabsTrigger>
				</TabsList>
			</Tabs>

			{/* Recomendaciones */}
			<div className="grid mobile-gap">
				{filteredRecommendations.map((recommendation) => (
					<Card key={recommendation.id} className="overflow-hidden mobile-card">
						<CardHeader>
							<div className="flex justify-between items-start mobile-gap">
								<div className="flex-1 min-w-0">
									<div className="flex flex-col sm:flex-row sm:items-center mobile-gap mb-2">
										<CardTitle className="responsive-subheading truncate">{recommendation.title}</CardTitle>
										<div className="flex items-center gap-1 flex-shrink-0">
											<Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-current" />
											<span className="responsive-caption font-medium">{recommendation.confidenceScore}%</span>
										</div>
									</div>
									<CardDescription className="responsive-body line-clamp-2">
										{recommendation.description}
									</CardDescription>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => saveWorkout(recommendation.id)}
									className={`touch-target flex-shrink-0 ${savedWorkouts.includes(recommendation.id) ? 'text-yellow-500' : ''}`}
								>
									<Bookmark className={`h-4 w-4 ${savedWorkouts.includes(recommendation.id) ? 'fill-current' : ''}`} />
								</Button>
							</div>
						</CardHeader>
						<CardContent className="mobile-spacing">
							{/* Métricas */}
							<div className="grid grid-cols-2 sm:grid-cols-4 mobile-gap">
								<div className="flex items-center gap-1 sm:gap-2">
									<Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
									<span className="responsive-caption truncate">{recommendation.duration} min</span>
								</div>
								<div className="flex items-center gap-1 sm:gap-2">
									<div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${getDifficultyColor(recommendation.difficulty)}`} />
									<span className="responsive-caption truncate">{getDifficultyText(recommendation.difficulty)}</span>
								</div>
								<div className="flex items-center gap-1 sm:gap-2">
									<Zap className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
									<span className="responsive-caption truncate">{recommendation.caloriesBurn} cal</span>
								</div>
								<div className="flex items-center gap-1 sm:gap-2">
									<Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
									<span className="responsive-caption truncate">{recommendation.category}</span>
								</div>
							</div>

							{/* Razones de la IA */}
							<div>
								<h4 className="font-medium mb-2 flex items-center gap-2">
									<Brain className="h-4 w-4 text-purple-500" />
									¿Por qué te recomendamos esto?
								</h4>
								<ul className="space-y-1">
									{recommendation.reasons.map((reason, index) => (
										<li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
											<ChevronRight className="h-3 w-3" />
											{reason}
										</li>
									))}
								</ul>
							</div>

							{/* Insights de la IA */}
							<div className="bg-muted/50 p-4 rounded-lg">
								<h4 className="font-medium mb-2 flex items-center gap-2">
									<Sparkles className="h-4 w-4 text-purple-500" />
									Insight de la IA
								</h4>
								<p className="text-sm text-muted-foreground">{recommendation.aiInsights}</p>
							</div>

							{/* Ejercicios */}
							<div>
								<h4 className="font-medium mb-3">Ejercicios incluidos</h4>
								<div className="grid gap-2">
									{recommendation.exercises.map((exercise, index) => (
										<div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded">
											<span className="font-medium">{exercise.name}</span>
											<span className="text-sm text-muted-foreground">
												{exercise.sets} × {exercise.reps}
											</span>
										</div>
									))}
								</div>
							</div>

							{/* Acciones */}
							<div className="flex flex-col sm:flex-row mobile-gap pt-2">
								<Button onClick={() => startWorkout(recommendation.id)} className="flex-1 mobile-button">
									<Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
									<span className="responsive-body">Comenzar Ahora</span>
								</Button>
								<Button variant="outline" onClick={() => {/* Programar para más tarde */}} className="mobile-button">
									<Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
									<span className="responsive-body">Programar</span>
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{filteredRecommendations.length === 0 && (
				<Card>
					<CardContent className="text-center py-8">
						<Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
						<h3 className="text-lg font-medium mb-2">No hay recomendaciones disponibles</h3>
						<p className="text-muted-foreground mb-4">
							Genera nuevas recomendaciones personalizadas basadas en tu perfil
						</p>
						<Button onClick={generateRecommendations}>
							<Sparkles className="h-4 w-4 mr-2" />
							Generar Recomendaciones
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	)
}

// Hook para usar las recomendaciones de IA
export function useAIRecommendations(userId?: string) {
	const [recommendations, setRecommendations] = useState<WorkoutRecommendation[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const generateRecommendations = async (userProfile: UserProfile) => {
		setIsLoading(true)
		setError(null)
		try {
			const response = await fetch('/api/ai/recommendations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					userProfile,
					limit: 3 
				})
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Error al generar recomendaciones')
			}

			const data = await response.json()
			setRecommendations(data.recommendations || [])
			return data.recommendations || []
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
			setError(errorMessage)
			logger.error('Error generating recommendations:', error)
			
			// Fallback a recomendaciones mock en caso de error
			setRecommendations(mockRecommendations)
			return mockRecommendations
		} finally {
			setIsLoading(false)
		}
	}

	return {
		recommendations,
		generateRecommendations,
		isLoading,
		error
	}
}