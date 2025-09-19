'use client'

import { useState, useEffect, useCallback } from 'react'
import { useNutrition, type NutritionPlan, type CreateNutritionPlanData } from '@/hooks/use-nutrition'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Plus, Calendar, Target, Users, ChefHat } from 'lucide-react'
import { toast } from 'sonner'

export function NutritionPlans() {
	const {
		loading,
		nutritionPlans,
		loadNutritionPlans,
		createNutritionPlan,
		assignNutritionPlan
	} = useNutrition()

	const [showCreateDialog, setShowCreateDialog] = useState(false)
	const [activeTab, setActiveTab] = useState('my-plans')
	const [formData, setFormData] = useState<CreateNutritionPlanData>({
		name: '',
		description: '',
		isTemplate: false,
		dailyCalories: undefined,
		dailyProtein: undefined,
		dailyCarbs: undefined,
		dailyFats: undefined,
		dailyFiber: undefined,
		tags: [],
		notes: ''
	})

	const loadPlans = useCallback(async () => {
		const options = {
			includeTemplates: activeTab === 'templates',
			includeAssigned: activeTab === 'assigned'
		}
		await loadNutritionPlans(options)
	}, [activeTab, loadNutritionPlans])

	useEffect(() => {
		loadPlans()
	}, [activeTab, loadPlans])

	const handleCreatePlan = async (e: React.FormEvent) => {
		e.preventDefault()
		try {
			await createNutritionPlan(formData)
			setShowCreateDialog(false)
			setFormData({
				name: '',
				description: '',
				isTemplate: false,
				dailyCalories: undefined,
				dailyProtein: undefined,
				dailyCarbs: undefined,
				dailyFats: undefined,
				dailyFiber: undefined,
				tags: [],
				notes: ''
			})
			await loadPlans()
		} catch (error) {
			// Error ya manejado en el hook
		}
	}

	const handleAssignPlan = async (planId: string, userId: string) => {
		try {
			await assignNutritionPlan(planId, userId)
			await loadPlans()
		} catch (error) {
			// Error ya manejado en el hook
		}
	}

	const formatMacros = (plan: NutritionPlan) => {
		const macros = []
		if (plan.dailyCalories) macros.push(`${plan.dailyCalories} kcal`)
		if (plan.dailyProtein) macros.push(`${plan.dailyProtein}g proteína`)
		if (plan.dailyCarbs) macros.push(`${plan.dailyCarbs}g carbos`)
		if (plan.dailyFats) macros.push(`${plan.dailyFats}g grasas`)
		return macros.join(' • ')
	}

	const getTags = (plan: NutritionPlan) => {
		try {
			return plan.tags ? JSON.parse(plan.tags) : []
		} catch {
			return []
		}
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Planes de Nutrición</h1>
					<p className="text-muted-foreground">
						Crea y gestiona planes de alimentación personalizados
					</p>
				</div>
				<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Nuevo Plan
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>Crear Plan de Nutrición</DialogTitle>
							<DialogDescription>
								Crea un nuevo plan de alimentación con objetivos nutricionales específicos
							</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleCreatePlan} className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="col-span-2">
									<Label htmlFor="name">Nombre del Plan *</Label>
									<Input
										id="name"
										value={formData.name}
										onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
										placeholder="Ej: Plan de Definición"
										required
									/>
								</div>
								<div className="col-span-2">
									<Label htmlFor="description">Descripción</Label>
									<Textarea
										id="description"
										value={formData.description}
										onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
										placeholder="Describe los objetivos y características del plan"
										rows={3}
									/>
								</div>
								<div>
									<Label htmlFor="calories">Calorías Diarias</Label>
									<Input
										id="calories"
										type="number"
										value={formData.dailyCalories || ''}
										onChange={(e) => setFormData(prev => ({ 
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
										value={formData.dailyProtein || ''}
										onChange={(e) => setFormData(prev => ({ 
											...prev, 
											dailyProtein: e.target.value ? parseInt(e.target.value) : undefined 
										}))}
										placeholder="150"
									/>
								</div>
								<div>
									<Label htmlFor="carbs">Carbohidratos (g)</Label>
									<Input
										id="carbs"
										type="number"
										value={formData.dailyCarbs || ''}
										onChange={(e) => setFormData(prev => ({ 
											...prev, 
											dailyCarbs: e.target.value ? parseInt(e.target.value) : undefined 
										}))}
										placeholder="200"
									/>
								</div>
								<div>
									<Label htmlFor="fats">Grasas (g)</Label>
									<Input
										id="fats"
										type="number"
										value={formData.dailyFats || ''}
										onChange={(e) => setFormData(prev => ({ 
											...prev, 
											dailyFats: e.target.value ? parseInt(e.target.value) : undefined 
										}))}
										placeholder="70"
									/>
								</div>
								<div className="col-span-2 flex items-center space-x-2">
									<Switch
										id="template"
										checked={formData.isTemplate}
										onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isTemplate: checked }))}
									/>
									<Label htmlFor="template">Crear como plantilla pública</Label>
								</div>
								<div className="col-span-2">
									<Label htmlFor="notes">Notas</Label>
									<Textarea
										id="notes"
										value={formData.notes}
										onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
										placeholder="Instrucciones adicionales o consideraciones especiales"
										rows={2}
									/>
								</div>
							</div>
							<div className="flex justify-end space-x-2">
								<Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
									Cancelar
								</Button>
								<Button type="submit" disabled={loading}>
									{loading ? 'Creando...' : 'Crear Plan'}
								</Button>
							</div>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList>
					<TabsTrigger value="my-plans">Mis Planes</TabsTrigger>
					<TabsTrigger value="assigned">Asignados</TabsTrigger>
					<TabsTrigger value="templates">Plantillas</TabsTrigger>
				</TabsList>

				<TabsContent value={activeTab} className="mt-6">
					{loading ? (
						<div className="flex items-center justify-center py-8">
							<div className="text-muted-foreground">Cargando planes...</div>
						</div>
					) : nutritionPlans.length === 0 ? (
						<div className="text-center py-8">
							<ChefHat className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
							<h3 className="text-lg font-medium mb-2">No hay planes disponibles</h3>
							<p className="text-muted-foreground mb-4">
								{activeTab === 'my-plans' && 'Crea tu primer plan de nutrición'}
								{activeTab === 'assigned' && 'No tienes planes asignados'}
								{activeTab === 'templates' && 'No hay plantillas disponibles'}
							</p>
							{activeTab === 'my-plans' && (
								<Button onClick={() => setShowCreateDialog(true)}>
									<Plus className="mr-2 h-4 w-4" />
									Crear Plan
								</Button>
							)}
						</div>
					) : (
						<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
							{nutritionPlans.map((plan) => (
								<Card key={plan.id} className="hover:shadow-md transition-shadow">
									<CardHeader>
										<div className="flex items-start justify-between">
											<div>
												<CardTitle className="text-lg">{plan.name}</CardTitle>
												<CardDescription className="mt-1">
													{plan.description || 'Sin descripción'}
												</CardDescription>
											</div>
											<div className="flex flex-col gap-1">
												{plan.isTemplate && (
													<Badge variant="secondary" className="text-xs">
														Plantilla
													</Badge>
												)}
												{plan.assignedTo && (
													<Badge variant="outline" className="text-xs">
														Asignado
													</Badge>
												)}
											</div>
										</div>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											{/* Macros */}
											{formatMacros(plan) && (
												<div className="flex items-center text-sm text-muted-foreground">
													<Target className="mr-2 h-4 w-4" />
													{formatMacros(plan)}
												</div>
											)}

											{/* Comidas */}
											{plan.meals.length > 0 && (
												<div className="flex items-center text-sm text-muted-foreground">
													<ChefHat className="mr-2 h-4 w-4" />
													{plan.meals.length} comida{plan.meals.length !== 1 ? 's' : ''}
												</div>
											)}

											{/* Creador */}
											<div className="flex items-center text-sm text-muted-foreground">
												<Users className="mr-2 h-4 w-4" />
												Creado por {plan.creator.name}
											</div>

											{/* Fecha */}
											<div className="flex items-center text-sm text-muted-foreground">
												<Calendar className="mr-2 h-4 w-4" />
												{new Date(plan.createdAt).toLocaleDateString()}
											</div>

											{/* Tags */}
											{getTags(plan).length > 0 && (
												<div className="flex flex-wrap gap-1">
													{getTags(plan).map((tag: string, index: number) => (
														<Badge key={index} variant="outline" className="text-xs">
															{tag}
														</Badge>
													))}
												</div>
											)}

											{/* Acciones */}
											<div className="flex gap-2 pt-2">
												<Button variant="outline" size="sm" className="flex-1">
													Ver Detalles
												</Button>
												{activeTab === 'templates' && (
													<Button size="sm" className="flex-1">
														Usar Plantilla
													</Button>
												)}
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	)
}