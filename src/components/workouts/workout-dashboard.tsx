'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
	Plus, 
	Play, 
	Edit, 
	Trash2, 
	Clock, 
	Target, 
	TrendingUp,
	Search,
	Filter,
	Calendar as CalendarIcon,
	BarChart3,
	Activity,
	Zap,
	Star,
	Users,
	Copy
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { WorkoutBuilder } from './workout-builder'
import { WorkoutExecutor } from './workout-executor'
import { CircularTimer } from './timer-display'

interface Exercise {
	id: string
	name: string
	description?: string
	category: string
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

interface Workout {
	id: string
	name: string
	description?: string
	category: string
	isTemplate: boolean
	createdAt: string
	updatedAt: string
	exercises: WorkoutExercise[]
	totalExercises?: number
	estimatedDuration?: number
	completedSessions?: number
	lastCompletedAt?: string
	creator?: {
		id: string
		name: string
		email: string
	}
}

interface WorkoutStats {
	totalWorkouts: number
	totalSessions: number
	totalMinutes: number
	favoriteCategory: string
	weeklyGoal: number
	weeklyProgress: number
	streak: number
}

interface WorkoutDashboardProps {
	userRole?: 'CLIENT' | 'TRAINER' | 'ADMIN'
}

export function WorkoutDashboard({ userRole = 'CLIENT' }: WorkoutDashboardProps) {
	const [workouts, setWorkouts] = useState<Workout[]>([])
	const [stats, setStats] = useState<WorkoutStats>({
		totalWorkouts: 0,
		totalSessions: 0,
		totalMinutes: 0,
		favoriteCategory: 'Fuerza',
		weeklyGoal: 3,
		weeklyProgress: 2,
		streak: 5
	})
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedCategory, setSelectedCategory] = useState('all')
	const [isLoading, setIsLoading] = useState(true)
	const [showBuilder, setShowBuilder] = useState(false)
	const [showExecutor, setShowExecutor] = useState(false)
	const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
	const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null)

	const loadWorkouts = useCallback(async () => {
		try {
			setIsLoading(true)
			const response = await fetch('/api/workouts')
			if (response.ok) {
				const data = await response.json()
				setWorkouts(data.workouts || [])
			}
		} catch (error) {
			console.error('Error loading workouts:', error)
			toast.error('Error al cargar las rutinas')
		} finally {
			setIsLoading(false)
		}
	}, [])

	const loadStats = useCallback(async () => {
		try {
			// Aquí se cargarían las estadísticas reales desde la API
			// Por ahora usamos datos de ejemplo
			setStats({
				totalWorkouts: workouts.length,
				totalSessions: 24,
				totalMinutes: 1200,
				favoriteCategory: 'Fuerza',
				weeklyGoal: 3,
				weeklyProgress: 2,
				streak: 5
			})
		} catch (error) {
			console.error('Error loading stats:', error)
		}
	}, [workouts.length])

	// Cargar rutinas y estadísticas
	useEffect(() => {
		loadWorkouts()
		loadStats()
	}, [loadWorkouts, loadStats])

	const handleCreateWorkout = async (workoutData: any) => {
		try {
			const response = await fetch('/api/workouts', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(workoutData)
			})

			if (response.ok) {
				const newWorkout = await response.json()
				setWorkouts(prev => [newWorkout, ...prev])
				setShowBuilder(false)
				toast.success('Rutina creada exitosamente')
			} else {
				throw new Error('Error creating workout')
			}
		} catch (error) {
			console.error('Error creating workout:', error)
			toast.error('Error al crear la rutina')
		}
	}

	const handleUpdateWorkout = async (workoutData: any) => {
		try {
			if (!editingWorkout) return

			const response = await fetch(`/api/workouts/${editingWorkout.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(workoutData)
			})

			if (response.ok) {
				const updatedWorkout = await response.json()
				setWorkouts(prev => prev.map(w => w.id === updatedWorkout.id ? updatedWorkout : w))
				setEditingWorkout(null)
				setShowBuilder(false)
				toast.success('Rutina actualizada exitosamente')
			} else {
				throw new Error('Error updating workout')
			}
		} catch (error) {
			console.error('Error updating workout:', error)
			toast.error('Error al actualizar la rutina')
		}
	}

	const handleDeleteWorkout = async (workoutId: string) => {
		try {
			const response = await fetch(`/api/workouts/${workoutId}`, {
				method: 'DELETE'
			})

			if (response.ok) {
				setWorkouts(prev => prev.filter(w => w.id !== workoutId))
				toast.success('Rutina eliminada exitosamente')
			} else {
				throw new Error('Error deleting workout')
			}
		} catch (error) {
			console.error('Error deleting workout:', error)
			toast.error('Error al eliminar la rutina')
		}
	}

	const handleDuplicateWorkout = async (workout: Workout) => {
		try {
			const duplicateData = {
				name: `${workout.name} (Copia)`,
				description: workout.description,
				category: workout.category,
				isTemplate: false,
				exercises: workout.exercises.map(ex => ({
					exerciseId: ex.exerciseId,
					order: ex.order,
					sets: ex.sets,
					reps: ex.reps,
					weight: ex.weight,
					duration: ex.duration,
					distance: ex.distance,
					restTime: ex.restTime,
					notes: ex.notes
				}))
			}

			await handleCreateWorkout(duplicateData)
		} catch (error) {
			console.error('Error duplicating workout:', error)
			toast.error('Error al duplicar la rutina')
		}
	}

	const handleStartWorkout = (workout: Workout) => {
		setSelectedWorkout(workout)
		setShowExecutor(true)
	}

	const handleCompleteSession = async (sessionData: any) => {
		try {
			const response = await fetch('/api/sessions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(sessionData)
			})

			if (response.ok) {
				setShowExecutor(false)
				setSelectedWorkout(null)
				loadWorkouts() // Recargar para actualizar estadísticas
				loadStats()
				toast.success('Sesión completada y guardada')
			} else {
				throw new Error('Error saving session')
			}
		} catch (error) {
			console.error('Error saving session:', error)
			toast.error('Error al guardar la sesión')
		}
	}

	const filteredWorkouts = workouts.filter(workout => {
		const matchesSearch = workout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
							  workout.description?.toLowerCase().includes(searchTerm.toLowerCase())
		const matchesCategory = selectedCategory === 'all' || workout.category === selectedCategory
		return matchesSearch && matchesCategory
	})

	const categories = ['all', ...Array.from(new Set(workouts.map(w => w.category)))]

	if (showExecutor && selectedWorkout) {
		return (
			<WorkoutExecutor
				workout={selectedWorkout}
				onComplete={handleCompleteSession}
				onExit={() => {
					setShowExecutor(false)
					setSelectedWorkout(null)
				}}
			/>
		)
	}

	return (
		<div className="max-w-7xl mx-auto p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Mis Rutinas</h1>
					<p className="text-muted-foreground mt-1">
						Crea, gestiona y ejecuta tus rutinas de ejercicios
					</p>
				</div>
				<Button onClick={() => setShowBuilder(true)}>
					<Plus className="h-4 w-4 mr-2" />
					Nueva Rutina
				</Button>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<Target className="h-5 w-5 text-blue-500" />
							<div>
								<p className="text-sm text-muted-foreground">Rutinas Creadas</p>
								<p className="text-2xl font-bold">{stats.totalWorkouts}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<Activity className="h-5 w-5 text-green-500" />
							<div>
								<p className="text-sm text-muted-foreground">Sesiones Completadas</p>
								<p className="text-2xl font-bold">{stats.totalSessions}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<Clock className="h-5 w-5 text-orange-500" />
							<div>
								<p className="text-sm text-muted-foreground">Minutos Entrenados</p>
								<p className="text-2xl font-bold">{stats.totalMinutes}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<Zap className="h-5 w-5 text-purple-500" />
							<div>
								<p className="text-sm text-muted-foreground">Racha Actual</p>
								<p className="text-2xl font-bold">{stats.streak} días</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Weekly Progress */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TrendingUp className="h-5 w-5" />
						Progreso Semanal
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-4">
						<CircularTimer
							timeRemaining={stats.weeklyGoal - stats.weeklyProgress}
							totalTime={stats.weeklyGoal}
							timerState="exercise"
							size={80}
						/>
						<div>
							<p className="text-lg font-semibold">
								{stats.weeklyProgress} de {stats.weeklyGoal} entrenamientos
							</p>
							<p className="text-muted-foreground">
								{stats.weeklyGoal - stats.weeklyProgress > 0 
									? `Te faltan ${stats.weeklyGoal - stats.weeklyProgress} entrenamientos esta semana`
									: '¡Meta semanal completada! 🎉'
								}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Search and Filters */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Buscar rutinas..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>
				<select
					value={selectedCategory}
					onChange={(e) => setSelectedCategory(e.target.value)}
					className="px-3 py-2 border border-input bg-background rounded-md text-sm"
				>
					<option value="all">Todas las categorías</option>
					{categories.filter(cat => cat !== 'all').map(category => (
						<option key={category} value={category}>{category}</option>
					))}
				</select>
			</div>

			{/* Workouts Grid */}
			{isLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{[...Array(6)].map((_, i) => (
						<Card key={i} className="animate-pulse">
							<CardContent className="p-4">
								<div className="h-4 bg-muted rounded mb-2"></div>
								<div className="h-3 bg-muted rounded mb-4 w-2/3"></div>
								<div className="h-8 bg-muted rounded"></div>
							</CardContent>
						</Card>
					))}
				</div>
			) : filteredWorkouts.length === 0 ? (
				<Card className="text-center py-12">
					<CardContent>
						<Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
						<h3 className="text-lg font-semibold mb-2">No hay rutinas</h3>
						<p className="text-muted-foreground mb-4">
							{searchTerm || selectedCategory !== 'all' 
								? 'No se encontraron rutinas con los filtros aplicados'
								: 'Crea tu primera rutina para comenzar'
							}
						</p>
						<Button onClick={() => setShowBuilder(true)}>
							<Plus className="h-4 w-4 mr-2" />
							Crear Rutina
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredWorkouts.map((workout) => (
						<Card key={workout.id} className="hover:shadow-lg transition-shadow">
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<CardTitle className="text-lg">{workout.name}</CardTitle>
										{workout.description && (
											<p className="text-sm text-muted-foreground mt-1 line-clamp-2">
												{workout.description}
											</p>
										)}
									</div>
									{workout.isTemplate && (
										<Badge variant="secondary" className="ml-2">
											<Star className="h-3 w-3 mr-1" />
											Plantilla
										</Badge>
									)}
								</div>
								<div className="flex gap-2 mt-3">
									<Badge variant="outline">{workout.category}</Badge>
									{workout.creator && userRole === 'CLIENT' && (
										<Badge variant="secondary">
											<Users className="h-3 w-3 mr-1" />
											Asignada
										</Badge>
									)}
								</div>
							</CardHeader>
							<CardContent className="pt-0">
								<div className="grid grid-cols-3 gap-4 text-sm mb-4">
									<div className="text-center">
										<p className="font-medium">{workout.totalExercises || workout.exercises.length}</p>
										<p className="text-muted-foreground">Ejercicios</p>
									</div>
									<div className="text-center">
										<p className="font-medium">{workout.estimatedDuration || 45}min</p>
										<p className="text-muted-foreground">Duración</p>
									</div>
									<div className="text-center">
										<p className="font-medium">{workout.completedSessions || 0}</p>
										<p className="text-muted-foreground">Completadas</p>
									</div>
								</div>

								<Separator className="mb-4" />

								<div className="flex gap-2">
									<Button 
										size="sm" 
										className="flex-1"
										onClick={() => handleStartWorkout(workout)}
									>
										<Play className="h-4 w-4 mr-1" />
										Iniciar
									</Button>
									<Button 
										variant="outline" 
										size="sm"
										onClick={() => {
											setEditingWorkout(workout)
											setShowBuilder(true)
										}}
									>
										<Edit className="h-4 w-4" />
									</Button>
									<Link href={`/dashboard/calendar?workoutId=${workout.id}`} className="inline-flex">
										<Button variant="outline" size="sm">
											<CalendarIcon className="h-4 w-4 mr-1" />
											Ver en calendario
										</Button>
									</Link>
									<Button 
										variant="outline" 
										size="sm"
										onClick={() => handleDuplicateWorkout(workout)}
									>
										<Copy className="h-4 w-4" />
									</Button>
									<Button 
										variant="outline" 
										size="sm"
										onClick={() => handleDeleteWorkout(workout.id)}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Workout Builder Dialog */}
			<Dialog open={showBuilder} onOpenChange={(open) => {
				setShowBuilder(open)
				if (!open) {
					setEditingWorkout(null)
				}
			}}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{editingWorkout ? 'Editar Rutina' : 'Crear Nueva Rutina'}
						</DialogTitle>
					</DialogHeader>
					<WorkoutBuilder
						initialWorkout={editingWorkout || undefined}
						onSave={editingWorkout ? handleUpdateWorkout : handleCreateWorkout}
						onCancel={() => {
							setShowBuilder(false)
							setEditingWorkout(null)
						}}
					/>
				</DialogContent>
			</Dialog>
		</div>
	)
}
