import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

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
	meals?: CreateMealData[]
}

export interface CreateMealData {
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
	foods?: CreateMealFoodData[]
}

export interface CreateMealFoodData {
	foodId: string
	quantity: number
	unit: string
	notes?: string
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

export interface NutritionLogData {
	userId: string
	logDate: Date
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

export class NutritionService {
	// =================== PLANES DE NUTRICIÓN ===================

	static async createNutritionPlan(creatorId: string, data: CreateNutritionPlanData) {
		try {
			const nutritionPlan = await prisma.nutritionPlan.create({
				data: {
					name: data.name,
					description: data.description,
					creatorId,
					isTemplate: data.isTemplate || false,
					dailyCalories: data.dailyCalories,
					dailyProtein: data.dailyProtein,
					dailyCarbs: data.dailyCarbs,
					dailyFats: data.dailyFats,
					dailyFiber: data.dailyFiber,
					tags: data.tags ? JSON.stringify(data.tags) : null,
					notes: data.notes,
					meals: data.meals ? {
						create: data.meals.map(meal => ({
							name: meal.name,
							type: meal.type,
							order: meal.order,
							suggestedTime: meal.suggestedTime,
							targetCalories: meal.targetCalories,
							targetProtein: meal.targetProtein,
							targetCarbs: meal.targetCarbs,
							targetFats: meal.targetFats,
							instructions: meal.instructions,
							notes: meal.notes,
							foods: meal.foods ? {
								create: meal.foods.map(food => ({
									foodId: food.foodId,
									quantity: food.quantity,
									unit: food.unit,
									notes: food.notes,
									// Calcular valores nutricionales
									calories: 0, // Se calculará después
									protein: 0,
									carbs: 0,
									fats: 0,
									fiber: 0
								}))
							} : undefined
						}))
					} : undefined
				},
				include: {
					creator: {
						select: {
							id: true,
							name: true,
							email: true
						}
					},
					meals: {
						include: {
							foods: {
								include: {
									food: true
								}
							}
						},
						orderBy: { order: 'asc' }
					}
				}
			})

			// Calcular valores nutricionales para MealFood
			if (nutritionPlan.meals) {
				for (const meal of nutritionPlan.meals) {
					for (const mealFood of meal.foods) {
						await this.calculateMealFoodNutrition(mealFood.id)
					}
				}
			}

			logger.info(`Plan de nutrición creado: ${nutritionPlan.id}`, 'NUTRITION')
			return nutritionPlan
		} catch (error) {
			logger.error('Error creando plan de nutrición:', error, 'NUTRITION')
			throw error
		}
	}

	static async getNutritionPlans(userId: string, options: {
		includeTemplates?: boolean
		includeAssigned?: boolean
		limit?: number
		offset?: number
	} = {}) {
		try {
			const where: any = {
				OR: []
			}

			// Planes creados por el usuario
			where.OR.push({ creatorId: userId })

			// Planes asignados al usuario
			if (options.includeAssigned) {
				where.OR.push({ assignedToId: userId })
			}

			// Plantillas públicas
			if (options.includeTemplates) {
				where.OR.push({ isTemplate: true, isActive: true })
			}

			const nutritionPlans = await prisma.nutritionPlan.findMany({
				where,
				include: {
					creator: {
						select: {
							id: true,
							name: true,
							email: true
						}
					},
					assignedTo: {
						select: {
							id: true,
							name: true,
							email: true
						}
					},
					meals: {
						include: {
							foods: {
								include: {
									food: true
								}
							}
						},
						orderBy: { order: 'asc' }
					}
				},
				orderBy: { createdAt: 'desc' },
				take: options.limit,
				skip: options.offset
			})

			return nutritionPlans
		} catch (error) {
			logger.error('Error obteniendo planes de nutrición:', error, 'NUTRITION')
			throw error
		}
	}

