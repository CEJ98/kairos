'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, Clock, MapPin, Users, Bell, Repeat, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
	calendarEventSchema,
	type CalendarEventFormData,
	type EventType,
	type EventStatus,
	type EventPriority,
	calendarValidationUtils
} from '@/lib/validations/calendar'

// Configuración de tipos de eventos
const eventTypeConfig: Record<EventType, {
	label: string
	icon: string
	color: string
	bgColor: string
	textColor: string
}> = {
	WORKOUT: {
		label: 'Entrenamiento',
		icon: '🏋️',
		color: 'bg-blue-500',
		bgColor: 'bg-blue-100',
		textColor: 'text-blue-700'
	},
	TRAINING_SESSION: {
		label: 'Sesión de Entrenamiento',
		icon: '💪',
		color: 'bg-green-500',
		bgColor: 'bg-green-100',
		textColor: 'text-green-700'
	},
	CONSULTATION: {
		label: 'Consulta',
		icon: '👨‍⚕️',
		color: 'bg-purple-500',
		bgColor: 'bg-purple-100',
		textColor: 'text-purple-700'
	},
	ASSESSMENT: {
		label: 'Evaluación',
		icon: '📊',
		color: 'bg-orange-500',
		bgColor: 'bg-orange-100',
		textColor: 'text-orange-700'
	},
	BREAK: {
		label: 'Descanso',
		icon: '🧘',
		color: 'bg-gray-500',
		bgColor: 'bg-gray-100',
		textColor: 'text-gray-700'
	},
	PERSONAL: {
		label: 'Personal',
		icon: '👤',
		color: 'bg-indigo-500',
		bgColor: 'bg-indigo-100',
		textColor: 'text-indigo-700'
	},
	REMINDER: {
		label: 'Recordatorio',
		icon: '⏰',
		color: 'bg-yellow-500',
		bgColor: 'bg-yellow-100',
		textColor: 'text-yellow-700'
	}
}

const statusConfig: Record<EventStatus, { label: string; icon: string }> = {
	SCHEDULED: { label: 'Programado', icon: '⏳' },
	IN_PROGRESS: { label: 'En Progreso', icon: '▶️' },
	COMPLETED: { label: 'Completado', icon: '✅' },
	CANCELLED: { label: 'Cancelado', icon: '❌' },
	POSTPONED: { label: 'Pospuesto', icon: '🔄' }
}

const priorityConfig: Record<EventPriority, { label: string; color: string }> = {
	LOW: { label: 'Baja', color: 'text-gray-600' },
	MEDIUM: { label: 'Media', color: 'text-blue-600' },
	HIGH: { label: 'Alta', color: 'text-orange-600' },
	URGENT: { label: 'Urgente', color: 'text-red-600' }
}

interface SecureCalendarEventFormProps {
	initialData?: Partial<CalendarEventFormData>
	onSubmit: (data: CalendarEventFormData) => Promise<void>
	onCancel?: () => void
	isLoading?: boolean
	existingEvents?: CalendarEventFormData[]
	mode?: 'create' | 'edit'
}

