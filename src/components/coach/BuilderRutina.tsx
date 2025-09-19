'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
	Plus, 
	Trash2, 
	GripVertical, 
	Search, 
	Filter,
	Save,
	Copy,
	Edit,
	Play,
	Clock,
	Weight,
	Repeat,
	Target
} from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

// Tipos
interface Exercise {
	id: string
	name: string
	description?: string
	category: string
	muscleGroups: string[]
	equipments: string[]
	difficulty: string
	imageUrl?: string
	instructions?: string
}

interface RoutineSet {
	id?: string
	exerciseId: string
	exercise?: Exercise
	order: number
	reps?: number
	weight?: number
	duration?: number
	distance?: number
	restTime?: number
	notes?: string
}

interface RoutineBlock {
	id?: string
	name: string
	order: number
	rounds: number
	restBetweenRounds?: number
	notes?: string
	sets: RoutineSet[]
}

interface Routine {
	id?: string
	name: string
	description?: string
	category?: string
	difficulty?: string
	estimatedDuration?: number
	isTemplate: boolean
	isActive: boolean
	blocks: RoutineBlock[]
}

interface BuilderRutinaProps {
	routine?: Routine
	onSave?: (routine: Routine) => void
	onCancel?: () => void
}

export default function BuilderRutina({ routine, onSave, onCancel }: BuilderRutinaProps) {
	// Estados principales
	const [currentRoutine, setCurrentRoutine] = useState<Routine>({
		name: '',
		description: '',
		category: 'STRENGTH',
		difficulty: 'BEGINNER',
		estimatedDuration: 60,
		isTemplate: false,
		isActive: true,
		blocks: []
	})

	// Estados para ejercicios
	const [exercises, setExercises] = useState<Exercise[]>([])
	const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
	const [exerciseSearch, setExerciseSearch] = useState('')
	const [exerciseFilters, setExerciseFilters] = useState({
		category: 'all',
		muscleGroup: 'all',
		equipment: 'all',
		difficulty: 'all'
	})

	// Estados de UI
	const [isExerciseDialogOpen, setIsExerciseDialogOpen] = useState(false)
	const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [isSaving, setIsSaving] = useState(false)

	// Cargar rutina existente si se proporciona
	useEffect(() => {
		if (routine) {
			setCurrentRoutine(routine)
		}
	}, [routine])

	// Cargar ejercicios disponibles
	const filterExercises = useCallback(() => {
		let filtered = exercises

		// Filtro por búsqueda
		if (exerciseSearch) {
			filtered = filtered.filter(ex => 
				ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
				ex.description?.toLowerCase().includes(exerciseSearch.toLowerCase())
			)
		}

		// Filtros por categoría
		if (exerciseFilters.category !== 'all') {
			filtered = filtered.filter(ex => ex.category === exerciseFilters.category)
		}

		if (exerciseFilters.muscleGroup !== 'all') {
			filtered = filtered.filter(ex => ex.muscleGroups.includes(exerciseFilters.muscleGroup))
		}

		if (exerciseFilters.equipment !== 'all') {
			filtered = filtered.filter(ex => ex.equipments.includes(exerciseFilters.equipment))
		}

		if (exerciseFilters.difficulty !== 'all') {
			filtered = filtered.filter(ex => ex.difficulty === exerciseFilters.difficulty)
		}

		setFilteredExercises(filtered)
	}, [exercises, exerciseSearch, exerciseFilters])

	useEffect(() => {
		loadExercises()
	}, [])

	// Filtrar ejercicios
	useEffect(() => {
		filterExercises()
	}, [exercises, exerciseSearch, exerciseFilters, filterExercises])

	const loadExercises = async () => {
		try {
			setIsLoading(true)
			const response = await fetch('/api/exercises?limit=100')
			if (!response.ok) throw new Error('Error al cargar ejercicios')
			
			const data = await response.json()
			setExercises(data.exercises || [])
		} catch (error) {
			console.error('Error loading exercises:', error)
			toast.error('Error al cargar ejercicios')
		} finally {
			setIsLoading(false)
		}
	}

	// (fin reordenamiento)

	// Funciones para manejar bloques
	const addBlock = () => {
		const newBlock: RoutineBlock = {
			name: `Bloque ${currentRoutine.blocks.length + 1}`,
			order: currentRoutine.blocks.length,
			rounds: 1,
			restBetweenRounds: 60,
			notes: '',
			sets: []
		}

		setCurrentRoutine(prev => ({
			...prev,
			blocks: [...prev.blocks, newBlock]
		}))
	}

	const removeBlock = (blockIndex: number) => {
		setCurrentRoutine(prev => ({
			...prev,
			blocks: prev.blocks.filter((_, index) => index !== blockIndex)
				.map((block, index) => ({ ...block, order: index }))
		}))
	}

	const updateBlock = (blockIndex: number, updates: Partial<RoutineBlock>) => {
		setCurrentRoutine(prev => ({
			...prev,
			blocks: prev.blocks.map((block, index) => 
				index === blockIndex ? { ...block, ...updates } : block
			)
		}))
	}

	// Funciones para manejar sets
	const addSetToBlock = (blockIndex: number, exercise: Exercise) => {
		const newSet: RoutineSet = {
			exerciseId: exercise.id,
			exercise,
			order: currentRoutine.blocks[blockIndex].sets.length,
			reps: 10,
			weight: 0,
			restTime: 60,
			notes: ''
		}

		updateBlock(blockIndex, {
			sets: [...currentRoutine.blocks[blockIndex].sets, newSet]
		})

		setIsExerciseDialogOpen(false)
		setSelectedBlockIndex(null)
	}

	const removeSetFromBlock = (blockIndex: number, setIndex: number) => {
		const updatedSets = currentRoutine.blocks[blockIndex].sets
			.filter((_, index) => index !== setIndex)
			.map((set, index) => ({ ...set, order: index }))

		updateBlock(blockIndex, { sets: updatedSets })
	}

	const updateSet = (blockIndex: number, setIndex: number, updates: Partial<RoutineSet>) => {
		const updatedSets = currentRoutine.blocks[blockIndex].sets.map((set, index) => 
			index === setIndex ? { ...set, ...updates } : set
		)

		updateBlock(blockIndex, { sets: updatedSets })
	}

	// Drag and drop
	const onDragEnd = (result: any) => {
		if (!result.destination) return

		const { source, destination, type } = result

		if (type === 'block') {
			// Reordenar bloques
			const newBlocks = Array.from(currentRoutine.blocks)
			const [reorderedBlock] = newBlocks.splice(source.index, 1)
			newBlocks.splice(destination.index, 0, reorderedBlock)

			// Actualizar orden
			const updatedBlocks = newBlocks.map((block, index) => ({
				...block,
				order: index
			}))

			setCurrentRoutine(prev => ({ ...prev, blocks: updatedBlocks }))
		} else if (type === 'set') {
			// Reordenar sets dentro de un bloque
			const blockIndex = parseInt(source.droppableId.split('-')[1])
			const newSets = Array.from(currentRoutine.blocks[blockIndex].sets)
			const [reorderedSet] = newSets.splice(source.index, 1)
			newSets.splice(destination.index, 0, reorderedSet)

			// Actualizar orden
			const updatedSets = newSets.map((set, index) => ({
				...set,
				order: index
			}))

			updateBlock(blockIndex, { sets: updatedSets })
		}
	}

	// Guardar rutina
	const handleSave = async () => {
		if (!currentRoutine.name.trim()) {
			toast.error('El nombre de la rutina es requerido')
			return
		}

		if (currentRoutine.blocks.length === 0) {
			toast.error('La rutina debe tener al menos un bloque')
			return
		}

		try {
			setIsSaving(true)
			
			const method = currentRoutine.id ? 'PUT' : 'POST'
			const url = '/api/routines'
			
			const payload = currentRoutine.id 
				? { routineId: currentRoutine.id, ...currentRoutine }
				: currentRoutine

			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || 'Error al guardar rutina')
			}

			const savedRoutine = await response.json()
			toast.success(currentRoutine.id ? 'Rutina actualizada' : 'Rutina creada exitosamente')
			
			if (onSave) {
				onSave(savedRoutine)
			}
		} catch (error) {
			console.error('Error saving routine:', error)
			toast.error(error instanceof Error ? error.message : 'Error al guardar rutina')
		} finally {
			setIsSaving(false)
		}
	}

	// Calcular duración estimada
	const calculateEstimatedDuration = useCallback(() => {
		let totalMinutes = 0
		
		currentRoutine.blocks.forEach(block => {
			let blockDuration = 0
			
			block.sets.forEach(set => {
				// Tiempo de ejercicio (estimado)
				if (set.duration) {
					blockDuration += set.duration
				} else if (set.reps) {
					// Estimar 2-3 segundos por rep
					blockDuration += set.reps * 2.5
				} else {
					// Tiempo por defecto
					blockDuration += 30
				}
				
				// Tiempo de descanso
				if (set.restTime) {
					blockDuration += set.restTime
				}
			})
			
			// Multiplicar por rondas
			blockDuration *= block.rounds
			
			// Agregar descanso entre rondas
			if (block.rounds > 1 && block.restBetweenRounds) {
				blockDuration += (block.rounds - 1) * block.restBetweenRounds
			}
			
			totalMinutes += blockDuration
		})
		
		return Math.ceil(totalMinutes / 60) // Convertir a minutos
	}, [currentRoutine.blocks])

	// Actualizar duración estimada cuando cambien los bloques
	useEffect(() => {
		const estimatedDuration = calculateEstimatedDuration()
		setCurrentRoutine(prev => ({ ...prev, estimatedDuration }))
	}, [currentRoutine.blocks, calculateEstimatedDuration])

	return (
		<div className="max-w-7xl mx-auto p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">
						{currentRoutine.id ? 'Editar Rutina' : 'Crear Nueva Rutina'}
					</h1>
					<p className="text-muted-foreground mt-1">
						Diseña rutinas personalizadas para tus alumnos
					</p>
				</div>
				<div className="flex gap-2">
					{onCancel && (
						<Button variant="outline" onClick={onCancel}>
							Cancelar
						</Button>
					)}
					<Button onClick={handleSave} disabled={isSaving}>
						<Save className="w-4 h-4 mr-2" />
						{isSaving ? 'Guardando...' : 'Guardar Rutina'}
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Panel de configuración */}
				<div className="lg:col-span-1">
					<Card>
						<CardHeader>
							<CardTitle>Configuración de Rutina</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<Label htmlFor="name">Nombre *</Label>
								<Input
									id="name"
									value={currentRoutine.name}
									onChange={(e) => setCurrentRoutine(prev => ({ ...prev, name: e.target.value }))}
									placeholder="Ej: Rutina de Fuerza Básica"
								/>
							</div>

							<div>
								<Label htmlFor="description">Descripción</Label>
								<Textarea
									id="description"
									value={currentRoutine.description || ''}
									onChange={(e) => setCurrentRoutine(prev => ({ ...prev, description: e.target.value }))}
									placeholder="Describe el objetivo y características de la rutina"
									rows={3}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label>Categoría</Label>
									<Select
										value={currentRoutine.category || 'STRENGTH'}
										onValueChange={(value) => setCurrentRoutine(prev => ({ ...prev, category: value }))}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="STRENGTH">Fuerza</SelectItem>
											<SelectItem value="CARDIO">Cardio</SelectItem>
											<SelectItem value="HIIT">HIIT</SelectItem>
											<SelectItem value="FLEXIBILITY">Flexibilidad</SelectItem>
											<SelectItem value="FUNCTIONAL">Funcional</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div>
									<Label>Dificultad</Label>
									<Select
										value={currentRoutine.difficulty || 'BEGINNER'}
										onValueChange={(value) => setCurrentRoutine(prev => ({ ...prev, difficulty: value }))}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="BEGINNER">Principiante</SelectItem>
											<SelectItem value="INTERMEDIATE">Intermedio</SelectItem>
											<SelectItem value="ADVANCED">Avanzado</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="flex items-center gap-4">
								<div className="flex items-center gap-2">
									<Clock className="w-4 h-4 text-muted-foreground" />
									<span className="text-sm text-muted-foreground">
										~{currentRoutine.estimatedDuration || 0} min
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Target className="w-4 h-4 text-muted-foreground" />
									<span className="text-sm text-muted-foreground">
										{currentRoutine.blocks.length} bloques
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Panel principal - Bloques */}
				<div className="lg:col-span-2">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle>Bloques de Ejercicios</CardTitle>
								<Button onClick={addBlock} size="sm">
									<Plus className="w-4 h-4 mr-2" />
									Agregar Bloque
								</Button>
							</div>
						</CardHeader>
							<CardContent className="content-visibility-auto">
							{currentRoutine.blocks.length === 0 ? (
								<div className="text-center py-12">
									<Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
									<h3 className="text-lg font-medium mb-2">No hay bloques</h3>
									<p className="text-muted-foreground mb-4">
										Comienza agregando un bloque de ejercicios
									</p>
									<Button onClick={addBlock}>
										<Plus className="w-4 h-4 mr-2" />
										Agregar Primer Bloque
									</Button>
								</div>
							) : (
								<DragDropContext onDragEnd={onDragEnd}>
									<Droppable droppableId="blocks" type="block">
										{(provided) => (
											<div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
												{currentRoutine.blocks.map((block, blockIndex) => (
													<Draggable key={blockIndex} draggableId={`block-${blockIndex}`} index={blockIndex}>
														{(provided) => (
															<div
																ref={provided.innerRef}
																{...provided.draggableProps}
																className="border rounded-lg p-4 bg-card"
															>
																{/* Block Header */}
																<div className="flex items-center gap-2 mb-4">
																	<div {...provided.dragHandleProps}>
																		<GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
																	</div>
																	<Input
																		value={block.name}
																		onChange={(e) => updateBlock(blockIndex, { name: e.target.value })}
																		className="font-medium"
																	/>
																	<Button
																		variant="ghost"
																		size="sm"
																		onClick={() => {
																			setSelectedBlockIndex(blockIndex)
																			setIsExerciseDialogOpen(true)
																		}}
																	>
																		<Plus className="w-4 h-4" />
																	</Button>
																	<Button
																		variant="ghost"
																		size="sm"
																		onClick={() => removeBlock(blockIndex)}
																	>
																		<Trash2 className="w-4 h-4" />
																	</Button>
																</div>

																{/* Block Configuration */}
																<div className="grid grid-cols-3 gap-4 mb-4">
																	<div>
																		<Label className="text-xs">Rondas</Label>
																		<Input
																			type="number"
																			min="1"
																			value={block.rounds}
																			onChange={(e) => updateBlock(blockIndex, { rounds: parseInt(e.target.value) || 1 })}
																			className="text-sm"
																		/>
																	</div>
																	<div>
																		<Label className="text-xs">Descanso entre rondas (seg)</Label>
																		<Input
																			type="number"
																			min="0"
																			value={block.restBetweenRounds || 0}
																			onChange={(e) => updateBlock(blockIndex, { restBetweenRounds: parseInt(e.target.value) || 0 })}
																			className="text-sm"
																		/>
																	</div>
																			<div>
																				<Label className="text-xs">Notas del bloque</Label>
																				<Textarea
																					value={block.notes || ''}
																					onChange={(e) => updateBlock(blockIndex, { notes: e.target.value })}
																					placeholder="Instrucciones especiales para este bloque"
																					rows={2}
																					className="text-sm"
																				/>
																			</div>
																		</div>

																		{/* Sets */}
																		{block.sets.length === 0 ? (
																			<div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
																				<p className="text-muted-foreground mb-2">No hay ejercicios en este bloque</p>
																				<Button
																					variant="ghost"
																					size="sm"
																					onClick={() => {
																						setSelectedBlockIndex(blockIndex)
																						setIsExerciseDialogOpen(true)
																					}}
																				>
																					<Plus className="w-4 h-4 mr-2" />
																					Agregar Ejercicio
																				</Button>
																			</div>
																		) : (
																			<Droppable droppableId={`sets-${blockIndex}`} type="set">
																				{(provided) => (
																					<div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
																						{block.sets.map((set, setIndex) => (
																							<Draggable key={setIndex} draggableId={`set-${blockIndex}-${setIndex}`} index={setIndex}>
																								{(provided) => (
																									<div
																										ref={provided.innerRef}
																										{...provided.draggableProps}
																										className="flex items-center gap-2 p-3 bg-muted/50 rounded border"
																									>
																										<div {...provided.dragHandleProps}>
																											<GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
																										</div>
																										<div className="flex-1">
																											<div className="font-medium text-sm">{set.exercise?.name || 'Ejercicio'}</div>
																											<div className="text-xs text-muted-foreground">
																												{set.exercise?.muscleGroups?.join(', ')}
																											</div>
																										</div>
																										<div className="flex items-center gap-2">
																											<div className="flex items-center gap-1">
																												<Repeat className="w-3 h-3" />
																												<Input
																													type="number"
																													min="1"
																													value={set.reps || ''}
																													onChange={(e) => updateSet(blockIndex, setIndex, { reps: parseInt(e.target.value) || undefined })}
																													placeholder="Reps"
																													className="w-16 text-xs"
																												/>
																											</div>
																											<div className="flex items-center gap-1">
																												<Weight className="w-3 h-3" />
																												<Input
																													type="number"
																													min="0"
																													step="0.5"
																													value={set.weight || ''}
																													onChange={(e) => updateSet(blockIndex, setIndex, { weight: parseFloat(e.target.value) || undefined })}
																													placeholder="Kg"
																													className="w-16 text-xs"
																												/>
																											</div>
																											<div className="flex items-center gap-1">
																												<Clock className="w-3 h-3" />
																												<Input
																													type="number"
																													min="0"
																													value={set.restTime || ''}
																													onChange={(e) => updateSet(blockIndex, setIndex, { restTime: parseInt(e.target.value) || undefined })}
																													placeholder="Seg"
																													className="w-16 text-xs"
																												/>
																											</div>
																											<Button
																												variant="ghost"
																												size="sm"
																												onClick={() => removeSetFromBlock(blockIndex, setIndex)}
																											>
																												<Trash2 className="w-3 h-3" />
																											</Button>
																										</div>
																									</div>
																								)}
																							</Draggable>
																						))}
																						{provided.placeholder}
																					</div>
																				)}
																			</Droppable>
																		)}
																	</div>
																)}
															</Draggable>
														))}
														{provided.placeholder}
													</div>
												)}
											</Droppable>
										</DragDropContext>)}
									</CardContent>
								</Card>
							</div>
						</div>

						{/* Dialog para seleccionar ejercicios */}
						<Dialog open={isExerciseDialogOpen} onOpenChange={setIsExerciseDialogOpen}>
							<DialogContent className="max-w-4xl max-h-[80vh]">
								<DialogHeader>
									<DialogTitle>Seleccionar Ejercicio</DialogTitle>
								</DialogHeader>
								<div className="space-y-4">
									{/* Búsqueda y filtros */}
									<div className="flex gap-4">
										<div className="flex-1">
											<div className="relative">
												<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
												<Input
													value={exerciseSearch}
													onChange={(e) => setExerciseSearch(e.target.value)}
													placeholder="Buscar ejercicios..."
													className="pl-10"
												/>
											</div>
										</div>
										<Select
											value={exerciseFilters.category}
											onValueChange={(value) => setExerciseFilters(prev => ({ ...prev, category: value }))}
										>
											<SelectTrigger className="w-40">
												<SelectValue placeholder="Categoría" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">Todas</SelectItem>
												<SelectItem value="STRENGTH">Fuerza</SelectItem>
												<SelectItem value="CARDIO">Cardio</SelectItem>
												<SelectItem value="FLEXIBILITY">Flexibilidad</SelectItem>
												<SelectItem value="FUNCTIONAL">Funcional</SelectItem>
											</SelectContent>
										</Select>
									</div>

									{/* Lista de ejercicios */}
									<ScrollArea className="h-96 content-visibility-auto">
										{isLoading ? (
											<div className="text-center py-8">
												<p>Cargando ejercicios...</p>
											</div>
										) : filteredExercises.length === 0 ? (
											<div className="text-center py-8">
												<p className="text-muted-foreground">No se encontraron ejercicios</p>
											</div>
										) : (
											<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
												{filteredExercises.map((exercise) => (
													<Card
														key={exercise.id}
														className="cursor-pointer hover:bg-muted/50 transition-colors"
														onClick={() => {
															if (selectedBlockIndex !== null) {
																addSetToBlock(selectedBlockIndex, exercise)
															}
														}}
													>
														<CardContent className="p-4">
															<div className="flex items-start gap-3">
																{exercise.imageUrl && (
																	<img
																		src={exercise.imageUrl}
																		alt={exercise.name}
																		className="w-16 h-16 object-cover rounded"
																	/>
																)}
																<div className="flex-1">
																	<h4 className="font-medium">{exercise.name}</h4>
																	{exercise.description && (
																		<p className="text-sm text-muted-foreground mt-1">
																			{exercise.description}
																		</p>
																	)}
																	<div className="flex flex-wrap gap-1 mt-2">
																		{exercise.muscleGroups.map((muscle) => (
																			<Badge key={muscle} variant="secondary" className="text-xs">
																				{muscle}
																			</Badge>
																		))}
																		<Badge variant="outline" className="text-xs">
																			{exercise.difficulty}
																		</Badge>
																	</div>
																</div>
															</div>
														</CardContent>
													</Card>
												))}
											</div>
										)}
									</ScrollArea>
								</div>
							</DialogContent>
						</Dialog>
					</div>
				)
			}