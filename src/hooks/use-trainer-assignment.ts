import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { logger } from '@/lib/logger'

export interface TrainerSearchFilters {
	specialty?: string
	maxRate?: number
	minExperience?: number
	location?: string
}

export interface TrainerSearchResult {
	id: string
	name: string
	email: string
	specialties: string[]
	hourlyRate?: number
	experience?: number
	location?: string
	availableSlots: number
	rating?: number
	totalClients: number
}

export interface TrainerAssignment {
	id: string
	clientId: string
	trainerId: string
	client: {
		id: string
		name: string
		email: string
	}
	trainer: {
		id: string
		name: string
		email: string
		specialties: string[]
	}
	assignedAt: string
	notes?: string
}

export interface ClientAssignment {
	trainer: {
		id: string
		name: string
		email: string
		specialties: string[]
		hourlyRate?: number
	}
	assignedAt: string
	notes?: string
}

export function useTrainerAssignment() {
	const { data: session } = useSession()
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Estados para búsqueda de entrenadores
	const [trainers, setTrainers] = useState<TrainerSearchResult[]>([])
	const [searchLoading, setSearchLoading] = useState(false)

	// Estados para asignaciones
	const [assignments, setAssignments] = useState<TrainerAssignment[]>([])
	const [clientAssignment, setClientAssignment] = useState<ClientAssignment | null>(null)

	// Buscar entrenadores disponibles
	const searchTrainers = async (filters: TrainerSearchFilters = {}) => {
		setSearchLoading(true)
		setError(null)

		try {
			const params = new URLSearchParams()
			if (filters.specialty) params.append('specialty', filters.specialty)
			if (filters.maxRate) params.append('maxRate', filters.maxRate.toString())
			if (filters.minExperience) params.append('minExperience', filters.minExperience.toString())
			if (filters.location) params.append('location', filters.location)

			const response = await fetch(`/api/trainers/search?${params}`)
			if (!response.ok) {
				throw new Error('Error al buscar entrenadores')
			}

			const data = await response.json()
			setTrainers(data.trainers)

			logger.info('Trainers search completed', {
				filters,
				resultsCount: data.trainers.length
			}, 'TRAINER_SEARCH')

		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
			setError(errorMessage)
			logger.error('Error searching trainers:', err, 'TRAINER_SEARCH')
		} finally {
			setSearchLoading(false)
		}
	}

	// Solicitar asignación de entrenador
	const requestAssignment = async (trainerId: string, notes?: string) => {
		if (!session?.user) {
			throw new Error('Usuario no autenticado')
		}

		setLoading(true)
		setError(null)

		try {
			const response = await fetch('/api/trainers/assignments', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					trainerId,
					clientId: session.user.id,
					notes
				})
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Error al solicitar asignación')
			}

			const assignment = await response.json()
			
			// Actualizar estado local
			await loadAssignments()

			logger.info('Assignment requested successfully', {
				assignmentId: assignment.id,
				trainerId
			}, 'TRAINER_ASSIGNMENT')

			return assignment

		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
			setError(errorMessage)
			logger.error('Error requesting assignment:', err, 'TRAINER_ASSIGNMENT')
			throw err
		} finally {
			setLoading(false)
		}
	}

	// Asignar cliente (para entrenadores)
	const assignClient = async (clientId: string, notes?: string) => {
		if (!session?.user || session.user.role !== 'TRAINER') {
			throw new Error('Solo los entrenadores pueden asignar clientes')
		}

		setLoading(true)
		setError(null)

		try {
			const response = await fetch('/api/trainers/assignments', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					trainerId: session.user.id,
					clientId,
					notes
				})
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Error al asignar cliente')
			}

			const assignment = await response.json()
			
			// Actualizar estado local
			await loadAssignments()

			return assignment

		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
			setError(errorMessage)
			throw err
		} finally {
			setLoading(false)
		}
	}

	// Eliminar asignación
	const removeAssignment = async (clientId: string) => {
		setLoading(true)
		setError(null)

		try {
			const response = await fetch(`/api/trainers/assignments?clientId=${clientId}`, {
				method: 'DELETE'
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Error al eliminar asignación')
			}

			// Actualizar estado local
			await loadAssignments()

			logger.info('Assignment removed successfully', {
				clientId
			}, 'TRAINER_ASSIGNMENT')

		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
			setError(errorMessage)
			throw err
		} finally {
			setLoading(false)
		}
	}

	// Cargar asignaciones
	const loadAssignments = useCallback(async () => {
		if (!session?.user) return

		setLoading(true)
		setError(null)

		try {
			const response = await fetch('/api/trainers/assignments')
			if (!response.ok) {
				throw new Error('Error al cargar asignaciones')
			}

			const data = await response.json()

			if (session.user.role === 'TRAINER') {
				setAssignments(data.assignments || [])
			} else if (session.user.role === 'CLIENT') {
				setClientAssignment(data.assignment || null)
			}

		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
			setError(errorMessage)
			logger.error('Error loading assignments:', err, 'TRAINER_ASSIGNMENT')
		} finally {
			setLoading(false)
		}
	}, [session?.user])

	// Cargar asignaciones al montar el componente
	useEffect(() => {
		if (session?.user) {
			loadAssignments()
		}
	}, [session?.user, loadAssignments])

	return {
		// Estados
		loading,
		error,
		searchLoading,
		trainers,
		assignments,
		clientAssignment,

		// Funciones
		searchTrainers,
		requestAssignment,
		assignClient,
		removeAssignment,
		loadAssignments,

		// Utilidades
		clearError: () => setError(null),
		clearTrainers: () => setTrainers([])
	}
}