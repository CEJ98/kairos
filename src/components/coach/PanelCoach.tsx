'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
	Users, 
	UserPlus, 
	Search, 
	Filter,
	TrendingUp,
	TrendingDown,
	Calendar,
	Clock,
	Target,
	Activity,
	MessageSquare,
	Settings,
	Plus,
	Edit,
	Trash2,
	Eye,
	BarChart3,
	Dumbbell,
	Mail
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

// Tipos
interface Student {
	id: string
	name: string
	email: string
	avatar?: string
	joinDate: string
	lastActivity: string
	status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
	assignedRoutines: number
	completedWorkouts: number
	progressScore: number
	nextSession?: string
	notes?: string
}

interface Routine {
	id: string
	name: string
	description?: string
	category: string
	difficulty: string
	estimatedDuration: number
	isActive: boolean
	createdAt: string
}

interface Assignment {
	id: string
	studentId: string
	routineId: string
	student: Student
	routine: Routine
	assignedAt: string
	status: 'ACTIVE' | 'COMPLETED' | 'PAUSED'
	progress: number
	lastWorkout?: string
	notes?: string
}

interface PanelCoachProps {
	className?: string
}

export default function PanelCoach({ className }: PanelCoachProps) {
	// Estados principales
	const [students, setStudents] = useState<Student[]>([])
	const [routines, setRoutines] = useState<Routine[]>([])
	const [assignments, setAssignments] = useState<Assignment[]>([])
	const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

	// Estados de UI
	const [activeTab, setActiveTab] = useState('students')
	const [searchTerm, setSearchTerm] = useState('')
	const [filterStatus, setFilterStatus] = useState('all')
	const [isLoading, setIsLoading] = useState(false)
	const [showAddStudentDialog, setShowAddStudentDialog] = useState(false)
	const [showAssignRoutineDialog, setShowAssignRoutineDialog] = useState(false)
	const [showProgressDialog, setShowProgressDialog] = useState(false)

	// Estados para formularios
	const [newStudentEmail, setNewStudentEmail] = useState('')
	const [selectedRoutineId, setSelectedRoutineId] = useState('')
	const [assignmentNotes, setAssignmentNotes] = useState('')

	// Cargar datos iniciales
// Carga de asignaciones (declarada antes de usarla)
const loadAssignments = useCallback(async () => {
	try {
		// Mock data - en producción vendría de la API
		const mockAssignments: Assignment[] = [
			{
				id: '1',
				studentId: '1',
				routineId: 'routine1',
				student: students[0] || ({} as Student),
				routine: {
					id: 'routine1',
					name: 'Rutina de Fuerza Básica',
					description: 'Rutina para principiantes',
					category: 'STRENGTH',
					difficulty: 'BEGINNER',
					estimatedDuration: 45,
					isActive: true,
					createdAt: '2024-01-15'
				},
				assignedAt: '2024-01-15',
				status: 'ACTIVE',
				progress: 75,
				lastWorkout: '2024-01-20'
			}
		]
		setAssignments(mockAssignments)
	} catch (error) {
		console.error('Error loading assignments:', error)
		toast.error('Error al cargar asignaciones')
	}
}, [students])

useEffect(() => {
		loadStudents()
		loadRoutines()
		loadAssignments()
}, [loadAssignments])

	const loadStudents = async () => {
		try {
			setIsLoading(true)
			// Mock data - en producción vendría de la API
			const mockStudents: Student[] = [
				{
					id: '1',
					name: 'María García',
					email: 'maria@email.com',
					avatar: 'MG',
					joinDate: '2024-01-15',
					lastActivity: '2024-01-20',
					status: 'ACTIVE',
					assignedRoutines: 3,
					completedWorkouts: 24,
					progressScore: 85,
					nextSession: 'Hoy, 6:00 PM'
				},
				{
					id: '2',
					name: 'Carlos López',
					email: 'carlos@email.com',
					avatar: 'CL',
					joinDate: '2024-01-10',
					lastActivity: '2024-01-19',
					status: 'ACTIVE',
					assignedRoutines: 2,
					completedWorkouts: 18,
					progressScore: 72,
					nextSession: 'Mañana, 8:00 AM'
				},
				{
					id: '3',
					name: 'Ana Rodríguez',
					email: 'ana@email.com',
					avatar: 'AR',
					joinDate: '2024-01-08',
					lastActivity: '2024-01-20',
					status: 'ACTIVE',
					assignedRoutines: 4,
					completedWorkouts: 32,
					progressScore: 95,
					nextSession: 'Miércoles, 5:00 PM'
				}
			]
			setStudents(mockStudents)
		} catch (error) {
			console.error('Error loading students:', error)
			toast.error('Error al cargar estudiantes')
		} finally {
			setIsLoading(false)
		}
	}

	const loadRoutines = async () => {
		try {
			const response = await fetch('/api/routines?limit=50')
			if (!response.ok) throw new Error('Error al cargar rutinas')
			
			const data = await response.json()
			setRoutines(data.routines || [])
		} catch (error) {
			console.error('Error loading routines:', error)
			toast.error('Error al cargar rutinas')
		}
	}

// (fin reordenamiento)

	// Funciones para manejar estudiantes
	const handleAddStudent = useCallback(async () => {
		if (!newStudentEmail.trim()) {
			toast.error('El email del estudiante es requerido')
			return
		}

		try {
			// TODO: Implementar búsqueda y asignación de estudiante
			toast.success('Estudiante agregado correctamente')
			setShowAddStudentDialog(false)
			setNewStudentEmail('')
			loadStudents()
		} catch (error) {
			console.error('Error adding student:', error)
			toast.error('Error al agregar estudiante')
		}
	}, [newStudentEmail])

	const handleAssignRoutine = async () => {
		if (!selectedStudent || !selectedRoutineId) {
			toast.error('Selecciona un estudiante y una rutina')
			return
		}

		try {
			// TODO: Implementar asignación de rutina
			toast.success('Rutina asignada correctamente')
			setShowAssignRoutineDialog(false)
			setSelectedRoutineId('')
			setAssignmentNotes('')
			loadAssignments()
		} catch (error) {
			console.error('Error assigning routine:', error)
			toast.error('Error al asignar rutina')
		}
	}

	// Filtrar estudiantes
	const filteredStudents = students.filter(student => {
		const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
							  student.email.toLowerCase().includes(searchTerm.toLowerCase())
		const matchesFilter = filterStatus === 'all' || student.status === filterStatus
		return matchesSearch && matchesFilter
	})

	// Calcular estadísticas
	const stats = {
		totalStudents: students.length,
		activeStudents: students.filter(s => s.status === 'ACTIVE').length,
		totalAssignments: assignments.length,
		averageProgress: assignments.length > 0 
			? Math.round(assignments.reduce((sum, a) => sum + a.progress, 0) / assignments.length)
			: 0
	}

	const formatDate = (dateString: string) => {
		try {
			const date = new Date(dateString)
			return formatDistanceToNow(date, { addSuffix: true, locale: es })
		} catch {
			return 'Fecha no disponible'
		}
	}

	return (
		<div className={`max-w-7xl mx-auto p-6 space-y-6 ${className}`}>
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold flex items-center gap-3">
						<Users className="h-8 w-8 text-primary" />
						Panel del Coach
					</h1>
					<p className="text-muted-foreground mt-1">
						Gestiona tus estudiantes, asigna rutinas y monitorea el progreso
					</p>
				</div>
				<div className="flex gap-2">
					<Button 
						variant="outline" 
						onClick={() => setShowAddStudentDialog(true)}
					>
						<UserPlus className="w-4 h-4 mr-2" />
						Agregar Estudiante
					</Button>
				</div>
			</div>

			{/* Estadísticas */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.totalStudents}</div>
						<p className="text-xs text-muted-foreground">
							{stats.activeStudents} activos
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Rutinas Asignadas</CardTitle>
						<Dumbbell className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.totalAssignments}</div>
						<p className="text-xs text-muted-foreground">
							En progreso
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Progreso Promedio</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.averageProgress}%</div>
						<p className="text-xs text-muted-foreground">
							Adherencia general
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Sesiones Hoy</CardTitle>
						<Calendar className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">8</div>
						<p className="text-xs text-muted-foreground">
							Programadas
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Tabs principales */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="students">Estudiantes</TabsTrigger>
					<TabsTrigger value="assignments">Asignaciones</TabsTrigger>
					<TabsTrigger value="progress">Progreso</TabsTrigger>
				</TabsList>

				{/* Tab de Estudiantes */}
				<TabsContent value="students" className="space-y-4">
					{/* Filtros y búsqueda */}
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
								<Input
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									placeholder="Buscar estudiantes..."
									className="pl-10"
								/>
							</div>
						</div>
						<Select value={filterStatus} onValueChange={setFilterStatus}>
							<SelectTrigger className="w-40">
								<SelectValue placeholder="Estado" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos</SelectItem>
								<SelectItem value="ACTIVE">Activos</SelectItem>
								<SelectItem value="INACTIVE">Inactivos</SelectItem>
								<SelectItem value="PENDING">Pendientes</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Lista de estudiantes */}
					{filteredStudents.length === 0 ? (
						<Card>
							<CardContent className="text-center py-12">
								<Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
								<h3 className="text-lg font-medium mb-2">
									{students.length === 0 ? 'No hay estudiantes' : 'No se encontraron estudiantes'}
								</h3>
								<p className="text-muted-foreground mb-4">
									{students.length === 0 
										? 'Comienza agregando tu primer estudiante'
										: 'Intenta con otros términos de búsqueda'
									}
								</p>
								{students.length === 0 && (
									<Button onClick={() => setShowAddStudentDialog(true)}>
										<UserPlus className="w-4 h-4 mr-2" />
										Agregar Primer Estudiante
									</Button>
								)}
							</CardContent>
						</Card>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{filteredStudents.map((student) => (
								<Card key={student.id} className="hover:shadow-lg transition-shadow">
									<CardHeader>
										<div className="flex justify-between items-start">
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
													<span className="text-sm font-medium">
														{student.avatar || student.name.charAt(0)}
													</span>
												</div>
												<div>
													<CardTitle className="text-lg">{student.name}</CardTitle>
													<CardDescription className="flex items-center gap-1">
														<Mail className="h-3 w-3" />
														{student.email}
													</CardDescription>
												</div>
											</div>
											<Badge 
												variant={student.status === 'ACTIVE' ? 'default' : 'secondary'}
											>
												{student.status}
											</Badge>
										</div>
									</CardHeader>
									<CardContent className="space-y-3">
										{/* Estadísticas del estudiante */}
										<div className="grid grid-cols-2 gap-4 text-sm">
											<div className="text-center">
												<div className="font-bold text-lg">{student.assignedRoutines}</div>
												<div className="text-muted-foreground">Rutinas</div>
											</div>
											<div className="text-center">
												<div className="font-bold text-lg">{student.completedWorkouts}</div>
												<div className="text-muted-foreground">Entrenamientos</div>
											</div>
										</div>

										{/* Progreso */}
										<div className="space-y-2">
											<div className="flex justify-between text-sm">
												<span>Progreso</span>
												<span className="font-medium">{student.progressScore}%</span>
											</div>
											<div className="w-full bg-muted rounded-full h-2">
												<div 
													className="bg-primary h-2 rounded-full transition-all" 
													style={{ width: `${student.progressScore}%` }}
												/>
											</div>
										</div>

										{/* Próxima sesión */}
										{student.nextSession && (
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<Calendar className="h-4 w-4" />
												{student.nextSession}
											</div>
										)}

										{/* Acciones */}
										<div className="flex gap-2">
											<Button 
												variant="outline" 
												size="sm" 
												className="flex-1"
												onClick={() => {
													setSelectedStudent(student)
													setShowAssignRoutineDialog(true)
												}}
											>
												<Dumbbell className="h-4 w-4 mr-1" />
												Asignar
											</Button>
											<Button 
												variant="outline" 
												size="sm" 
												className="flex-1"
												onClick={() => {
													setSelectedStudent(student)
													setShowProgressDialog(true)
												}}
											>
												<BarChart3 className="h-4 w-4 mr-1" />
												Progreso
											</Button>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>

				{/* Tab de Asignaciones */}
				<TabsContent value="assignments" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Rutinas Asignadas</CardTitle>
							<CardDescription>
								Monitorea las rutinas asignadas a tus estudiantes
							</CardDescription>
						</CardHeader>
						<CardContent>
							{assignments.length === 0 ? (
								<div className="text-center py-8">
									<Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
									<h3 className="text-lg font-medium mb-2">No hay asignaciones</h3>
									<p className="text-muted-foreground mb-4">
										Comienza asignando rutinas a tus estudiantes
									</p>
								</div>
							) : (
								<div className="space-y-4">
									{assignments.map((assignment) => (
										<div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
											<div className="flex items-center gap-4">
												<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
													<Dumbbell className="h-5 w-5" />
												</div>
												<div>
													<h4 className="font-medium">{assignment.routine.name}</h4>
													<p className="text-sm text-muted-foreground">
														Asignado a {assignment.student.name} • {formatDate(assignment.assignedAt)}
													</p>
												</div>
											</div>
											<div className="flex items-center gap-4">
												<div className="text-right">
													<div className="text-sm font-medium">{assignment.progress}%</div>
													<div className="text-xs text-muted-foreground">Progreso</div>
												</div>
												<Badge variant={assignment.status === 'ACTIVE' ? 'default' : 'secondary'}>
													{assignment.status}
												</Badge>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tab de Progreso */}
				<TabsContent value="progress" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Análisis de Progreso</CardTitle>
							<CardDescription>
								Visión general del progreso de todos tus estudiantes
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="text-center py-8">
								<BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
								<h3 className="text-lg font-medium mb-2">Análisis en desarrollo</h3>
								<p className="text-muted-foreground">
									Próximamente: gráficas de progreso, métricas avanzadas y reportes
								</p>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Dialog para agregar estudiante */}
			<Dialog open={showAddStudentDialog} onOpenChange={setShowAddStudentDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Agregar Nuevo Estudiante</DialogTitle>
						<DialogDescription>
							Ingresa el email del estudiante que deseas vincular
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div>
							<Label htmlFor="email">Email del Estudiante</Label>
							<Input
								id="email"
								type="email"
								value={newStudentEmail}
								onChange={(e) => setNewStudentEmail(e.target.value)}
								placeholder="estudiante@ejemplo.com"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowAddStudentDialog(false)}>
							Cancelar
						</Button>
						<Button onClick={handleAddStudent} disabled={!newStudentEmail.trim()}>
							Agregar Estudiante
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialog para asignar rutina */}
			<Dialog open={showAssignRoutineDialog} onOpenChange={setShowAssignRoutineDialog}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Asignar Rutina</DialogTitle>
						<DialogDescription>
							Selecciona una rutina para asignar a {selectedStudent?.name}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div>
							<Label>Rutina</Label>
							<Select value={selectedRoutineId} onValueChange={setSelectedRoutineId}>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona una rutina" />
								</SelectTrigger>
								<SelectContent>
									{routines.map((routine) => (
										<SelectItem key={routine.id} value={routine.id}>
											<div className="flex flex-col">
												<span className="font-medium">{routine.name}</span>
												<span className="text-xs text-muted-foreground">
													{routine.category} • {routine.difficulty} • {routine.estimatedDuration}min
												</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label htmlFor="notes">Notas (opcional)</Label>
							<Input
								id="notes"
								value={assignmentNotes}
								onChange={(e) => setAssignmentNotes(e.target.value)}
								placeholder="Instrucciones especiales, objetivos, etc."
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowAssignRoutineDialog(false)}>
							Cancelar
						</Button>
						<Button onClick={handleAssignRoutine} disabled={!selectedRoutineId}>
							Asignar Rutina
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialog para ver progreso */}
			<Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
				<DialogContent className="max-w-4xl max-h-[80vh]">
					<DialogHeader>
						<DialogTitle>Progreso de {selectedStudent?.name}</DialogTitle>
						<DialogDescription>
							Análisis detallado del progreso y rendimiento
						</DialogDescription>
					</DialogHeader>
					<ScrollArea className="h-96">
						<div className="space-y-6 p-4">
							{/* Estadísticas generales */}
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<Card>
									<CardContent className="p-4 text-center">
										<div className="text-2xl font-bold">{selectedStudent?.completedWorkouts || 0}</div>
										<div className="text-xs text-muted-foreground">Entrenamientos</div>
									</CardContent>
								</Card>
								<Card>
									<CardContent className="p-4 text-center">
										<div className="text-2xl font-bold">{selectedStudent?.assignedRoutines || 0}</div>
										<div className="text-xs text-muted-foreground">Rutinas</div>
									</CardContent>
								</Card>
								<Card>
									<CardContent className="p-4 text-center">
										<div className="text-2xl font-bold">{selectedStudent?.progressScore || 0}%</div>
										<div className="text-xs text-muted-foreground">Progreso</div>
									</CardContent>
								</Card>
								<Card>
									<CardContent className="p-4 text-center">
										<div className="text-2xl font-bold">7</div>
										<div className="text-xs text-muted-foreground">Días activo</div>
									</CardContent>
								</Card>
							</div>

							{/* Información adicional */}
							<div className="text-center py-8">
								<BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
								<h3 className="text-lg font-medium mb-2">Análisis detallado en desarrollo</h3>
								<p className="text-muted-foreground">
									Próximamente: gráficas de progreso, historial de entrenamientos y métricas avanzadas
								</p>
							</div>
						</div>
					</ScrollArea>
				</DialogContent>
			</Dialog>
		</div>
	)
}