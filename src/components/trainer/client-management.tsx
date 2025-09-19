'use client'

import { useState } from 'react'
import { useTrainerAssignment } from '@/hooks/use-trainer-assignment'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Users, UserPlus, Mail, Calendar, MessageSquare, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface ClientManagementProps {
	onClientUpdate?: () => void
}

export function ClientManagement({ onClientUpdate }: ClientManagementProps) {
	const {
		assignments,
		loading,
		error,
		assignClient,
		removeAssignment,
		loadAssignments
	} = useTrainerAssignment()

	const [showAddClientDialog, setShowAddClientDialog] = useState(false)
	const [newClientEmail, setNewClientEmail] = useState('')
	const [assignmentNotes, setAssignmentNotes] = useState('')
	const [searchTerm, setSearchTerm] = useState('')
	const [addingClient, setAddingClient] = useState(false)

	// Filtrar clientes por término de búsqueda
	const filteredAssignments = assignments.filter(assignment => 
		assignment.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		assignment.client.email.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const handleAddClient = async () => {
		if (!newClientEmail.trim()) {
			toast.error('El email del cliente es obligatorio')
			return
		}

		setAddingClient(true)
		try {
			// Aquí necesitaríamos buscar el cliente por email primero
			// Por ahora, asumimos que tenemos el ID del cliente
			// En una implementación real, necesitaríamos una API para buscar usuarios por email
			
			// TODO: Implementar búsqueda de cliente por email
			toast.error('Funcionalidad de búsqueda de cliente por email pendiente de implementar')
			
			// await assignClient(clientId, assignmentNotes || undefined)
			// toast.success('Cliente asignado correctamente')
			// setShowAddClientDialog(false)
			// setNewClientEmail('')
			// setAssignmentNotes('')
			// onClientUpdate?.()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Error al asignar cliente')
		} finally {
			setAddingClient(false)
		}
	}

	const handleRemoveClient = async (clientId: string, clientName: string) => {
		try {
			await removeAssignment(clientId)
			toast.success(`Cliente ${clientName} eliminado correctamente`)
			onClientUpdate?.()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Error al eliminar cliente')
		}
	}

	const formatAssignmentDate = (dateString: string) => {
		try {
			const date = new Date(dateString)
			return formatDistanceToNow(date, { addSuffix: true, locale: es })
		} catch {
			return 'Fecha no disponible'
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
					<p className="text-gray-600">Cargando clientes...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Header con acciones */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h2 className="text-2xl font-bold flex items-center gap-2">
						<Users className="h-6 w-6" />
						Mis Clientes
					</h2>
					<p className="text-gray-600 mt-1">
						Gestiona tus clientes asignados ({assignments.length})
					</p>
				</div>

				<Dialog open={showAddClientDialog} onOpenChange={setShowAddClientDialog}>
					<DialogTrigger asChild>
						<Button className="flex items-center gap-2">
							<UserPlus className="h-4 w-4" />
							Añadir Cliente
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Añadir Nuevo Cliente</DialogTitle>
							<DialogDescription>
								Ingresa el email del cliente que deseas asignar
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div>
								<label className="text-sm font-medium mb-2 block">
									Email del Cliente
								</label>
								<Input
									type="email"
									placeholder="cliente@ejemplo.com"
									value={newClientEmail}
									onChange={(e) => setNewClientEmail(e.target.value)}
								/>
							</div>
							<div>
								<label className="text-sm font-medium mb-2 block">
									Notas (opcional)
								</label>
								<Textarea
									placeholder="Notas sobre el cliente, objetivos, etc."
									value={assignmentNotes}
									onChange={(e) => setAssignmentNotes(e.target.value)}
									rows={3}
								/>
							</div>
						</div>
						<div className="flex justify-end gap-2">
							<Button 
								variant="outline" 
								onClick={() => setShowAddClientDialog(false)}
							>
								Cancelar
							</Button>
							<Button 
								onClick={handleAddClient}
								disabled={addingClient || !newClientEmail.trim()}
							>
								{addingClient ? 'Añadiendo...' : 'Añadir Cliente'}
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			{/* Barra de búsqueda */}
			{assignments.length > 0 && (
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
					<Input
						placeholder="Buscar clientes por nombre o email..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>
			)}

			{/* Mostrar errores */}
			{error && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
					<p className="text-red-800">{error}</p>
				</div>
			)}

			{/* Lista de clientes */}
			{filteredAssignments.length === 0 ? (
				<Card>
					<CardContent className="text-center py-12">
						<Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
						<h3 className="text-lg font-semibold text-gray-900 mb-2">
							{assignments.length === 0 ? 'No tienes clientes asignados' : 'No se encontraron clientes'}
						</h3>
						<p className="text-gray-600 mb-4">
							{assignments.length === 0 
								? 'Comienza añadiendo tu primer cliente para empezar a entrenar'
								: 'Intenta con otros términos de búsqueda'
							}
						</p>
						{assignments.length === 0 && (
							<Button onClick={() => setShowAddClientDialog(true)}>
								Añadir Primer Cliente
							</Button>
						)}
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredAssignments.map((assignment) => (
						<Card key={assignment.id} className="hover:shadow-lg transition-shadow">
							<CardHeader>
								<div className="flex justify-between items-start">
									<div>
										<CardTitle className="text-lg">
											{assignment.client.name}
										</CardTitle>
										<CardDescription className="flex items-center gap-1">
											<Mail className="h-3 w-3" />
											{assignment.client.email}
										</CardDescription>
									</div>
									<Dialog>
										<DialogTrigger asChild>
											<Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
												<Trash2 className="h-4 w-4" />
											</Button>
										</DialogTrigger>
										<DialogContent>
											<DialogHeader>
												<DialogTitle>¿Eliminar cliente?</DialogTitle>
												<DialogDescription>
													¿Estás seguro de que deseas eliminar a {assignment.client.name} de tu lista de clientes? 
													Esta acción no se puede deshacer.
												</DialogDescription>
											</DialogHeader>
											<DialogFooter className="gap-2">
												<Button variant="outline">Cancelar</Button>
												<Button 
													onClick={() => handleRemoveClient(assignment.clientId, assignment.client.name)}
													className="bg-red-600 hover:bg-red-700 text-white"
												>
													Eliminar
												</Button>
											</DialogFooter>
										</DialogContent>
									</Dialog>
								</div>
							</CardHeader>
							<CardContent className="space-y-3">
								{/* Fecha de asignación */}
								<div className="flex items-center gap-2 text-sm text-gray-600">
									<Calendar className="h-4 w-4" />
									Asignado {formatAssignmentDate(assignment.assignedAt)}
								</div>

								{/* Notas */}
								{assignment.notes && (
									<div className="bg-gray-50 rounded-lg p-3">
										<p className="text-sm text-gray-700">
											<strong>Notas:</strong> {assignment.notes}
										</p>
									</div>
								)}

								{/* Acciones */}
								<div className="flex gap-2">
									<Button variant="outline" size="sm" className="flex-1">
										<MessageSquare className="h-4 w-4 mr-1" />
										Chat
									</Button>
									<Button variant="outline" size="sm" className="flex-1">
										<Calendar className="h-4 w-4 mr-1" />
										Plan
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	)
}