'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DollarSign, TrendingUp, Users, Calendar, Download, Eye, Search } from 'lucide-react'

export default function TrainerBillingPage() {
	const [searchTerm, setSearchTerm] = useState('')

	// Mock data
	const monthlyStats = {
		totalRevenue: 4250.00,
		pendingPayments: 850.00,
		completedSessions: 42,
		activeClients: 18,
		growthRate: 12.5
	}

	const recentInvoices = [
		{
			id: 'INV-2024-001',
			client: 'Ana García',
			service: 'Entrenamiento Personal - Paquete Mensual',
			amount: 250.00,
			status: 'paid',
			date: '2024-01-15',
			dueDate: '2024-01-15'
		},
		{
			id: 'INV-2024-002',
			client: 'Carlos López',
			service: 'Plan de Entrenamiento + Nutrición',
			amount: 180.00,
			status: 'pending',
			date: '2024-01-12',
			dueDate: '2024-01-19'
		},
		{
			id: 'INV-2024-003',
			client: 'María Rodríguez',
			service: 'Sesión de Evaluación Física',
			amount: 75.00,
			status: 'overdue',
			date: '2024-01-08',
			dueDate: '2024-01-15'
		},
		{
			id: 'INV-2024-004',
			client: 'Pedro Martín',
			service: 'Entrenamiento Grupal - 4 Sesiones',
			amount: 120.00,
			status: 'paid',
			date: '2024-01-10',
			dueDate: '2024-01-10'
		}
	]

	const clientPayments = [
		{
			client: 'Ana García',
			totalPaid: 750.00,
			pendingAmount: 0,
			lastPayment: '2024-01-15',
			status: 'current'
		},
		{
			client: 'Carlos López',
			totalPaid: 540.00,
			pendingAmount: 180.00,
			lastPayment: '2023-12-15',
			status: 'pending'
		},
		{
			client: 'María Rodríguez',
			totalPaid: 225.00,
			pendingAmount: 75.00,
			lastPayment: '2023-12-20',
			status: 'overdue'
		},
		{
			client: 'Pedro Martín',
			totalPaid: 360.00,
			pendingAmount: 0,
			lastPayment: '2024-01-10',
			status: 'current'
		}
	]

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'paid': return 'bg-green-100 text-green-800'
			case 'pending': return 'bg-yellow-100 text-yellow-800'
			case 'overdue': return 'bg-red-100 text-red-800'
			case 'current': return 'bg-green-100 text-green-800'
			default: return 'bg-gray-100 text-gray-800'
		}
	}

	const getStatusLabel = (status: string) => {
		switch (status) {
			case 'paid': return 'Pagado'
			case 'pending': return 'Pendiente'
			case 'overdue': return 'Vencido'
			case 'current': return 'Al día'
			default: return status
		}
	}

	const filteredInvoices = recentInvoices.filter(invoice =>
		invoice.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
		invoice.id.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const filteredClients = clientPayments.filter(client =>
		client.client.toLowerCase().includes(searchTerm.toLowerCase())
	)

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Facturación</h1>
					<p className="text-gray-600">Gestiona tus ingresos y pagos de clientes</p>
				</div>
				<Button>
					<DollarSign className="h-4 w-4 mr-2" />
					Nueva Factura
				</Button>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Ingresos del Mes</p>
								<p className="text-2xl font-bold">${monthlyStats.totalRevenue.toFixed(2)}</p>
							</div>
							<DollarSign className="h-8 w-8 text-green-600" />
						</div>
						<div className="flex items-center gap-1 mt-2">
							<TrendingUp className="h-4 w-4 text-green-600" />
							<span className="text-sm text-green-600">+{monthlyStats.growthRate}%</span>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Pagos Pendientes</p>
								<p className="text-2xl font-bold">${monthlyStats.pendingPayments.toFixed(2)}</p>
							</div>
							<Calendar className="h-8 w-8 text-orange-600" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Sesiones Completadas</p>
								<p className="text-2xl font-bold">{monthlyStats.completedSessions}</p>
							</div>
							<TrendingUp className="h-8 w-8 text-blue-600" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Clientes Activos</p>
								<p className="text-2xl font-bold">{monthlyStats.activeClients}</p>
							</div>
							<Users className="h-8 w-8 text-purple-600" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="invoices" className="space-y-4">
				<TabsList>
					<TabsTrigger value="invoices">Facturas</TabsTrigger>
					<TabsTrigger value="clients">Clientes</TabsTrigger>
					<TabsTrigger value="reports">Reportes</TabsTrigger>
				</TabsList>

				<TabsContent value="invoices" className="space-y-4">
					{/* Search */}
					<div className="flex gap-4">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
							<Input
								placeholder="Buscar facturas..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Facturas Recientes</CardTitle>
							<CardDescription>
								Gestiona y revisa tus facturas emitidas
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{filteredInvoices.map((invoice) => (
									<div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
										<div className="flex items-center gap-4">
											<div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
												<DollarSign className="h-5 w-5 text-blue-600" />
											</div>
											<div>
												<p className="font-medium">{invoice.id}</p>
												<p className="text-sm text-gray-600">{invoice.client}</p>
												<p className="text-sm text-gray-500">{invoice.service}</p>
											</div>
										</div>
										<div className="flex items-center gap-4">
											<div className="text-right">
												<p className="font-medium">${invoice.amount.toFixed(2)}</p>
												<p className="text-sm text-gray-600">Vence: {invoice.dueDate}</p>
												<Badge className={getStatusColor(invoice.status)}>
													{getStatusLabel(invoice.status)}
												</Badge>
											</div>
											<div className="flex gap-2">
												<Button variant="outline" size="sm">
													<Eye className="h-4 w-4 mr-2" />
													Ver
												</Button>
												<Button variant="outline" size="sm">
													<Download className="h-4 w-4 mr-2" />
													Descargar
												</Button>
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="clients" className="space-y-4">
					{/* Search */}
					<div className="flex gap-4">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
							<Input
								placeholder="Buscar clientes..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Estado de Pagos por Cliente</CardTitle>
							<CardDescription>
								Revisa el estado de pagos de cada cliente
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{filteredClients.map((client, index) => (
									<div key={index} className="flex items-center justify-between p-4 border rounded-lg">
										<div className="flex items-center gap-4">
											<div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full">
												<Users className="h-5 w-5 text-purple-600" />
											</div>
											<div>
												<p className="font-medium">{client.client}</p>
												<p className="text-sm text-gray-600">Último pago: {client.lastPayment}</p>
											</div>
										</div>
										<div className="flex items-center gap-4">
											<div className="text-right">
												<p className="font-medium">Total: ${client.totalPaid.toFixed(2)}</p>
												{client.pendingAmount > 0 && (
													<p className="text-sm text-red-600">Pendiente: ${client.pendingAmount.toFixed(2)}</p>
												)}
												<Badge className={getStatusColor(client.status)}>
													{getStatusLabel(client.status)}
												</Badge>
											</div>
											<div className="flex gap-2">
												<Button variant="outline" size="sm">
													Ver Historial
												</Button>
												{client.pendingAmount > 0 && (
													<Button size="sm">
														Enviar Recordatorio
													</Button>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="reports" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle>Generar Reporte</CardTitle>
								<CardDescription>
									Crea reportes personalizados de ingresos
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label>Fecha de Inicio</Label>
									<Input type="date" />
								</div>
								<div className="space-y-2">
									<Label>Fecha de Fin</Label>
									<Input type="date" />
								</div>
								<Button className="w-full">
									<Download className="h-4 w-4 mr-2" />
									Generar Reporte
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Resumen Fiscal</CardTitle>
								<CardDescription>
									Información para declaraciones fiscales
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">Ingresos Anuales:</span>
									<span className="font-medium">$51,000.00</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">Gastos Deducibles:</span>
									<span className="font-medium">$8,500.00</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">Ingresos Netos:</span>
									<span className="font-medium">$42,500.00</span>
								</div>
								<Button variant="outline" className="w-full">
									<Download className="h-4 w-4 mr-2" />
									Descargar Resumen Fiscal
								</Button>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	)
}