	static async getNutritionPlan(id: string, userId: string) {
		try {
			const nutritionPlan = await prisma.nutritionPlan.findFirst({
				where: {
					id,
					OR: [
						{ creatorId: userId },
						{ assignedToId: userId },
						{ isTemplate: true, isActive: true }
					]
				},
				include: {
					creator: {
						select: {
							id: true,
							name: true,
							email: true
						}
					},
					assignedTo: {
						select: {
							id: true,
							name: true,
							email: true
						}
					},
					meals: {
						include: {
							foods: {
								include: {
									food: true
								}
							}
						},
						orderBy: { order: 'asc' }
					}
				}
			})

			if (!nutritionPlan) {
				throw new Error('Plan de nutrición no encontrado')
			}

			return nutritionPlan
		} catch (error) {
			logger.error('Error obteniendo plan de nutrición:', error, 'NUTRITION')
			throw error
		}
	}

	static async assignNutritionPlan(planId: string, assignedToId: string, assignerId: string) {
		try {
			// Verificar que el asignador es el creador del plan o un entrenador
			const plan = await prisma.nutritionPlan.findFirst({
				where: {
					id: planId,
					creatorId: assignerId
				}
			})

			if (!plan) {
				throw new Error('No tienes permisos para asignar este plan')
			}

			const updatedPlan = await prisma.nutritionPlan.update({
				where: { id: planId },
				data: { assignedToId },
				include: {
					creator: {
						select: { id: true, name: true, email: true }
					},
					assignedTo: {
						select: { id: true, name: true, email: true }
					}
				}
			})

			logger.info(`Plan de nutrición ${planId} asignado a ${assignedToId}`, 'NUTRITION')
			return updatedPlan
		} catch (error) {
			logger.error('Error asignando plan de nutrición:', error, 'NUTRITION')
			throw error
		}
	}

	// =================== ALIMENTOS ===================

	static async createFood(data: CreateFoodData) {
		try {
			const food = await prisma.food.create({
				data: {
					name: data.name,
					brand: data.brand,
					description: data.description,
					category: data.category,
					subcategory: data.subcategory,
					caloriesPer100g: data.caloriesPer100g,
					proteinPer100g: data.proteinPer100g,
					carbsPer100g: data.carbsPer100g,
					fatsPer100g: data.fatsPer100g,
					fiberPer100g: data.fiberPer100g,
					sugarPer100g: data.sugarPer100g,
					sodiumPer100g: data.sodiumPer100g,
					commonUnit: data.commonUnit,
					commonUnitGrams: data.commonUnitGrams
				}
			})

			logger.info(`Alimento creado: ${food.id}`, 'NUTRITION')
			return food
		} catch (error) {
			logger.error('Error creando alimento:', error, 'NUTRITION')
			throw error
		}
	}

	static async searchFoods(query: string, options: {
		category?: string
		limit?: number
		offset?: number
	} = {}) {
		try {
			const where: any = {
				isActive: true,
				OR: [
					{ name: { contains: query, mode: 'insensitive' } },
					{ brand: { contains: query, mode: 'insensitive' } },
					{ description: { contains: query, mode: 'insensitive' } }
				]
			}

			if (options.category) {
				where.category = options.category
			}

			const foods = await prisma.food.findMany({
				where,
				orderBy: [
					{ isVerified: 'desc' },
					{ name: 'asc' }
				],
				take: options.limit || 20,
				skip: options.offset || 0
			})

			return foods
		} catch (error) {
			logger.error('Error buscando alimentos:', error, 'NUTRITION')
			throw error
		}
	}

	// =================== REGISTRO NUTRICIONAL ===================

	static async logNutrition(data: NutritionLogData) {
		try {
			const nutritionLog = await prisma.nutritionLog.create({
				data
			})

			logger.info(`Registro nutricional creado para usuario ${data.userId}`, 'NUTRITION')
			return nutritionLog
		} catch (error) {
			logger.error('Error registrando nutrición:', error, 'NUTRITION')
			throw error
		}
	}

