/**
 * Secure Form Field Components
 * Componentes de formulario con validación de seguridad avanzada
 */

'use client'

import React, { useState } from 'react'
import { Control, FieldPath, FieldValues, useController } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { AlertCircle, CheckCircle, Eye, EyeOff, Info, Shield } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Base props for all secure form fields
interface SecureFormFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label?: string
  description?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  showSuccessState?: boolean
  securityTip?: string
}

// Text input field props
interface SecureTextFormFieldProps<T extends FieldValues> extends SecureFormFieldProps<T> {
  type?: 'text' | 'email' | 'password' | 'url' | 'tel' | 'search'
  autoComplete?: string
  maxLength?: number
  showCharacterCount?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onRightIconClick?: () => void
  showPasswordToggle?: boolean
}

// Textarea field props
interface SecureTextareaFormFieldProps<T extends FieldValues> extends SecureFormFieldProps<T> {
  rows?: number
  maxLength?: number
  showCharacterCount?: boolean
  autoResize?: boolean
}

// Error message component with security context
function SecureFieldError({ message, securityTip }: { message?: string; securityTip?: string }) {
  if (!message) return null

  return (
    <div className="flex items-start gap-2 text-sm text-red-600 mt-1">
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <div>
        <span>{message}</span>
        {securityTip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="ml-1 inline-flex items-center">
                  <Info className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-start gap-1.5 max-w-xs">
                  <Shield className="w-4 h-4 flex-shrink-0 text-blue-500 mt-0.5" />
                  <p className="text-sm">{securityTip}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  )
}

// Success message component
function SecureFieldSuccess({ message }: { message?: string }) {
  if (!message) return null

  return (
    <div className="flex items-center gap-2 text-sm text-green-600 mt-1">
      <CheckCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

/**
 * Secure Text Form Field Component
 * Campo de texto con validación de seguridad avanzada
 */
export function SecureTextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  type = 'text',
  disabled = false,
  required = false,
  className,
  autoComplete,
  maxLength,
  showCharacterCount = false,
  leftIcon,
  rightIcon,
  onRightIconClick,
  showSuccessState = false,
  securityTip,
  showPasswordToggle = true,
}: SecureTextFormFieldProps<T>) {
  const [showPassword, setShowPassword] = useState(false)
  const [realTimeError, setRealTimeError] = useState<string>('')
  const isPassword = type === 'password' && showPasswordToggle
  
  const {
    field,
    fieldState: { error, isDirty, isTouched },
  } = useController({
    name,
    control,
  })

  const showSuccess = showSuccessState && isDirty && isTouched && !error && !realTimeError
  const actualType = isPassword && showPassword ? 'text' : type
  const valueLength = (field.value as string)?.length || 0
  const displayError = error || (realTimeError ? { message: realTimeError } : null)

  // Validación en tiempo real
  const handleRealTimeValidation = (value: string) => {
    setRealTimeError('')
    
    if (required && !value.trim()) {
      setRealTimeError('Este campo es obligatorio')
      return
    }

    if (type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        setRealTimeError('Formato de email inválido')
        return
      }
    }

    if (type === 'password' && value) {
      if (value.length < 8) {
        setRealTimeError('La contraseña debe tener al menos 8 caracteres')
        return
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        setRealTimeError('Debe contener mayúsculas, minúsculas y números')
        return
      }
    }

    if (maxLength && value.length > maxLength) {
      setRealTimeError(`Máximo ${maxLength} caracteres permitidos`)
      return
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    field.onChange(value)
    handleRealTimeValidation(value)
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <Label
            htmlFor={name}
            className={cn('text-sm font-medium', required && 'required')}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          
          {showCharacterCount && maxLength && (
            <span className={cn(
              'text-xs',
              valueLength > maxLength ? 'text-red-500' : 'text-gray-500'
            )}>
              {valueLength}/{maxLength}
            </span>
          )}
        </div>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500">
            {leftIcon}
          </div>
        )}

        <Input
          {...field}
          id={name}
          type={actualType}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          maxLength={maxLength}
          value={field.value || ''}
          onChange={handleChange}
          className={cn(
            leftIcon && 'pl-9',
            (rightIcon || isPassword) && 'pr-9',
            displayError && 'border-red-500 focus-visible:ring-red-500',
            showSuccess && 'border-green-500 focus-visible:ring-green-500'
          )}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}

        {rightIcon && !isPassword && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            tabIndex={-1}
          >
            {rightIcon}
          </button>
        )}
      </div>

      {description && !error && (
        <p className="text-sm text-gray-600">{description}</p>
      )}

      <SecureFieldError message={displayError?.message} securityTip={securityTip} />
      {showSuccess && <SecureFieldSuccess message="Campo válido" />}
    </div>
  )
}

/**
 * Secure Textarea Form Field Component
 * Campo de texto multilínea con validación de seguridad avanzada
 */
export function SecureTextareaField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  rows = 4,
  maxLength,
  showCharacterCount = false,
  autoResize = false,
  disabled = false,
  required = false,
  className,
  showSuccessState = false,
  securityTip,
}: SecureTextareaFormFieldProps<T>) {
  const {
    field,
    fieldState: { error, isDirty, isTouched },
  } = useController({
    name,
    control,
  })

  const showSuccess = showSuccessState && isDirty && isTouched && !error
  const valueLength = (field.value as string)?.length || 0

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <Label
            htmlFor={name}
            className={cn('text-sm font-medium', required && 'required')}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          
          {showCharacterCount && maxLength && (
            <span className={cn(
              'text-xs',
              valueLength > maxLength ? 'text-red-500' : 'text-gray-500'
            )}>
              {valueLength}/{maxLength}
            </span>
          )}
        </div>
      )}

      <Textarea
        {...field}
        id={name}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        value={field.value || ''}
        className={cn(
          error && 'border-red-500 focus-visible:ring-red-500',
          showSuccess && 'border-green-500 focus-visible:ring-green-500',
          autoResize && 'min-h-[80px] resize-y'
        )}
      />

      {description && !error && (
        <p className="text-sm text-gray-600">{description}</p>
      )}

      <SecureFieldError message={error?.message} securityTip={securityTip} />
      {showSuccess && <SecureFieldSuccess message="Campo válido" />}
    </div>
  )
}