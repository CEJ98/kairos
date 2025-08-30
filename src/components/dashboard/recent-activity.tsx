'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle, Play, Calendar, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface ActivityItem {
	id: string
	type: 'workout' | 'measurement' | 'achievement'
	title: string
	description: string
	date: string
	status: 'completed' | 'in_progress' | 'scheduled'
	duration?: number
	intensity?: number
}

interface RecentActivityProps {
	activities?: ActivityItem[]
}

const defaultActivities: ActivityItem[] = [
	{
		id: '1',
		type: 'workout',
		title: 'Entrenamiento de Fuerza',
		description: 'Tren superior - 8 ejercicios',
		date: 'Hoy, 14:30',
		status: 'completed',
		duration: 45,
		intensity: 8
	},
	{
		id: '2',
		type: 'workout',
		title: 'Cardio HIIT',
		description: '20 min de intervalos',
		date: 'Ayer, 09:15',
		status: 'completed',
		duration: 20,
		intensity: 9
	},
	{
		id: '3',
		type: 'measurement',
		title: 'Medición Corporal',
		description: 'Peso: 75kg, Grasa: 12%',
		date: 'Hace 2 días',
		status: 'completed'
	},
	{
		id: '4',
		type: 'workout',
		title: 'Yoga Flow',
		description: 'Flexibilidad y relajación',
		date: 'Mañana, 08:00',
		status: 'scheduled',
		duration: 30
	},
	{
		id: '5',
		type: 'achievement',
		title: '¡Nueva marca personal!',
		description: 'Press banca: 80kg x 5 reps',
		date: 'Hace 3 días',
		status: 'completed'
	}
]

export default function RecentActivity({ activities = defaultActivities }: RecentActivityProps) {
	const getStatusIcon = (status: ActivityItem['status']) => {
		switch (status) {
			case 'completed':
				return <CheckCircle className="h-4 w-4 text-green-500" />
			case 'in_progress':
				return <Play className="h-4 w-4 text-blue-500" />
			case 'scheduled':
				return <Calendar className="h-4 w-4 text-orange-500" />
			default:
				return <Clock className="h-4 w-4 text-gray-500" />
		}
	}

	const getStatusBadge = (status: ActivityItem['status']) => {
		switch (status) {
			case 'completed':
				return <Badge variant="default" className="text-xs">Completado</Badge>
			case 'in_progress':
				return <Badge variant="secondary" className="text-xs">En progreso</Badge>
			case 'scheduled':
				return <Badge variant="outline" className="text-xs">Programado</Badge>
			default:
				return null
		}
	}

	const getTypeColor = (type: ActivityItem['type']) => {
		switch (type) {
			case 'workout':
				return 'bg-blue-100 text-blue-700'
			case 'measurement':
				return 'bg-green-100 text-green-700'
			case 'achievement':
				return 'bg-yellow-100 text-yellow-700'
			default:
				return 'bg-gray-100 text-gray-700'
		}
	}

	return (
		<Card className="h-full mobile-card">
			<CardHeader className="pb-3 mobile-spacing">
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg flex items-center gap-2 responsive-subheading">
						<Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
						<span className="truncate">Actividad Reciente</span>
					</CardTitle>
					<Button variant="ghost" size="sm" asChild className="hidden sm:flex">
						<Link href="/dashboard/activities">
							Ver todo
							<ChevronRight className="h-4 w-4 ml-1" />
						</Link>
					</Button>
				</div>
			</CardHeader>
			<CardContent className="mobile-spacing">
				<div className="space-y-3">
					{activities.slice(0, 4).map((activity) => (
						<div key={activity.id} className="flex items-center mobile-gap p-3 rounded-lg border hover:bg-muted/50 transition-colors touch-target">
							<div className="flex-shrink-0">
								{getStatusIcon(activity.status)}
							</div>
							
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 mb-1">
									<h4 className="responsive-body font-medium truncate">{activity.title}</h4>
									<span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getTypeColor(activity.type)}`}>
										{activity.type === 'workout' ? 'Entreno' : 
										 activity.type === 'measurement' ? 'Medición' : 'Logro'}
									</span>
								</div>
								<p className="responsive-caption text-muted-foreground line-clamp-2">{activity.description}</p>
								<div className="flex items-center gap-2 mt-1 flex-wrap">
									<span className="text-xs text-muted-foreground">{activity.date}</span>
									{activity.duration && (
										<span className="text-xs text-muted-foreground">• {activity.duration}min</span>
									)}
									{activity.intensity && (
										<span className="text-xs text-muted-foreground hidden sm:inline">• Intensidad {activity.intensity}/10</span>
									)}
								</div>
							</div>
							
							<div className="flex-shrink-0 hidden sm:block">
								{getStatusBadge(activity.status)}
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}