'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
	Calendar, 
	Clock, 
	MapPin, 
	User, 
	Dumbbell,
	Play,
	Bell,
	ChevronRight,
	AlertCircle,
	CheckCircle2
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow, format, isToday, isTomorrow } from 'date-fns'
import { es } from 'date-fns/locale'

interface UpcomingWorkoutData {
	id: string
	name: string
	type: 'strength' | 'cardio' | 'flexibility' | 'mixed'
	scheduledAt: string
	duration: number // en minutos
	difficulty: 'beginner' | 'intermediate' | 'advanced'
	location?: string
	trainer?: string
	exerciseCount: number
	equipmentNeeded: string[]
	notes?: string
	isCompleted?: boolean
	isReminded?: boolean
}

interface UpcomingWorkoutProps {
	upcomingWorkouts?: UpcomingWorkoutData[]
	isLoading?: boolean
}

const mockWorkouts: UpcomingWorkoutData[] = [
	{
		id: '1',
		name: 'Entrenamiento de Piernas',
		type: 'strength',
		scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // en 2 horas
		duration: 60,
		difficulty: 'intermediate',
		location: 'Gimnasio Principal',
		trainer: 'Carlos Mendez',
		exerciseCount: 8,
		equipmentNeeded: ['Barra', 'Discos', 'Mancuernas'],
		notes: 'Enfoque en sentadillas y peso muerto',
		isCompleted: false,
		isReminded: true
	},
	{
		id: '2',
		name: 'Cardio HIIT Matutino',
		type: 'cardio',
		scheduledAt: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(), // mañana
		duration: 30,
		difficulty: 'advanced',
		location: 'Sala de Cardio',
		exerciseCount: 6,
		equipmentNeeded: ['Kettlebells', 'Colchoneta'],
		notes: 'Intervalos de alta intensidad',
		isCompleted: false,
		isReminded: false
	},
	{
		id: '3',
		name: 'Yoga y Estiramiento',
		type: 'flexibility',
		scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // en 3 días
		duration: 45,
		difficulty: 'beginner',
		location: 'Estudio de Yoga',
		trainer: 'Ana García',
		exerciseCount: 12,
		equipmentNeeded: ['Colchoneta', 'Bloques de yoga'],
		notes: 'Sesión de relajación y flexibilidad',
		isCompleted: false,
		isReminded: false
	}
]

const getWorkoutTypeColor = (type: string) => {
	switch (type) {
		case 'strength':
			return 'bg-blue-100 text-blue-700 border-blue-200'
		case 'cardio':
			return 'bg-red-100 text-red-700 border-red-200'
		case 'flexibility':
			return 'bg-green-100 text-green-700 border-green-200'
		case 'mixed':
			return 'bg-purple-100 text-purple-700 border-purple-200'
		default:
			return 'bg-gray-100 text-gray-700 border-gray-200'
	}
}

const getWorkoutTypeLabel = (type: string) => {
	switch (type) {
		case 'strength':
			return 'Fuerza'
		case 'cardio':
			return 'Cardio'
		case 'flexibility':
			return 'Flexibilidad'
		case 'mixed':
			return 'Mixto'
		default:
			return type
	}
}

