'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
	ArrowLeft,
	Edit,
	MessageSquare,
	Calendar,
	Phone,
	Mail,
	MapPin,
	TrendingUp,
	Target,
	Trophy,
	Clock,
	Dumbbell,
	Activity,
	User,
	Settings,
	BarChart3
} from 'lucide-react'
import Link from 'next/link'

interface Client {
	id: string
	name: string
	email: string
	phone: string
	avatar: string
	age: number
	joinDate: string
	subscription: string
	status: string
	lastWorkout: string
	totalWorkouts: number
	streak: number
	progress: number
	goals: string[]
	nextSession?: string
	location: string
	monthlyRevenue: number
	satisfaction: number
	notes: string
}

export default function ClientDetailPage() {
	const params = useParams()
	const router = useRouter()
	const clientId = params.id as string
	const [client, setClient] = useState<Client | null>(null)
	const [loading, setLoading] = useState(true)

	// Mock clients data - en producción vendría de una API
	const mockClients: Client[] = useMemo(() => [
		{
			id: '1',
			name: 'María García',
			email: 'maria@email.com',
			phone: '+1 305 123 4567',
			avatar: 'MG',
			age: 28,
			joinDate: '2024-01-15',
			subscription: 'Pro',
			status: 'active',
			lastWorkout: '2024-01-20',
			totalWorkouts: 24,
			streak: 5,
			progress: 85,
			goals: ['Pérdida de peso', 'Tono muscular'],
			nextSession: 'Hoy, 6:00 PM',
			location: 'Miami, FL',
			monthlyRevenue: 199,
			satisfaction: 5,
			notes: 'Muy motivada, prefiere entrenamientos matutinos'
		},
		{
			id: '2',
			name: 'Carlos López',
			email: 'carlos@email.com',
			phone: '+1 305 987 6543',
			avatar: 'CL',
			age: 35,
			joinDate: '2024-01-10',
			subscription: 'Basic',
			status: 'active',
			lastWorkout: '2024-01-19',
			totalWorkouts: 18,
			streak: 3,
			progress: 72,
			goals: ['Ganancia muscular', 'Fuerza'],
			nextSession: 'Mañana, 8:00 AM',
			location: 'Miami, FL',
			monthlyRevenue: 99,
			satisfaction: 4,
			notes: 'Buen progreso en compound lifts'
		},
		{
			id: '3',
			name: 'Ana Rodríguez',
			email: 'ana@email.com',
			phone: '+1 305 555 0123',
			avatar: 'AR',
			age: 42,
			joinDate: '2024-01-08',
			subscription: 'Pro',
			status: 'active',
			lastWorkout: '2024-01-20',
			totalWorkouts: 36,
			streak: 12,
			progress: 95,
			goals: ['Resistencia', 'Salud general'],
			nextSession: 'Miércoles, 5:00 PM',
			location: 'Miami Beach, FL',
			monthlyRevenue: 199,
			satisfaction: 5,
			notes: 'Cliente ejemplar, siempre puntual'
		}
	], [])

	const loadClient = useCallback(() => {
		// Simular carga de datos
		setTimeout(() => {
			const foundClient = mockClients.find(c => c.id === clientId)
			setClient(foundClient || null)
			setLoading(false)
		}, 500)
	}, [clientId, mockClients])

	useEffect(() => {
		loadClient()
	}, [loadClient])

	const getStatusColor = (status: string) => {
		return status === 'active' ? 'default' : 'secondary'
	}

	const getSubscriptionColor = (subscription: string) => {
		switch (subscription) {
			case 'Pro': return 'default'
			case 'Basic': return 'secondary'
			case 'Premium': return 'destructive'
			default: return 'outline'
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Cargando información del cliente...</p>
				</div>
			</div>
		)
	}

	if (!client) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<h2 className="text-2xl font-bold text-gray-900 mb-2">Cliente no encontrado</h2>
					<p className="text-gray-600 mb-6">El cliente que buscas no existe o ha sido eliminado.</p>
					<Link href="/dashboard/trainer/clients">
						<Button>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Volver a Clientes
						</Button>
					</Link>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Link href="/dashboard/trainer/clients">
						<Button variant="ghost" size="sm">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Volver
						</Button>
					</Link>
					<div>
						<h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
						<p className="text-gray-600">Cliente desde {new Date(client.joinDate).toLocaleDateString()}</p>
					</div>
				</div>
				<div className="flex gap-2">
					<Button variant="outline">
						<MessageSquare className="h-4 w-4 mr-2" />
						Mensaje
					</Button>
					<Button variant="outline">
						<Calendar className="h-4 w-4 mr-2" />
						Programar
					</Button>
					<Button>
						<Edit className="h-4 w-4 mr-2" />
						Editar
					</Button>
				</div>
			</div>

			{/* Client Overview */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Profile Card */}
				<Card>
					<CardHeader className="text-center">
						<div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
							{client.avatar}
						</div>
						<CardTitle>{client.name}</CardTitle>
						<CardDescription>{client.age} años</CardDescription>
						<div className="flex justify-center gap-2 mt-2">
							<Badge variant={getStatusColor(client.status)}>
								{client.status === 'active' ? 'Activo' : 'Inactivo'}
							</Badge>
							<Badge variant={getSubscriptionColor(client.subscription)}>
								{client.subscription}
							</Badge>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-sm">
								<Mail className="h-4 w-4 text-gray-500" />
								<span>{client.email}</span>
							</div>
							<div className="flex items-center gap-2 text-sm">
								<Phone className="h-4 w-4 text-gray-500" />
								<span>{client.phone}</span>
							</div>
							<div className="flex items-center gap-2 text-sm">
								<MapPin className="h-4 w-4 text-gray-500" />
								<span>{client.location}</span>
							</div>
						</div>

						<div className="pt-4 border-t">
							<h4 className="font-medium mb-2">Objetivos</h4>
							<div className="flex flex-wrap gap-1">
								{client.goals.map((goal, index) => (
									<Badge key={index} variant="outline" className="text-xs">
										{goal}
									</Badge>
								))}
							</div>
						</div>

						<div className="pt-4 border-t">
							<h4 className="font-medium mb-2">Notas</h4>
							<p className="text-sm text-gray-600">{client.notes}</p>
						</div>
					</CardContent>
				</Card>

				{/* Stats Cards */}
				<div className="lg:col-span-2 grid grid-cols-2 gap-4">
					<Card>
						<CardContent className="p-6 text-center">
							<div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
								<Dumbbell className="h-6 w-6 text-blue-600" />
							</div>
							<div className="text-2xl font-bold text-gray-900">{client.totalWorkouts}</div>
							<p className="text-sm text-gray-600">Entrenamientos</p>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-6 text-center">
							<div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-3">
								<Trophy className="h-6 w-6 text-orange-600" />
							</div>
							<div className="text-2xl font-bold text-gray-900">{client.streak}</div>
							<p className="text-sm text-gray-600">Días de racha</p>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-6 text-center">
							<div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
								<TrendingUp className="h-6 w-6 text-green-600" />
							</div>
							<div className="text-2xl font-bold text-gray-900">{client.progress}%</div>
							<p className="text-sm text-gray-600">Progreso</p>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-6 text-center">
							<div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-3">
								<BarChart3 className="h-6 w-6 text-purple-600" />
							</div>
							<div className="text-2xl font-bold text-gray-900">${client.monthlyRevenue}</div>
							<p className="text-sm text-gray-600">Ingresos/mes</p>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Next Session */}
			{client.nextSession && (
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-green-100 rounded-full">
									<Calendar className="h-5 w-5 text-green-600" />
								</div>
								<div>
									<h3 className="font-medium">Próxima Sesión</h3>
									<p className="text-sm text-gray-600">{client.nextSession}</p>
								</div>
							</div>
							<div className="flex gap-2">
								<Button variant="outline" size="sm">
									Reprogramar
								</Button>
								<Button size="sm">
									Iniciar Sesión
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Detailed Information Tabs */}
			<Tabs defaultValue="progress" className="space-y-6">
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="progress">Progreso</TabsTrigger>
					<TabsTrigger value="workouts">Rutinas</TabsTrigger>
					<TabsTrigger value="history">Historial</TabsTrigger>
					<TabsTrigger value="billing">Facturación</TabsTrigger>
				</TabsList>

				<TabsContent value="progress" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Progreso General</CardTitle>
							<CardDescription>
								Seguimiento del progreso del cliente
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div>
									<div className="flex justify-between text-sm mb-2">
										<span>Progreso hacia objetivos</span>
										<span>{client.progress}%</span>
									</div>
									<Progress value={client.progress} className="h-2" />
								</div>
								<div className="grid grid-cols-2 gap-4 pt-4">
									<div className="text-center p-4 bg-gray-50 rounded-lg">
										<div className="text-2xl font-bold text-blue-600">85%</div>
										<div className="text-sm text-gray-600">Asistencia</div>
									</div>
									<div className="text-center p-4 bg-gray-50 rounded-lg">
										<div className="text-2xl font-bold text-green-600">92%</div>
										<div className="text-sm text-gray-600">Satisfacción</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="workouts" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Rutinas Asignadas</CardTitle>
							<CardDescription>
								Rutinas de entrenamiento del cliente
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="text-center py-8">
								<Dumbbell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
								<p className="text-gray-600">No hay rutinas asignadas</p>
								<Button className="mt-4">
									Asignar Rutina
								</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="history" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Historial de Entrenamientos</CardTitle>
							<CardDescription>
								Últimas sesiones completadas
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex items-center justify-between p-4 border rounded-lg">
									<div>
										<h4 className="font-medium">Full Body Strength</h4>
										<p className="text-sm text-gray-600">20 de Enero, 2024</p>
									</div>
									<div className="text-right">
										<div className="text-sm font-medium">45 min</div>
										<div className="text-xs text-gray-500">Completado</div>
									</div>
								</div>
								<div className="flex items-center justify-between p-4 border rounded-lg">
									<div>
										<h4 className="font-medium">Cardio HIIT</h4>
										<p className="text-sm text-gray-600">18 de Enero, 2024</p>
									</div>
									<div className="text-right">
										<div className="text-sm font-medium">30 min</div>
										<div className="text-xs text-gray-500">Completado</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="billing" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Información de Facturación</CardTitle>
							<CardDescription>
								Historial de pagos y suscripción
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
									<div>
										<h4 className="font-medium text-green-900">Plan {client.subscription}</h4>
										<p className="text-sm text-green-700">Activo - Próximo pago: 15 Feb 2024</p>
									</div>
									<div className="text-right">
										<div className="text-lg font-bold text-green-900">${client.monthlyRevenue}</div>
										<div className="text-sm text-green-700">/mes</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}