/**
 * Esquemas de validación mejorados para formularios de contacto
 * Utiliza validación segura con detección de amenazas y sanitización
 */

import { z } from 'zod'
import {
  createSecureEmailSchema,
  createSecureStringSchema,
  createSecurePhoneSchema,
  createSecureTextareaSchema
} from '../form-validation'

// Validación mejorada para formulario de contacto
export const contactSchema = z.object({
  name: createSecureStringSchema({
    fieldName: 'El nombre',
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
    patternError: 'El nombre solo puede contener letras y espacios'
  }),
  
  email: createSecureEmailSchema(),
  
  subject: createSecureStringSchema({
    fieldName: 'El asunto',
    minLength: 5,
    maxLength: 100
  }),
  
  message: createSecureTextareaSchema({
    fieldName: 'El mensaje',
    minLength: 10,
    maxLength: 2000,
    allowHtml: false
  }),
  
  phone: createSecurePhoneSchema(),
  
  company: createSecureStringSchema({
    fieldName: 'El nombre de la empresa',
    required: false,
    maxLength: 100
  }),
  
  type: z.enum(['general', 'support', 'business', 'partnership'], {
    required_error: 'Selecciona un tipo de consulta'
  }),
  
  newsletter: z.boolean().optional().default(false)
})

export type ContactFormData = z.infer<typeof contactSchema>