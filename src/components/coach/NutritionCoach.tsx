'use client'

import { useState, useEffect } from 'react'
import { useNutrition, type NutritionPlan, type CreateNutritionPlanData, type Food } from '@/hooks/use-nutrition'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Calendar, Target, Users, ChefHat, Search, Trash2, Edit, Clock, Utensils } from 'lucide-react'
import { toast } from 'sonner'

interface Student {
	id: string
	name: string
	email: string
	assignedPlan?: {
		id: string
		name: string
	}
}

interface MealFormData {
	name: string
	type: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | ''
	description: string
	calories?: number
	protein?: number
	foods: Array<{
		id: string
		foodId: string
		name: string
		quantity: number
		unit: string
		notes: string
	}>
}

export function NutritionCoach() {
	const {
		loading,
		nutritionPlans,
		foods,
		loadNutritionPlans,
		createNutritionPlan,
		assignNutritionPlan,
		searchFoods
	} = useNutrition()

	const [activeTab, setActiveTab] = useState('plans')
	const [showCreateDialog, setShowCreateDialog] = useState(false)
	const [showMealDialog, setShowMealDialog] = useState(false)
	const [showAssignDialog, setShowAssignDialog] = useState(false)
	const [selectedPlan, setSelectedPlan] = useState<NutritionPlan | null>(null)
	const [searchTerm, setSearchTerm] = useState('')
	const [foodSearchTerm, setFoodSearchTerm] = useState('')

	// Estados para formularios
	const [planFormData, setPlanFormData] = useState<CreateNutritionPlanData>({
		name: '',
		description: '',
		isTemplate: false,
		dailyCalories: undefined,
		dailyProtein: undefined,
		dailyCarbs: undefined,
		dailyFats: undefined,
		dailyFiber: undefined,
		tags: [],
		notes: '',
		meals: []
	})

	const [mealFormData, setMealFormData] = useState<MealFormData>({
		name: '',
		type: '',
		description: '',
		calories: undefined,
		protein: undefined,
		foods: []
	})

	// Mock data para estudiantes
	const [students] = useState<Student[]>([
		{ id: '1', name: 'Ana García', email: 'ana@example.com' },
		{ id: '2', name: 'Carlos López', email: 'carlos@example.com' },
		{ id: '3', name: 'María Rodríguez', email: 'maria@example.com' }
	])

	useEffect(() => {
		loadNutritionPlans({ includeTemplates: true })
		searchFoods('')
	}, [loadNutritionPlans, searchFoods])

	const handleCreatePlan = async () => {
		try {
			await createNutritionPlan(planFormData)
			setShowCreateDialog(false)
			resetPlanForm()
			toast.success('Plan de nutrición creado exitosamente')
		} catch (error) {
			console.error('Error creando plan:', error)
		}
	}

	const handleAddMeal = () => {
		const newMeals = [...(planFormData.meals || []), mealFormData]
		setPlanFormData(prev => ({ ...prev, meals: newMeals }))
		setShowMealDialog(false)
		resetMealForm()
		toast.success('Comida agregada al plan')
	}

	const handleAssignPlan = async (studentId: string, planId: string) => {
		try {
			await assignNutritionPlan(planId, studentId)
			setShowAssignDialog(false)
			toast.success('Plan asignado exitosamente')
		} catch (error) {
			console.error('Error asignando plan:', error)
		}
	}

	const resetPlanForm = () => {
		setPlanFormData({
			name: '',
			description: '',
			isTemplate: false,
			dailyCalories: undefined,
			dailyProtein: undefined,
			dailyCarbs: undefined,
			dailyFats: undefined,
			dailyFiber: undefined,
			tags: [],
			notes: '',
			meals: []
		})
	}

	const resetMealForm = () => {
		setMealFormData({
			name: '',
			type: '',
			description: '',
			calories: undefined,
			protein: undefined,
			foods: []
		})
	}

	const addFoodToMeal = (food: Food) => {
		const newFood = {
			id: crypto.randomUUID(),
			foodId: food.id,
			name: food.name,
			quantity: 100,
			unit: 'gramos',
			notes: ''
		}
		setMealFormData(prev => ({
			...prev,
			foods: [...prev.foods, newFood]
		}))
	}

	const removeFoodFromMeal = (index: number) => {
		setMealFormData(prev => ({
			...prev,
			foods: prev.foods.filter((_, i) => i !== index)
		}))
	}

	const filteredPlans = nutritionPlans.filter(plan =>
		plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		plan.description?.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const filteredFoods = foods.filter(food =>
		food.name.toLowerCase().includes(foodSearchTerm.toLowerCase()) ||
		food.brand?.toLowerCase().includes(foodSearchTerm.toLowerCase())
	)

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Gestión Nutricional</h1>
					<p className="text-muted-foreground">
						Crea y gestiona planes de nutrición para tus estudiantes
					</p>
				</div>
				<Button onClick={() => setShowCreateDialog(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Nuevo Plan
				</Button>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
				<TabsList>
					<TabsTrigger value="plans">Planes de Nutrición</TabsTrigger>
					<TabsTrigger value="students">Estudiantes</TabsTrigger>
					<TabsTrigger value="foods">Base de Alimentos</TabsTrigger>
				</TabsList>

				<TabsContent value="plans" className="space-y-4">
					<div className="flex items-center space-x-2">
						<Search className="h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Buscar planes..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="max-w-sm"
						/>
					</div>

					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{filteredPlans.map((plan) => (
							<Card key={plan.id} className="hover:shadow-md transition-shadow">
								<CardHeader>
									<div className="flex items-start justify-between">
										<div>
											<CardTitle className="text-lg">{plan.name}</CardTitle>
											<CardDescription>{plan.description}</CardDescription>
										</div>
										<div className="flex space-x-1">
											{plan.isTemplate && (
												<Badge variant="secondary">Plantilla</Badge>
											)}
											{plan.assignedTo && (
												<Badge variant="default">Asignado</Badge>
											)}
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<div className="space-y-2">
										{plan.dailyCalories && (
											<div className="flex items-center text-sm">
												<Target className="mr-2 h-4 w-4" />
												{plan.dailyCalories} kcal/día
											</div>
										)}
										<div className="flex items-center text-sm text-muted-foreground">
											<Utensils className="mr-2 h-4 w-4" />
											{plan.meals.length} comidas
										</div>
										<div className="flex space-x-2 pt-2">
											<Button
												size="sm"
												variant="outline"
												onClick={() => {
													setSelectedPlan(plan)
													setShowAssignDialog(true)
												}}
											>
												<Users className="mr-1 h-3 w-3" />
												Asignar
											</Button>
											<Button size="sm" variant="ghost">
												<Edit className="h-3 w-3" />
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="students" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{students.map((student) => (
							<Card key={student.id}>
								<CardHeader>
									<CardTitle className="text-lg">{student.name}</CardTitle>
									<CardDescription>{student.email}</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-2">
										{student.assignedPlan ? (
											<div className="flex items-center text-sm">
												<ChefHat className="mr-2 h-4 w-4" />
												Plan: {student.assignedPlan.name}
											</div>
										) : (
											<p className="text-sm text-muted-foreground">Sin plan asignado</p>
										)}
										<Button
											size="sm"
											variant="outline"
											onClick={() => {
												setSelectedPlan(null)
												setShowAssignDialog(true)
											}}
										>
											<Users className="mr-1 h-3 w-3" />
											Asignar Plan
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="foods" className="space-y-4">
					<div className="flex items-center space-x-2">
						<Search className="h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Buscar alimentos..."
							value={foodSearchTerm}
							onChange={(e) => setFoodSearchTerm(e.target.value)}
							className="max-w-sm"
						/>
					</div>

					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{filteredFoods.slice(0, 12).map((food) => (
							<Card key={food.id}>
								<CardHeader>
									<CardTitle className="text-lg">{food.name}</CardTitle>
									{food.brand && (
										<CardDescription>{food.brand}</CardDescription>
									)}
								</CardHeader>
								<CardContent>
									<div className="space-y-1 text-sm">
										<div>Calorías: {food.caloriesPer100g}/100g</div>
										<div>Proteína: {food.proteinPer100g}g</div>
										<div>Carbohidratos: {food.carbsPer100g}g</div>
										<div>Grasas: {food.fatsPer100g}g</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>
			</Tabs>

			{/* Diálogo Crear Plan */}
			<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
				<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Crear Plan de Nutrición</DialogTitle>
						<DialogDescription>
							Define los objetivos nutricionales y comidas del plan
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="name">Nombre del Plan</Label>
								<Input
									id="name"
									value={planFormData.name}
									onChange={(e) => setPlanFormData(prev => ({ ...prev, name: e.target.value }))}
									placeholder="Plan de Definición"
								/>
							</div>
							<div className="flex items-center space-x-2">
								<Switch
									checked={planFormData.isTemplate}
									onCheckedChange={(checked) => setPlanFormData(prev => ({ ...prev, isTemplate: checked }))}
								/>
								<Label>Es plantilla</Label>
							</div>
						</div>

						<div>
							<Label htmlFor="description">Descripción</Label>
							<Textarea
								id="description"
								value={planFormData.description}
								onChange={(e) => setPlanFormData(prev => ({ ...prev, description: e.target.value }))}
								placeholder="Describe los objetivos del plan"
								rows={3}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="calories">Calorías Diarias</Label>
								<Input
									id="calories"
									type="number"
									value={planFormData.dailyCalories || ''}
									onChange={(e) => setPlanFormData(prev => ({ 
										...prev, 
										dailyCalories: e.target.value ? parseInt(e.target.value) : undefined 
									}))}
									placeholder="2000"
								/>
							</div>
							<div>
								<Label htmlFor="protein">Proteína (g)</Label>
								<Input
									id="protein"
									type="number"
									value={planFormData.dailyProtein || ''}
									onChange={(e) => setPlanFormData(prev => ({ 
										...prev, 
										dailyProtein: e.target.value ? parseFloat(e.target.value) : undefined 
									}))}
									placeholder="150"
								/>
							</div>
						</div>

						<Separator />

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label>Comidas del Plan</Label>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setShowMealDialog(true)}
								>
									<Plus className="mr-1 h-3 w-3" />
									Agregar Comida
								</Button>
							</div>

							{planFormData.meals && planFormData.meals.length > 0 ? (
								<div className="space-y-2">
									{planFormData.meals.map((meal, index) => (
										<div key={index} className="flex items-center justify-between p-2 border rounded">
											<div>
												<span className="font-medium">{meal.name}</span>
												<span className="text-sm text-muted-foreground ml-2">({meal.type})</span>
											</div>
											<Button
												size="sm"
												variant="ghost"
												onClick={() => {
													const newMeals = planFormData.meals?.filter((_, i) => i !== index)
													setPlanFormData(prev => ({ ...prev, meals: newMeals }))
												}}
											>
												<Trash2 className="h-3 w-3" />
											</Button>
										</div>
									))}
								</div>
							) : (
								<p className="text-sm text-muted-foreground">No hay comidas agregadas</p>
							)}
						</div>

						<div className="flex justify-end space-x-2">
							<Button variant="outline" onClick={() => setShowCreateDialog(false)}>
								Cancelar
							</Button>
							<Button onClick={handleCreatePlan} disabled={!planFormData.name}>
								Crear Plan
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Diálogo Asignar Plan */}
			<Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Asignar Plan de Nutrición</DialogTitle>
						<DialogDescription>
							Selecciona un estudiante y un plan para asignar
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div>
							<Label>Plan de Nutrición</Label>
							<Select
								value={selectedPlan?.id || ''}
								onValueChange={(value) => {
									const plan = nutritionPlans.find(p => p.id === value)
									setSelectedPlan(plan || null)
								}}
							>
								<SelectTrigger>
									<SelectValue placeholder="Seleccionar plan" />
								</SelectTrigger>
								<SelectContent>
									{nutritionPlans.map((plan) => (
										<SelectItem key={plan.id} value={plan.id}>
											{plan.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label>Estudiante</Label>
							<div className="space-y-2">
								{students.map((student) => (
									<div key={student.id} className="flex items-center justify-between p-2 border rounded">
										<div>
											<div className="font-medium">{student.name}</div>
											<div className="text-sm text-muted-foreground">{student.email}</div>
										</div>
										<Button
											size="sm"
											onClick={() => selectedPlan && handleAssignPlan(student.id, selectedPlan.id)}
											disabled={!selectedPlan}
										>
											Asignar
										</Button>
									</div>
								))}
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Diálogo Crear Comida */}
			<Dialog open={showMealDialog} onOpenChange={setShowMealDialog}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Agregar Comida</DialogTitle>
						<DialogDescription>
							Define una nueva comida para el plan
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div>
							<Label htmlFor="mealName">Nombre de la Comida</Label>
							<Input
								id="mealName"
								value={mealFormData.name}
								onChange={(e) => setMealFormData(prev => ({ ...prev, name: e.target.value }))}
								placeholder="Desayuno Proteico"
							/>
						</div>

						<div>
							<Label htmlFor="mealType">Tipo de Comida</Label>
							<Select
								value={mealFormData.type}
								onValueChange={(value) => setMealFormData(prev => ({ ...prev, type: value as any }))}
							>
								<SelectTrigger>
									<SelectValue placeholder="Seleccionar tipo" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="BREAKFAST">Desayuno</SelectItem>
									<SelectItem value="LUNCH">Almuerzo</SelectItem>
									<SelectItem value="DINNER">Cena</SelectItem>
									<SelectItem value="SNACK">Snack</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label htmlFor="mealDescription">Descripción</Label>
							<Textarea
								id="mealDescription"
								value={mealFormData.description}
								onChange={(e) => setMealFormData(prev => ({ ...prev, description: e.target.value }))}
								placeholder="Describe los ingredientes y preparación"
								rows={3}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="mealCalories">Calorías</Label>
								<Input
									id="mealCalories"
									type="number"
									value={mealFormData.calories || ''}
									onChange={(e) => setMealFormData(prev => ({ 
										...prev, 
										calories: e.target.value ? parseInt(e.target.value) : undefined 
									}))}
									placeholder="400"
								/>
							</div>
							<div>
								<Label htmlFor="mealProtein">Proteína (g)</Label>
								<Input
									id="mealProtein"
									type="number"
									step="0.1"
									value={mealFormData.protein || ''}
									onChange={(e) => setMealFormData(prev => ({ 
										...prev, 
										protein: e.target.value ? parseFloat(e.target.value) : undefined 
									}))}
									placeholder="25"
								/>
							</div>
						</div>

						<div className="flex justify-end space-x-2">
							<Button variant="outline" onClick={() => setShowMealDialog(false)}>
								Cancelar
							</Button>
							<Button onClick={handleAddMeal} disabled={!mealFormData.name || !mealFormData.type}>
								Agregar
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}