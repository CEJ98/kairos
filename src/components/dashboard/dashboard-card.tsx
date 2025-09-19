'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
	Dumbbell, 
	Clock, 
	Flame, 
	TrendingUp, 
	ChevronRight,
	Play,
	CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Workout {
	id: string
	name: string
	duration: number // en minutos
	caloriesBurned: number
	completedAt: string
	exerciseCount: number
	difficulty: 'beginner' | 'intermediate' | 'advanced'
	category: string
}

interface DashboardCardProps {
	recentWorkouts?: Workout[]
	totalWorkouts?: number
	weeklyWorkouts?: number
	isLoading?: boolean
}

const mockWorkouts: Workout[] = [
	{
		id: '1',
		name: 'Entrenamiento de Fuerza',
		duration: 45,
		caloriesBurned: 320,
		completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // hace 2 horas
		exerciseCount: 8,
		difficulty: 'intermediate',
		category: 'Fuerza'
	},
	{
		id: '2',
		name: 'Cardio HIIT',
		duration: 30,
		caloriesBurned: 280,
		completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // ayer
		exerciseCount: 6,
		difficulty: 'advanced',
		category: 'Cardio'
	},
	{
		id: '3',
		name: 'Yoga Matutino',
		duration: 25,
		caloriesBurned: 150,
		completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // hace 2 días
		exerciseCount: 12,
		difficulty: 'beginner',
		category: 'Flexibilidad'
	}
]

const getDifficultyColor = (difficulty: string) => {
	switch (difficulty) {
		case 'beginner':
			return 'bg-green-100 text-green-700 border-green-200'
		case 'intermediate':
			return 'bg-yellow-100 text-yellow-700 border-yellow-200'
		case 'advanced':
			return 'bg-red-100 text-red-700 border-red-200'
		default:
			return 'bg-gray-100 text-gray-700 border-gray-200'
	}
}

const getDifficultyLabel = (difficulty: string) => {
	switch (difficulty) {
		case 'beginner':
			return 'Principiante'
		case 'intermediate':
			return 'Intermedio'
		case 'advanced':
			return 'Avanzado'
		default:
			return difficulty
	}
}

export default function DashboardCard({ 
	recentWorkouts = mockWorkouts, 
	totalWorkouts = 24, 
	weeklyWorkouts = 3,
	isLoading = false 
}: DashboardCardProps) {
	if (isLoading) {
		return (
			<Card className="animate-pulse">
				<CardHeader className="pb-3">
					<div className="h-6 bg-gray-200 rounded w-3/4"></div>
				</CardHeader>
				<CardContent className="space-y-4">
					{[1, 2, 3].map((i) => (
						<div key={i} className="space-y-2">
							<div className="h-4 bg-gray-200 rounded w-1/2"></div>
							<div className="h-3 bg-gray-200 rounded w-3/4"></div>
						</div>
					))}
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className="h-full">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg flex items-center gap-2">
						<Dumbbell className="h-5 w-5 text-primary" />
						Últimos Entrenamientos
					</CardTitle>
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<TrendingUp className="h-4 w-4 text-green-500" />
						<span>{weeklyWorkouts} esta semana</span>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Estadísticas rápidas */}
				<div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
					<div className="text-center">
						<div className="text-2xl font-bold text-primary">{totalWorkouts}</div>
						<div className="text-xs text-muted-foreground">Total</div>
					</div>
					<div className="text-center">
						<div className="text-2xl font-bold text-green-600">{weeklyWorkouts}</div>
						<div className="text-xs text-muted-foreground">Esta semana</div>
					</div>
				</div>

				{/* Lista de entrenamientos recientes */}
				<div className="space-y-3">
					{recentWorkouts.slice(0, 3).map((workout) => {
						const timeAgo = formatDistanceToNow(new Date(workout.completedAt), {
							addSuffix: true,
							locale: es
						})

						return (
							<div 
								key={workout.id} 
								className="flex items-center justify-between p-3 bg-card border rounded-lg hover:bg-muted/50 transition-colors"
							>
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
										<CheckCircle className="h-5 w-5 text-primary" />
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-1">
											<h4 className="font-medium text-sm truncate">{workout.name}</h4>
											<Badge 
												variant="outline" 
												className={`text-xs ${getDifficultyColor(workout.difficulty)}`}
											>
												{getDifficultyLabel(workout.difficulty)}
											</Badge>
										</div>
										<div className="flex items-center gap-4 text-xs text-muted-foreground">
											<div className="flex items-center gap-1">
												<Clock className="h-3 w-3" />
												{workout.duration} min
											</div>
											<div className="flex items-center gap-1">
												<Flame className="h-3 w-3" />
												{workout.caloriesBurned} kcal
											</div>
											<span>{timeAgo}</span>
										</div>
									</div>
								</div>
								<ChevronRight className="h-4 w-4 text-muted-foreground" />
							</div>
						)
					})}
				</div>

				{/* Botones de acción */}
				<div className="flex gap-2 pt-2">
					<Button className="flex-1" size="sm">
						<Play className="h-4 w-4 mr-2" />
						Nuevo Entrenamiento
					</Button>
					<Button variant="outline" size="sm" asChild>
						<Link href="/dashboard/workouts">
							Ver Todos
							<ChevronRight className="h-4 w-4 ml-1" />
						</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}