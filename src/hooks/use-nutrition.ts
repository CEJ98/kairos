import { useState, useCallback } from 'react'
import { toast } from 'sonner'

export interface NutritionPlan {
	id: string
	name: string
	description?: string
	isTemplate: boolean
	isActive: boolean
	dailyCalories?: number
	dailyProtein?: number
	dailyCarbs?: number
	dailyFats?: number
	dailyFiber?: number
	tags?: string
	notes?: string
	createdAt: string
	updatedAt: string
	creator: {
		id: string
		name: string
		email: string
	}
	assignedTo?: {
		id: string
		name: string
		email: string
	}
	meals: Meal[]
}

export interface Meal {
	id: string
	name: string
	type: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'
	order: number
	suggestedTime?: string
	targetCalories?: number
	targetProtein?: number
	targetCarbs?: number
	targetFats?: number
	instructions?: string
	notes?: string
	foods: MealFood[]
}

export interface MealFood {
	id: string
	quantity: number
	unit: string
	calories: number
	protein: number
	carbs: number
	fats: number
	fiber: number
	notes?: string
	food: Food
}

export interface Food {
	id: string
	name: string
	brand?: string
	description?: string
	category?: string
	subcategory?: string
	caloriesPer100g: number
	proteinPer100g: number
	carbsPer100g: number
	fatsPer100g: number
	fiberPer100g?: number
	sugarPer100g?: number
	sodiumPer100g?: number
	commonUnit?: string
	commonUnitGrams?: number
	isVerified: boolean
	isActive: boolean
}

export interface NutritionLog {
	id: string
	userId: string
	logDate: string
	mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'
	foodName: string
	quantity: number
	unit: string
	calories: number
	protein: number
	carbs: number
	fats: number
	fiber?: number
	notes?: string
	createdAt: string
}

export interface DailyNutritionSummary {
	date: string
	summary: {
		totalCalories: number
		totalProtein: number
		totalCarbs: number
		totalFats: number
		totalFiber: number
	}
	byMealType: Record<string, {
		calories: number
		protein: number
		carbs: number
		fats: number
		fiber: number
		foods: NutritionLog[]
	}>
	totalLogs: number
}

export interface CreateNutritionPlanData {
	name: string
	description?: string
	isTemplate?: boolean
	dailyCalories?: number
	dailyProtein?: number
	dailyCarbs?: number
	dailyFats?: number
	dailyFiber?: number
	tags?: string[]
	notes?: string
	meals?: {
		name: string
		type: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'
		order: number
		suggestedTime?: string
		targetCalories?: number
		targetProtein?: number
		targetCarbs?: number
		targetFats?: number
		instructions?: string
		notes?: string
		foods?: {
			foodId: string
			quantity: number
			unit: string
			notes?: string
		}[]
	}[]
}

export interface CreateFoodData {
	name: string
	brand?: string
	description?: string
	category?: string
	subcategory?: string
	caloriesPer100g: number
	proteinPer100g: number
	carbsPer100g: number
	fatsPer100g: number
	fiberPer100g?: number
	sugarPer100g?: number
	sodiumPer100g?: number
	commonUnit?: string
	commonUnitGrams?: number
}

export interface CreateNutritionLogData {
	logDate: string
	mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'
	foodName: string
	quantity: number
	unit: string
	calories: number
	protein: number
	carbs: number
	fats: number
	fiber?: number
	notes?: string
}

