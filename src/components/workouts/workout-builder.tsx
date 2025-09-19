'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from '@hello-pangea/dnd'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, GripVertical, Trash2, Clock, Target, Dumbbell } from 'lucide-react'
import { toast } from 'sonner'

interface Exercise {
	id: string
	name: string
	description?: string
	category: string
	muscleGroups?: string[]
	equipments?: string[]
	difficulty: string
	imageUrl?: string
	videoUrl?: string
	instructions?: string
}

interface WorkoutExercise {
	id: string
	exerciseId: string
	exercise: Exercise
	order: number
	sets?: number
	reps?: number
	weight?: number
	duration?: number
	distance?: number
	restTime?: number
	notes?: string
}

interface WorkoutBuilderProps {
	initialWorkout?: {
		id?: string
		name: string
		description?: string
		category: string
		isTemplate?: boolean
		isPublic?: boolean
		exercises: WorkoutExercise[]
	}
	onSave: (workout: any) => Promise<void>
	onCancel?: () => void
}

const WORKOUT_CATEGORIES = [
	{ value: 'STRENGTH', label: 'Fuerza' },
	{ value: 'CARDIO', label: 'Cardio' },
	{ value: 'HIIT', label: 'HIIT' },
	{ value: 'FLEXIBILITY', label: 'Flexibilidad' },
	{ value: 'FUNCTIONAL', label: 'Funcional' },
	{ value: 'MIXED', label: 'Mixto' }
]

const EXERCISE_CATEGORIES = [
	{ value: 'all', label: 'Todos' },
	{ value: 'STRENGTH', label: 'Fuerza' },
	{ value: 'CARDIO', label: 'Cardio' },
	{ value: 'FLEXIBILITY', label: 'Flexibilidad' },
	{ value: 'FUNCTIONAL', label: 'Funcional' }
]

const DIFFICULTY_LEVELS = [
	{ value: 'all', label: 'Todos' },
	{ value: 'BEGINNER', label: 'Principiante' },
	{ value: 'INTERMEDIATE', label: 'Intermedio' },
	{ value: 'ADVANCED', label: 'Avanzado' },
	{ value: 'EXPERT', label: 'Experto' }
]

