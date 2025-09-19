'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
	Brain, Zap, Target, Clock, TrendingUp, Star, 
	Play, Settings, RefreshCw, Sparkles, Activity,
	Dumbbell, Heart, Flame, Award, ChevronRight
} from 'lucide-react'
import { logger } from '@/lib/logger'
import { toast } from 'sonner'

interface AdaptiveWorkoutParams {
	targetDuration: number
	focusAreas: string[]
	difficulty?: 'beginner' | 'intermediate' | 'advanced'
	equipment: string[]
}

interface GeneratedWorkout {
	workout: {
		name: string
		description: string
		category: string
		duration: number
		exercises: {
			exerciseId: string
			order: number
			sets: number
			reps: number
			weight?: number
			duration?: number
			restTime: number
			notes?: string
		}[]
	}
	progressionSuggestions: {
		exerciseId: string
		currentLoad: number
		suggestedLoad: number
		progressionType: string
		reasoning: string
	}[]
	aiInsights: string
}

const focusAreaOptions = [
	{ id: 'chest', label: 'Pecho', icon: '💪' },
	{ id: 'back', label: 'Espalda', icon: '🏋️' },
	{ id: 'legs', label: 'Piernas', icon: '🦵' },
	{ id: 'arms', label: 'Brazos', icon: '💪' },
	{ id: 'shoulders', label: 'Hombros', icon: '🤸' },
	{ id: 'core', label: 'Core', icon: '🎯' },
	{ id: 'cardio', label: 'Cardio', icon: '❤️' },
	{ id: 'flexibility', label: 'Flexibilidad', icon: '🧘' }
]

const equipmentOptions = [
	{ id: 'bodyweight', label: 'Peso corporal' },
	{ id: 'dumbbells', label: 'Mancuernas' },
	{ id: 'barbell', label: 'Barra' },
	{ id: 'resistance_bands', label: 'Bandas elásticas' },
	{ id: 'kettlebell', label: 'Kettlebell' },
	{ id: 'yoga_mat', label: 'Colchoneta' },
	{ id: 'pull_up_bar', label: 'Barra de dominadas' },
	{ id: 'bench', label: 'Banco' }
]

