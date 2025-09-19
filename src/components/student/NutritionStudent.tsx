'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
	ChefHat, 
	Calendar, 
	Clock, 
	Target, 
	TrendingUp, 
	Plus,
	Check,
	X,
	Info,
	Apple,
	Droplets,
	Zap
} from 'lucide-react'
import { useNutrition } from '@/hooks/use-nutrition'
import { toast } from 'sonner'

interface NutritionPlan {
	id: string
	name: string
	description?: string
	dailyCalories?: number
	dailyProtein?: number
	dailyCarbs?: number
	dailyFats?: number
	isActive: boolean
	createdAt: Date
	meals: Meal[]
}

interface Meal {
	id: string
	name: string
	type: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'
	description?: string
	calories?: number
	protein?: number
	carbs?: number
	fats?: number
	foods: MealFood[]
}

interface MealFood {
	id: string
	foodId: string
	quantity: number
	unit: string
	food: {
		id: string
		name: string
		brand?: string
		caloriesPer100g: number
		proteinPer100g: number
		carbsPer100g: number
		fatsPer100g: number
	}
}

interface NutritionLog {
	id: string
	date: Date
	mealType: string
	foodName: string
	quantity: number
	calories: number
	protein: number
	carbs: number
	fats: number
}

interface DailyProgress {
	date: string
	totalCalories: number
	totalProtein: number
	totalCarbs: number
	totalFats: number
	targetCalories: number
	targetProtein: number
	mealsLogged: number
	totalMeals: number
}

