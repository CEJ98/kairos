'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, Filter, Calendar, Users, Clock, Target } from 'lucide-react'
import Link from 'next/link'

export default function TrainerWorkoutsPage() {
	const [searchTerm, setSearchTerm] = useState('')

	// Mock data
	const workoutTemplates = [
		{
			id: 1,
			name: 'Entrenamiento de Fuerza - Principiante',
			duration: 45,
			difficulty: 'Principiante',
			category: 'Fuerza',
			exercises: 8,
			usedBy: 12,
			lastUsed: '2024-01-10'
		},
		{
			id: 2,
			name: 'HIIT Cardio Intenso',
			duration: 30,
			difficulty: 'Avanzado',
			category: 'Cardio',
			exercises: 6,
			usedBy: 8,
			lastUsed: '2024-01-12'
		},
		{
			id: 3,
			name: 'Yoga y Flexibilidad',
			duration: 60,
			difficulty: 'Intermedio',
			category: 'Flexibilidad',
			exercises: 10,
			usedBy: 15,
			lastUsed: '2024-01-08'
		}
	]

	const scheduledWorkouts = [
		{
			id: 1,
			client: 'Ana García',
			workout: 'Entrenamiento de Fuerza - Principiante',
			date: '2024-01-15',
			time: '09:00',
			status: 'programado'
		},
		{
			id: 2,
			client: 'Carlos López',
			workout: 'HIIT Cardio Intenso',
			date: '2024-01-15',
			time: '10:30',
			status: 'en_progreso'
		},
		{
			id: 3,
			client: 'María Rodríguez',
			workout: 'Yoga y Flexibilidad',
			date: '2024-01-15',
			time: '16:00',
			status: 'completado'
		}
	]

	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty) {
			case 'Principiante': return 'bg-green-100 text-green-800'
			case 'Intermedio': return 'bg-yellow-100 text-yellow-800'
			case 'Avanzado': return 'bg-red-100 text-red-800'
			default: return 'bg-gray-100 text-gray-800'
		}
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'programado': return 'bg-blue-100 text-blue-800'
			case 'en_progreso': return 'bg-orange-100 text-orange-800'
			case 'completado': return 'bg-green-100 text-green-800'
			default: return 'bg-gray-100 text-gray-800'
		}
	}

	const filteredTemplates = workoutTemplates.filter(template =>
		template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		template.category.toLowerCase().includes(searchTerm.toLowerCase())
	)

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Entrenamientos</h1>
					<p className="text-gray-600">Gestiona plantillas y sesiones de entrenamiento</p>
				</div>
				<Link href="/dashboard/trainer/workouts/new">
					<Button>
						<Plus className="h-4 w-4 mr-2" />
						Nuevo Entrenamiento
					</Button>
				</Link>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Plantillas</p>
								<p className="text-2xl font-bold">{workoutTemplates.length}</p>
							</div>
							<Target className="h-8 w-8 text-blue-600" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Hoy</p>
								<p className="text-2xl font-bold">{scheduledWorkouts.length}</p>
							</div>
							<Calendar className="h-8 w-8 text-green-600" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">En Progreso</p>
								<p className="text-2xl font-bold">
									{scheduledWorkouts.filter(w => w.status === 'en_progreso').length}
								</p>
							</div>
							<Clock className="h-8 w-8 text-orange-600" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Completados</p>
								<p className="text-2xl font-bold">
									{scheduledWorkouts.filter(w => w.status === 'completado').length}
								</p>
							</div>
							<Users className="h-8 w-8 text-purple-600" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="templates" className="space-y-4">
				<TabsList>
					<TabsTrigger value="templates">Plantillas</TabsTrigger>
					<TabsTrigger value="scheduled">Programados</TabsTrigger>
				</TabsList>

				<TabsContent value="templates" className="space-y-4">
					{/* Search and Filter */}
					<div className="flex gap-4">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
							<Input
								placeholder="Buscar entrenamientos..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>
						<Button variant="outline">
							<Filter className="h-4 w-4 mr-2" />
							Filtros
						</Button>
					</div>

					{/* Templates Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{filteredTemplates.map((template) => (
							<Card key={template.id} className="hover:shadow-md transition-shadow">
								<CardHeader>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<CardTitle className="text-lg">{template.name}</CardTitle>
											<CardDescription>{template.category}</CardDescription>
										</div>
										<Badge className={getDifficultyColor(template.difficulty)}>
											{template.difficulty}
										</Badge>
									</div>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-2 gap-4 text-sm">
										<div className="flex items-center gap-2">
											<Clock className="h-4 w-4 text-gray-500" />
											<span>{template.duration} min</span>
										</div>
										<div className="flex items-center gap-2">
											<Target className="h-4 w-4 text-gray-500" />
											<span>{template.exercises} ejercicios</span>
										</div>
										<div className="flex items-center gap-2">
											<Users className="h-4 w-4 text-gray-500" />
											<span>{template.usedBy} clientes</span>
										</div>
										<div className="flex items-center gap-2">
											<Calendar className="h-4 w-4 text-gray-500" />
											<span>{template.lastUsed}</span>
										</div>
									</div>
									<div className="flex gap-2">
										<Button variant="outline" size="sm" className="flex-1">
											Editar
										</Button>
										<Button size="sm" className="flex-1">
											Usar
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="scheduled" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Entrenamientos de Hoy</CardTitle>
							<CardDescription>
								Sesiones programadas para el día de hoy
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{scheduledWorkouts.map((workout) => (
									<div key={workout.id} className="flex items-center justify-between p-4 border rounded-lg">
										<div className="flex items-center gap-4">
											<div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
												<Clock className="h-5 w-5 text-blue-600" />
											</div>
											<div>
												<p className="font-medium">{workout.client}</p>
												<p className="text-sm text-gray-600">{workout.workout}</p>
												<p className="text-sm text-gray-500">{workout.time}</p>
											</div>
										</div>
										<div className="flex items-center gap-4">
											<Badge className={getStatusColor(workout.status)}>
												{workout.status === 'programado' ? 'Programado' :
												 workout.status === 'en_progreso' ? 'En Progreso' : 'Completado'}
											</Badge>
											<Button variant="outline" size="sm">
												{workout.status === 'programado' ? 'Iniciar' :
												 workout.status === 'en_progreso' ? 'Continuar' : 'Ver'}
											</Button>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}