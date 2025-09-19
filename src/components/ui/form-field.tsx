/**
 * Enhanced Form Field Components with Zod validation
 * Componente mejorado para campos de formulario con validación robusta
 */

'use client'

import React from 'react'
import { Control, FieldPath, FieldValues, useController } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { AlertCircle, CheckCircle, Eye, EyeOff, Info } from 'lucide-react'

// Base props for all form fields
interface BaseFormFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label?: string
  description?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  showSuccessState?: boolean
}

// Text input field props
interface TextFormFieldProps<T extends FieldValues> extends BaseFormFieldProps<T> {
  type?: 'text' | 'email' | 'password' | 'url' | 'tel' | 'search'
  autoComplete?: string
  maxLength?: number
  showCharacterCount?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onRightIconClick?: () => void
}

// Number input field props
interface NumberFormFieldProps<T extends FieldValues> extends BaseFormFieldProps<T> {
  min?: number
  max?: number
  step?: number
  showRange?: boolean
}

// Textarea field props
interface TextareaFormFieldProps<T extends FieldValues> extends BaseFormFieldProps<T> {
  rows?: number
  maxLength?: number
  showCharacterCount?: boolean
  autoResize?: boolean
}

// Select field props
interface SelectFormFieldProps<T extends FieldValues> extends BaseFormFieldProps<T> {
  options: Array<{
    value: string
    label: string
    disabled?: boolean
    description?: string
  }>
  emptyText?: string
}

// Checkbox field props
interface CheckboxFormFieldProps<T extends FieldValues> extends BaseFormFieldProps<T> {
  text?: string
}

// Switch field props
interface SwitchFormFieldProps<T extends FieldValues> extends BaseFormFieldProps<T> {
  text?: string
}

