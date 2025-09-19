'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { UserPlus, Dumbbell, Apple, Calendar, Target, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NewClientPage() {
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(false)
	const [activeTab, setActiveTab] = useState('basic')

	// Estados del formulario
	const [clientData, setClientData] = useState({
		// Información básica
		name: '',
		email: '',
		phone: '',
		age: '',
		gender: '',
		height: '',
		weight: '',
		// Objetivos y nivel
		fitnessGoal: '',
		activityLevel: '',
		medicalConditions: '',
		// Plan de suscripción
		subscriptionPlan: 'basic',
		// Rutina inicial
		initialWorkout: '',
		// Plan nutricional
		nutritionPlan: '',
		dietaryRestrictions: '',
		// Notas adicionales
		notes: ''
	})

	const handleInputChange = (field: string, value: string) => {
		setClientData(prev => ({ ...prev, [field]: value }))
	}

	const handleSubmit = async () => {
		setIsLoading(true)
		try {
			// Validaciones básicas
			if (!clientData.name || !clientData.email) {
				toast.error('Por favor completa los campos obligatorios')
				return
			}

			// Aquí iría la lógica para crear el cliente
			// const response = await fetch('/api/clients', {
			//   method: 'POST',
			//   headers: { 'Content-Type': 'application/json' },
			//   body: JSON.stringify(clientData)
			// })

			// Simulamos la creación exitosa
			await new Promise(resolve => setTimeout(resolve, 1000))
			
			toast.success('Cliente creado exitosamente')
			router.push('/dashboard/trainer/clients')
		} catch (error) {
			toast.error('Error al crear el cliente')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="container mx-auto py-8 max-w-4xl">
			{/* Header */}
			<div className="flex items-center gap-4 mb-8">
				<Link href="/dashboard/trainer/clients">
					<Button variant="ghost" size="sm">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Volver
					</Button>
				</Link>
				<div>
					<h1 className="text-3xl font-bold flex items-center gap-3">
						<UserPlus className="h-8 w-8 text-primary" />
						Nuevo Cliente
					</h1>
					<p className="text-muted-foreground mt-1">
						Crea un perfil completo para tu nuevo cliente
					</p>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="basic">Información Básica</TabsTrigger>
					<TabsTrigger value="fitness">Objetivos & Fitness</TabsTrigger>
					<TabsTrigger value="plans">Planes & Rutinas</TabsTrigger>
					<TabsTrigger value="nutrition">Nutrición</TabsTrigger>
				</TabsList>

				{/* Información Básica */}
				<TabsContent value="basic" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Datos Personales</CardTitle>
							<CardDescription>
								Información básica del cliente
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="name">Nombre Completo *</Label>
									<Input
										id="name"
										value={clientData.name}
										onChange={(e) => handleInputChange('name', e.target.value)}
										placeholder="Ej: Juan Pérez"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="email">Email *</Label>
									<Input
										id="email"
										type="email"
										value={clientData.email}
										onChange={(e) => handleInputChange('email', e.target.value)}
										placeholder="juan@email.com"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="phone">Teléfono</Label>
									<Input
										id="phone"
										value={clientData.phone}
										onChange={(e) => handleInputChange('phone', e.target.value)}
										placeholder="+1 234 567 8900"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="age">Edad</Label>
									<Input
										id="age"
										type="number"
										value={clientData.age}
										onChange={(e) => handleInputChange('age', e.target.value)}
										placeholder="25"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="space-y-2">
									<Label htmlFor="gender">Género</Label>
									<Select value={clientData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
										<SelectTrigger>
											<SelectValue placeholder="Seleccionar" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="male">Masculino</SelectItem>
											<SelectItem value="female">Femenino</SelectItem>
											<SelectItem value="other">Otro</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="height">Altura (cm)</Label>
									<Input
										id="height"
										type="number"
										value={clientData.height}
										onChange={(e) => handleInputChange('height', e.target.value)}
										placeholder="175"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="weight">Peso (kg)</Label>
									<Input
										id="weight"
										type="number"
										value={clientData.weight}
										onChange={(e) => handleInputChange('weight', e.target.value)}
										placeholder="70"
									/>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Objetivos & Fitness */}
				<TabsContent value="fitness" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Target className="h-5 w-5" />
								Objetivos de Fitness
							</CardTitle>
							<CardDescription>
								Define los objetivos y nivel de actividad del cliente
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="fitnessGoal">Objetivo Principal</Label>
									<Select value={clientData.fitnessGoal} onValueChange={(value) => handleInputChange('fitnessGoal', value)}>
										<SelectTrigger>
											<SelectValue placeholder="Seleccionar objetivo" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="weight_loss">Pérdida de peso</SelectItem>
											<SelectItem value="muscle_gain">Ganancia muscular</SelectItem>
											<SelectItem value="strength">Fuerza</SelectItem>
											<SelectItem value="endurance">Resistencia</SelectItem>
											<SelectItem value="general_fitness">Fitness general</SelectItem>
											<SelectItem value="rehabilitation">Rehabilitación</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="activityLevel">Nivel de Actividad</Label>
									<Select value={clientData.activityLevel} onValueChange={(value) => handleInputChange('activityLevel', value)}>
										<SelectTrigger>
											<SelectValue placeholder="Seleccionar nivel" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="sedentary">Sedentario</SelectItem>
											<SelectItem value="lightly_active">Ligeramente activo</SelectItem>
											<SelectItem value="moderately_active">Moderadamente activo</SelectItem>
											<SelectItem value="very_active">Muy activo</SelectItem>
											<SelectItem value="extremely_active">Extremadamente activo</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="medicalConditions">Condiciones Médicas o Lesiones</Label>
								<Textarea
									id="medicalConditions"
									value={clientData.medicalConditions}
									onChange={(e) => handleInputChange('medicalConditions', e.target.value)}
									placeholder="Describe cualquier condición médica, lesión previa o limitación física..."
									rows={3}
								/>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Planes & Rutinas */}
				<TabsContent value="plans" className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Plan de Suscripción */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Badge className="h-5 w-5" />
									Plan de Suscripción
								</CardTitle>
								<CardDescription>
									Selecciona el plan de entrenamiento
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<Select value={clientData.subscriptionPlan} onValueChange={(value) => handleInputChange('subscriptionPlan', value)}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="basic">
											<div className="flex flex-col">
												<span className="font-medium">Plan Básico</span>
												<span className="text-sm text-muted-foreground">$29/mes - 2 sesiones semanales</span>
											</div>
										</SelectItem>
										<SelectItem value="pro">
											<div className="flex flex-col">
												<span className="font-medium">Plan Pro</span>
												<span className="text-sm text-muted-foreground">$49/mes - 4 sesiones semanales</span>
											</div>
										</SelectItem>
										<SelectItem value="premium">
											<div className="flex flex-col">
												<span className="font-medium">Plan Premium</span>
												<span className="text-sm text-muted-foreground">$79/mes - Sesiones ilimitadas</span>
											</div>
										</SelectItem>
									</SelectContent>
								</Select>
							</CardContent>
						</Card>

						{/* Rutina Inicial */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Dumbbell className="h-5 w-5" />
									Rutina de Entrenamiento
								</CardTitle>
								<CardDescription>
									Asigna una rutina inicial
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<Select value={clientData.initialWorkout} onValueChange={(value) => handleInputChange('initialWorkout', value)}>
									<SelectTrigger>
										<SelectValue placeholder="Seleccionar rutina" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="beginner_fullbody">Principiante - Cuerpo Completo</SelectItem>
										<SelectItem value="intermediate_split">Intermedio - Rutina Dividida</SelectItem>
										<SelectItem value="strength_focused">Enfoque en Fuerza</SelectItem>
										<SelectItem value="cardio_hiit">Cardio + HIIT</SelectItem>
										<SelectItem value="functional">Entrenamiento Funcional</SelectItem>
										<SelectItem value="custom">Rutina Personalizada</SelectItem>
									</SelectContent>
								</Select>
								
								<div className="p-4 bg-blue-50 rounded-lg">
									<p className="text-sm text-blue-700">
										💡 <strong>Tip:</strong> Puedes crear rutinas personalizadas después de crear el cliente
									</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Nutrición */}
				<TabsContent value="nutrition" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Apple className="h-5 w-5" />
								Plan Nutricional
							</CardTitle>
							<CardDescription>
								Configura el plan nutricional del cliente
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="nutritionPlan">Tipo de Plan Nutricional</Label>
								<Select value={clientData.nutritionPlan} onValueChange={(value) => handleInputChange('nutritionPlan', value)}>
									<SelectTrigger>
										<SelectValue placeholder="Seleccionar plan" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="balanced">Dieta Balanceada</SelectItem>
										<SelectItem value="low_carb">Baja en Carbohidratos</SelectItem>
										<SelectItem value="high_protein">Alta en Proteínas</SelectItem>
										<SelectItem value="mediterranean">Mediterránea</SelectItem>
										<SelectItem value="vegetarian">Vegetariana</SelectItem>
										<SelectItem value="vegan">Vegana</SelectItem>
										<SelectItem value="keto">Cetogénica</SelectItem>
										<SelectItem value="custom">Plan Personalizado</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="dietaryRestrictions">Restricciones Alimentarias</Label>
								<Textarea
									id="dietaryRestrictions"
									value={clientData.dietaryRestrictions}
									onChange={(e) => handleInputChange('dietaryRestrictions', e.target.value)}
									placeholder="Alergias, intolerancias, preferencias alimentarias..."
									rows={3}
								/>
							</div>

							<div className="p-4 bg-green-50 rounded-lg">
								<p className="text-sm text-green-700">
									🥗 <strong>Próximamente:</strong> Generación automática de planes nutricionales con IA
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Notas Adicionales */}
					<Card>
						<CardHeader>
							<CardTitle>Notas Adicionales</CardTitle>
							<CardDescription>
								Información adicional sobre el cliente
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Textarea
								id="notes"
								value={clientData.notes}
								onChange={(e) => handleInputChange('notes', e.target.value)}
								placeholder="Motivaciones, preferencias de horario, experiencias previas, etc..."
								rows={4}
							/>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Botones de Acción */}
			<div className="flex justify-between items-center pt-6 border-t">
				<div className="flex gap-2">
					{activeTab !== 'basic' && (
						<Button 
							variant="outline" 
							onClick={() => {
								const tabs = ['basic', 'fitness', 'plans', 'nutrition']
								const currentIndex = tabs.indexOf(activeTab)
								if (currentIndex > 0) {
									setActiveTab(tabs[currentIndex - 1])
								}
							}}
						>
							Anterior
						</Button>
					)}
					{activeTab !== 'nutrition' && (
						<Button 
							variant="outline"
							onClick={() => {
								const tabs = ['basic', 'fitness', 'plans', 'nutrition']
								const currentIndex = tabs.indexOf(activeTab)
								if (currentIndex < tabs.length - 1) {
									setActiveTab(tabs[currentIndex + 1])
								}
							}}
						>
							Siguiente
						</Button>
					)}
				</div>

				<div className="flex gap-2">
					<Button variant="outline" asChild>
						<Link href="/dashboard/trainer/clients">
							Cancelar
						</Link>
					</Button>
					<Button 
						onClick={handleSubmit}
						disabled={isLoading || !clientData.name || !clientData.email}
						size="lg"
					>
						{isLoading ? 'Creando...' : 'Crear Cliente'}
					</Button>
				</div>
			</div>
		</div>
	)
}