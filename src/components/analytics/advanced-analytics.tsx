'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { 
	LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
	XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { logger } from '@/lib/logger'
import { 
	TrendingUp, TrendingDown, Users, Activity, Target, Calendar,
	Clock, Zap, Award, AlertCircle, Download, Filter
} from 'lucide-react'

interface AnalyticsData {
	clients: {
		total: number
		active: number
		new: number
		retention: number
	}
	workouts: {
		total: number
		completed: number
		avgDuration: number
		completionRate: number
	}
	revenue: {
		monthly: number
		growth: number
		projected: number
	}
	engagement: {
		dailyActive: number
		weeklyActive: number
		avgSessionTime: number
	}
}

interface ChartData {
	date: string
	clients: number
	workouts: number
	revenue: number
	engagement: number
}

interface ClientMetrics {
	id: string
	name: string
	workoutsCompleted: number
	avgIntensity: number
	progress: number
	lastActive: string
	status: 'active' | 'inactive' | 'at-risk'
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6']

const mockAnalyticsData: AnalyticsData = {
	clients: { total: 45, active: 38, new: 7, retention: 84.4 },
	workouts: { total: 342, completed: 289, avgDuration: 52, completionRate: 84.5 },
	revenue: { monthly: 4250, growth: 12.5, projected: 5100 },
	engagement: { dailyActive: 28, weeklyActive: 41, avgSessionTime: 35 }
}

const mockChartData: ChartData[] = [
	{ date: '2024-01-01', clients: 35, workouts: 245, revenue: 3200, engagement: 75 },
	{ date: '2024-01-08', clients: 37, workouts: 268, revenue: 3450, engagement: 78 },
	{ date: '2024-01-15', clients: 39, workouts: 289, revenue: 3680, engagement: 82 },
	{ date: '2024-01-22', clients: 42, workouts: 312, revenue: 3920, engagement: 85 },
	{ date: '2024-01-29', clients: 45, workouts: 342, revenue: 4250, engagement: 88 }
]

const mockClientMetrics: ClientMetrics[] = [
	{ id: '1', name: 'Ana García', workoutsCompleted: 24, avgIntensity: 8.2, progress: 92, lastActive: '2024-01-29', status: 'active' },
	{ id: '2', name: 'Carlos López', workoutsCompleted: 18, avgIntensity: 7.5, progress: 78, lastActive: '2024-01-28', status: 'active' },
	{ id: '3', name: 'María Rodríguez', workoutsCompleted: 12, avgIntensity: 6.8, progress: 65, lastActive: '2024-01-25', status: 'at-risk' },
	{ id: '4', name: 'Juan Martínez', workoutsCompleted: 31, avgIntensity: 9.1, progress: 95, lastActive: '2024-01-29', status: 'active' },
	{ id: '5', name: 'Laura Sánchez', workoutsCompleted: 8, avgIntensity: 5.2, progress: 45, lastActive: '2024-01-20', status: 'inactive' }
]

export default function AdvancedAnalytics() {
	const [timeRange, setTimeRange] = useState('30d')
	const [selectedMetric, setSelectedMetric] = useState('overview')
	const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(mockAnalyticsData)
	const [chartData, setChartData] = useState<ChartData[]>(mockChartData)
	const [clientMetrics, setClientMetrics] = useState<ClientMetrics[]>(mockClientMetrics)

	// Simular carga de datos
	useEffect(() => {
		// Aquí se cargarían los datos reales desde la API
		setAnalyticsData(mockAnalyticsData)
		setChartData(mockChartData)
		setClientMetrics(mockClientMetrics)
	}, [timeRange])

	const exportData = () => {
		// Implementar exportación de datos
		logger.debug('Exporting analytics data...')
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'active': return 'bg-green-500'
			case 'at-risk': return 'bg-yellow-500'
			case 'inactive': return 'bg-red-500'
			default: return 'bg-gray-500'
		}
	}

