import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

import { logger } from '@/lib/logger'
interface DashboardStats {
	totalWorkouts: number
	completedWorkouts: number
	weeklyDistance: number
	weeklyCalories: number
	weeklyPoints: number
	currentStreak: number
	dailySteps: number
	dailyStepsGoal: number
	dailyCalories: number
	dailyCaloriesGoal: number
	currentWeight: number
	weightGoal: number
	weightChange: number
	restingHeartRate: number
	heartRate: number
	lastWorkout: string | null
	upcomingWorkouts: number
}

interface WeeklyProgress {
	date: string
	workouts: number
	calories: number
	duration: number
}

interface PersonalRecord {
	id: string
	exerciseName: string
	recordType: string
	value: number
	reps?: number
	achievedAt: string
}

interface DashboardData {
	stats: DashboardStats
	weeklyProgress: WeeklyProgress[]
	recentRecords: PersonalRecord[]
	isLoading: boolean
	error: string | null
	refresh: () => void
}

export function useDashboardData(): DashboardData {
	const { data: session } = useSession()
	const [stats, setStats] = useState<DashboardStats>({
		totalWorkouts: 0,
		completedWorkouts: 0,
		weeklyDistance: 0,
		weeklyCalories: 0,
		weeklyPoints: 0,
		currentStreak: 0,
		dailySteps: 0,
		dailyStepsGoal: 10000,
		dailyCalories: 0,
		dailyCaloriesGoal: 2340,
		currentWeight: 0,
		weightGoal: 75,
		weightChange: 0,
		restingHeartRate: 72,
		heartRate: 0,
		lastWorkout: null,
		upcomingWorkouts: 0
	})
	const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress[]>([])
	const [recentRecords, setRecentRecords] = useState<PersonalRecord[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchDashboardData = async () => {
		if (!session?.user) return

		try {
			setIsLoading(true)
			setError(null)

			// Obtener datos de progreso (últimos 7 días)
			const progressResponse = await fetch('/api/progress?timeframe=7&type=workouts')
			if (!progressResponse.ok) throw new Error('Error al obtener progreso')
			const progressData = await progressResponse.json()

			// Obtener récords personales recientes
			const recordsResponse = await fetch('/api/records?limit=5')
			if (!recordsResponse.ok) throw new Error('Error al obtener récords')
			const recordsData = await recordsResponse.json()

			// Obtener mediciones corporales más recientes
			const measurementsResponse = await fetch('/api/measurements?limit=1')
			if (!measurementsResponse.ok) throw new Error('Error al obtener mediciones')
			const measurementsData = await measurementsResponse.json()

			// Obtener rutinas del usuario
			const workoutsResponse = await fetch('/api/workouts?limit=100')
			if (!workoutsResponse.ok) throw new Error('Error al obtener rutinas')
			const workoutsData = await workoutsResponse.json()

			// Procesar datos de estadísticas
			const workoutStats = progressData.workouts?.stats || {}
			const dailyWorkouts = progressData.workouts?.daily || []
			const latestMeasurement = measurementsData.measurements?.[0] || measurementsData.latest

			// Calcular estadísticas del dashboard
			const totalWorkouts = workoutsData.pagination?.total || 0
			const completedWorkouts = workoutStats._count?.id || 0
			const weeklyCalories = workoutStats._sum?.caloriesBurned || 0
			const avgDuration = workoutStats._avg?.duration || 0

			// Calcular racha actual (días consecutivos con entrenamientos)
			let currentStreak = 0
			const today = new Date()
			for (let i = 0; i < 30; i++) {
				const checkDate = new Date(today)
				checkDate.setDate(today.getDate() - i)
				const dateStr = checkDate.toISOString().split('T')[0]
				
				const hasWorkout = dailyWorkouts.some((day: any) => 
					new Date(day.date).toISOString().split('T')[0] === dateStr
				)
				
				if (hasWorkout) {
					currentStreak++
				} else if (i > 0) { // No contar el día actual si no hay entrenamiento
					break
				}
			}

			// Simular datos de pasos y frecuencia cardíaca (en el futuro se integrarían con dispositivos)
			const dailySteps = Math.floor(Math.random() * 5000) + 5000 // 5000-10000 pasos
			const heartRate = Math.floor(Math.random() * 20) + 70 // 70-90 bpm

			// Actualizar estado
			setStats({
				totalWorkouts,
				completedWorkouts,
				weeklyDistance: Math.floor(dailySteps * 0.0008 * 7), // Aproximación km por semana
				weeklyCalories,
				weeklyPoints: completedWorkouts * 50 + currentStreak * 10, // Sistema de puntos
				currentStreak,
				dailySteps,
				dailyStepsGoal: 10000,
				dailyCalories: Math.floor(weeklyCalories / 7),
				dailyCaloriesGoal: 2340,
				currentWeight: latestMeasurement?.weight || 70,
				weightGoal: 75,
				weightChange: 0,
				restingHeartRate: 72,
				heartRate,
				lastWorkout: workoutStats._count?.id > 0 ? 'Hoy' : null,
				upcomingWorkouts: Math.floor(Math.random() * 3) + 1
			})

			// Procesar progreso semanal
			const weeklyData = dailyWorkouts.map((day: any) => ({
				date: day.date,
				workouts: day.count,
				calories: day.total_calories || 0,
				duration: Math.floor((day.total_duration || 0) / 60) // convertir a minutos
			}))
			setWeeklyProgress(weeklyData)

			// Procesar récords recientes
			const records = (recordsData.bestRecords || recordsData.records || []).slice(0, 5).map((record: any) => ({
				id: record.id,
				exerciseName: record.exercise?.name || 'Ejercicio',
				recordType: record.recordType,
				value: record.value,
				reps: record.reps,
				achievedAt: record.achievedAt
			}))
			setRecentRecords(records)

		} catch (err) {
			logger.error('Error fetching dashboard data:', err)
			setError(err instanceof Error ? err.message : 'Error desconocido')
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		fetchDashboardData()
	}, [session, fetchDashboardData])

	return {
		stats,
		weeklyProgress,
		recentRecords,
		isLoading,
		error,
		refresh: fetchDashboardData
	}
}