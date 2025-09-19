import { z } from 'zod'
import {
	createSecureStringSchema,
	createSecureTextareaSchema
} from '../form-validation'

// Tipos de eventos válidos
export const eventTypeEnum = z.enum([
	'WORKOUT',
	'TRAINING_SESSION',
	'CONSULTATION',
	'ASSESSMENT',
	'BREAK',
	'PERSONAL',
	'REMINDER'
], {
	errorMap: () => ({ message: 'Tipo de evento no válido' })
})

// Estados de evento
export const eventStatusEnum = z.enum([
	'SCHEDULED',
	'IN_PROGRESS',
	'COMPLETED',
	'CANCELLED',
	'POSTPONED'
], {
	errorMap: () => ({ message: 'Estado de evento no válido' })
})

// Prioridades de evento
export const eventPriorityEnum = z.enum([
	'LOW',
	'MEDIUM',
	'HIGH',
	'URGENT'
], {
	errorMap: () => ({ message: 'Prioridad no válida' })
})

// Esquema para eventos del calendario
export const calendarEventSchema = z.object({
	title: createSecureStringSchema({
		fieldName: 'El título del evento',
		minLength: 2,
		maxLength: 100,
		pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-\.\(\)\:]+$/,
		patternError: 'El título solo puede contener letras, números, espacios y algunos símbolos básicos'
	}),
	description: createSecureTextareaSchema({
		fieldName: 'La descripción',
		required: false,
		maxLength: 1000,
		allowHtml: false
	}),
	type: eventTypeEnum,
	status: eventStatusEnum.default('SCHEDULED'),
	priority: eventPriorityEnum.default('MEDIUM'),
	startDate: z.date({
		required_error: 'La fecha de inicio es requerida',
		invalid_type_error: 'Fecha de inicio no válida'
	}),
	endDate: z.date({
		required_error: 'La fecha de fin es requerida',
		invalid_type_error: 'Fecha de fin no válida'
	}),
	allDay: z.boolean().default(false),
	location: createSecureStringSchema({
		fieldName: 'La ubicación',
		required: false,
		maxLength: 200
	}).optional(),
	participantIds: z.array(
		createSecureStringSchema({
			fieldName: 'ID de participante',
			minLength: 1,
			maxLength: 50,
			pattern: /^[a-zA-Z0-9_-]+$/,
			patternError: 'ID de participante no válido'
		})
	).max(20, 'Máximo 20 participantes').default([]),
	reminder: z.object({
		enabled: z.boolean().default(false),
		minutesBefore: z.number().min(0).max(10080).default(15) // Máximo 1 semana
	}).optional(),
	recurrence: z.object({
		type: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY']).default('NONE'),
		interval: z.number().min(1).max(365).default(1),
		endDate: z.date().optional()
	}).optional(),
	metadata: z.object({
		workoutId: z.string().optional(),
		clientId: z.string().optional(),
		trainerId: z.string().optional(),
		color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hexadecimal no válido').optional()
	}).optional()
}).refine((data) => {
	// Validar que la fecha de fin sea posterior a la de inicio
	return data.endDate > data.startDate
}, {
	message: 'La fecha de fin debe ser posterior a la fecha de inicio',
	path: ['endDate']
})

// Esquema para filtros de calendario
export const calendarFilterSchema = z.object({
	startDate: z.date().optional(),
	endDate: z.date().optional(),
	type: eventTypeEnum.optional(),
	status: eventStatusEnum.optional(),
	participantId: z.string().optional(),
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0)
})

// Esquema para actualizar evento
export const updateCalendarEventSchema = z.object({
	id: createSecureStringSchema({
		fieldName: 'ID del evento',
		minLength: 1,
		maxLength: 50,
		pattern: /^[a-zA-Z0-9_-]+$/,
		patternError: 'ID de evento no válido'
	}),
	title: createSecureStringSchema({
		fieldName: 'El título del evento',
		minLength: 2,
		maxLength: 100,
		pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-\.\(\)\:]+$/,
		patternError: 'El título solo puede contener letras, números, espacios y algunos símbolos básicos'
	}).optional(),
	description: createSecureTextareaSchema({
		fieldName: 'La descripción',
		required: false,
		maxLength: 1000,
		allowHtml: false
	}).optional(),
	type: eventTypeEnum.optional(),
	status: eventStatusEnum.optional(),
	priority: eventPriorityEnum.optional(),
	startDate: z.date().optional(),
	endDate: z.date().optional(),
	allDay: z.boolean().optional(),
	location: createSecureStringSchema({
		fieldName: 'La ubicación',
		required: false,
		maxLength: 200
	}).optional()
})

// Tipos TypeScript
export type CalendarEventFormData = z.infer<typeof calendarEventSchema>
export type CalendarFilterData = z.infer<typeof calendarFilterSchema>
export type UpdateCalendarEventData = z.infer<typeof updateCalendarEventSchema>
export type EventType = z.infer<typeof eventTypeEnum>
export type EventStatus = z.infer<typeof eventStatusEnum>
export type EventPriority = z.infer<typeof eventPriorityEnum>

// Utilidades de validación para calendario
export const calendarValidationUtils = {
	// Sanitizar datos del evento
	sanitizeEventData: (data: CalendarEventFormData): CalendarEventFormData => {
		return {
			...data,
			title: data.title?.trim() || '',
			description: data.description?.trim() || '',
			location: data.location?.trim() || ''
		}
	},
	
	// Validar conflictos de horario
	validateTimeConflict: (newEvent: CalendarEventFormData, existingEvents: CalendarEventFormData[]): boolean => {
		for (const event of existingEvents) {
			// Verificar solapamiento de horarios
			if (
				(newEvent.startDate >= event.startDate && newEvent.startDate < event.endDate) ||
				(newEvent.endDate > event.startDate && newEvent.endDate <= event.endDate) ||
				(newEvent.startDate <= event.startDate && newEvent.endDate >= event.endDate)
			) {
				return false // Hay conflicto
			}
		}
		return true // No hay conflicto
	},
	
	// Validar duración del evento
	validateEventDuration: (startDate: Date, endDate: Date, type: EventType): boolean => {
		const durationMs = endDate.getTime() - startDate.getTime()
		const durationMinutes = durationMs / (1000 * 60)
		
		switch (type) {
			case 'WORKOUT':
				return durationMinutes >= 15 && durationMinutes <= 180 // 15 min - 3 horas
			case 'TRAINING_SESSION':
				return durationMinutes >= 30 && durationMinutes <= 240 // 30 min - 4 horas
			case 'CONSULTATION':
				return durationMinutes >= 15 && durationMinutes <= 120 // 15 min - 2 horas
			case 'ASSESSMENT':
				return durationMinutes >= 30 && durationMinutes <= 180 // 30 min - 3 horas
			case 'BREAK':
				return durationMinutes >= 5 && durationMinutes <= 60 // 5 min - 1 hora
			default:
				return durationMinutes >= 1 && durationMinutes <= 1440 // 1 min - 24 horas
		}
	},
	
	// Generar color por defecto según el tipo
	getDefaultColor: (type: EventType): string => {
		switch (type) {
			case 'WORKOUT': return '#3B82F6' // Azul
			case 'TRAINING_SESSION': return '#10B981' // Verde
			case 'CONSULTATION': return '#8B5CF6' // Púrpura
			case 'ASSESSMENT': return '#F59E0B' // Amarillo
			case 'BREAK': return '#6B7280' // Gris
			case 'PERSONAL': return '#EF4444' // Rojo
			case 'REMINDER': return '#06B6D4' // Cian
			default: return '#6B7280'
		}
	}
}