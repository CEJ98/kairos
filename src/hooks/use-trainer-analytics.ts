'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { AnalyticsEngine, TrainerAnalytics } from '@/lib/analytics'
import { logger } from '@/lib/logger'

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

interface UseTrainerAnalyticsReturn {
	analyticsData: AnalyticsData
	chartData: ChartData[]
	clientMetrics: ClientMetrics[]
	isLoading: boolean
	error: string | null
	refreshData: () => Promise<void>
	exportData: () => void
}

export function useTrainerAnalytics(timeRange: string = '30d'): UseTrainerAnalyticsReturn {
	const { data: session } = useSession()
	const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
		clients: { total: 0, active: 0, new: 0, retention: 0 },
		workouts: { total: 0, completed: 0, avgDuration: 0, completionRate: 0 },
		revenue: { monthly: 0, growth: 0, projected: 0 },
		engagement: { dailyActive: 0, weeklyActive: 0, avgSessionTime: 0 }
	})
	const [chartData, setChartData] = useState<ChartData[]>([])
	const [clientMetrics, setClientMetrics] = useState<ClientMetrics[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchAnalyticsData = useCallback(async () => {
		if (!session?.user?.id || session.user.role !== 'TRAINER') {
			return
		}

		try {
			setIsLoading(true)
			setError(null)

			// Obtener analytics del entrenador
			const analyticsEngine = AnalyticsEngine.getInstance()
			const trainerAnalytics = await analyticsEngine.generateTrainerAnalytics(session.user.id)

			// Obtener datos históricos para gráficos
			const historicalResponse = await fetch(`/api/analytics/trainer/historical?timeRange=${timeRange}`)
			const historicalData = historicalResponse.ok ? await historicalResponse.json() : []

			// Obtener métricas de clientes individuales
			const clientsResponse = await fetch('/api/analytics/trainer/clients')
			const clientsData = clientsResponse.ok ? await clientsResponse.json() : []

			// Transformar datos para el componente
			const transformedAnalytics: AnalyticsData = {
				clients: {
					total: trainerAnalytics.totalClients,
					active: trainerAnalytics.activeClients,
					new: Math.max(0, trainerAnalytics.totalClients - (historicalData[0]?.clients || 0)),
					retention: trainerAnalytics.clientRetentionRate
				},
				workouts: {
					total: trainerAnalytics.workoutsCreated,
					completed: Math.floor(trainerAnalytics.workoutsCreated * 0.85), // Estimación
					avgDuration: 45, // Valor por defecto, se puede calcular desde la DB
					completionRate: 85 // Valor por defecto
				},
				revenue: {
					monthly: trainerAnalytics.revenueGenerated,
					growth: calculateGrowthRate(historicalData),
					projected: trainerAnalytics.revenueGenerated * 1.2 // Proyección simple
				},
				engagement: {
					dailyActive: Math.floor(trainerAnalytics.activeClients * 0.7),
					weeklyActive: trainerAnalytics.activeClients,
					avgSessionTime: Math.floor(trainerAnalytics.responseTime / 60) // Convertir a minutos
				}
			}

			setAnalyticsData(transformedAnalytics)
			setChartData(historicalData)
			setClientMetrics(clientsData)

		} catch (err) {
			logger.error('Error fetching trainer analytics', err, 'ANALYTICS')
			setError('Error al cargar los datos de analytics')
		} finally {
			setIsLoading(false)
		}
	}, [session?.user?.id, session?.user?.role, timeRange])

	const refreshData = useCallback(async () => {
		await fetchAnalyticsData()
	}, [fetchAnalyticsData])

	const exportData = useCallback(() => {
		try {
			const dataToExport = {
				analyticsData,
				chartData,
				clientMetrics,
				exportedAt: new Date().toISOString(),
				timeRange
			}

			const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
				type: 'application/json'
			})

			const url = URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = url
			link.download = `trainer-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`
			link.click()
			URL.revokeObjectURL(url)

			logger.debug('Analytics data exported successfully')
		} catch (err) {
			logger.error('Error exporting analytics data', err, 'ANALYTICS')
		}
	}, [analyticsData, chartData, clientMetrics, timeRange])

	useEffect(() => {
		fetchAnalyticsData()
	}, [fetchAnalyticsData])

	return {
		analyticsData,
		chartData,
		clientMetrics,
		isLoading,
		error,
		refreshData,
		exportData
	}
}

// Función auxiliar para calcular tasa de crecimiento
function calculateGrowthRate(historicalData: ChartData[]): number {
	if (historicalData.length < 2) return 0

	const latest = historicalData[historicalData.length - 1]
	const previous = historicalData[historicalData.length - 2]

	if (!previous.revenue || previous.revenue === 0) return 0

	return Math.round(((latest.revenue - previous.revenue) / previous.revenue) * 100 * 10) / 10
}