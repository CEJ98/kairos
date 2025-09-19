import { useState, useCallback, useMemo } from 'react'

interface FilterOptions {
	category?: string
	difficulty?: string
	muscleGroup?: string
	equipment?: string
	status?: string
	timeframe?: string
	period?: string
	metric?: string
	[key: string]: string | undefined
}

/**
 * Hook personalizado para manejar búsqueda y filtros
 * Reduce la duplicación en componentes con funcionalidad de búsqueda
 */
export function useSearchAndFilter<T>({
	initialSearchTerm = '',
	initialFilters = {},
	filterFunction,
	data = []
}: {
	initialSearchTerm?: string
	initialFilters?: FilterOptions
	filterFunction?: (item: T, searchTerm: string, filters: FilterOptions) => boolean
	data?: T[]
}) {
	const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
	const [filters, setFilters] = useState<FilterOptions>(initialFilters)

	const updateFilter = useCallback((key: string, value: string) => {
		setFilters(prev => ({
			...prev,
			[key]: value
		}))
	}, [])

	const updateMultipleFilters = useCallback((newFilters: Partial<FilterOptions>) => {
		setFilters(prev => ({
			...prev,
			...newFilters
		}))
	}, [])

	const resetFilters = useCallback(() => {
		setFilters(initialFilters)
		setSearchTerm(initialSearchTerm)
	}, [initialFilters, initialSearchTerm])

	const filteredData = useMemo(() => {
		if (!filterFunction) return data
		
		return data.filter(item => filterFunction(item, searchTerm, filters))
	}, [data, searchTerm, filters, filterFunction])

	const hasActiveFilters = useMemo(() => {
		return searchTerm !== initialSearchTerm || 
			   Object.keys(filters).some(key => filters[key] !== initialFilters[key])
	}, [searchTerm, filters, initialSearchTerm, initialFilters])

	return {
		searchTerm,
		setSearchTerm,
		filters,
		setFilters,
		updateFilter,
		updateMultipleFilters,
		resetFilters,
		filteredData,
		hasActiveFilters
	}
}

/**
 * Hook específico para ejercicios
 */
export function useExerciseSearch<T>(data: T[], filterFunction?: (item: T, searchTerm: string, filters: FilterOptions) => boolean) {
	return useSearchAndFilter({
		initialFilters: {
			category: 'all',
			difficulty: 'all',
			muscleGroup: 'all',
			equipment: 'all'
		},
		filterFunction,
		data
	})
}

/**
 * Hook específico para entrenamientos
 */
export function useWorkoutSearch<T>(data: T[], filterFunction?: (item: T, searchTerm: string, filters: FilterOptions) => boolean) {
	return useSearchAndFilter({
		initialFilters: {
			category: 'all',
			status: 'all'
		},
		filterFunction,
		data
	})
}

/**
 * Hook específico para clientes
 */
export function useClientSearch<T>(data: T[], filterFunction?: (item: T, searchTerm: string, filters: FilterOptions) => boolean) {
	return useSearchAndFilter({
		initialFilters: {
			status: 'all',
			timeframe: 'all'
		},
		filterFunction,
		data
	})
}