export function WorkoutBuilder({ initialWorkout, onSave, onCancel }: WorkoutBuilderProps) {
	const [workoutName, setWorkoutName] = useState(initialWorkout?.name || '')
	const [workoutDescription, setWorkoutDescription] = useState(initialWorkout?.description || '')
	const [workoutCategory, setWorkoutCategory] = useState(initialWorkout?.category || 'STRENGTH')
	const [isTemplate, setIsTemplate] = useState(initialWorkout?.isTemplate || false)
	const [isPublic, setIsPublic] = useState(initialWorkout?.isPublic || false)
	const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>(initialWorkout?.exercises || [])
	
	const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])
	const [exerciseSearch, setExerciseSearch] = useState('')
	const [exerciseCategory, setExerciseCategory] = useState('all')
	const [exerciseDifficulty, setExerciseDifficulty] = useState('all')
	const [isExerciseDialogOpen, setIsExerciseDialogOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [isSaving, setIsSaving] = useState(false)

	const loadExercises = useCallback(async () => {
		try {
			setIsLoading(true)
			const params = new URLSearchParams({
				search: exerciseSearch,
				category: exerciseCategory,
				difficulty: exerciseDifficulty,
				limit: '50'
			})

			const response = await fetch(`/api/exercises?${params}`)
			if (!response.ok) throw new Error('Error al cargar ejercicios')

			const data = await response.json()
			setAvailableExercises(data.exercises)
		} catch (error) {
			console.error('Error loading exercises:', error)
			toast.error('Error al cargar ejercicios')
		} finally {
			setIsLoading(false)
		}
	}, [exerciseSearch, exerciseCategory, exerciseDifficulty])

	// Cargar ejercicios disponibles
	useEffect(() => {
		loadExercises()
	}, [loadExercises])

	const handleDragEnd = (result: DropResult) => {
		if (!result.destination) return

		const items = Array.from(workoutExercises)
		const [reorderedItem] = items.splice(result.source.index, 1)
		items.splice(result.destination.index, 0, reorderedItem)

		// Actualizar el orden
		const updatedItems = items.map((item, index) => ({
			...item,
			order: index + 1
		}))

		setWorkoutExercises(updatedItems)
	}

	const addExerciseToWorkout = (exercise: Exercise) => {
		const newWorkoutExercise: WorkoutExercise = {
			id: `temp-${Date.now()}`,
			exerciseId: exercise.id,
			exercise,
			order: workoutExercises.length + 1,
			sets: 3,
			reps: 10,
			restTime: 60
		}

		setWorkoutExercises([...workoutExercises, newWorkoutExercise])
		setIsExerciseDialogOpen(false)
		toast.success(`${exercise.name} agregado a la rutina`)
	}

	const removeExerciseFromWorkout = (index: number) => {
		const updatedExercises = workoutExercises.filter((_, i) => i !== index)
			.map((item, i) => ({ ...item, order: i + 1 }))
		setWorkoutExercises(updatedExercises)
	}

	const updateExerciseConfig = (index: number, field: string, value: any) => {
		const updatedExercises = [...workoutExercises]
		updatedExercises[index] = {
			...updatedExercises[index],
			[field]: value
		}
		setWorkoutExercises(updatedExercises)
	}

	const calculateEstimatedDuration = () => {
		return workoutExercises.reduce((total, ex) => {
			const exerciseTime = ex.duration || (ex.sets || 1) * (ex.reps || 10) * 2 // 2 seg por rep
			const restTime = (ex.sets || 1) * (ex.restTime || 60)
			return total + exerciseTime + restTime
		}, 0) / 60 // en minutos
	}

	const handleSave = async () => {
		if (!workoutName.trim()) {
			toast.error('El nombre de la rutina es obligatorio')
			return
		}

		if (workoutExercises.length === 0) {
			toast.error('La rutina debe tener al menos un ejercicio')
			return
		}

		try {
			setIsSaving(true)
			const workoutData = {
				name: workoutName,
				description: workoutDescription,
				category: workoutCategory,
				isTemplate,
				isPublic,
				exercises: workoutExercises.map(ex => ({
					exerciseId: ex.exerciseId,
					sets: ex.sets,
					reps: ex.reps,
					weight: ex.weight,
					duration: ex.duration,
					distance: ex.distance,
					restTime: ex.restTime,
					notes: ex.notes
				}))
			}

			await onSave(workoutData)
			toast.success('Rutina guardada exitosamente')
		} catch (error) {
			console.error('Error saving workout:', error)
			toast.error('Error al guardar la rutina')
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<div className="max-w-6xl mx-auto p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">
						{initialWorkout?.id ? 'Editar Rutina' : 'Crear Nueva Rutina'}
					</h1>
					<p className="text-muted-foreground mt-1">
						Personaliza tu rutina de ejercicios
					</p>
				</div>
				<div className="flex gap-2">
					{onCancel && (
						<Button variant="outline" onClick={onCancel}>
							Cancelar
						</Button>
					)}
					<Button onClick={handleSave} disabled={isSaving}>
						{isSaving ? 'Guardando...' : 'Guardar Rutina'}
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Configuración de la rutina */}
				<div className="lg:col-span-1">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Target className="h-5 w-5" />
								Configuración
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<Label htmlFor="workout-name">Nombre de la rutina *</Label>
								<Input
									id="workout-name"
									value={workoutName}
									onChange={(e) => setWorkoutName(e.target.value)}
									placeholder="Ej: Rutina de Fuerza - Día 1"
								/>
							</div>

							<div>
								<Label htmlFor="workout-description">Descripción</Label>
								<Textarea
									id="workout-description"
									value={workoutDescription}
									onChange={(e) => setWorkoutDescription(e.target.value)}
									placeholder="Describe el objetivo de esta rutina..."
									rows={3}
								/>
							</div>

							<div>
								<Label htmlFor="workout-category">Categoría *</Label>
								<Select value={workoutCategory} onValueChange={setWorkoutCategory}>
									{WORKOUT_CATEGORIES.map(cat => (
										<option key={cat.value} value={cat.value}>{cat.label}</option>
									))}
								</Select>
							</div>

							<Separator />

							{/* Estadísticas */}
							<div className="space-y-2">
								<h4 className="font-medium flex items-center gap-2">
									<Clock className="h-4 w-4" />
									Estadísticas
								</h4>
								<div className="text-sm text-muted-foreground space-y-1">
									<p>Ejercicios: {workoutExercises.length}</p>
									<p>Duración estimada: {Math.round(calculateEstimatedDuration())} min</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Lista de ejercicios de la rutina */}
				<div className="lg:col-span-2">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle className="flex items-center gap-2">
									<Dumbbell className="h-5 w-5" />
									Ejercicios ({workoutExercises.length})
								</CardTitle>
								<Dialog open={isExerciseDialogOpen} onOpenChange={setIsExerciseDialogOpen}>
									<DialogTrigger asChild>
										<Button>
											<Plus className="h-4 w-4 mr-2" />
											Agregar Ejercicio
										</Button>
									</DialogTrigger>
									<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
										<DialogHeader>
											<DialogTitle>Seleccionar Ejercicio</DialogTitle>
										</DialogHeader>
										
										{/* Filtros de ejercicios */}
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
											<div className="relative">
												<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
												<Input
													value={exerciseSearch}
													onChange={(e) => setExerciseSearch(e.target.value)}
													placeholder="Buscar ejercicios..."
													className="pl-10"
												/>
											</div>
											<Select value={exerciseCategory} onValueChange={setExerciseCategory}>
												{EXERCISE_CATEGORIES.map(cat => (
													<option key={cat.value} value={cat.value}>{cat.label}</option>
												))}
											</Select>
											<Select value={exerciseDifficulty} onValueChange={setExerciseDifficulty}>
												{DIFFICULTY_LEVELS.map(diff => (
													<option key={diff.value} value={diff.value}>{diff.label}</option>
												))}
											</Select>
										</div>

										{/* Lista de ejercicios disponibles */}
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
											{isLoading ? (
												<div className="col-span-2 text-center py-8">
													Cargando ejercicios...
												</div>
											) : availableExercises.length === 0 ? (
												<div className="col-span-2 text-center py-8 text-muted-foreground">
													No se encontraron ejercicios
												</div>
											) : (
												availableExercises.map(exercise => (
													<Card 
														key={exercise.id} 
														className="cursor-pointer hover:shadow-md transition-shadow"
														onClick={() => addExerciseToWorkout(exercise)}
													>
														<CardContent className="p-4">
															<div className="flex items-start gap-3">
																{exercise.imageUrl && (
													<Image 
														src={exercise.imageUrl} 
														alt={exercise.name}
														width={64}
														height={64}
														className="w-16 h-16 object-cover rounded-lg"
													/>
												)}
																<div className="flex-1">
																	<h4 className="font-medium">{exercise.name}</h4>
																	{exercise.description && (
																		<p className="text-sm text-muted-foreground mt-1 line-clamp-2">
																			{exercise.description}
																		</p>
																	)}
																	<div className="flex gap-2 mt-2">
																		<Badge variant="secondary" className="text-xs">
																			{exercise.category}
																		</Badge>
																		<Badge variant="outline" className="text-xs">
																			{exercise.difficulty}
																		</Badge>
																	</div>
																</div>
															</div>
														</CardContent>
													</Card>
												))
											)}
										</div>
									</DialogContent>
								</Dialog>
							</div>
						</CardHeader>
						<CardContent>
							{workoutExercises.length === 0 ? (
								<div className="text-center py-12 text-muted-foreground">
								<Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
								<p>No hay ejercicios en esta rutina</p>
								<p className="text-sm">Haz clic en &quot;Agregar Ejercicio&quot; para comenzar</p>
							</div>
							) : (
								<DragDropContext onDragEnd={handleDragEnd}>
									<Droppable droppableId="workout-exercises">
										{(provided: DroppableProvided) => (
											<div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
												{workoutExercises.map((workoutExercise, index) => (
													<Draggable 
														key={workoutExercise.id} 
														draggableId={workoutExercise.id} 
														index={index}
													>
														{(provided: DraggableProvided) => (
															<Card 
																ref={provided.innerRef}
																{...provided.draggableProps}
																className="border-l-4 border-l-primary"
															>
																<CardContent className="p-4">
																	<div className="flex items-start gap-4">
																		{/* Drag handle */}
																		<div {...provided.dragHandleProps} className="mt-2">
																			<GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
																		</div>

																		{/* Exercise info */}
																		<div className="flex-1">
																			<div className="flex items-center justify-between mb-3">
																				<div>
																					<h4 className="font-medium">{workoutExercise.exercise.name}</h4>
																					<p className="text-sm text-muted-foreground">
																						Ejercicio #{index + 1}
																					</p>
																				</div>
																				<Button
																					variant="ghost"
																					size="sm"
																					onClick={() => removeExerciseFromWorkout(index)}
																					className="text-destructive hover:text-destructive"
																				>
																					<Trash2 className="h-4 w-4" />
																				</Button>
																			</div>

																			{/* Exercise configuration */}
																			<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
																				<div>
																					<Label className="text-xs">Series</Label>
																					<Input
																						type="number"
																						value={workoutExercise.sets || ''}
																						onChange={(e) => updateExerciseConfig(index, 'sets', parseInt(e.target.value) || 0)}
																						min="1"
																						className="h-8"
																					/>
																				</div>
																				<div>
																					<Label className="text-xs">Repeticiones</Label>
																					<Input
																						type="number"
																						value={workoutExercise.reps || ''}
																						onChange={(e) => updateExerciseConfig(index, 'reps', parseInt(e.target.value) || 0)}
																						min="1"
																						className="h-8"
																					/>
																				</div>
																				<div>
																					<Label className="text-xs">Peso (kg)</Label>
																					<Input
																						type="number"
																						value={workoutExercise.weight || ''}
																						onChange={(e) => updateExerciseConfig(index, 'weight', parseFloat(e.target.value) || 0)}
																						step="0.5"
																						min="0"
																						className="h-8"
																					/>
																				</div>
																				<div>
																					<Label className="text-xs">Descanso (seg)</Label>
																					<Input
																						type="number"
																						value={workoutExercise.restTime || ''}
																						onChange={(e) => updateExerciseConfig(index, 'restTime', parseInt(e.target.value) || 0)}
																						min="0"
																						step="5"
																						className="h-8"
																					/>
																				</div>
																			</div>

																			{/* Notes */}
																			<div className="mt-3">
																				<Label className="text-xs">Notas</Label>
																				<Input
																					value={workoutExercise.notes || ''}
																					onChange={(e) => updateExerciseConfig(index, 'notes', e.target.value)}
																					placeholder="Notas adicionales..."
																					className="h-8"
																				/>
																			</div>
																		</div>
																	</div>
																</CardContent>
															</Card>
														)}
													</Draggable>
												))}
												{provided.placeholder}
											</div>
										)}
									</Droppable>
								</DragDropContext>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}