'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
	TrendingUp, 
	TrendingDown, 
	Target, 
	Scale, 
	Activity,
	Heart,
	Calendar
} from 'lucide-react'
import { 
	LineChart, 
	Line, 
	XAxis, 
	YAxis, 
	CartesianGrid, 
	Tooltip, 
	ResponsiveContainer,
	AreaChart,
	Area,
	BarChart,
	Bar
} from 'recharts'

interface ProgressDataPoint {
	date: string
	weight: number
	bodyFat: number
	muscle: number
	workouts: number
}

interface ProgressData {
	weeklyGoal: number
	currentProgress: number
	lastWeekProgress: number
	streak: number
	currentWeight: number
	weightGoal: number
	weightChange: number
	currentBodyFat: number
	bodyFatGoal: number
	bodyFatChange: number
	progressHistory: ProgressDataPoint[]
}

interface ProgressChartProps {
	data?: ProgressData
}

const defaultData: ProgressData = {
	weeklyGoal: 5,
	currentProgress: 3,
	lastWeekProgress: 4,
	streak: 7,
	currentWeight: 75.2,
	weightGoal: 70.0,
	weightChange: -0.8,
	currentBodyFat: 18.5,
	bodyFatGoal: 15.0,
	bodyFatChange: -1.2,
	progressHistory: [
		{ date: '2024-01-01', weight: 78.5, bodyFat: 22.1, muscle: 58.2, workouts: 2 },
		{ date: '2024-01-08', weight: 77.8, bodyFat: 21.3, muscle: 58.8, workouts: 3 },
		{ date: '2024-01-15', weight: 77.1, bodyFat: 20.5, muscle: 59.1, workouts: 4 },
		{ date: '2024-01-22', weight: 76.4, bodyFat: 19.8, muscle: 59.5, workouts: 3 },
		{ date: '2024-01-29', weight: 75.9, bodyFat: 19.1, muscle: 59.8, workouts: 5 },
		{ date: '2024-02-05', weight: 75.2, bodyFat: 18.5, muscle: 60.2, workouts: 3 }
	]
}

const CustomTooltip = ({ active, payload, label }: any) => {
	if (active && payload && payload.length) {
		return (
			<div className="bg-background border rounded-lg shadow-lg p-3">
				<p className="text-sm font-medium mb-2">{`Semana: ${label}`}</p>
				{payload.map((entry: any, index: number) => (
					<p key={index} className="text-sm" style={{ color: entry.color }}>
						{`${entry.name}: ${entry.value}${entry.dataKey === 'weight' ? ' kg' : entry.dataKey === 'bodyFat' ? '%' : ''}`}
					</p>
				))}
			</div>
		)
	}
	return null
}

export default function ProgressChart({ data = defaultData }: ProgressChartProps) {
	const progressPercentage = Math.round((data.currentProgress / data.weeklyGoal) * 100)
	const isImproving = data.currentProgress >= data.lastWeekProgress
	const difference = Math.abs(data.currentProgress - data.lastWeekProgress)
	const isWeightImproving = data.weightChange < 0 // Perder peso es positivo
	const isBodyFatImproving = data.bodyFatChange < 0 // Perder grasa corporal es positivo

	return (
		<Card className="h-full">
			<CardHeader className="pb-3">
				<CardTitle className="text-lg flex items-center gap-2">
					<Activity className="h-5 w-5 text-primary" />
					Progreso Corporal
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Métricas principales */}
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<Scale className="h-4 w-4 text-blue-500" />
							<span className="text-sm font-medium">Peso</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-2xl font-bold">{data.currentWeight} kg</span>
							<Badge 
								variant={isWeightImproving ? "default" : "secondary"}
								className={isWeightImproving ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
							>
								{isWeightImproving ? (
									<TrendingDown className="h-3 w-3 mr-1" />
								) : (
									<TrendingUp className="h-3 w-3 mr-1" />
								)}
								{Math.abs(data.weightChange)} kg
							</Badge>
						</div>
						<div className="text-xs text-muted-foreground">
							Meta: {data.weightGoal} kg
						</div>
					</div>

					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<Heart className="h-4 w-4 text-red-500" />
							<span className="text-sm font-medium">Grasa Corporal</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-2xl font-bold">{data.currentBodyFat}%</span>
							<Badge 
								variant={isBodyFatImproving ? "default" : "secondary"}
								className={isBodyFatImproving ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
							>
								{isBodyFatImproving ? (
									<TrendingDown className="h-3 w-3 mr-1" />
								) : (
									<TrendingUp className="h-3 w-3 mr-1" />
								)}
								{Math.abs(data.bodyFatChange)}%
							</Badge>
						</div>
						<div className="text-xs text-muted-foreground">
							Meta: {data.bodyFatGoal}%
						</div>
					</div>
				</div>

				{/* Gráfico de progreso */}
				<div className="space-y-3">
					<h4 className="text-sm font-medium flex items-center gap-2">
						<Calendar className="h-4 w-4" />
						Progreso de las últimas 6 semanas
					</h4>
					<div className="h-48">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={data.progressHistory}>
								<CartesianGrid strokeDasharray="3 3" className="opacity-30" />
								<XAxis 
									dataKey="date" 
									tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
									className="text-xs"
								/>
								<YAxis className="text-xs" />
								<Tooltip content={<CustomTooltip />} />
								<Line 
									type="monotone" 
									dataKey="weight" 
									stroke="#3b82f6" 
									strokeWidth={2}
									name="Peso"
									dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
								/>
								<Line 
									type="monotone" 
									dataKey="bodyFat" 
									stroke="#ef4444" 
									strokeWidth={2}
									name="Grasa Corporal"
									dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* Progreso semanal de entrenamientos */}
				<div className="space-y-3 pt-4 border-t">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Target className="h-4 w-4 text-primary" />
							<span className="text-sm font-medium">Entrenamientos esta semana</span>
						</div>
						<span className="text-sm font-medium">{data.currentProgress}/{data.weeklyGoal}</span>
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
			</CardContent>
		</Card>
	)
}