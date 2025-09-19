'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

// Tipos locales para evitar importar desde personal-records
export interface PersonalRecord {
	id: string
	userId: string
	exerciseId: string
	recordType: 'MAX_WEIGHT' | 'MAX_REPS' | 'MAX_VOLUME' | 'BEST_TIME' | 'MAX_DISTANCE'
	value: number
	unit: string
	achievedAt: Date
	setData: any
	previousRecord?: PersonalRecord
}

export interface SetPerformance {
	weight?: number
	reps?: number
	duration?: number
	distance?: number
	restTime?: number
}

export interface UsePersonalRecordsReturn {
	records: PersonalRecord[]
	recentRecords: PersonalRecord[]
	exerciseRecords: PersonalRecord[]
	isLoading: boolean
	error: string | null
	evaluateSet: (exerciseId: string, setData: SetPerformance) => Promise<PersonalRecord[]>
	getUserRecords: () => Promise<void>
	getExerciseRecords: (exerciseId: string) => Promise<void>
	getRecentRecords: (limit?: number) => Promise<void>
	formatRecord: (record: PersonalRecord) => string
	getRecordTypeLabel: (recordType: string) => string
}

export function usePersonalRecords(userId?: string): UsePersonalRecordsReturn {
	const [records, setRecords] = useState<PersonalRecord[]>([])
	const [recentRecords, setRecentRecords] = useState<PersonalRecord[]>([])
	const [exerciseRecords, setExerciseRecords] = useState<PersonalRecord[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	/**
	 * Evalúa un set para detectar nuevos records personales
	 */
	const evaluateSet = async (
		exerciseId: string,
		setData: SetPerformance
	): Promise<PersonalRecord[]> => {
		if (!userId) {
			console.warn('No user ID provided for personal records evaluation')
			return []
		}

		try {
			setError(null)
			
			// Calcular volumen si hay reps y peso
			const enhancedSetData = {
				...setData,
				volume: setData.reps && setData.weight ? setData.reps * setData.weight : undefined
			}

			const response = await fetch('/api/records/evaluate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					userId,
					exerciseId,
					setData: enhancedSetData
				})
			})

			if (!response.ok) {
				throw new Error('Failed to evaluate records')
			}

			const newRecords = await response.json()

			// Mostrar notificaciones para nuevos records
			newRecords.forEach((record: PersonalRecord) => {
				const exerciseName = (record as any).exercise?.name || 'Ejercicio'
				const recordLabel = getRecordTypeLabel(record.recordType)
				const formattedValue = formatRecord(record)
				
				toast.success(`🏆 ¡Nuevo Record Personal!`, {
					description: `${exerciseName}: ${recordLabel} - ${formattedValue}`,
					duration: 5000
				})
			})

			// Actualizar records recientes si hay nuevos
			if (newRecords.length > 0) {
				await getRecentRecords()
			}

			return newRecords
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error evaluating personal records'
			setError(errorMessage)
			console.error('Error evaluating set for records:', err)
			return []
		}
	}

	/**
	 * Obtiene todos los records del usuario
	 */
	const getUserRecords = async (): Promise<void> => {
		if (!userId) return

		try {
			setIsLoading(true)
			setError(null)
			
			const response = await fetch(`/api/records/user/${userId}`)
			if (!response.ok) {
				throw new Error('Failed to fetch user records')
			}
			const userRecords = await response.json()
			setRecords(userRecords)
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error fetching user records'
			setError(errorMessage)
			console.error('Error fetching user records:', err)
		} finally {
			setIsLoading(false)
		}
	}

	/**
	 * Obtiene los records de un ejercicio específico
	 */
	const getExerciseRecords = async (exerciseId: string): Promise<void> => {
		if (!userId) return

		try {
			setIsLoading(true)
			setError(null)
			
			const response = await fetch(`/api/records/exercise/${exerciseId}?userId=${userId}`)
			if (!response.ok) {
				throw new Error('Failed to fetch exercise records')
			}
			const records = await response.json()
			setExerciseRecords(records)
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error fetching exercise records'
			setError(errorMessage)
			console.error('Error fetching exercise records:', err)
		} finally {
			setIsLoading(false)
		}
	}

	/**
	 * Obtiene los records más recientes
	 */
	const getRecentRecords = useCallback(async (limit: number = 5): Promise<void> => {
		if (!userId) return

		try {
			setError(null)
			
			const response = await fetch(`/api/records/recent?userId=${userId}&limit=${limit}`)
			if (!response.ok) {
				throw new Error('Failed to fetch recent records')
			}
			const records = await response.json()
			setRecentRecords(records)
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error fetching recent records'
			setError(errorMessage)
			console.error('Error fetching recent records:', err)
		}
	}, [userId])

	/**
	 * Formatea un record para mostrar
	 */
	const formatRecord = (record: PersonalRecord): string => {
		switch (record.recordType) {
			case 'MAX_WEIGHT':
				return `${record.value} kg`
			case 'MAX_REPS':
				return `${record.value} reps`
			case 'MAX_VOLUME':
				return `${record.value} kg`
			case 'BEST_TIME':
				return `${Math.floor(record.value / 60)}:${(record.value % 60).toString().padStart(2, '0')}`
			case 'MAX_DISTANCE':
				return `${record.value} m`
			default:
				return `${record.value} ${record.unit || ''}`
		}
	}

	/**
	 * Obtiene la etiqueta del tipo de record
	 */
	const getRecordTypeLabel = (recordType: string): string => {
		switch (recordType) {
			case 'MAX_WEIGHT':
				return 'Peso Máximo'
			case 'MAX_REPS':
				return 'Repeticiones Máximas'
			case 'MAX_VOLUME':
				return 'Volumen Máximo'
			case 'BEST_TIME':
				return 'Mejor Tiempo'
			case 'MAX_DISTANCE':
				return 'Distancia Máxima'
			default:
				return 'Record Personal'
		}
	}

	// Cargar records recientes al montar el componente
	useEffect(() => {
		if (userId) {
			getRecentRecords()
		}
	}, [userId, getRecentRecords])

	return {
		records,
		recentRecords,
		exerciseRecords,
		isLoading,
		error,
		evaluateSet,
		getUserRecords,
		getExerciseRecords,
		getRecentRecords,
		formatRecord,
		getRecordTypeLabel
	}
}