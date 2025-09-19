'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Trash2, Clock, Target, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { logger } from '@/lib/logger'
interface Exercise {
	id: string
	name: string
	sets: number
	reps: string
	rest: number
	notes: string
}

export default function NewWorkoutPage() {
	const router = useRouter()
	const [workoutData, setWorkoutData] = useState({
		name: '',
		description: '',
		category: '',
		difficulty: '',
		duration: '',
		targetMuscles: [] as string[],
		equipment: [] as string[]
	})

	const [exercises, setExercises] = useState<Exercise[]>([
		{
			id: '1',
			name: '',
			sets: 3,
			reps: '10-12',
			rest: 60,
			notes: ''
		}
	])

	const categories = ['Fuerza', 'Cardio', 'Flexibilidad', 'Funcional', 'Rehabilitación']
	const difficulties = ['Principiante', 'Intermedio', 'Avanzado']
	const muscleGroups = ['Pecho', 'Espalda', 'Hombros', 'Brazos', 'Piernas', 'Core', 'Glúteos']
	const equipmentOptions = ['Mancuernas', 'Barra', 'Máquinas', 'Peso corporal', 'Bandas elásticas', 'Kettlebells']

	const addExercise = () => {
		const newExercise: Exercise = {
			id: Date.now().toString(),
			name: '',
			sets: 3,
			reps: '10-12',
			rest: 60,
			notes: ''
		}
		setExercises([...exercises, newExercise])
	}

	const removeExercise = (id: string) => {
		if (exercises.length > 1) {
			setExercises(exercises.filter(ex => ex.id !== id))
		}
	}

	const updateExercise = (id: string, field: keyof Exercise, value: any) => {
		setExercises(exercises.map(ex => 
			ex.id === id ? { ...ex, [field]: value } : ex
		))
	}

	const handleSave = () => {
		// Aquí iría la lógica para guardar el entrenamiento
		logger.debug('Guardando entrenamiento:', { workoutData, exercises })
		router.push('/dashboard/trainer/workouts')
	}

	const toggleArrayItem = (array: string[], item: string, setter: (arr: string[]) => void) => {
		if (array.includes(item)) {
			setter(array.filter(i => i !== item))
		} else {
			setter([...array, item])
		}
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Link href="/dashboard/trainer/workouts">
					<Button variant="outline" size="sm">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Volver
					</Button>
				</Link>
				<div>
					<h1 className="text-3xl font-bold">Nuevo Entrenamiento</h1>
					<p className="text-gray-600">Crea una nueva plantilla de entrenamiento</p>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Main Content */}
				<div className="lg:col-span-2 space-y-6">
					{/* Basic Information */}
					<Card>
						<CardHeader>
							<CardTitle>Información Básica</CardTitle>
							<CardDescription>
								Configura los detalles principales del entrenamiento
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="name">Nombre del Entrenamiento</Label>
									<Input
										id="name"
										value={workoutData.name}
										onChange={(e) => setWorkoutData({...workoutData, name: e.target.value})}
										placeholder="Ej: Entrenamiento de Fuerza - Principiante"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="duration">Duración (minutos)</Label>
									<Input
										id="duration"
										type="number"
										value={workoutData.duration}
										onChange={(e) => setWorkoutData({...workoutData, duration: e.target.value})}
										placeholder="45"
									/>
								</div>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Categoría</Label>
									<Select value={workoutData.category} onValueChange={(value) => setWorkoutData({...workoutData, category: value})}>
										<SelectTrigger>
											<SelectValue placeholder="Selecciona una categoría" />
										</SelectTrigger>
										<SelectContent>
											{categories.map(cat => (
												<SelectItem key={cat} value={cat}>{cat}</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label>Dificultad</Label>
									<Select value={workoutData.difficulty} onValueChange={(value) => setWorkoutData({...workoutData, difficulty: value})}>
										<SelectTrigger>
											<SelectValue placeholder="Selecciona la dificultad" />
										</SelectTrigger>
										<SelectContent>
											{difficulties.map(diff => (
												<SelectItem key={diff} value={diff}>{diff}</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="description">Descripción</Label>
								<Textarea
									id="description"
									value={workoutData.description}
									onChange={(e) => setWorkoutData({...workoutData, description: e.target.value})}
									placeholder="Describe el objetivo y características del entrenamiento..."
									rows={3}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Exercises */}
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>Ejercicios</CardTitle>
									<CardDescription>
										Agrega y configura los ejercicios del entrenamiento
									</CardDescription>
								</div>
								<Button onClick={addExercise} size="sm">
									<Plus className="h-4 w-4 mr-2" />
									Agregar Ejercicio
								</Button>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							{exercises.map((exercise, index) => (
								<div key={exercise.id} className="p-4 border rounded-lg space-y-4">
									<div className="flex items-center justify-between">
										<h4 className="font-medium">Ejercicio {index + 1}</h4>
										{exercises.length > 1 && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => removeExercise(exercise.id)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										)}
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label>Nombre del Ejercicio</Label>
											<Input
												value={exercise.name}
												onChange={(e) => updateExercise(exercise.id, 'name', e.target.value)}
												placeholder="Ej: Press de banca"
											/>
										</div>
										<div className="grid grid-cols-3 gap-2">
											<div className="space-y-2">
												<Label>Series</Label>
												<Input
													type="number"
													value={exercise.sets}
													onChange={(e) => updateExercise(exercise.id, 'sets', parseInt(e.target.value))}
													min="1"
												/>
											</div>
											<div className="space-y-2">
												<Label>Reps</Label>
												<Input
													value={exercise.reps}
													onChange={(e) => updateExercise(exercise.id, 'reps', e.target.value)}
													placeholder="10-12"
												/>
											</div>
											<div className="space-y-2">
												<Label>Descanso (s)</Label>
												<Input
													type="number"
													value={exercise.rest}
													onChange={(e) => updateExercise(exercise.id, 'rest', parseInt(e.target.value))}
													min="0"
												/>
											</div>
										</div>
									</div>
									<div className="space-y-2">
										<Label>Notas</Label>
										<Textarea
											value={exercise.notes}
											onChange={(e) => updateExercise(exercise.id, 'notes', e.target.value)}
											placeholder="Instrucciones especiales, técnica, etc."
											rows={2}
										/>
									</div>
								</div>
							))}
						</CardContent>
					</Card>
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					{/* Summary */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Resumen</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center gap-2">
								<Clock className="h-4 w-4 text-gray-500" />
								<span className="text-sm">
									{workoutData.duration || '0'} minutos
								</span>
							</div>
							<div className="flex items-center gap-2">
								<Target className="h-4 w-4 text-gray-500" />
								<span className="text-sm">
									{exercises.length} ejercicios
								</span>
							</div>
							<div className="flex items-center gap-2">
								<Users className="h-4 w-4 text-gray-500" />
								<span className="text-sm">
									{workoutData.difficulty || 'Sin definir'}
								</span>
							</div>
						</CardContent>
					</Card>

					{/* Target Muscles */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Músculos Objetivo</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex flex-wrap gap-2">
								{muscleGroups.map(muscle => (
									<Badge
										key={muscle}
										variant={workoutData.targetMuscles.includes(muscle) ? 'default' : 'outline'}
										className="cursor-pointer"
										onClick={() => toggleArrayItem(
											workoutData.targetMuscles,
											muscle,
											(muscles) => setWorkoutData({...workoutData, targetMuscles: muscles})
										)}
									>
										{muscle}
									</Badge>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Equipment */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Equipamiento</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex flex-wrap gap-2">
								{equipmentOptions.map(equipment => (
									<Badge
										key={equipment}
										variant={workoutData.equipment.includes(equipment) ? 'default' : 'outline'}
										className="cursor-pointer"
										onClick={() => toggleArrayItem(
											workoutData.equipment,
											equipment,
											(eq) => setWorkoutData({...workoutData, equipment: eq})
										)}
									>
										{equipment}
									</Badge>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Actions */}
					<div className="space-y-2">
						<Button onClick={handleSave} className="w-full">
							Guardar Entrenamiento
						</Button>
						<Button variant="outline" className="w-full">
							Guardar como Borrador
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}