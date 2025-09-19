/**
 * Esquemas de validación mejorados para autenticación
 * Utiliza validación segura con detección de amenazas y sanitización
 */

import { z } from 'zod'
import {
  createSecureEmailSchema,
  createSecurePasswordSchema,
  createSecureStringSchema
} from '../form-validation'
import { UserRole } from '@/types/user'

// Esquema de inicio de sesión mejorado
export const signInSchema = z.object({
  email: createSecureEmailSchema(),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña es demasiado larga')
})

// Esquema de registro mejorado
export const signUpSchema = z.object({
  name: createSecureStringSchema({
    fieldName: 'El nombre',
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
    patternError: 'El nombre solo puede contener letras y espacios'
  }),
  email: createSecureEmailSchema(),
  password: createSecurePasswordSchema({
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true
  }),
  confirmPassword: z
    .string()
    .min(1, 'Confirma tu contraseña'),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: 'Selecciona un tipo de cuenta válido' })
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

// Esquema de recuperación de contraseña mejorado
export const forgotPasswordSchema = z.object({
  email: createSecureEmailSchema()
})

// Esquema de restablecimiento de contraseña mejorado
export const resetPasswordSchema = z.object({
  password: createSecurePasswordSchema({
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true
  }),
  confirmPassword: z
    .string()
    .min(1, 'Confirma tu contraseña')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

// Tipos TypeScript generados desde los esquemas
export type SignInFormData = z.infer<typeof signInSchema>
export type SignUpFormData = z.infer<typeof signUpSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>