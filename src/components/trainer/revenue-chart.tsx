'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
	LineChart, Line, AreaChart, Area, BarChart, Bar, 
	XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { DollarSign, TrendingUp, TrendingDown, Calendar, Target } from 'lucide-react'

interface RevenueData {
	date: string
	revenue: number
	clients: number
	sessions: number
	projected?: number
}

interface RevenueChartProps {
	data?: RevenueData[]
	timeframe?: 'week' | 'month' | 'quarter' | 'year'
	onTimeframeChange?: (timeframe: string) => void
}

const defaultData: RevenueData[] = [
	{ date: 'Ene', revenue: 1800, clients: 32, sessions: 120 },
	{ date: 'Feb', revenue: 2100, clients: 35, sessions: 140 },
	{ date: 'Mar', revenue: 2450, clients: 38, sessions: 156 },
	{ date: 'Abr', revenue: 2200, clients: 36, sessions: 144 },
	{ date: 'May', revenue: 2650, clients: 42, sessions: 168 },
	{ date: 'Jun', revenue: 2800, clients: 45, sessions: 180, projected: 3000 }
]

const weeklyData: RevenueData[] = [
	{ date: 'Lun', revenue: 420, clients: 8, sessions: 12 },
	{ date: 'Mar', revenue: 380, clients: 7, sessions: 11 },
	{ date: 'Mié', revenue: 450, clients: 9, sessions: 14 },
	{ date: 'Jue', revenue: 520, clients: 10, sessions: 16 },
	{ date: 'Vie', revenue: 480, clients: 9, sessions: 15 },
	{ date: 'Sáb', revenue: 350, clients: 6, sessions: 10 },
	{ date: 'Dom', revenue: 280, clients: 5, sessions: 8 }
]

export default function RevenueChart({ 
	data, 
	timeframe = 'month',
	onTimeframeChange 
}: RevenueChartProps) {
	const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe)
	const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('area')

	const chartData = selectedTimeframe === 'week' ? weeklyData : (data || defaultData)
	
	// Calcular estadísticas
	const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0)
	const avgRevenue = totalRevenue / chartData.length
	const lastPeriodRevenue = chartData[chartData.length - 2]?.revenue || 0
	const currentRevenue = chartData[chartData.length - 1]?.revenue || 0
	const growthRate = lastPeriodRevenue > 0 ? ((currentRevenue - lastPeriodRevenue) / lastPeriodRevenue) * 100 : 0
	const isGrowing = growthRate > 0

	const handleTimeframeChange = (newTimeframe: string) => {
		setSelectedTimeframe(newTimeframe as 'week' | 'month' | 'quarter' | 'year')
		onTimeframeChange?.(newTimeframe)
	}

	const renderChart = () => {
		const commonProps = {
			data: chartData,
			margin: { top: 5, right: 30, left: 20, bottom: 5 }
		}

		switch (chartType) {
			case 'line':
				return (
					<LineChart {...commonProps}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="date" />
						<YAxis />
						<Tooltip formatter={(value, name) => [`$${value}`, name === 'revenue' ? 'Ingresos' : name]} />
						<Legend />
						<Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="Ingresos" />
						{chartData.some(d => d.projected) && (
							<Line type="monotone" dataKey="projected" stroke="#10B981" strokeDasharray="5 5" name="Proyectado" />
						)}
					</LineChart>
				)
			case 'bar':
				return (
					<BarChart {...commonProps}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="date" />
						<YAxis />
						<Tooltip formatter={(value, name) => [`$${value}`, name === 'revenue' ? 'Ingresos' : name]} />
						<Legend />
						<Bar dataKey="revenue" fill="#3B82F6" name="Ingresos" />
					</BarChart>
				)
			default: // area
				return (
					<AreaChart {...commonProps}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="date" />
						<YAxis />
						<Tooltip formatter={(value, name) => [`$${value}`, name === 'revenue' ? 'Ingresos' : name]} />
						<Legend />
						<Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} name="Ingresos" />
						{chartData.some(d => d.projected) && (
							<Area type="monotone" dataKey="projected" stroke="#10B981" fill="#10B981" fillOpacity={0.2} name="Proyectado" />
						)}
					</AreaChart>
				)
		}
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<DollarSign className="h-5 w-5 text-primary" />
						Ingresos
					</CardTitle>
					<div className="flex gap-2">
						<Select value={chartType} onValueChange={(value) => setChartType(value as 'line' | 'area' | 'bar')}>
							<SelectTrigger className="w-24">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="area">Área</SelectItem>
								<SelectItem value="line">Línea</SelectItem>
								<SelectItem value="bar">Barras</SelectItem>
							</SelectContent>
						</Select>
						<Select value={selectedTimeframe} onValueChange={handleTimeframeChange}>
							<SelectTrigger className="w-32">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="week">Esta semana</SelectItem>
								<SelectItem value="month">Este mes</SelectItem>
								<SelectItem value="quarter">Trimestre</SelectItem>
								<SelectItem value="year">Año</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
				
				{/* Stats Summary */}
				<div className="grid grid-cols-3 gap-4 mt-4">
					<div className="text-center">
						<div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
						<div className="text-sm text-muted-foreground">Total</div>
					</div>
					<div className="text-center">
						<div className="text-2xl font-bold">${Math.round(avgRevenue).toLocaleString()}</div>
						<div className="text-sm text-muted-foreground">Promedio</div>
					</div>
					<div className="text-center">
						<div className="flex items-center justify-center gap-1">
							{isGrowing ? (
								<TrendingUp className="h-4 w-4 text-green-500" />
							) : (
								<TrendingDown className="h-4 w-4 text-red-500" />
							)}
							<span className={`text-2xl font-bold ${isGrowing ? 'text-green-500' : 'text-red-500'}`}>
								{Math.abs(growthRate).toFixed(1)}%
							</span>
						</div>
						<div className="text-sm text-muted-foreground">Crecimiento</div>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={300}>
					{renderChart()}
				</ResponsiveContainer>
				
				{/* Additional Metrics */}
				<div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t">
					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground">Clientes activos</span>
						<Badge variant="secondary">
							{chartData[chartData.length - 1]?.clients || 0}
						</Badge>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground">Sesiones completadas</span>
						<Badge variant="secondary">
							{chartData[chartData.length - 1]?.sessions || 0}
						</Badge>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground">Ingreso por cliente</span>
						<Badge variant="outline">
							${Math.round(currentRevenue / (chartData[chartData.length - 1]?.clients || 1))}
						</Badge>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground">Ingreso por sesión</span>
						<Badge variant="outline">
							${Math.round(currentRevenue / (chartData[chartData.length - 1]?.sessions || 1))}
						</Badge>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}