// Error message component
function FieldError({ message }: { message?: string }) {
  if (!message) return null

  return (
    <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

// Success message component
function FieldSuccess({ message }: { message?: string }) {
  if (!message) return null

  return (
    <div className="flex items-center gap-2 text-sm text-green-600 mt-1">
      <CheckCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

// Description component
function FieldDescription({ description }: { description?: string }) {
  if (!description) return null

  return (
    <div className="flex items-start gap-2 text-sm text-gray-600 mt-1">
      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{description}</span>
    </div>
  )
}

// Character count component
function CharacterCount({ 
  current, 
  max, 
  className 
}: { 
  current: number
  max: number
  className?: string 
}) {
  const percentage = (current / max) * 100
  const isNearLimit = percentage > 80
  const isOverLimit = current > max

  return (
    <div className={cn(
      'text-xs text-right mt-1',
      isOverLimit && 'text-red-600',
      isNearLimit && !isOverLimit && 'text-amber-600',
      !isNearLimit && 'text-gray-500',
      className
    )}>
      {current}/{max}
    </div>
  )
}

// Text input field
export function TextFormField<T extends FieldValues>({
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
  showSuccessState = false,
  leftIcon,
  rightIcon,
  onRightIconClick,
}: TextFormFieldProps<T>) {
  const { field, fieldState } = useController({ control, name })
  const [showPassword, setShowPassword] = React.useState(false)
  const hasError = !!fieldState.error
  const isValid = !hasError && field.value && showSuccessState

  const inputType = type === 'password' && showPassword ? 'text' : type
  const currentLength = field.value?.length || 0

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label 
          htmlFor={name} 
          className={cn(
            'text-sm font-medium',
            required && "after:content-['*'] after:ml-0.5 after:text-red-500",
            disabled && 'text-gray-400'
          )}
        >
          {label}
        </Label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
            {leftIcon}
          </div>
        )}

        <Input
          {...field}
          id={name}
          type={inputType}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className={cn(
            leftIcon && 'pl-10',
            (rightIcon || type === 'password') && 'pr-10',
            hasError && 'border-red-500 focus-visible:ring-red-500',
            isValid && 'border-green-500 focus-visible:ring-green-500',
            'transition-colors duration-200'
          )}
          value={field.value || ''}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${name}-error` : 
            description ? `${name}-description` : undefined
          }
        />

        {(rightIcon || type === 'password') && (
          <button
            type="button"
            onClick={type === 'password' ? 
              () => setShowPassword(!showPassword) : 
              onRightIconClick
            }
            disabled={disabled}
            className={cn(
              'absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-sm p-0.5',
              'transition-colors duration-200',
              disabled && 'cursor-not-allowed opacity-50'
            )}
            aria-label={
              type === 'password' ? 
                (showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña') :
                'Acción personalizada'
            }
          >
            {type === 'password' ? (
              showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />
            ) : (
              rightIcon
            )}
          </button>
        )}
      </div>

      {showCharacterCount && maxLength && (
        <CharacterCount current={currentLength} max={maxLength} />
      )}

      <FieldError message={fieldState.error?.message} />
      {!hasError && description && <FieldDescription description={description} />}
      {isValid && <FieldSuccess message="Campo válido" />}
    </div>
  )
}

// Number input field
export function NumberFormField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  disabled = false,
  required = false,
  className,
  min,
  max,
  step,
  showRange = false,
  showSuccessState = false,
}: NumberFormFieldProps<T>) {
  const { field, fieldState } = useController({ control, name })
  const hasError = !!fieldState.error
  const isValid = !hasError && field.value !== null && field.value !== undefined && showSuccessState

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label 
          htmlFor={name} 
          className={cn(
            'text-sm font-medium',
            required && "after:content-['*'] after:ml-0.5 after:text-red-500",
            disabled && 'text-gray-400'
          )}
        >
          {label}
          {showRange && min !== undefined && max !== undefined && (
            <span className="text-xs text-gray-500 ml-2">({min} - {max})</span>
          )}
        </Label>
      )}

      <Input
        {...field}
        id={name}
        type="number"
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={cn(
          hasError && 'border-red-500 focus-visible:ring-red-500',
          isValid && 'border-green-500 focus-visible:ring-green-500',
          'transition-colors duration-200'
        )}
        value={field.value ?? ''}
        onChange={(e) => {
          const value = e.target.value
          field.onChange(value === '' ? null : parseFloat(value))
        }}
        aria-invalid={hasError}
        aria-describedby={
          hasError ? `${name}-error` : 
          description ? `${name}-description` : undefined
        }
      />

      <FieldError message={fieldState.error?.message} />
      {!hasError && description && <FieldDescription description={description} />}
      {isValid && <FieldSuccess message="Campo válido" />}
    </div>
  )
}

// Textarea field
export function TextareaFormField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  disabled = false,
  required = false,
  className,
  rows = 4,
  maxLength,
  showCharacterCount = false,
  showSuccessState = false,
  autoResize = false,
}: TextareaFormFieldProps<T>) {
  const { field, fieldState } = useController({ control, name })
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const hasError = !!fieldState.error
  const isValid = !hasError && field.value && showSuccessState
  const currentLength = field.value?.length || 0

  // Auto resize functionality
  React.useEffect(() => {
    if (autoResize && textareaRef.current) {
      const textarea = textareaRef.current
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [field.value, autoResize])

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label 
          htmlFor={name} 
          className={cn(
            'text-sm font-medium',
            required && "after:content-['*'] after:ml-0.5 after:text-red-500",
            disabled && 'text-gray-400'
          )}
        >
          {label}
        </Label>
      )}

      <Textarea
        {...field}
        ref={textareaRef}
        id={name}
        placeholder={placeholder}
        disabled={disabled}
        rows={autoResize ? undefined : rows}
        maxLength={maxLength}
        className={cn(
          hasError && 'border-red-500 focus-visible:ring-red-500',
          isValid && 'border-green-500 focus-visible:ring-green-500',
          autoResize && 'resize-none overflow-hidden',
          'transition-colors duration-200'
        )}
        value={field.value || ''}
        aria-invalid={hasError}
        aria-describedby={
          hasError ? `${name}-error` : 
          description ? `${name}-description` : undefined
        }
      />

      {showCharacterCount && maxLength && (
        <CharacterCount current={currentLength} max={maxLength} />
      )}

      <FieldError message={fieldState.error?.message} />
      {!hasError && description && <FieldDescription description={description} />}
      {isValid && <FieldSuccess message="Campo válido" />}
    </div>
  )
}

// Select field
export function SelectFormField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  disabled = false,
  required = false,
  className,
  options,
  emptyText = "No hay opciones disponibles",
  showSuccessState = false,
}: SelectFormFieldProps<T>) {
  const { field, fieldState } = useController({ control, name })
  const hasError = !!fieldState.error
  const isValid = !hasError && field.value && showSuccessState

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label 
          htmlFor={name} 
          className={cn(
            'text-sm font-medium',
            required && "after:content-['*'] after:ml-0.5 after:text-red-500",
            disabled && 'text-gray-400'
          )}
        >
          {label}
        </Label>
      )}

      <Select
        value={field.value || ''}
        onValueChange={field.onChange}
        disabled={disabled}
      >
        <SelectTrigger 
          className={cn(
            hasError && 'border-red-500 focus:ring-red-500',
            isValid && 'border-green-500 focus:ring-green-500',
            'transition-colors duration-200'
          )}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${name}-error` : 
            description ? `${name}-description` : undefined
          }
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-gray-500">
              {emptyText}
            </div>
          ) : (
            options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="flex flex-col items-start"
              >
                <span>{option.label}</span>
                {option.description && (
                  <span className="text-xs text-gray-500">{option.description}</span>
                )}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      <FieldError message={fieldState.error?.message} />
      {!hasError && description && <FieldDescription description={description} />}
      {isValid && <FieldSuccess message="Campo válido" />}
    </div>
  )
}