export function NutritionStudent() {
	const { nutritionPlans, loading } = useNutrition()
	const [assignedPlan, setAssignedPlan] = useState<NutritionPlan | null>(null)
	const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([])
	const [dailyProgress, setDailyProgress] = useState<DailyProgress | null>(null)
	const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
	const [showLogDialog, setShowLogDialog] = useState(false)
	const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null)
	const [logFormData, setLogFormData] = useState({
		foodName: '',
		quantity: '',
		calories: '',
		protein: '',
		carbs: '',
		fats: ''
	})

	// Calcular progreso diario (declarado antes de usarlo en efectos)
	const calculateDailyProgress = useCallback(() => {
		if (!assignedPlan) return

		const todayLogs = nutritionLogs.filter(log => 
			log.date.toISOString().split('T')[0] === selectedDate
		)

		const totalCalories = todayLogs.reduce((sum, log) => sum + log.calories, 0)
		const totalProtein = todayLogs.reduce((sum, log) => sum + log.protein, 0)
		const totalCarbs = todayLogs.reduce((sum, log) => sum + log.carbs, 0)
		const totalFats = todayLogs.reduce((sum, log) => sum + log.fats, 0)

		const loggedMealTypes = new Set(todayLogs.map(log => log.mealType))
		const mealsLogged = loggedMealTypes.size
		const totalMeals = assignedPlan.meals.length

		setDailyProgress({
			date: selectedDate,
			totalCalories,
			totalProtein,
			totalCarbs,
			totalFats,
			targetCalories: assignedPlan.dailyCalories || 0,
			targetProtein: assignedPlan.dailyProtein || 0,
			mealsLogged,
			totalMeals
		})
	}, [assignedPlan, nutritionLogs, selectedDate])

	useEffect(() => {
		loadAssignedPlan()
		loadNutritionLogs()
	}, [])

	useEffect(() => {
		calculateDailyProgress()
	}, [nutritionLogs, selectedDate, assignedPlan, calculateDailyProgress])

	const loadAssignedPlan = async () => {
		try {
			// Simular carga del plan asignado
			const mockPlan: NutritionPlan = {
				id: '1',
				name: 'Plan de Definición',
				description: 'Plan diseñado para pérdida de grasa manteniendo masa muscular',
				dailyCalories: 2000,
				dailyProtein: 150,
				dailyCarbs: 200,
				dailyFats: 67,
				isActive: true,
				createdAt: new Date(),
				meals: [
					{
						id: '1',
						name: 'Desayuno Proteico',
						type: 'BREAKFAST',
						description: 'Avena con proteína y frutas',
						calories: 400,
						protein: 30,
						carbs: 45,
						fats: 8,
						foods: []
					},
					{
						id: '2',
						name: 'Almuerzo Balanceado',
						type: 'LUNCH',
						description: 'Pollo con arroz y vegetales',
						calories: 600,
						protein: 45,
						carbs: 60,
						fats: 15,
						foods: []
					},
					{
						id: '3',
						name: 'Cena Ligera',
						type: 'DINNER',
						description: 'Salmón con ensalada',
						calories: 500,
						protein: 40,
						carbs: 20,
						fats: 25,
						foods: []
					},
					{
						id: '4',
						name: 'Snack Post-Entreno',
						type: 'SNACK',
						description: 'Batido de proteína con plátano',
						calories: 300,
						protein: 25,
						carbs: 35,
						fats: 5,
						foods: []
					}
				]
			}
			setAssignedPlan(mockPlan)
		} catch (error) {
			console.error('Error loading assigned plan:', error)
			toast.error('Error al cargar el plan de nutrición')
		}
	}

	const loadNutritionLogs = async () => {
		try {
			// Simular carga de logs de nutrición
			const mockLogs: NutritionLog[] = [
				{
					id: '1',
					date: new Date(),
					mealType: 'BREAKFAST',
					foodName: 'Avena con proteína',
					quantity: 1,
					calories: 400,
					protein: 30,
					carbs: 45,
					fats: 8
				},
				{
					id: '2',
					date: new Date(),
					mealType: 'LUNCH',
					foodName: 'Pollo con arroz',
					quantity: 1,
					calories: 600,
					protein: 45,
					carbs: 60,
					fats: 15
				}
			]
			setNutritionLogs(mockLogs)
		} catch (error) {
			console.error('Error loading nutrition logs:', error)
		}
	}

	// (fin reordenamiento)

	const handleLogMeal = async () => {
		if (!selectedMeal || !logFormData.foodName) return

		try {
			const newLog: NutritionLog = {
				id: Date.now().toString(),
				date: new Date(selectedDate),
				mealType: selectedMeal.type,
				foodName: logFormData.foodName,
				quantity: parseFloat(logFormData.quantity) || 1,
				calories: parseInt(logFormData.calories) || 0,
				protein: parseFloat(logFormData.protein) || 0,
				carbs: parseFloat(logFormData.carbs) || 0,
				fats: parseFloat(logFormData.fats) || 0
			}

			setNutritionLogs(prev => [...prev, newLog])
			setShowLogDialog(false)
			setLogFormData({
				foodName: '',
				quantity: '',
				calories: '',
				protein: '',
				carbs: '',
				fats: ''
			})
			toast.success('Comida registrada correctamente')
		} catch (error) {
			console.error('Error logging meal:', error)
			toast.error('Error al registrar la comida')
		}
	}

	const getMealTypeLabel = (type: string) => {
		const labels = {
			BREAKFAST: 'Desayuno',
			LUNCH: 'Almuerzo',
			DINNER: 'Cena',
			SNACK: 'Snack'
		}
		return labels[type as keyof typeof labels] || type
	}

	const isMealLogged = (mealType: string) => {
		return nutritionLogs.some(log => 
			log.date.toISOString().split('T')[0] === selectedDate && 
			log.mealType === mealType
		)
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
					<p className="text-muted-foreground">Cargando plan de nutrición...</p>
				</div>
			</div>
		)
	}

	if (!assignedPlan) {
		return (
			<div className="text-center py-12">
				<ChefHat className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
				<h3 className="text-lg font-semibold mb-2">No tienes un plan de nutrición asignado</h3>
				<p className="text-muted-foreground mb-4">
					Contacta a tu entrenador para que te asigne un plan personalizado
				</p>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Header con información del plan */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Mi Plan de Nutrición</h1>
					<p className="text-muted-foreground">
						Sigue tu plan y registra tus comidas diarias
					</p>
				</div>
				<div className="flex items-center space-x-2">
					<Label htmlFor="date">Fecha:</Label>
					<Input
						id="date"
						type="date"
						value={selectedDate}
						onChange={(e) => setSelectedDate(e.target.value)}
						className="w-40"
					/>
				</div>
			</div>

			{/* Información del plan */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center">
						<ChefHat className="mr-2 h-5 w-5" />
						{assignedPlan.name}
					</CardTitle>
					{assignedPlan.description && (
						<CardDescription>{assignedPlan.description}</CardDescription>
					)}
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div className="text-center">
							<div className="text-2xl font-bold text-primary">{assignedPlan.dailyCalories}</div>
							<div className="text-sm text-muted-foreground">Calorías</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-blue-600">{assignedPlan.dailyProtein}g</div>
							<div className="text-sm text-muted-foreground">Proteína</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-green-600">{assignedPlan.dailyCarbs}g</div>
							<div className="text-sm text-muted-foreground">Carbohidratos</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-orange-600">{assignedPlan.dailyFats}g</div>
							<div className="text-sm text-muted-foreground">Grasas</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Progreso diario */}
			{dailyProgress && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center">
							<Target className="mr-2 h-5 w-5" />
							Progreso del Día
						</CardTitle>
						<CardDescription>
							Comidas registradas: {dailyProgress.mealsLogged}/{dailyProgress.totalMeals}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<div className="flex justify-between text-sm mb-1">
								<span>Calorías</span>
								<span>{dailyProgress.totalCalories}/{dailyProgress.targetCalories}</span>
							</div>
							<Progress 
								value={(dailyProgress.totalCalories / dailyProgress.targetCalories) * 100} 
								className="h-2"
							/>
						</div>
						<div>
							<div className="flex justify-between text-sm mb-1">
								<span>Proteína</span>
								<span>{dailyProgress.totalProtein.toFixed(1)}g/{dailyProgress.targetProtein}g</span>
							</div>
							<Progress 
								value={(dailyProgress.totalProtein / dailyProgress.targetProtein) * 100} 
								className="h-2"
							/>
						</div>
						<div className="grid grid-cols-3 gap-4 text-center">
							<div>
								<div className="text-lg font-semibold text-green-600">{dailyProgress.totalCarbs.toFixed(1)}g</div>
								<div className="text-xs text-muted-foreground">Carbohidratos</div>
							</div>
							<div>
								<div className="text-lg font-semibold text-orange-600">{dailyProgress.totalFats.toFixed(1)}g</div>
								<div className="text-xs text-muted-foreground">Grasas</div>
							</div>
							<div>
								<div className="text-lg font-semibold text-primary">{dailyProgress.totalCalories}</div>
								<div className="text-xs text-muted-foreground">Calorías</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Comidas del plan */}
			<div className="grid gap-4 md:grid-cols-2">
				{assignedPlan.meals.map((meal) => {
					const isLogged = isMealLogged(meal.type)
					return (
						<Card key={meal.id} className={isLogged ? 'border-green-200 bg-green-50' : ''}>
							<CardHeader>
								<CardTitle className="flex items-center justify-between">
									<div className="flex items-center">
										<Apple className="mr-2 h-4 w-4" />
										{meal.name}
									</div>
									<div className="flex items-center space-x-2">
										<Badge variant={isLogged ? 'default' : 'secondary'}>
											{getMealTypeLabel(meal.type)}
										</Badge>
										{isLogged && <Check className="h-4 w-4 text-green-600" />}
									</div>
								</CardTitle>
								{meal.description && (
									<CardDescription>{meal.description}</CardDescription>
								)}
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 gap-2 text-sm mb-4">
									<div className="flex items-center">
										<Zap className="mr-1 h-3 w-3 text-yellow-500" />
										{meal.calories} kcal
									</div>
									<div className="flex items-center">
										<Droplets className="mr-1 h-3 w-3 text-blue-500" />
										{meal.protein}g proteína
									</div>
									<div className="text-muted-foreground">
										{meal.carbs}g carbos
									</div>
									<div className="text-muted-foreground">
										{meal.fats}g grasas
									</div>
								</div>
								<Button
									size="sm"
									variant={isLogged ? 'outline' : 'default'}
									onClick={() => {
										setSelectedMeal(meal)
										setShowLogDialog(true)
									}}
									className="w-full"
								>
									{isLogged ? (
										<>
											<Check className="mr-1 h-3 w-3" />
											Registrado
										</>
									) : (
										<>
											<Plus className="mr-1 h-3 w-3" />
											Registrar
										</>
									)}
								</Button>
							</CardContent>
						</Card>
					)
				})}
			</div>

			{/* Diálogo Registrar Comida */}
			<Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Registrar Comida</DialogTitle>
						<DialogDescription>
							{selectedMeal && `Registra tu ${getMealTypeLabel(selectedMeal.type).toLowerCase()}`}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div>
							<Label htmlFor="foodName">Alimento/Comida</Label>
							<Input
								id="foodName"
								value={logFormData.foodName}
								onChange={(e) => setLogFormData(prev => ({ ...prev, foodName: e.target.value }))}
								placeholder={selectedMeal?.name || 'Nombre del alimento'}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="quantity">Cantidad</Label>
								<Input
									id="quantity"
									type="number"
									step="0.1"
									value={logFormData.quantity}
									onChange={(e) => setLogFormData(prev => ({ ...prev, quantity: e.target.value }))}
									placeholder="1"
								/>
							</div>
							<div>
								<Label htmlFor="calories">Calorías</Label>
								<Input
									id="calories"
									type="number"
									value={logFormData.calories}
									onChange={(e) => setLogFormData(prev => ({ ...prev, calories: e.target.value }))}
									placeholder={selectedMeal?.calories?.toString() || '0'}
								/>
							</div>
						</div>

						<div className="grid grid-cols-3 gap-2">
							<div>
								<Label htmlFor="protein">Proteína (g)</Label>
								<Input
									id="protein"
									type="number"
									step="0.1"
									value={logFormData.protein}
									onChange={(e) => setLogFormData(prev => ({ ...prev, protein: e.target.value }))}
									placeholder={selectedMeal?.protein?.toString() || '0'}
								/>
							</div>
							<div>
								<Label htmlFor="carbs">Carbos (g)</Label>
								<Input
									id="carbs"
									type="number"
									step="0.1"
									value={logFormData.carbs}
									onChange={(e) => setLogFormData(prev => ({ ...prev, carbs: e.target.value }))}
									placeholder={selectedMeal?.carbs?.toString() || '0'}
								/>
							</div>
							<div>
								<Label htmlFor="fats">Grasas (g)</Label>
								<Input
									id="fats"
									type="number"
									step="0.1"
									value={logFormData.fats}
									onChange={(e) => setLogFormData(prev => ({ ...prev, fats: e.target.value }))}
									placeholder={selectedMeal?.fats?.toString() || '0'}
								/>
							</div>
						</div>

						<div className="flex justify-end space-x-2">
							<Button variant="outline" onClick={() => setShowLogDialog(false)}>
								Cancelar
							</Button>
							<Button onClick={handleLogMeal} disabled={!logFormData.foodName}>
								Registrar
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}