export function useNutrition() {
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>([])
	const [foods, setFoods] = useState<Food[]>([])
	const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([])
	const [dailySummary, setDailySummary] = useState<DailyNutritionSummary | null>(null)

	// =================== PLANES DE NUTRICIÓN ===================

	const loadNutritionPlans = useCallback(async (options: {
		includeTemplates?: boolean
		includeAssigned?: boolean
		limit?: number
		offset?: number
	} = {}) => {
		setLoading(true)
		setError(null)

		try {
			const params = new URLSearchParams()
			if (options.includeTemplates) params.append('includeTemplates', 'true')
			if (options.includeAssigned) params.append('includeAssigned', 'true')
			if (options.limit) params.append('limit', options.limit.toString())
			if (options.offset) params.append('offset', options.offset.toString())

			const response = await fetch(`/api/nutrition/plans?${params}`)
			if (!response.ok) {
				throw new Error('Error cargando planes de nutrición')
			}

			const data = await response.json()
			setNutritionPlans(data.plans)
			return data.plans
		} catch (err: any) {
			const errorMessage = err.message || 'Error cargando planes de nutrición'
			setError(errorMessage)
			toast.error(errorMessage)
			throw err
		} finally {
			setLoading(false)
		}
	}, [])

	const createNutritionPlan = useCallback(async (data: CreateNutritionPlanData) => {
		setLoading(true)
		setError(null)

		try {
			const response = await fetch('/api/nutrition/plans', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Error creando plan de nutrición')
			}

			const result = await response.json()
			toast.success('Plan de nutrición creado exitosamente')
			
			// Actualizar lista local
			setNutritionPlans(prev => [result.plan, ...prev])
			return result.plan
		} catch (err: any) {
			const errorMessage = err.message || 'Error creando plan de nutrición'
			setError(errorMessage)
			toast.error(errorMessage)
			throw err
		} finally {
			setLoading(false)
		}
	}, [])

	const getNutritionPlan = useCallback(async (id: string) => {
		setLoading(true)
		setError(null)

		try {
			const response = await fetch(`/api/nutrition/plans/${id}`)
			if (!response.ok) {
				throw new Error('Plan de nutrición no encontrado')
			}

			const data = await response.json()
			return data.plan
		} catch (err: any) {
			const errorMessage = err.message || 'Error cargando plan de nutrición'
			setError(errorMessage)
			toast.error(errorMessage)
			throw err
		} finally {
			setLoading(false)
		}
	}, [])

	const assignNutritionPlan = useCallback(async (planId: string, assignedToId: string) => {
		setLoading(true)
		setError(null)

		try {
			const response = await fetch(`/api/nutrition/plans/${planId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ assignedToId })
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Error asignando plan de nutrición')
			}

			const result = await response.json()
			toast.success('Plan de nutrición asignado exitosamente')
			return result.plan
		} catch (err: any) {
			const errorMessage = err.message || 'Error asignando plan de nutrición'
			setError(errorMessage)
			toast.error(errorMessage)
			throw err
		} finally {
			setLoading(false)
		}
	}, [])

	// =================== ALIMENTOS ===================

	const searchFoods = useCallback(async (query: string, options: {
		category?: string
		limit?: number
		offset?: number
	} = {}) => {
		setLoading(true)
		setError(null)

		try {
			const params = new URLSearchParams()
			params.append('q', query)
			if (options.category) params.append('category', options.category)
			if (options.limit) params.append('limit', options.limit.toString())
			if (options.offset) params.append('offset', options.offset.toString())

			const response = await fetch(`/api/nutrition/foods?${params}`)
			if (!response.ok) {
				throw new Error('Error buscando alimentos')
			}

			const data = await response.json()
			setFoods(data.foods)
			return data.foods
		} catch (err: any) {
			const errorMessage = err.message || 'Error buscando alimentos'
			setError(errorMessage)
			toast.error(errorMessage)
			throw err
		} finally {
			setLoading(false)
		}
	}, [])

	const createFood = useCallback(async (data: CreateFoodData) => {
		setLoading(true)
		setError(null)

		try {
			const response = await fetch('/api/nutrition/foods', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Error creando alimento')
			}

			const result = await response.json()
			toast.success('Alimento creado exitosamente')
			return result.food
		} catch (err: any) {
			const errorMessage = err.message || 'Error creando alimento'
			setError(errorMessage)
			toast.error(errorMessage)
			throw err
		} finally {
			setLoading(false)
		}
	}, [])

	// =================== REGISTROS NUTRICIONALES ===================

	const logNutrition = useCallback(async (data: CreateNutritionLogData) => {
		setLoading(true)
		setError(null)

		try {
			const response = await fetch('/api/nutrition/logs', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Error registrando nutrición')
			}

			const result = await response.json()
			toast.success('Registro nutricional guardado')
			
			// Actualizar lista local
			setNutritionLogs(prev => [result.nutritionLog, ...prev])
			return result.nutritionLog
		} catch (err: any) {
			const errorMessage = err.message || 'Error registrando nutrición'
			setError(errorMessage)
			toast.error(errorMessage)
			throw err
		} finally {
			setLoading(false)
		}
	}, [])

	const loadNutritionLogs = useCallback(async (startDate?: string, endDate?: string) => {
		setLoading(true)
		setError(null)

		try {
			const params = new URLSearchParams()
			if (startDate) params.append('startDate', startDate)
			if (endDate) params.append('endDate', endDate)

			const response = await fetch(`/api/nutrition/logs?${params}`)
			if (!response.ok) {
				throw new Error('Error cargando registros nutricionales')
			}

			const data = await response.json()
			setNutritionLogs(data.logs)
			return data.logs
		} catch (err: any) {
			const errorMessage = err.message || 'Error cargando registros nutricionales'
			setError(errorMessage)
			toast.error(errorMessage)
			throw err
		} finally {
			setLoading(false)
		}
	}, [])

	const loadDailySummary = useCallback(async (date: string) => {
		setLoading(true)
		setError(null)

		try {
			const params = new URLSearchParams()
			params.append('date', date)

			const response = await fetch(`/api/nutrition/logs?${params}`)
			if (!response.ok) {
				throw new Error('Error cargando resumen nutricional')
			}

			const data = await response.json()
			setDailySummary(data.summary)
			return data.summary
		} catch (err: any) {
			const errorMessage = err.message || 'Error cargando resumen nutricional'
			setError(errorMessage)
			toast.error(errorMessage)
			throw err
		} finally {
			setLoading(false)
		}
	}, [])

	return {
		// Estado
		loading,
		error,
		nutritionPlans,
		foods,
		nutritionLogs,
		dailySummary,

		// Planes de nutrición
		loadNutritionPlans,
		createNutritionPlan,
		getNutritionPlan,
		assignNutritionPlan,

		// Alimentos
		searchFoods,
		createFood,

		// Registros nutricionales
		logNutrition,
		loadNutritionLogs,
		loadDailySummary,

		// Utilidades
		clearError: () => setError(null),
		clearData: () => {
			setNutritionPlans([])
			setFoods([])
			setNutritionLogs([])
			setDailySummary(null)
		}
	}
}