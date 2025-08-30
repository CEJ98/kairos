'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Clock, Flame, Activity } from 'lucide-react'

interface WeeklyStatsData {
	totalWorkouts: number
	totalMinutes: number
	caloriesBurned: number
	avgIntensity: number
	weeklyGoal: number
}

interface WeeklyStatsProps {
	data?: WeeklyStatsData
}

const defaultData: WeeklyStatsData = {
	totalWorkouts: 4,
	totalMinutes: 180,
	caloriesBurned: 850,
	avgIntensity: 7.5,
	weeklyGoal: 5
}

export default function WeeklyStats({ data = defaultData }: WeeklyStatsProps) {
	const goalProgress = Math.round((data.totalWorkouts / data.weeklyGoal) * 100)
	const avgWorkoutDuration = Math.round(data.totalMinutes / data.totalWorkouts)

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-lg flex items-center gap-2">
					<BarChart3 className="h-5 w-5 text-primary" />
					Estadísticas Semanales
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<Activity className="h-4 w-4 text-blue-500" />
							<span className="text-sm text-muted-foreground">Entrenamientos</span>
						</div>
						<div className="text-2xl font-bold">{data.totalWorkouts}</div>
						<Badge variant={goalProgress >= 100 ? 'default' : 'secondary'} className="text-xs">
							{goalProgress}% del objetivo
						</Badge>
					</div>

					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<Clock className="h-4 w-4 text-green-500" />
							<span className="text-sm text-muted-foreground">Tiempo total</span>
						</div>
						<div className="text-2xl font-bold">{data.totalMinutes}m</div>
						<div className="text-xs text-muted-foreground">
							~{avgWorkoutDuration}m por sesión
						</div>
					</div>

					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<Flame className="h-4 w-4 text-orange-500" />
							<span className="text-sm text-muted-foreground">Calorías</span>
						</div>
						<div className="text-2xl font-bold">{data.caloriesBurned}</div>
						<div className="text-xs text-muted-foreground">
							~{Math.round(data.caloriesBurned / data.totalWorkouts)} por sesión
						</div>
					</div>

					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<div className="h-4 w-4 rounded-full bg-purple-500" />
							<span className="text-sm text-muted-foreground">Intensidad</span>
						</div>
						<div className="text-2xl font-bold">{data.avgIntensity}/10</div>
						<Badge 
							variant={data.avgIntensity >= 8 ? 'default' : data.avgIntensity >= 6 ? 'secondary' : 'outline'}
							className="text-xs"
						>
							{data.avgIntensity >= 8 ? 'Alta' : data.avgIntensity >= 6 ? 'Media' : 'Baja'}
						</Badge>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}