export function SecureCalendarEventForm({
	initialData,
	onSubmit,
	onCancel,
	isLoading = false,
	existingEvents = [],
	mode = 'create'
}: SecureCalendarEventFormProps) {
	const {
		register,
		handleSubmit,
		watch,
		setValue,
		getValues,
		formState: { errors, isSubmitting },
		clearErrors
	} = useForm<CalendarEventFormData>({
		resolver: zodResolver(calendarEventSchema),
		defaultValues: {
			title: initialData?.title || '',
			description: initialData?.description || '',
			type: initialData?.type || 'WORKOUT',
			status: initialData?.status || 'SCHEDULED',
			priority: initialData?.priority || 'MEDIUM',
			startDate: initialData?.startDate || new Date(),
			endDate: initialData?.endDate || new Date(Date.now() + 60 * 60 * 1000), // +1 hora por defecto
			allDay: initialData?.allDay || false,
			location: initialData?.location || '',
			participantIds: initialData?.participantIds || [],
			reminder: initialData?.reminder || { enabled: false, minutesBefore: 15 },
			recurrence: initialData?.recurrence || { type: 'NONE', interval: 1 },
			metadata: initialData?.metadata || {}
		}
	})

	const watchedType = watch('type')
	const watchedAllDay = watch('allDay')
	const watchedStartDate = watch('startDate')
	const watchedEndDate = watch('endDate')

	const handleFormSubmit = async (data: CalendarEventFormData) => {
		try {
			// Sanitizar datos
			const sanitizedData = calendarValidationUtils.sanitizeEventData(data)

			// Validar conflictos de horario si no es modo edición
			if (mode === 'create' && !calendarValidationUtils.validateTimeConflict(sanitizedData, existingEvents)) {
				toast.error('Conflicto de horario detectado. Ya existe un evento en este horario.')
				return
			}

			// Validar duración del evento
			if (!calendarValidationUtils.validateEventDuration(sanitizedData.startDate, sanitizedData.endDate, sanitizedData.type)) {
				toast.error('La duración del evento no es válida para este tipo de evento.')
				return
			}

			await onSubmit(sanitizedData)
			toast.success(mode === 'create' ? 'Evento creado exitosamente' : 'Evento actualizado exitosamente')
		} catch (error) {
			console.error('Error al guardar evento:', error)
			toast.error('Error al guardar el evento. Por favor, inténtalo de nuevo.')
			throw error
		}
	}

	const selectedTypeConfig = eventTypeConfig[watchedType]

	return (
		<form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
			{/* Header con tipo de evento */}
			<Card>
				<CardHeader className={cn('pb-3', selectedTypeConfig.bgColor)}>
					<CardTitle className={cn('flex items-center gap-2', selectedTypeConfig.textColor)}>
						<span className="text-lg">{selectedTypeConfig.icon}</span>
						{mode === 'create' ? 'Crear Evento' : 'Editar Evento'}
						<Badge variant="outline" className="ml-auto">
							{selectedTypeConfig.label}
						</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 pt-4">
					{/* Información básica */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="md:col-span-2">
							<Label htmlFor="title">Título del evento *</Label>
							<Input
								id="title"
								{...register('title')}
								placeholder="Ej: Entrenamiento de piernas"
								className={errors.title ? 'border-red-500' : ''}
							/>
							{errors.title && (
								<p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
							)}
						</div>

						<div>
							<Label htmlFor="type">Tipo de evento</Label>
							<Select
								value={watchedType}
								onValueChange={(value: EventType) => setValue('type', value)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{Object.entries(eventTypeConfig).map(([key, config]) => (
										<SelectItem key={key} value={key}>
											<div className="flex items-center gap-2">
												<span>{config.icon}</span>
												<span>{config.label}</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label htmlFor="priority">Prioridad</Label>
							<Select
								value={watch('priority')}
								onValueChange={(value: EventPriority) => setValue('priority', value)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{Object.entries(priorityConfig).map(([key, config]) => (
										<SelectItem key={key} value={key}>
											<span className={config.color}>{config.label}</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="md:col-span-2">
						<Label htmlFor="description">Descripción</Label>
						<Textarea
							id="description"
							{...register('description')}
							placeholder="Detalles adicionales del evento..."
							rows={3}
							className={errors.description ? 'border-red-500' : ''}
						/>
						{errors.description && (
							<p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Fecha y hora */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CalendarIcon className="w-5 h-5" />
						Fecha y Hora
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center space-x-2">
						<Switch
							id="allDay"
							checked={watchedAllDay}
							onCheckedChange={(checked) => setValue('allDay', checked)}
						/>
						<Label htmlFor="allDay">Evento de todo el día</Label>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<Label>Fecha y hora de inicio *</Label>
							<div className="flex gap-2">
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className={cn(
												"w-full justify-start text-left font-normal",
												!watchedStartDate && "text-muted-foreground",
												errors.startDate && "border-red-500"
											)}
										>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{watchedStartDate ? (
												format(watchedStartDate, "PPP", { locale: es })
											) : (
												<span>Seleccionar fecha</span>
											)}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0">
										<Calendar
										mode="single"
										selected={watchedStartDate}
										onSelect={(date: Date | undefined) => date && setValue('startDate', date)}
										initialFocus
									/>
									</PopoverContent>
								</Popover>
								{!watchedAllDay && (
									<Input
										type="time"
										value={watchedStartDate ? format(watchedStartDate, 'HH:mm') : ''}
										onChange={(e) => {
											const [hours, minutes] = e.target.value.split(':')
											const newDate = new Date(watchedStartDate)
											newDate.setHours(parseInt(hours), parseInt(minutes))
											setValue('startDate', newDate)
										}}
										className="w-32"
									/>
								)}
							</div>
							{errors.startDate && (
								<p className="text-sm text-red-600 mt-1">{errors.startDate.message}</p>
							)}
						</div>

						<div>
							<Label>Fecha y hora de fin *</Label>
							<div className="flex gap-2">
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className={cn(
												"w-full justify-start text-left font-normal",
												!watchedEndDate && "text-muted-foreground",
												errors.endDate && "border-red-500"
											)}
										>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{watchedEndDate ? (
												format(watchedEndDate, "PPP", { locale: es })
											) : (
												<span>Seleccionar fecha</span>
											)}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0">
										<Calendar
										mode="single"
										selected={watchedEndDate}
										onSelect={(date: Date | undefined) => date && setValue('endDate', date)}
										initialFocus
									/>
									</PopoverContent>
								</Popover>
								{!watchedAllDay && (
									<Input
										type="time"
										value={watchedEndDate ? format(watchedEndDate, 'HH:mm') : ''}
										onChange={(e) => {
											const [hours, minutes] = e.target.value.split(':')
											const newDate = new Date(watchedEndDate)
											newDate.setHours(parseInt(hours), parseInt(minutes))
											setValue('endDate', newDate)
										}}
										className="w-32"
									/>
								)}
							</div>
							{errors.endDate && (
								<p className="text-sm text-red-600 mt-1">{errors.endDate.message}</p>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Ubicación y participantes */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<MapPin className="w-5 h-5" />
						Ubicación y Participantes
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label htmlFor="location">Ubicación</Label>
						<Input
							id="location"
							{...register('location')}
							placeholder="Ej: Gimnasio principal, Sala 2"
							className={errors.location ? 'border-red-500' : ''}
						/>
						{errors.location && (
							<p className="text-sm text-red-600 mt-1">{errors.location.message}</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Recordatorios y recurrencia */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Bell className="w-5 h-5" />
						Recordatorios y Recurrencia
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center space-x-2">
						<Switch
							id="reminder-enabled"
							checked={watch('reminder.enabled')}
							onCheckedChange={(checked) => setValue('reminder.enabled', checked)}
						/>
						<Label htmlFor="reminder-enabled">Activar recordatorio</Label>
					</div>

					{watch('reminder.enabled') && (
						<div>
							<Label htmlFor="reminder-minutes">Recordar con (minutos de anticipación)</Label>
							<Select
								value={watch('reminder.minutesBefore')?.toString()}
								onValueChange={(value) => setValue('reminder.minutesBefore', parseInt(value))}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="5">5 minutos</SelectItem>
									<SelectItem value="15">15 minutos</SelectItem>
									<SelectItem value="30">30 minutos</SelectItem>
									<SelectItem value="60">1 hora</SelectItem>
									<SelectItem value="1440">1 día</SelectItem>
								</SelectContent>
							</Select>
						</div>
					)}

					<Separator />

					<div>
						<Label htmlFor="recurrence-type">Repetir evento</Label>
						<Select
							value={watch('recurrence.type')}
							onValueChange={(value: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY') => setValue('recurrence.type', value)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="NONE">No repetir</SelectItem>
								<SelectItem value="DAILY">Diariamente</SelectItem>
								<SelectItem value="WEEKLY">Semanalmente</SelectItem>
								<SelectItem value="MONTHLY">Mensualmente</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{watch('recurrence.type') !== 'NONE' && (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<Label htmlFor="recurrence-interval">Cada (intervalo)</Label>
								<Input
									type="number"
									min="1"
									max="365"
									value={watch('recurrence.interval')}
									onChange={(e) => setValue('recurrence.interval', parseInt(e.target.value))}
									placeholder="1"
								/>
							</div>
							<div>
								<Label>Fecha de fin de recurrencia</Label>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className="w-full justify-start text-left font-normal"
										>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{watch('recurrence.endDate') ? (
												format(watch('recurrence.endDate')!, "PPP", { locale: es })
											) : (
												<span>Opcional</span>
											)}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0">
										<Calendar
											mode="single"
											selected={watch('recurrence.endDate')}
											onSelect={(date: Date | undefined) => setValue('recurrence.endDate', date)}
											initialFocus
										/>
									</PopoverContent>
								</Popover>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Botones de acción */}
			<div className="flex justify-between pt-4">
				<Button
					type="button"
					variant="outline"
					onClick={onCancel}
					disabled={isSubmitting || isLoading}
				>
					Cancelar
				</Button>
				<Button
					type="submit"
					disabled={isSubmitting || isLoading}
					className={selectedTypeConfig.color}
				>
					{isSubmitting || isLoading ? (
						<>
							<Clock className="w-4 h-4 mr-2 animate-spin" />
							Guardando...
						</>
					) : (
						<>
							<span className="mr-2">{selectedTypeConfig.icon}</span>
							{mode === 'create' ? 'Crear Evento' : 'Actualizar Evento'}
						</>
					)}
				</Button>
			</div>
		</form>
	)
}

export default SecureCalendarEventForm