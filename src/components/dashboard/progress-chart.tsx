'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Target } from 'lucide-react'

interface ProgressData {
	weeklyGoal: number
	currentProgress: number
	lastWeekProgress: number
	streak: number
}

interface ProgressChartProps {
	data?: ProgressData
}

const defaultData: ProgressData = {
	weeklyGoal: 5,
	currentProgress: 3,
	lastWeekProgress: 4,
	streak: 7
}

export default function ProgressChart({ data = defaultData }: ProgressChartProps) {
	const progressPercentage = Math.round((data.currentProgress / data.weeklyGoal) * 100)
	const isImproving = data.currentProgress >= data.lastWeekProgress
	const difference = Math.abs(data.currentProgress - data.lastWeekProgress)

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-lg flex items-center gap-2">
					<Target className="h-5 w-5 text-primary" />
					Progreso Semanal
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Entrenamientos completados</span>
						<span className="font-medium">{data.currentProgress}/{data.weeklyGoal}</span>
					</div>
					<Progress value={progressPercentage} className="h-2" />
					<div className="flex justify-between items-center text-sm">
						<span className="text-muted-foreground">{progressPercentage}% completado</span>
						<div className="flex items-center gap-1">
							{isImproving ? (
								<TrendingUp className="h-3 w-3 text-green-500" />
							) : (
								<TrendingDown className="h-3 w-3 text-red-500" />
							)}
							<span className={isImproving ? 'text-green-500' : 'text-red-500'}>
								{isImproving ? '+' : '-'}{difference} vs semana pasada
							</span>
						</div>
					</div>
				</div>

				<div className="pt-2 border-t">
					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground">Racha actual</span>
						<span className="text-lg font-bold text-primary">{data.streak} días</span>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}