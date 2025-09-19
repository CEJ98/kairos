import { useState, useCallback } from 'react'

/**
 * Hook personalizado para manejar múltiples estados de carga
 * Reduce la duplicación de código en componentes
 */
export function useLoadingStates<T extends Record<string, boolean>>(initialStates: T) {
	const [loadingStates, setLoadingStates] = useState<T>(initialStates)

	const setLoading = useCallback((key: keyof T, value: boolean) => {
		setLoadingStates(prev => ({
			...prev,
			[key]: value
		}))
	}, [])

	const setMultipleLoading = useCallback((updates: Partial<T>) => {
		setLoadingStates(prev => ({
			...prev,
			...updates
		}))
	}, [])

	const resetLoading = useCallback(() => {
		setLoadingStates(initialStates)
	}, [initialStates])

	const isAnyLoading = Object.values(loadingStates).some(Boolean)

	return {
		loadingStates,
		setLoading,
		setMultipleLoading,
		resetLoading,
		isAnyLoading
	}
}

/**
 * Hook simplificado para un solo estado de carga
 */
export function useLoading(initialValue = false) {
	const [isLoading, setIsLoading] = useState(initialValue)

	const startLoading = useCallback(() => setIsLoading(true), [])
	const stopLoading = useCallback(() => setIsLoading(false), [])
	const toggleLoading = useCallback(() => setIsLoading(prev => !prev), [])

	return {
		isLoading,
		setIsLoading,
		startLoading,
		stopLoading,
		toggleLoading
	}
}

/**
 * Hook para manejar estados de formulario comunes
 */
export function useFormStates() {
	return useLoadingStates({
		isLoading: false,
		isSubmitting: false,
		isSaving: false,
		isValidating: false
	})
}

/**
 * Hook para manejar estados de UI comunes
 */
export function useUIStates() {
	return useLoadingStates({
		isOpen: false,
		isVisible: false,
		isExpanded: false,
		isActive: false
	})
}