// Checkbox field
export function CheckboxFormField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  text,
  disabled = false,
  required = false,
  className,
  showSuccessState = false,
}: CheckboxFormFieldProps<T>) {
  const { field, fieldState } = useController({ control, name })
  const hasError = !!fieldState.error
  const isValid = !hasError && field.value && showSuccessState

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-start space-x-3">
        <Checkbox
          id={name}
          checked={field.value || false}
          onCheckedChange={field.onChange}
          disabled={disabled}
          className={cn(
            hasError && 'border-red-500',
            isValid && 'border-green-500',
            'transition-colors duration-200 mt-0.5'
          )}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${name}-error` : 
            description ? `${name}-description` : undefined
          }
        />
        <div className="grid gap-1.5 leading-none flex-1">
          {label && (
            <Label
              htmlFor={name}
              className={cn(
                'text-sm font-medium leading-none cursor-pointer',
                required && "after:content-['*'] after:ml-0.5 after:text-red-500",
                disabled && 'text-gray-400 cursor-not-allowed'
              )}
            >
              {label}
            </Label>
          )}
          {text && (
            <p className="text-sm text-gray-600">
              {text}
            </p>
          )}
        </div>
      </div>

      <FieldError message={fieldState.error?.message} />
      {!hasError && description && <FieldDescription description={description} />}
      {isValid && <FieldSuccess message="Campo válido" />}
    </div>
  )
}

// Switch field
export function SwitchFormField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  text,
  disabled = false,
  required = false,
  className,
  showSuccessState = false,
}: SwitchFormFieldProps<T>) {
  const { field, fieldState } = useController({ control, name })
  const hasError = !!fieldState.error
  const isValid = !hasError && showSuccessState

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5 flex-1">
          {label && (
            <Label
              htmlFor={name}
              className={cn(
                'text-sm font-medium',
                required && "after:content-['*'] after:ml-0.5 after:text-red-500",
                disabled && 'text-gray-400'
              )}
            >
              {label}
            </Label>
          )}
          {text && (
            <p className="text-sm text-gray-600">
              {text}
            </p>
          )}
        </div>
        <Switch
          id={name}
          checked={field.value || false}
          onCheckedChange={field.onChange}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${name}-error` : 
            description ? `${name}-description` : undefined
          }
        />
      </div>

      <FieldError message={fieldState.error?.message} />
      {!hasError && description && <FieldDescription description={description} />}
      {isValid && <FieldSuccess message="Campo válido" />}
    </div>
  )
}