export default function AdaptiveWorkoutGenerator() {
	const [params, setParams] = useState<AdaptiveWorkoutParams>({
		targetDuration: 45,
		focusAreas: [],
		difficulty: 'intermediate',
		equipment: ['bodyweight']
	})
	const [generatedWorkout, setGeneratedWorkout] = useState<GeneratedWorkout | null>(null)
	const [isGenerating, setIsGenerating] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleFocusAreaChange = (areaId: string, checked: boolean) => {
		setParams(prev => ({
			...prev,
			focusAreas: checked 
				? [...prev.focusAreas, areaId]
				: prev.focusAreas.filter(id => id !== areaId)
		}))
	}

	const handleEquipmentChange = (equipmentId: string, checked: boolean) => {
		setParams(prev => ({
			...prev,
			equipment: checked 
				? [...prev.equipment, equipmentId]
				: prev.equipment.filter(id => id !== equipmentId)
		}))
	}

	const generateWorkout = async () => {
		setIsGenerating(true)
		setError(null)
		try {
			const response = await fetch('/api/ai/adaptive-workout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(params)
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Error al generar workout')
			}

			const data = await response.json()
			setGeneratedWorkout(data)
			toast.success('¡Workout adaptativo generado con éxito!')
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
			setError(errorMessage)
			toast.error('Error al generar workout: ' + errorMessage)
			logger.error('Error generating adaptive workout:', error)
		} finally {
			setIsGenerating(false)
		}
	}

	const saveWorkout = async () => {
		if (!generatedWorkout) return

		try {
			const response = await fetch('/api/workouts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(generatedWorkout.workout)
			})

			if (!response.ok) {
				throw new Error('Error al guardar workout')
			}

			toast.success('Workout guardado en tu biblioteca')
		} catch (error) {
			toast.error('Error al guardar workout')
			logger.error('Error saving workout:', error)
		}
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="text-center space-y-2">
				<div className="flex items-center justify-center gap-2 mb-2">
					<Brain className="h-6 w-6 text-purple-500" />
					<h2 className="text-2xl font-bold">Generador de Workouts Adaptativos</h2>
				</div>
				<p className="text-muted-foreground">
					Crea entrenamientos personalizados usando inteligencia artificial
				</p>
			</div>

			{/* Configuración */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Settings className="h-5 w-5" />
						Configuración del Workout
					</CardTitle>
					<CardDescription>
						Personaliza los parámetros para generar tu workout ideal
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Duración */}
					<div className="space-y-3">
						<Label className="flex items-center gap-2">
							<Clock className="h-4 w-4" />
							Duración objetivo: {params.targetDuration} minutos
						</Label>
						<Input
							type="range"
							value={params.targetDuration}
							onChange={(e) => setParams(prev => ({ ...prev, targetDuration: parseInt(e.target.value) }))}
							min={15}
							max={120}
							step={5}
							className="w-full"
						/>
						<div className="flex justify-between text-sm text-muted-foreground">
							<span>15 min</span>
							<span>120 min</span>
						</div>
					</div>

					<Separator />

					{/* Nivel de dificultad */}
					<div className="space-y-3">
						<Label className="flex items-center gap-2">
							<Target className="h-4 w-4" />
							Nivel de dificultad
						</Label>
						<Select 
							value={params.difficulty} 
							onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => setParams(prev => ({ ...prev, difficulty: value }))}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="beginner">Principiante</SelectItem>
								<SelectItem value="intermediate">Intermedio</SelectItem>
								<SelectItem value="advanced">Avanzado</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<Separator />

					{/* Áreas de enfoque */}
					<div className="space-y-3">
						<Label className="flex items-center gap-2">
							<Dumbbell className="h-4 w-4" />
							Áreas de enfoque
						</Label>
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
							{focusAreaOptions.map(area => (
								<div key={area.id} className="flex items-center space-x-2">
									<Checkbox
										id={area.id}
										checked={params.focusAreas.includes(area.id)}
										onCheckedChange={(checked: boolean) => handleFocusAreaChange(area.id, checked)}
									/>
									<Label htmlFor={area.id} className="text-sm cursor-pointer">
										{area.icon} {area.label}
									</Label>
								</div>
							))}
						</div>
					</div>

					<Separator />

					{/* Equipamiento */}
					<div className="space-y-3">
						<Label className="flex items-center gap-2">
							<Activity className="h-4 w-4" />
							Equipamiento disponible
						</Label>
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
							{equipmentOptions.map(equipment => (
								<div key={equipment.id} className="flex items-center space-x-2">
									<Checkbox
										id={equipment.id}
										checked={params.equipment.includes(equipment.id)}
										onCheckedChange={(checked: boolean) => handleEquipmentChange(equipment.id, checked)}
									/>
									<Label htmlFor={equipment.id} className="text-sm cursor-pointer">
										{equipment.label}
									</Label>
								</div>
							))}
						</div>
					</div>

					{/* Botón generar */}
					<Button 
						onClick={generateWorkout}
						disabled={isGenerating || params.equipment.length === 0}
						size="lg"
						className="w-full"
					>
						{isGenerating ? (
							<>
								<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
								Generando workout...
							</>
						) : (
							<>
								<Sparkles className="h-4 w-4 mr-2" />
								Generar Workout Adaptativo
							</>
						)}
					</Button>
				</CardContent>
			</Card>

			{/* Error */}
			{error && (
				<Card className="border-destructive">
					<CardContent className="pt-6">
						<div className="text-destructive text-center">
							<p className="font-medium">Error al generar workout</p>
							<p className="text-sm mt-1">{error}</p>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Workout generado */}
			{generatedWorkout && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="flex items-center gap-2">
									<Award className="h-5 w-5 text-yellow-500" />
									{generatedWorkout.workout.name}
								</CardTitle>
								<CardDescription>{generatedWorkout.workout.description}</CardDescription>
							</div>
							<div className="flex gap-2">
								<Button onClick={saveWorkout} variant="outline" size="sm">
									Guardar
								</Button>
								<Button size="sm">
									<Play className="h-4 w-4 mr-1" />
									Comenzar
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Información del workout */}
						<div className="flex flex-wrap gap-4 text-sm">
							<div className="flex items-center gap-1">
								<Clock className="h-4 w-4" />
								{generatedWorkout.workout.duration} min
							</div>
							<div className="flex items-center gap-1">
								<Activity className="h-4 w-4" />
								{generatedWorkout.workout.exercises.length} ejercicios
							</div>
							<Badge variant="secondary">
								{generatedWorkout.workout.category}
							</Badge>
						</div>

						{/* Insights de IA */}
						<div className="bg-muted/50 p-4 rounded-lg">
							<h4 className="font-medium mb-2 flex items-center gap-2">
								<Brain className="h-4 w-4 text-purple-500" />
								Insights de la IA
							</h4>
							<p className="text-sm text-muted-foreground">{generatedWorkout.aiInsights}</p>
						</div>

						{/* Ejercicios */}
						<div>
							<h4 className="font-medium mb-3">Ejercicios del workout</h4>
							<div className="space-y-2">
								{generatedWorkout.workout.exercises.map((exercise, index) => (
									<div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded">
										<div>
											<span className="font-medium">Ejercicio {exercise.order}</span>
											{exercise.notes && (
												<p className="text-sm text-muted-foreground">{exercise.notes}</p>
											)}
										</div>
										<div className="text-right text-sm">
											<div>{exercise.sets} series</div>
											<div>{exercise.reps} reps</div>
											<div className="text-muted-foreground">{exercise.restTime}s descanso</div>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Sugerencias de progresión */}
						{generatedWorkout.progressionSuggestions.length > 0 && (
							<div>
								<h4 className="font-medium mb-3 flex items-center gap-2">
									<TrendingUp className="h-4 w-4 text-green-500" />
									Sugerencias de progresión
								</h4>
								<div className="space-y-2">
									{generatedWorkout.progressionSuggestions.map((suggestion, index) => (
										<div key={index} className="p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
											<div className="flex items-center gap-2 mb-1">
												<ChevronRight className="h-3 w-3" />
												<span className="font-medium text-sm">Progresión en {suggestion.progressionType}</span>
											</div>
											<p className="text-sm text-muted-foreground">{suggestion.reasoning}</p>
										</div>
									))}
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	)
}