'use client'

import { useState, useEffect, useCallback } from 'react'
import { TrainerMetrics, ClientMetrics, RecentActivity } from '@/lib/trainer-metrics'

export interface TrainerMetricsData {
	metrics: TrainerMetrics | null
	clients: ClientMetrics[]
	recentActivity: RecentActivity[]
}

export interface UseTrainerMetricsReturn {
	data: TrainerMetricsData
	loading: boolean
	error: string | null
	refresh: () => Promise<void>
	getClientDetails: (clientId: string) => Promise<ClientMetrics | null>
}

export function useTrainerMetrics(limit: number = 10): UseTrainerMetricsReturn {
	const [data, setData] = useState<TrainerMetricsData>({
		metrics: null,
		clients: [],
		recentActivity: []
	})
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchMetrics = useCallback(async () => {
		try {
			setLoading(true)
			setError(null)

			const response = await fetch(`/api/trainer/metrics?limit=${limit}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Error al cargar métricas')
			}

			const result = await response.json()
			setData({
				metrics: result.metrics,
				clients: result.clients,
				recentActivity: result.recentActivity
			})

		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
			setError(errorMessage)
			console.error('Error fetching trainer metrics:', err)
		} finally {
			setLoading(false)
		}
	}, [limit])

	const getClientDetails = async (clientId: string): Promise<ClientMetrics | null> => {
		try {
			const response = await fetch('/api/trainer/metrics', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ clientId })
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Error al cargar detalles del cliente')
			}

			const result = await response.json()
			return result.client

		} catch (err) {
			console.error('Error fetching client details:', err)
			return null
		}
	}

	const refresh = useCallback(async () => {
		await fetchMetrics()
	}, [fetchMetrics])

	useEffect(() => {
		fetchMetrics()
	}, [limit, fetchMetrics])

	return {
		data,
		loading,
		error,
		refresh,
		getClientDetails
	}
}

// Hook para métricas en tiempo real (opcional)
export function useTrainerMetricsRealTime(refreshInterval: number = 30000) {
	const metrics = useTrainerMetrics()

	useEffect(() => {
		if (refreshInterval <= 0) return

		const interval = setInterval(() => {
			metrics.refresh()
		}, refreshInterval)

		return () => clearInterval(interval)
	}, [refreshInterval, metrics])

	return metrics
}

// Utilidades para formatear datos
export const formatters = {
	percentage: (value: number) => `${Math.round(value)}%`,
	currency: (value: number) => `$${value.toFixed(2)}`,
	rating: (value: number) => `${value.toFixed(1)} ⭐`,
	streak: (days: number) => {
		if (days === 0) return 'Sin racha'
		if (days === 1) return '1 día'
		return `${days} días`
	},
	subscription: (plan: string) => {
		const plans: Record<string, string> = {
			'FREE': 'Gratis',
			'BASIC': 'Básico',
			'PRO': 'Pro',
			'TRAINER': 'Trainer'
		}
		return plans[plan] || plan
	},
	activityType: (type: string) => {
		const types: Record<string, string> = {
			'workout_completed': '💪 Entrenamiento completado',
			'new_client': '👋 Nuevo cliente',
			'message': '💬 Mensaje',
			'milestone': '🏆 Logro alcanzado',
			'missed_session': '⚠️ Sesión perdida'
		}
		return types[type] || type
	},
	timeAgo: (date: Date | string) => {
		const dateObj = typeof date === 'string' ? new Date(date) : date
		const now = new Date()
		const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60))

		if (diffInMinutes < 60) {
			return `hace ${diffInMinutes} minutos`
		} else if (diffInMinutes < 1440) { // 24 horas
			const hours = Math.floor(diffInMinutes / 60)
			return `hace ${hours} hora${hours > 1 ? 's' : ''}`
		} else {
			const days = Math.floor(diffInMinutes / 1440)
			return `hace ${days} día${days > 1 ? 's' : ''}`
		}
	}
}