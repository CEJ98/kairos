'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, User, MapPin } from 'lucide-react'
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday } from 'date-fns'
import { es } from 'date-fns/locale'

interface Appointment {
	id: string
	client: string
	type: 'training' | 'consultation' | 'assessment'
	time: string
	duration: number
	location: string
	status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
	notes?: string
}

export default function TrainerCalendarPage() {
	const [currentDate, setCurrentDate] = useState(new Date())
	const [view, setView] = useState<'week' | 'day'>('week')

	// Mock appointments data
	const appointments: Record<string, Appointment[]> = {
		'2024-01-15': [
			{
				id: '1',
				client: 'Ana García',
				type: 'training',
				time: '09:00',
				duration: 60,
				location: 'Sala 1',
				status: 'confirmed'
			},
			{
				id: '2',
				client: 'Carlos López',
				type: 'training',
				time: '10:30',
				duration: 45,
				location: 'Sala 2',
				status: 'scheduled'
			},
			{
				id: '3',
				client: 'María Rodríguez',
				type: 'consultation',
				time: '16:00',
				duration: 30,
				location: 'Oficina',
				status: 'confirmed'
			}
		],
		'2024-01-16': [
			{
				id: '4',
				client: 'Pedro Martín',
				type: 'assessment',
				time: '11:00',
				duration: 90,
				location: 'Sala de Evaluación',
				status: 'scheduled'
			}
		],
		'2024-01-17': [
			{
				id: '5',
				client: 'Laura Sánchez',
				type: 'training',
				time: '08:00',
				duration: 60,
				location: 'Sala 1',
				status: 'confirmed'
			},
			{
				id: '6',
				client: 'Roberto Silva',
				type: 'training',
				time: '19:00',
				duration: 45,
				location: 'Sala 3',
				status: 'scheduled'
			}
		]
	}

	const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
	const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
	const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

	const getTypeColor = (type: string) => {
		switch (type) {
			case 'training': return 'bg-blue-100 text-blue-800 border-blue-200'
			case 'consultation': return 'bg-green-100 text-green-800 border-green-200'
			case 'assessment': return 'bg-purple-100 text-purple-800 border-purple-200'
			default: return 'bg-gray-100 text-gray-800 border-gray-200'
		}
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'scheduled': return 'bg-yellow-100 text-yellow-800'
			case 'confirmed': return 'bg-green-100 text-green-800'
			case 'completed': return 'bg-blue-100 text-blue-800'
			case 'cancelled': return 'bg-red-100 text-red-800'
			default: return 'bg-gray-100 text-gray-800'
		}
	}

	const getTypeLabel = (type: string) => {
		switch (type) {
			case 'training': return 'Entrenamiento'
			case 'consultation': return 'Consulta'
			case 'assessment': return 'Evaluación'
			default: return type
		}
	}

	const getStatusLabel = (status: string) => {
		switch (status) {
			case 'scheduled': return 'Programado'
			case 'confirmed': return 'Confirmado'
			case 'completed': return 'Completado'
			case 'cancelled': return 'Cancelado'
			default: return status
		}
	}

	const navigateWeek = (direction: 'prev' | 'next') => {
		const days = direction === 'next' ? 7 : -7
		setCurrentDate(addDays(currentDate, days))
	}

	const getTodayAppointments = () => {
		const today = format(new Date(), 'yyyy-MM-dd')
		return appointments[today] || []
	}

	const getWeekStats = () => {
		let totalAppointments = 0
		let confirmedAppointments = 0
		
		weekDays.forEach((day: Date) => {
		const dayKey = format(day, 'yyyy-MM-dd')
		const dayAppointments = appointments[dayKey] || []
		totalAppointments += dayAppointments.length
		confirmedAppointments += dayAppointments.filter(apt => apt.status === 'confirmed').length
	})
		
		return { totalAppointments, confirmedAppointments }
	}

	const { totalAppointments, confirmedAppointments } = getWeekStats()
	const todayAppointments = getTodayAppointments()

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Calendario</h1>
					<p className="text-gray-600">Gestiona tus citas y entrenamientos</p>
				</div>
				<Button>
					<Plus className="h-4 w-4 mr-2" />
					Nueva Cita
				</Button>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Hoy</p>
								<p className="text-2xl font-bold">{todayAppointments.length}</p>
							</div>
							<Calendar className="h-8 w-8 text-blue-600" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Esta Semana</p>
								<p className="text-2xl font-bold">{totalAppointments}</p>
							</div>
							<Clock className="h-8 w-8 text-green-600" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Confirmadas</p>
								<p className="text-2xl font-bold">{confirmedAppointments}</p>
							</div>
							<User className="h-8 w-8 text-purple-600" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Pendientes</p>
								<p className="text-2xl font-bold">{totalAppointments - confirmedAppointments}</p>
							</div>
							<Clock className="h-8 w-8 text-orange-600" />
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Calendar */}
				<div className="lg:col-span-2">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle>
									{format(weekStart, 'dd MMM', { locale: es })} - {format(weekEnd, 'dd MMM yyyy', { locale: es })}
								</CardTitle>
								<div className="flex items-center gap-2">
									<Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
										<ChevronLeft className="h-4 w-4" />
									</Button>
									<Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
										Hoy
									</Button>
									<Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
										<ChevronRight className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-7 gap-1 mb-4">
								{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
									<div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
										{day}
									</div>
								))}
							</div>
							<div className="grid grid-cols-7 gap-1">
								{weekDays.map((day: Date) => {
								const dayKey = format(day, 'yyyy-MM-dd')
								const dayAppointments = appointments[dayKey] || []
								const isCurrentDay = isToday(day)
									
									return (
										<div key={dayKey} className={`min-h-[120px] p-2 border rounded-lg ${
											isCurrentDay ? 'bg-blue-50 border-blue-200' : 'bg-white'
										}`}>
											<div className={`text-sm font-medium mb-2 ${
												isCurrentDay ? 'text-blue-600' : 'text-gray-900'
											}`}>
												{format(day, 'd')}
											</div>
											<div className="space-y-1">
												{dayAppointments.map(appointment => (
													<div
														key={appointment.id}
														className={`p-1 rounded text-xs border cursor-pointer hover:shadow-sm transition-shadow ${
															getTypeColor(appointment.type)
														}`}
													>
														<div className="font-medium truncate">
															{appointment.time}
														</div>
														<div className="truncate">
															{appointment.client}
														</div>
													</div>
												))}
											</div>
										</div>
									)
								})}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Today's Schedule */}
				<div>
					<Card>
						<CardHeader>
							<CardTitle>Agenda de Hoy</CardTitle>
							<CardDescription>
								{format(new Date(), 'EEEE, dd MMMM', { locale: es })}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{todayAppointments.length === 0 ? (
								<p className="text-gray-500 text-center py-8">
									No tienes citas programadas para hoy
								</p>
							) : (
								<div className="space-y-4">
									{todayAppointments.map(appointment => (
										<div key={appointment.id} className="p-4 border rounded-lg space-y-2">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<Clock className="h-4 w-4 text-gray-500" />
													<span className="font-medium">{appointment.time}</span>
												</div>
												<Badge className={getStatusColor(appointment.status)}>
													{getStatusLabel(appointment.status)}
												</Badge>
											</div>
											<div>
												<p className="font-medium">{appointment.client}</p>
												<p className="text-sm text-gray-600">
													{getTypeLabel(appointment.type)} • {appointment.duration} min
												</p>
											</div>
											<div className="flex items-center gap-2 text-sm text-gray-500">
												<MapPin className="h-4 w-4" />
												{appointment.location}
											</div>
											<div className="flex gap-2">
												<Button variant="outline" size="sm" className="flex-1">
													Editar
												</Button>
												<Button size="sm" className="flex-1">
													{appointment.status === 'scheduled' ? 'Confirmar' : 'Iniciar'}
												</Button>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}