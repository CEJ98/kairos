'use client'

import { useState } from 'react'
import { useTrainerAssignment, TrainerSearchFilters, TrainerSearchResult } from '@/hooks/use-trainer-assignment'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Star, MapPin, DollarSign, Users, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface TrainerSearchProps {
	onAssignmentSuccess?: () => void
}

export function TrainerSearch({ onAssignmentSuccess }: TrainerSearchProps) {
	const {
		trainers,
		searchLoading,
		loading,
		error,
		searchTrainers,
		requestAssignment,
		clearError
	} = useTrainerAssignment()

	const [filters, setFilters] = useState<TrainerSearchFilters>({})
	const [selectedTrainer, setSelectedTrainer] = useState<TrainerSearchResult | null>(null)
	const [assignmentNotes, setAssignmentNotes] = useState('')
	const [showAssignmentForm, setShowAssignmentForm] = useState(false)

	const handleSearch = async () => {
		clearError()
		await searchTrainers(filters)
	}

	const handleAssignmentRequest = async () => {
		if (!selectedTrainer) return

		try {
			await requestAssignment(selectedTrainer.id, assignmentNotes || undefined)
			toast.success('Solicitud de asignación enviada correctamente')
			setShowAssignmentForm(false)
			setSelectedTrainer(null)
			setAssignmentNotes('')
			onAssignmentSuccess?.()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Error al solicitar asignación')
		}
	}

	const formatRate = (rate?: number) => {
		if (!rate) return 'No especificado'
		return `$${rate}/hora`
	}

	const formatRating = (rating?: number) => {
		if (!rating) return 'Sin calificaciones'
		return `${rating.toFixed(1)}/5`
	}

	return (
		<div className="space-y-6">
			{/* Filtros de búsqueda */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Search className="h-5 w-5" />
						Buscar Entrenadores
					</CardTitle>
					<CardDescription>
						Encuentra el entrenador perfecto para tus objetivos
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<div>
							<label className="text-sm font-medium mb-2 block">
								Especialidad
							</label>
							<Select
								value={filters.specialty || ''}
								onValueChange={(value) => 
									setFilters(prev => ({ ...prev, specialty: value || undefined }))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Todas las especialidades" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">Todas las especialidades</SelectItem>
									<SelectItem value="Pérdida de peso">Pérdida de peso</SelectItem>
									<SelectItem value="Ganancia muscular">Ganancia muscular</SelectItem>
									<SelectItem value="Fuerza">Fuerza</SelectItem>
									<SelectItem value="Resistencia">Resistencia</SelectItem>
									<SelectItem value="Rehabilitación">Rehabilitación</SelectItem>
									<SelectItem value="Deportes específicos">Deportes específicos</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="text-sm font-medium mb-2 block">
								Tarifa máxima ($/hora)
							</label>
							<Input
								type="number"
								placeholder="Ej: 50"
								value={filters.maxRate || ''}
								onChange={(e) => 
									setFilters(prev => ({ 
										...prev, 
										maxRate: e.target.value ? parseFloat(e.target.value) : undefined 
									}))
								}
							/>
						</div>

						<div>
							<label className="text-sm font-medium mb-2 block">
								Experiencia mínima (años)
							</label>
							<Input
								type="number"
								placeholder="Ej: 2"
								value={filters.minExperience || ''}
								onChange={(e) => 
									setFilters(prev => ({ 
										...prev, 
										minExperience: e.target.value ? parseInt(e.target.value) : undefined 
									}))
								}
							/>
						</div>

						<div>
							<label className="text-sm font-medium mb-2 block">
								Ubicación
							</label>
							<Input
								placeholder="Ciudad o región"
								value={filters.location || ''}
								onChange={(e) => 
									setFilters(prev => ({ ...prev, location: e.target.value || undefined }))
								}
							/>
						</div>
					</div>

					<Button 
						onClick={handleSearch}
						disabled={searchLoading}
						className="w-full md:w-auto"
					>
						{searchLoading ? 'Buscando...' : 'Buscar Entrenadores'}
					</Button>
				</CardContent>
			</Card>

			{/* Mostrar errores */}
			{error && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
					<p className="text-red-800">{error}</p>
				</div>
			)}

			{/* Resultados de búsqueda */}
			{trainers.length > 0 && (
				<div className="space-y-4">
					<h3 className="text-lg font-semibold">
						Entrenadores encontrados ({trainers.length})
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{trainers.map((trainer) => (
							<Card key={trainer.id} className="hover:shadow-lg transition-shadow">
								<CardHeader>
									<CardTitle className="text-lg">{trainer.name}</CardTitle>
									<CardDescription>{trainer.email}</CardDescription>
								</CardHeader>
								<CardContent className="space-y-3">
									{/* Especialidades */}
									<div className="flex flex-wrap gap-1">
										{trainer.specialties.map((specialty) => (
											<Badge key={specialty} variant="secondary" className="text-xs">
												{specialty}
											</Badge>
										))}
									</div>

									{/* Información adicional */}
									<div className="space-y-2 text-sm text-gray-600">
										<div className="flex items-center gap-2">
											<DollarSign className="h-4 w-4" />
											{formatRate(trainer.hourlyRate)}
										</div>
										{trainer.experience && (
											<div className="flex items-center gap-2">
												<Clock className="h-4 w-4" />
												{trainer.experience} años de experiencia
											</div>
										)}
										{trainer.location && (
											<div className="flex items-center gap-2">
												<MapPin className="h-4 w-4" />
												{trainer.location}
											</div>
										)}
										<div className="flex items-center gap-2">
											<Users className="h-4 w-4" />
											{trainer.totalClients} clientes
										</div>
										<div className="flex items-center gap-2">
											<Star className="h-4 w-4" />
											{formatRating(trainer.rating)}
										</div>
									</div>

									<Button 
										onClick={() => {
											setSelectedTrainer(trainer)
											setShowAssignmentForm(true)
										}}
										className="w-full"
										disabled={trainer.availableSlots === 0}
									>
										{trainer.availableSlots === 0 ? 'No disponible' : 'Solicitar Asignación'}
									</Button>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			)}

			{/* Formulario de solicitud de asignación */}
			{showAssignmentForm && selectedTrainer && (
				<Card>
					<CardHeader>
						<CardTitle>
							Solicitar Asignación con {selectedTrainer.name}
						</CardTitle>
						<CardDescription>
							Añade una nota opcional para el entrenador
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<Textarea
							placeholder="Cuéntale al entrenador sobre tus objetivos, experiencia previa, disponibilidad, etc."
							value={assignmentNotes}
							onChange={(e) => setAssignmentNotes(e.target.value)}
							rows={4}
						/>
						<div className="flex gap-2">
							<Button 
								onClick={handleAssignmentRequest}
								disabled={loading}
							>
								{loading ? 'Enviando...' : 'Enviar Solicitud'}
							</Button>
							<Button 
								variant="outline"
								onClick={() => {
									setShowAssignmentForm(false)
									setSelectedTrainer(null)
									setAssignmentNotes('')
								}}
							>
								Cancelar
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	)
}