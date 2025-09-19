/**
 * Enhanced Form Validation Utilities
 * Sistema de validación de formularios mejorado con seguridad y sanitización
 */

import { z } from 'zod'
import { AdvancedValidator } from './advanced-validation'

// Crear una instancia del validador avanzado
const validator = new AdvancedValidator()

/**
 * Crea un esquema de validación de Zod con seguridad mejorada
 */
export function createSecureStringSchema({
  fieldName,
  required = true,
  minLength,
  maxLength = 255,
  pattern,
  patternError,
  allowHtml = false,
}: {
  fieldName: string
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  patternError?: string
  allowHtml?: boolean
}) {
  // Crear schema base
  let baseSchema = z.string()

  // Aplicar validaciones
  if (required) {
    baseSchema = baseSchema.min(1, `${fieldName} es requerido`)
  }

  if (minLength) {
    baseSchema = baseSchema.min(minLength, `${fieldName} debe tener al menos ${minLength} caracteres`)
  }

  if (maxLength) {
    baseSchema = baseSchema.max(maxLength, `${fieldName} es demasiado largo`)
  }

  if (pattern && patternError) {
    baseSchema = baseSchema.regex(pattern, patternError)
  }

  // Hacer opcional si no es requerido
  const schema = required ? baseSchema : baseSchema.optional()

  // Añadir refinamiento para seguridad
  return schema.refine(
    (value) => {
      if (!value && !required) return true
      
      const result = validator.validateString(value, {
        sanitize: true,
        allowHtml,
        maxLength,
        required,
      })
      
      return result.success
    },
    {
      message: `${fieldName} contiene caracteres no permitidos o potencialmente peligrosos`,
    }
  )
}

/**
 * Crea un esquema de validación de email seguro
 */
export function createSecureEmailSchema({
  required = true,
  maxLength = 254,
}: {
  required?: boolean
  maxLength?: number
} = {}) {
  let baseSchema = z.string()
    .email('Ingresa un correo electrónico válido')
    .max(maxLength, 'El correo electrónico es demasiado largo')

  if (required) {
    baseSchema = baseSchema.min(1, 'El correo electrónico es requerido')
  }

  const schema = required ? baseSchema : baseSchema.optional()

  // Añadir refinamiento para seguridad
  return schema.refine(
    (value) => {
      if (!value && !required) return true
      
      const result = validator.validateEmail(value)
      return result.success
    },
    {
      message: 'El correo electrónico contiene caracteres no permitidos o es potencialmente peligroso',
    }
  )
}

/**
 * Crea un esquema de validación de contraseña segura
 */
export function createSecurePasswordSchema({
  required = true,
  minLength = 8,
  maxLength = 128,
  requireUppercase = true,
  requireLowercase = true,
  requireNumber = true,
  requireSpecial = false,
}: {
  required?: boolean
  minLength?: number
  maxLength?: number
  requireUppercase?: boolean
  requireLowercase?: boolean
  requireNumber?: boolean
  requireSpecial?: boolean
} = {}) {
  let baseSchema = z.string()
    .min(minLength, `La contraseña debe tener al menos ${minLength} caracteres`)
    .max(maxLength, 'La contraseña es demasiado larga')

  if (required) {
    baseSchema = baseSchema.min(1, 'La contraseña es requerida')
  }

  // Construir la expresión regular según los requisitos
  let regexParts = []
  let errorMessage = 'La contraseña debe contener'

  if (requireUppercase) {
    regexParts.push('(?=.*[A-Z])')
    errorMessage += ' al menos una mayúscula'
  }

  if (requireLowercase) {
    regexParts.push('(?=.*[a-z])')
    errorMessage += requireUppercase ? ',' : ''
    errorMessage += ' al menos una minúscula'
  }

  if (requireNumber) {
    regexParts.push('(?=.*\\d)')
    errorMessage += (requireUppercase || requireLowercase) ? ',' : ''
    errorMessage += ' al menos un número'
  }

  if (requireSpecial) {
    regexParts.push('(?=.*[!@#$%^&*(),.?":{}|<>])')
    errorMessage += (requireUppercase || requireLowercase || requireNumber) ? ' y' : ''
    errorMessage += ' al menos un carácter especial'
  }

  if (regexParts.length > 0) {
    const regex = new RegExp(`^${regexParts.join('')}`)
    baseSchema = baseSchema.regex(regex, errorMessage)
  }

  const schema = required ? baseSchema : baseSchema.optional()
  return schema
}

/**
 * Crea un esquema de validación para números de teléfono
 */
export function createSecurePhoneSchema({
  required = false,
}: {
  required?: boolean
} = {}) {
  let baseSchema = z.string()

  if (required) {
    baseSchema = baseSchema.min(1, 'El número de teléfono es requerido')
  }

  const schema = required ? baseSchema : baseSchema.optional()

  return schema.refine(
    (value) => {
      if (!value && !required) return true
      
      // Validar formato de teléfono internacional o local
      return /^(\+?\d{1,4}[\s\-]?)?(\(?\d{3,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{4})$/.test(value || '')
    },
    {
      message: 'Ingresa un número de teléfono válido',
    }
  )
}

/**
 * Crea un esquema de validación para URLs
 */
export function createSecureUrlSchema({
  required = false,
  maxLength = 2048,
}: {
  required?: boolean
  maxLength?: number
} = {}) {
  let baseSchema = z.string()
    .max(maxLength, 'La URL es demasiado larga')
    .url('Ingresa una URL válida')

  if (required) {
    baseSchema = baseSchema.min(1, 'La URL es requerida')
  }

  const schema = required ? baseSchema : baseSchema.optional()

  // Añadir refinamiento para seguridad
  return schema.refine(
    (value) => {
      if (!value && !required) return true
      
      const result = validator.validateString(value, {
        sanitize: true,
        allowHtml: false,
        maxLength,
        required,
      })
      
      return result.success
    },
    {
      message: 'La URL contiene caracteres no permitidos o es potencialmente peligrosa',
    }
  )
}

/**
 * Crea un esquema de validación para texto largo (áreas de texto)
 */
export function createSecureTextareaSchema({
  fieldName,
  required = true,
  minLength,
  maxLength = 2000,
  allowHtml = false,
}: {
  fieldName: string
  required?: boolean
  minLength?: number
  maxLength?: number
  allowHtml?: boolean
}) {
  return createSecureStringSchema({
    fieldName,
    required,
    minLength,
    maxLength,
    allowHtml,
  })
}

// Exportar utilidades adicionales
export const formValidationUtils = {
  createSecureStringSchema,
  createSecureEmailSchema,
  createSecurePasswordSchema,
  createSecurePhoneSchema,
  createSecureUrlSchema,
  createSecureTextareaSchema,
}