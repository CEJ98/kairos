import { z } from 'zod'
import {
	createSecureStringSchema,
	createSecureTextareaSchema
} from '../form-validation'

// Tipos de mensaje válidos
export const messageTypeEnum = z.enum([
	'TEXT',
	'IMAGE',
	'FILE',
	'SYSTEM',
	'NOTIFICATION'
], {
	errorMap: () => ({ message: 'Tipo de mensaje no válido' })
})

// Estados de mensaje
export const messageStatusEnum = z.enum([
	'SENDING',
	'SENT',
	'DELIVERED',
	'READ',
	'FAILED'
], {
	errorMap: () => ({ message: 'Estado de mensaje no válido' })
})

// Esquema para mensajes de chat
export const chatMessageSchema = z.object({
	content: createSecureTextareaSchema({
		fieldName: 'El mensaje',
		required: true,
		minLength: 1,
		maxLength: 2000,
		allowHtml: false
	}),
	type: messageTypeEnum.default('TEXT'),
	recipientId: createSecureStringSchema({
		fieldName: 'ID del destinatario',
		minLength: 1,
		maxLength: 50,
		pattern: /^[a-zA-Z0-9_-]+$/,
		patternError: 'ID de destinatario no válido'
	}),
	conversationId: createSecureStringSchema({
		fieldName: 'ID de conversación',
		minLength: 1,
		maxLength: 50,
		pattern: /^[a-zA-Z0-9_-]+$/,
		patternError: 'ID de conversación no válido'
	}).optional(),
	metadata: z.object({
		isUrgent: z.boolean().default(false),
		hasAttachment: z.boolean().default(false),
		mentions: z.array(z.string()).max(10).default([])
	}).optional()
})

// Esquema para filtros de chat
export const chatFilterSchema = z.object({
	conversationId: z.string().optional(),
	messageType: messageTypeEnum.optional(),
	status: messageStatusEnum.optional(),
	dateFrom: z.date().optional(),
	dateTo: z.date().optional(),
	limit: z.number().min(1).max(100).default(20),
	offset: z.number().min(0).default(0)
})

// Esquema para crear conversación
export const createConversationSchema = z.object({
	participantIds: z.array(
		createSecureStringSchema({
			fieldName: 'ID de participante',
			minLength: 1,
			maxLength: 50,
			pattern: /^[a-zA-Z0-9_-]+$/,
			patternError: 'ID de participante no válido'
		})
	).min(2, 'Se requieren al menos 2 participantes').max(10, 'Máximo 10 participantes'),
	title: createSecureStringSchema({
		fieldName: 'Título de la conversación',
		required: false,
		maxLength: 100
	}).optional(),
	isGroup: z.boolean().default(false)
})

// Tipos TypeScript
export type ChatMessageFormData = z.infer<typeof chatMessageSchema>
export type ChatFilterData = z.infer<typeof chatFilterSchema>
export type CreateConversationData = z.infer<typeof createConversationSchema>
export type MessageType = z.infer<typeof messageTypeEnum>
export type MessageStatus = z.infer<typeof messageStatusEnum>

// Utilidades de validación para chat
export const chatValidationUtils = {
	// Sanitizar mensaje
	sanitizeMessage: (data: ChatMessageFormData): ChatMessageFormData => {
		return {
			...data,
			content: data.content?.trim() || '',
			recipientId: data.recipientId?.trim() || ''
		}
	},
	
	// Validar que el mensaje no esté vacío después de sanitizar
	validateMessageContent: (content: string): boolean => {
		const trimmed = content.trim()
		return trimmed.length > 0 && trimmed.length <= 2000
	},
	
	// Detectar menciones en el mensaje
	detectMentions: (content: string): string[] => {
		const mentionRegex = /@([a-zA-Z0-9_-]+)/g
		const mentions: string[] = []
		let match
		
		while ((match = mentionRegex.exec(content)) !== null) {
			mentions.push(match[1])
		}
		
		return mentions.slice(0, 10) // Máximo 10 menciones
	},
	
	// Validar longitud de mensaje para diferentes tipos
	validateMessageLength: (content: string, type: MessageType): boolean => {
		switch (type) {
			case 'TEXT':
				return content.length <= 2000
			case 'SYSTEM':
				return content.length <= 500
			case 'NOTIFICATION':
				return content.length <= 200
			default:
				return content.length <= 2000
		}
	}
}