'use client'

import React from 'react'
import { AlertCircle, CheckCircle, Info, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

/**
 * Tipos de validación y mensajes de error
 */
export const ValidationMessages = {
	// Campos obligatorios
	required: (field: string) => `${field} es obligatorio`,
	
	// Validaciones de longitud
	minLength: (field: string, min: number) => `${field} debe tener al menos ${min} caracteres`,
	maxLength: (field: string, max: number) => `${field} no puede exceder ${max} caracteres`,
	
	// Validaciones numéricas
	minValue: (field: string, min: number) => `${field} debe ser mayor o igual a ${min}`,
	maxValue: (field: string, max: number) => `${field} debe ser menor o igual a ${max}`,
	positiveNumber: (field: string) => `${field} debe ser un número positivo`,
	
	// Validaciones de formato
	email: 'Por favor, ingresa un email válido',
	phone: 'Por favor, ingresa un número de teléfono válido',
	url: 'Por favor, ingresa una URL válida',
	
	// Validaciones de contraseña
	password: {
		weak: 'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial',
		minLength: 'La contraseña debe tener al menos 8 caracteres',
		match: 'Las contraseñas no coinciden'
	},
	
	// Validaciones específicas del dominio
	age: 'La edad debe estar entre 13 y 120 años',
	weight: 'El peso debe estar entre 20 y 500 kg',
	height: 'La altura debe estar entre 100 y 250 cm',
	experience: 'La experiencia debe estar entre 0 y 50 años',
	hourlyRate: 'La tarifa debe estar entre 0 y 1000',
	bio: 'La biografía no puede exceder 500 caracteres'
}

/**
 * Validadores comunes
 */
export const Validators = {
	// Validador de email
	email: (value: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		return emailRegex.test(value)
	},
	
	// Validador de teléfono
	phone: (value: string): boolean => {
		const phoneRegex = /^\+?[\d\s\-\(\)]{10,20}$/
		return phoneRegex.test(value)
	},
	
	// Validador de contraseña segura
	password: (value: string): boolean => {
		return value.length >= 8 && 
			   /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(value)
	},
	
	// Validador de URL
	url: (value: string): boolean => {
		try {
			new URL(value)
			return true
		} catch {
			return false
		}
	},
	
	// Validador de rango numérico
	numberRange: (value: number, min: number, max: number): boolean => {
		return value >= min && value <= max
	},
	
	// Validador de longitud de texto
	textLength: (value: string, min: number, max: number): boolean => {
		const length = value.trim().length
		return length >= min && length <= max
	}
}

/**
 * Componente de mensaje de error con tooltip de seguridad
 */
interface FormErrorProps {
	message?: string
	securityTip?: string
	showIcon?: boolean
	className?: string
}

export function FormError({ 
	message, 
	securityTip, 
	showIcon = true, 
	className 
}: FormErrorProps) {
	if (!message) return null

	return (
		<div className={cn('flex items-start gap-2 text-sm text-red-600 mt-1', className)}>
			{showIcon && <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
			<span className="flex-1">{message}</span>
			{securityTip && (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<button type="button" className="text-blue-500 hover:text-blue-700">
								<Info className="w-4 h-4" />
							</button>
						</TooltipTrigger>
						<TooltipContent side="top" className="max-w-xs">
							<div className="flex items-start gap-2">
								<Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
								<p className="text-xs">{securityTip}</p>
							</div>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)}
		</div>
	)
}

/**
 * Componente de mensaje de éxito
 */
interface FormSuccessProps {
	message?: string
	showIcon?: boolean
	className?: string
}

export function FormSuccess({ 
	message = 'Campo válido', 
	showIcon = true, 
	className 
}: FormSuccessProps) {
	return (
		<div className={cn('flex items-center gap-2 text-sm text-green-600 mt-1', className)}>
			{showIcon && <CheckCircle className="w-4 h-4" />}
			<span>{message}</span>
		</div>
	)
}

/**
 * Hook para validación en tiempo real
 */
export function useRealTimeValidation() {
	const [errors, setErrors] = React.useState<Record<string, string>>({})

	const validateField = React.useCallback((name: string, value: any, rules: ValidationRule[]) => {
		for (const rule of rules) {
			const error = rule.validator(value)
			if (error) {
				setErrors(prev => ({ ...prev, [name]: error }))
				return false
			}
		}
		setErrors(prev => {
			const newErrors = { ...prev }
			delete newErrors[name]
			return newErrors
		})
		return true
	}, [])

	const clearError = React.useCallback((name: string) => {
		setErrors(prev => {
			const newErrors = { ...prev }
			delete newErrors[name]
			return newErrors
		})
	}, [])

	const clearAllErrors = React.useCallback(() => {
		setErrors({})
	}, [])

	return {
		errors,
		validateField,
		clearError,
		clearAllErrors,
		hasErrors: Object.keys(errors).length > 0
	}
}

/**
 * Interfaz para reglas de validación
 */
interface ValidationRule {
	validator: (value: any) => string | null
	message?: string
}

/**
 * Reglas de validación predefinidas
 */
export const ValidationRules = {
	required: (fieldName: string): ValidationRule => ({
		validator: (value: any) => {
			if (!value || (typeof value === 'string' && !value.trim())) {
				return ValidationMessages.required(fieldName)
			}
			return null
		}
	}),

	email: (): ValidationRule => ({
		validator: (value: string) => {
			if (value && !Validators.email(value)) {
				return ValidationMessages.email
			}
			return null
		}
	}),

	password: (): ValidationRule => ({
		validator: (value: string) => {
			if (value && !Validators.password(value)) {
				return ValidationMessages.password.weak
			}
			return null
		}
	}),

	numberRange: (fieldName: string, min: number, max: number): ValidationRule => ({
		validator: (value: any) => {
			const num = parseFloat(value)
			if (value && (!isNaN(num) && !Validators.numberRange(num, min, max))) {
				return `${fieldName} debe estar entre ${min} y ${max}`
			}
			return null
		}
	}),

	textLength: (fieldName: string, min: number, max: number): ValidationRule => ({
		validator: (value: string) => {
			if (value && !Validators.textLength(value, min, max)) {
				if (value.trim().length < min) {
					return ValidationMessages.minLength(fieldName, min)
				}
				if (value.trim().length > max) {
					return ValidationMessages.maxLength(fieldName, max)
				}
			}
			return null
		}
	})
}

/**
 * Utilidades para sanitización de datos
 */
export const DataSanitizers = {
	// Sanitizar email
	email: (value: string): string => {
		return value.trim().toLowerCase()
	},
	
	// Sanitizar texto general
	text: (value: string): string => {
		return value.trim().replace(/\s+/g, ' ')
	},
	
	// Sanitizar números
	number: (value: string): number | null => {
		const num = parseFloat(value)
		return isNaN(num) ? null : num
	},
	
	// Sanitizar teléfono
	phone: (value: string): string => {
		return value.replace(/[^\d\+\-\(\)\s]/g, '')
	}
}