	static async getNutritionLogs(userId: string, startDate: Date, endDate: Date) {
		try {
			const logs = await prisma.nutritionLog.findMany({
				where: {
					userId,
					logDate: {
						gte: startDate,
						lte: endDate
					}
				},
				orderBy: [
					{ logDate: 'desc' },
					{ createdAt: 'desc' }
				]
			})

			return logs
		} catch (error) {
			logger.error('Error obteniendo registros nutricionales:', error, 'NUTRITION')
			throw error
		}
	}

	static async getDailyNutritionSummary(userId: string, date: Date) {
		try {
			const startOfDay = new Date(date)
			startOfDay.setHours(0, 0, 0, 0)
			
			const endOfDay = new Date(date)
			endOfDay.setHours(23, 59, 59, 999)

			const logs = await prisma.nutritionLog.findMany({
				where: {
					userId,
					logDate: {
						gte: startOfDay,
						lte: endOfDay
					}
				}
			})

			// Calcular totales
			const summary = logs.reduce((acc, log) => {
				acc.totalCalories += log.calories
				acc.totalProtein += log.protein
				acc.totalCarbs += log.carbs
				acc.totalFats += log.fats
				acc.totalFiber += log.fiber || 0
				return acc
			}, {
				totalCalories: 0,
				totalProtein: 0,
				totalCarbs: 0,
				totalFats: 0,
				totalFiber: 0
			})

			// Agrupar por tipo de comida
			const byMealType = logs.reduce((acc, log) => {
				if (!acc[log.mealType]) {
					acc[log.mealType] = {
						calories: 0,
						protein: 0,
						carbs: 0,
						fats: 0,
						fiber: 0,
						foods: []
					}
				}
				acc[log.mealType].calories += log.calories
				acc[log.mealType].protein += log.protein
				acc[log.mealType].carbs += log.carbs
				acc[log.mealType].fats += log.fats
				acc[log.mealType].fiber += log.fiber || 0
				acc[log.mealType].foods.push(log)
				return acc
			}, {} as any)

			return {
				date,
				summary,
				byMealType,
				totalLogs: logs.length
			}
		} catch (error) {
			logger.error('Error obteniendo resumen nutricional diario:', error, 'NUTRITION')
			throw error
		}
	}

	// =================== UTILIDADES ===================

	private static async calculateMealFoodNutrition(mealFoodId: string) {
		try {
			const mealFood = await prisma.mealFood.findUnique({
				where: { id: mealFoodId },
				include: { food: true }
			})

			if (!mealFood) return

			const { food, quantity, unit } = mealFood
			let multiplier = 1

			// Calcular multiplicador basado en la unidad
			if (unit === 'grams') {
				multiplier = quantity / 100 // Los valores nutricionales están por 100g
			} else if (unit === food.commonUnit && food.commonUnitGrams) {
				multiplier = (quantity * food.commonUnitGrams) / 100
			}

			// Calcular valores nutricionales
			const calories = food.caloriesPer100g * multiplier
			const protein = food.proteinPer100g * multiplier
			const carbs = food.carbsPer100g * multiplier
			const fats = food.fatsPer100g * multiplier
			const fiber = (food.fiberPer100g || 0) * multiplier

			// Actualizar MealFood
			await prisma.mealFood.update({
				where: { id: mealFoodId },
				data: {
					calories,
					protein,
					carbs,
					fats,
					fiber
				}
			})

			return { calories, protein, carbs, fats, fiber }
		} catch (error) {
			logger.error('Error calculando nutrición de MealFood:', error, 'NUTRITION')
			throw error
		}
	}

	static calculateNutritionFromFood(food: any, quantity: number, unit: string) {
		let multiplier = 1

		// Calcular multiplicador basado en la unidad
		if (unit === 'grams') {
			multiplier = quantity / 100
		} else if (unit === food.commonUnit && food.commonUnitGrams) {
			multiplier = (quantity * food.commonUnitGrams) / 100
		}

		return {
			calories: food.caloriesPer100g * multiplier,
			protein: food.proteinPer100g * multiplier,
			carbs: food.carbsPer100g * multiplier,
			fats: food.fatsPer100g * multiplier,
			fiber: (food.fiberPer100g || 0) * multiplier
		}
	}
}