const getDifficultyColor = (difficulty: string) => {
	switch (difficulty) {
		case 'beginner':
			return 'bg-green-100 text-green-700'
		case 'intermediate':
			return 'bg-yellow-100 text-yellow-700'
		case 'advanced':
			return 'bg-red-100 text-red-700'
		default:
			return 'bg-gray-100 text-gray-700'
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

const getTimeLabel = (date: Date) => {
	if (isToday(date)) {
		return `Hoy a las ${format(date, 'HH:mm')}`
	} else if (isTomorrow(date)) {
		return `Mañana a las ${format(date, 'HH:mm')}`
	} else {
		return format(date, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })
	}
}

export default function UpcomingWorkout({ 
	upcomingWorkouts = mockWorkouts, 
	isLoading = false 
}: UpcomingWorkoutProps) {
	if (isLoading) {
		return (
			<Card className="animate-pulse h-full">
				<CardHeader className="pb-3">
					<div className="h-6 bg-gray-200 rounded w-3/4"></div>
				</CardHeader>
				<CardContent className="space-y-4">
					{[1, 2].map((i) => (
						<div key={i} className="space-y-3 p-4 border rounded-lg">
							<div className="h-4 bg-gray-200 rounded w-1/2"></div>
							<div className="h-3 bg-gray-200 rounded w-3/4"></div>
							<div className="h-3 bg-gray-200 rounded w-1/3"></div>
						</div>
					))}
				</CardContent>
			</Card>
		)
	}

	if (!upcomingWorkouts.length) {
		return (
			<Card className="h-full">
				<CardHeader className="pb-3">
					<CardTitle className="text-lg flex items-center gap-2">
						<Calendar className="h-5 w-5 text-primary" />
						Próximos Entrenamientos
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col items-center justify-center py-8 text-center">
					<Calendar className="h-12 w-12 text-muted-foreground mb-4" />
					<h3 className="font-medium text-muted-foreground mb-2">No hay entrenamientos programados</h3>
					<p className="text-sm text-muted-foreground mb-4">Programa tu próximo entrenamiento para mantener tu rutina</p>
					<Button size="sm" asChild>
						<Link href="/dashboard/calendar">
							<Calendar className="h-4 w-4 mr-2" />
							Programar Entrenamiento
						</Link>
					</Button>
				</CardContent>
			</Card>
		)
	}

	const nextWorkout = upcomingWorkouts[0]
	const nextWorkoutDate = new Date(nextWorkout.scheduledAt)
	const timeUntil = formatDistanceToNow(nextWorkoutDate, { addSuffix: true, locale: es })

	return (
		<Card className="h-full">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg flex items-center gap-2">
						<Calendar className="h-5 w-5 text-primary" />
						Próximos Entrenamientos
					</CardTitle>
					<Badge variant="outline" className="text-xs">
						{upcomingWorkouts.length} programados
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Próximo entrenamiento destacado */}
				<div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
					<div className="flex items-start justify-between mb-3">
						<div className="flex-1">
							<div className="flex items-center gap-2 mb-2">
								<h3 className="font-semibold text-lg">{nextWorkout.name}</h3>
								{nextWorkout.isReminded && (
									<Bell className="h-4 w-4 text-primary" />
								)}
							</div>
							<div className="flex items-center gap-2 mb-2">
								<Badge 
									variant="outline" 
									className={`text-xs ${getWorkoutTypeColor(nextWorkout.type)}`}
								>
									{getWorkoutTypeLabel(nextWorkout.type)}
								</Badge>
								<Badge 
									variant="outline" 
									className={`text-xs ${getDifficultyColor(nextWorkout.difficulty)}`}
								>
									{getDifficultyLabel(nextWorkout.difficulty)}
								</Badge>
							</div>
							<div className="text-sm text-muted-foreground mb-3">
								<div className="flex items-center gap-4 mb-1">
									<div className="flex items-center gap-1">
										<Clock className="h-3 w-3" />
										{getTimeLabel(nextWorkoutDate)}
									</div>
									<div className="flex items-center gap-1">
										<Dumbbell className="h-3 w-3" />
										{nextWorkout.duration} min
									</div>
								</div>
								{nextWorkout.location && (
									<div className="flex items-center gap-1 mb-1">
										<MapPin className="h-3 w-3" />
										{nextWorkout.location}
									</div>
								)}
								{nextWorkout.trainer && (
									<div className="flex items-center gap-1">
										<User className="h-3 w-3" />
										{nextWorkout.trainer}
									</div>
								)}
							</div>
						</div>
						<div className="text-right">
							<div className="text-sm font-medium text-primary mb-1">
								{timeUntil}
							</div>
							{isToday(nextWorkoutDate) && (
								<Badge variant="default" className="bg-green-500 text-white text-xs">
									Hoy
								</Badge>
							)}
						</div>
					</div>

					{nextWorkout.notes && (
						<div className="flex items-start gap-2 p-2 bg-muted/50 rounded text-xs">
							<AlertCircle className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
							<span className="text-muted-foreground">{nextWorkout.notes}</span>
						</div>
					)}

					<div className="flex gap-2">
						<Button size="sm" className="flex-1">
							<Play className="h-4 w-4 mr-2" />
							Iniciar Ahora
						</Button>
						<Button variant="outline" size="sm">
							<Bell className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Lista de próximos entrenamientos */}
				{upcomingWorkouts.length > 1 && (
					<div className="space-y-2">
						<h4 className="text-sm font-medium text-muted-foreground">Próximos</h4>
						{upcomingWorkouts.slice(1, 3).map((workout) => {
							const workoutDate = new Date(workout.scheduledAt)
							return (
								<div 
									key={workout.id} 
									className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
								>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-1">
											<h5 className="font-medium text-sm truncate">{workout.name}</h5>
											<Badge 
												variant="outline" 
												className={`text-xs ${getWorkoutTypeColor(workout.type)}`}
											>
												{getWorkoutTypeLabel(workout.type)}
											</Badge>
										</div>
										<div className="flex items-center gap-3 text-xs text-muted-foreground">
											<div className="flex items-center gap-1">
												<Clock className="h-3 w-3" />
												{format(workoutDate, 'dd/MM HH:mm')}
											</div>
											<div className="flex items-center gap-1">
												<Dumbbell className="h-3 w-3" />
												{workout.duration} min
											</div>
										</div>
									</div>
									<ChevronRight className="h-4 w-4 text-muted-foreground" />
								</div>
							)
						})}
					</div>
				)}

				{/* Botón para ver todos */}
				<div className="pt-2">
					<Button variant="outline" size="sm" className="w-full" asChild>
						<Link href="/dashboard/calendar">
							Ver Calendario Completo
							<ChevronRight className="h-4 w-4 ml-1" />
						</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}