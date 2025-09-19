import { Metadata } from 'next'
import { ClientManagement } from '@/components/trainer/client-management'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, Calendar, MessageSquare } from 'lucide-react'

export const metadata: Metadata = {
	title: 'Gestión de Clientes | Kairos Fitness',
	description: 'Gestiona tus clientes asignados y su progreso'
}

export default function TrainerClientsPage() {
	return (
		<div className="container mx-auto py-8 space-y-8">
			{/* Header */}
			<div className="space-y-4">
				<h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
					<Users className="h-8 w-8 text-primary" />
					Gestión de Clientes
				</h1>
				<p className="text-lg text-muted-foreground">
					Administra tus clientes, revisa su progreso y mantén una comunicación efectiva
				</p>
			</div>

			{/* Estadísticas rápidas */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">12</div>
						<p className="text-xs text-muted-foreground">
							+2 desde el mes pasado
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Sesiones Esta Semana</CardTitle>
						<Calendar className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">28</div>
						<p className="text-xs text-muted-foreground">
							+12% vs semana anterior
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Progreso Promedio</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">85%</div>
						<p className="text-xs text-muted-foreground">
							Adherencia a rutinas
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Mensajes Pendientes</CardTitle>
						<MessageSquare className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">3</div>
						<p className="text-xs text-muted-foreground">
							Requieren respuesta
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Componente de gestión de clientes */}
			<ClientManagement />
		</div>
	)
}