	const getStatusText = (status: string) => {
		switch (status) {
			case 'active': return 'Activo'
			case 'at-risk': return 'En Riesgo'
			case 'inactive': return 'Inactivo'
			default: return 'Desconocido'
		}
	}

	return (
		<div className="space-y-6">
			{/* Header con controles */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div className="min-w-0">
					<h1 className="text-2xl sm:text-3xl font-bold">Analytics Avanzado</h1>
					<p className="text-sm sm:text-base text-muted-foreground">Métricas detalladas de rendimiento y clientes</p>
				</div>
				<div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
					<Select value={timeRange} onValueChange={setTimeRange}>
						<SelectTrigger className="w-full sm:w-32 h-9">
							<SelectValue className="text-sm" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="7d" className="text-sm">7 días</SelectItem>
							<SelectItem value="30d" className="text-sm">30 días</SelectItem>
							<SelectItem value="90d" className="text-sm">90 días</SelectItem>
							<SelectItem value="1y" className="text-sm">1 año</SelectItem>
						</SelectContent>
					</Select>
					<Button variant="outline" onClick={exportData} className="h-9">
						<Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
						<span className="text-sm">Exportar</span>
					</Button>
				</div>
			</div>

			{/* KPIs principales */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
				<Card className="p-3 sm:p-6">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
						<CardTitle className="text-xs sm:text-sm font-medium">Clientes Totales</CardTitle>
						<Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
					</CardHeader>
					<CardContent className="p-0 pt-2">
						<div className="text-xl sm:text-2xl font-bold">{analyticsData.clients.total}</div>
						<p className="text-xs text-muted-foreground">
							<span className="text-green-600 flex items-center">
								<TrendingUp className="h-3 w-3 mr-1" />
								+{analyticsData.clients.new} nuevos
							</span>
						</p>
					</CardContent>
				</Card>

				<Card className="p-3 sm:p-6">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
						<CardTitle className="text-xs sm:text-sm font-medium">Entrenamientos</CardTitle>
						<Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
					</CardHeader>
					<CardContent className="p-0 pt-2">
						<div className="text-xl sm:text-2xl font-bold">{analyticsData.workouts.completed}</div>
						<p className="text-xs text-muted-foreground">
							{analyticsData.workouts.completionRate}% completados
						</p>
					</CardContent>
				</Card>

				<Card className="p-3 sm:p-6">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
						<CardTitle className="text-xs sm:text-sm font-medium">Ingresos Mensuales</CardTitle>
						<Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
					</CardHeader>
					<CardContent className="p-0 pt-2">
						<div className="text-xl sm:text-2xl font-bold">${analyticsData.revenue.monthly}</div>
						<p className="text-xs text-muted-foreground">
							<span className="text-green-600 flex items-center">
								<TrendingUp className="h-3 w-3 mr-1" />
								+{analyticsData.revenue.growth}%
							</span>
						</p>
					</CardContent>
				</Card>

				<Card className="p-3 sm:p-6">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
						<CardTitle className="text-xs sm:text-sm font-medium">Retención</CardTitle>
						<Award className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
					</CardHeader>
					<CardContent className="p-0 pt-2">
						<div className="text-xl sm:text-2xl font-bold">{analyticsData.clients.retention}%</div>
						<Progress value={analyticsData.clients.retention} className="mt-2" />
					</CardContent>
				</Card>
			</div>

			{/* Gráficos principales */}
			<Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="space-y-4">
				<TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
					<TabsTrigger value="overview" className="text-xs sm:text-sm py-2">Resumen</TabsTrigger>
					<TabsTrigger value="clients" className="text-xs sm:text-sm py-2">Clientes</TabsTrigger>
					<TabsTrigger value="workouts" className="text-xs sm:text-sm py-2">Entrenamientos</TabsTrigger>
					<TabsTrigger value="revenue" className="text-xs sm:text-sm py-2">Ingresos</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
						<Card className="p-3 sm:p-6">
							<CardHeader className="p-0 pb-3 sm:pb-4">
								<CardTitle className="text-base sm:text-lg">Tendencias Generales</CardTitle>
							</CardHeader>
							<CardContent className="p-0">
								<ResponsiveContainer width="100%" height={250}>
									<LineChart data={chartData}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="date" fontSize={10} interval="preserveStartEnd" />
										<YAxis fontSize={10} />
										<Tooltip contentStyle={{ fontSize: '12px' }} />
										<Legend wrapperStyle={{ fontSize: '12px' }} />
										<Line type="monotone" dataKey="clients" stroke="#10B981" name="Clientes" strokeWidth={2} />
										<Line type="monotone" dataKey="workouts" stroke="#3B82F6" name="Entrenamientos" strokeWidth={2} />
									</LineChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						<Card className="p-3 sm:p-6">
							<CardHeader className="p-0 pb-3 sm:pb-4">
								<CardTitle className="text-base sm:text-lg">Distribución de Clientes</CardTitle>
							</CardHeader>
							<CardContent className="p-0">
								<ResponsiveContainer width="100%" height={250}>
									<PieChart>
										<Pie
											data={[
												{ name: 'Activos', value: analyticsData.clients.active },
												{ name: 'Inactivos', value: analyticsData.clients.total - analyticsData.clients.active }
											]}
											cx="50%"
											cy="50%"
											labelLine={false}
											label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
											outerRadius={60}
											fill="#8884d8"
											dataKey="value"
										>
											{[0, 1].map((entry, index) => (
												<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
											))}
										</Pie>
										<Tooltip contentStyle={{ fontSize: '12px' }} />
									</PieChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="clients" className="space-y-4">
					<Card className="p-3 sm:p-6">
						<CardHeader className="p-0 pb-3 sm:pb-4">
							<CardTitle className="text-base sm:text-lg">Métricas de Clientes</CardTitle>
							<CardDescription className="text-xs sm:text-sm">Rendimiento individual de cada cliente</CardDescription>
						</CardHeader>
						<CardContent className="p-0">
							<div className="space-y-3 sm:space-y-4">
								{clientMetrics.map((client) => (
									<div key={client.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
										<div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
											<div className="flex-1 min-w-0">
												<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
													<h4 className="text-sm sm:text-base font-medium truncate">{client.name}</h4>
													<Badge className={getStatusColor(client.status)}>
														<span className="text-xs">{getStatusText(client.status)}</span>
													</Badge>
												</div>
												<p className="text-xs sm:text-sm text-muted-foreground">
													{client.workoutsCompleted} entrenamientos • Intensidad: {client.avgIntensity}/10
												</p>
											</div>
										</div>
										<div className="text-right flex-shrink-0">
											<div className="text-base sm:text-lg font-semibold">{client.progress}%</div>
											<Progress value={client.progress} className="w-16 sm:w-20" />
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="workouts">
					<Card className="p-3 sm:p-6">
						<CardHeader className="p-0 pb-3 sm:pb-4">
							<CardTitle className="text-base sm:text-lg">Análisis de Entrenamientos</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							<ResponsiveContainer width="100%" height={300}>
								<AreaChart data={chartData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="date" fontSize={10} interval="preserveStartEnd" />
									<YAxis fontSize={10} />
									<Tooltip contentStyle={{ fontSize: '12px' }} />
									<Area type="monotone" dataKey="workouts" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} strokeWidth={2} />
								</AreaChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="revenue">
					<Card className="p-3 sm:p-6">
						<CardHeader className="p-0 pb-3 sm:pb-4">
							<CardTitle className="text-base sm:text-lg">Análisis de Ingresos</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							<ResponsiveContainer width="100%" height={300}>
								<BarChart data={chartData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="date" fontSize={10} interval="preserveStartEnd" />
									<YAxis fontSize={10} />
									<Tooltip contentStyle={{ fontSize: '12px' }} />
									<Bar dataKey="revenue" fill="#10B981" />
								</BarChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}