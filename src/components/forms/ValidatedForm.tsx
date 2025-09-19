/**
 * Validated Form Components
 * Componentes de formulario con validación robusta usando react-hook-form y yup
 */

'use client'

import React from 'react'
import { useForm, UseFormProps, FieldValues, Path, PathValue, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { ObjectSchema } from 'yup'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

// Form field props
interface BaseFieldProps<T extends FieldValues> {
  name: Path<T>
  label: string
  placeholder?: string
  description?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

interface TextFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  type?: 'text' | 'email' | 'password' | 'url' | 'tel'
  autoComplete?: string
  maxLength?: number
}

interface NumberFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  min?: number
  max?: number
  step?: number
}

interface TextareaFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  rows?: number
  maxLength?: number
}

interface SelectFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  options: Array<{ value: string; label: string; disabled?: boolean }>
  defaultValue?: string
}

interface CheckboxFieldProps<T extends FieldValues> extends Omit<BaseFieldProps<T>, 'placeholder'> {
  text?: string
}

interface SwitchFieldProps<T extends FieldValues> extends Omit<BaseFieldProps<T>, 'placeholder'> {
  text?: string
}

// Main form component props
interface ValidatedFormProps<T extends FieldValues> extends Omit<UseFormProps<T>, 'resolver'> {
  schema: ObjectSchema<any>
  onSubmit: (data: T) => Promise<void> | void
  children: React.ReactNode
  title?: string
  description?: string
  submitText?: string
  isLoading?: boolean
  className?: string
  showCard?: boolean
}

// Hook for form validation
export function useValidatedForm<T extends FieldValues>(
  schema: ObjectSchema<any>,
  options?: UseFormProps<T>
) {
  return useForm<T>({
    resolver: yupResolver(schema) as any,
    mode: 'onChange',
    reValidateMode: 'onChange',
    ...options,
  })
}

// Error message component
function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null

  return (
    <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
      <AlertCircle className="w-4 h-4" />
      <span>{message}</span>
    </div>
  )
}

// Success message component
function SuccessMessage({ message }: { message?: string }) {
  if (!message) return null

  return (
    <div className="flex items-center gap-2 text-sm text-green-600 mt-1">
      <CheckCircle className="w-4 h-4" />
      <span>{message}</span>
    </div>
  )
}

// Text input field
export function TextField<T extends FieldValues>({
  name,
  label,
  placeholder,
  description,
  type = 'text',
  required = false,
  disabled = false,
  className,
  autoComplete,
  maxLength,
  ...props
}: TextFieldProps<T> & { control: any; errors: any }) {
  const error = props.errors[name]?.message

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className={cn('text-sm font-medium', required && 'required')}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <Controller
        name={name}
        control={props.control}
        render={({ field }) => (
          <Input
            {...field}
            id={name}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete={autoComplete}
            maxLength={maxLength}
            className={cn(error && 'border-red-500 focus-visible:ring-red-500')}
            value={field.value || ''}
          />
        )}
      />
      
      {description && !error && (
        <p className="text-sm text-gray-600">{description}</p>
      )}
      
      <ErrorMessage message={error} />
    </div>
  )
}

// Number input field
export function NumberField<T extends FieldValues>({
  name,
  label,
  placeholder,
  description,
  required = false,
  disabled = false,
  className,
  min,
  max,
  step,
  ...props
}: NumberFieldProps<T> & { control: any; errors: any }) {
  const error = props.errors[name]?.message

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className={cn('text-sm font-medium', required && 'required')}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <Controller
        name={name}
        control={props.control}
        render={({ field }) => (
          <Input
            {...field}
            id={name}
            type="number"
            placeholder={placeholder}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            className={cn(error && 'border-red-500 focus-visible:ring-red-500')}
            value={field.value || ''}
            onChange={(e) => {
              const value = e.target.value
              field.onChange(value === '' ? null : parseFloat(value))
            }}
          />
        )}
      />
      
      {description && !error && (
        <p className="text-sm text-gray-600">{description}</p>
      )}
      
      <ErrorMessage message={error} />
    </div>
  )
}

// Textarea field
export function TextareaField<T extends FieldValues>({
  name,
  label,
  placeholder,
  description,
  required = false,
  disabled = false,
  className,
  rows = 4,
  maxLength,
  ...props
}: TextareaFieldProps<T> & { control: any; errors: any }) {
  const error = props.errors[name]?.message

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className={cn('text-sm font-medium', required && 'required')}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <Controller
        name={name}
        control={props.control}
        render={({ field }) => (
          <Textarea
            {...field}
            id={name}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            maxLength={maxLength}
            className={cn(error && 'border-red-500 focus-visible:ring-red-500')}
            value={field.value || ''}
          />
        )}
      />
      
      {maxLength && (
        <div className="flex justify-end">
          <span className="text-xs text-gray-500">
            {(props.control._formValues[name] || '').length || 0}/{maxLength}
          </span>
        </div>
      )}
      
      {description && !error && (
        <p className="text-sm text-gray-600">{description}</p>
      )}
      
      <ErrorMessage message={error} />
    </div>
  )
}

// Select field
export function SelectField<T extends FieldValues>({
  name,
  label,
  placeholder,
  description,
  required = false,
  disabled = false,
  className,
  options,
  defaultValue,
  ...props
}: SelectFieldProps<T> & { control: any; errors: any }) {
  const error = props.errors[name]?.message

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className={cn('text-sm font-medium', required && 'required')}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <Controller
        name={name}
        control={props.control}
        defaultValue={defaultValue as PathValue<T, Path<T>>}
        render={({ field }) => (
          <Select
            value={field.value || ''}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <SelectTrigger className={cn(error && 'border-red-500 focus-visible:ring-red-500')}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      
      {description && !error && (
        <p className="text-sm text-gray-600">{description}</p>
      )}
      
      <ErrorMessage message={error} />
    </div>
  )
}

// Checkbox field
export function CheckboxField<T extends FieldValues>({
  name,
  label,
  description,
  text,
  required = false,
  disabled = false,
  className,
  ...props
}: CheckboxFieldProps<T> & { control: any; errors: any }) {
  const error = props.errors[name]?.message

  return (
    <div className={cn('space-y-2', className)}>
      <Controller
        name={name}
        control={props.control}
        render={({ field }) => (
          <div className="flex items-start space-x-2">
            <Checkbox
              id={name}
              checked={field.value || false}
              onCheckedChange={field.onChange}
              disabled={disabled}
              className={cn(error && 'border-red-500')}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor={name}
                className={cn(
                  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                  required && 'required'
                )}
              >
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {(text || description) && (
                <p className="text-xs text-muted-foreground">
                  {text || description}
                </p>
              )}
            </div>
          </div>
        )}
      />
      
      <ErrorMessage message={error} />
    </div>
  )
}

// Switch field
export function SwitchField<T extends FieldValues>({
  name,
  label,
  description,
  text,
  required = false,
  disabled = false,
  className,
  ...props
}: SwitchFieldProps<T> & { control: any; errors: any }) {
  const error = props.errors[name]?.message

  return (
    <div className={cn('space-y-2', className)}>
      <Controller
        name={name}
        control={props.control}
        render={({ field }) => (
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label
                htmlFor={name}
                className={cn('text-sm font-medium', required && 'required')}
              >
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {(text || description) && (
                <p className="text-xs text-muted-foreground">
                  {text || description}
                </p>
              )}
            </div>
            <Switch
              id={name}
              checked={field.value || false}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </div>
        )}
      />
      
      <ErrorMessage message={error} />
    </div>
  )
}

// Main validated form component
export function ValidatedForm<T extends FieldValues>({
  schema,
  onSubmit,
  children,
  title,
  description,
  submitText = 'Enviar',
  isLoading = false,
  className,
  showCard = false,
  ...formProps
}: ValidatedFormProps<T>) {
  const form = useForm<T>({
    resolver: yupResolver(schema) as any,
    mode: 'onChange',
    reValidateMode: 'onChange',
    ...formProps,
  })

  const { handleSubmit, formState: { errors, isValid, isDirty } } = form

  const handleFormSubmit = async (data: T) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const formContent = (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            control: form.control,
            errors,
          })
        }
        return child
      })}
      
      <Button
        type="submit"
        disabled={isLoading || (!isDirty && !isValid)}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Procesando...
          </>
        ) : (
          submitText
        )}
      </Button>
    </form>
  )

  if (showCard) {
    return (
      <Card className={cn('w-full max-w-md mx-auto', className)}>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>
          {formContent}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {(title || description) && (
        <div className="space-y-2">
          {title && <h2 className="text-2xl font-bold">{title}</h2>}
          {description && <p className="text-gray-600">{description}</p>}
        </div>
      )}
      {formContent}
    </div>
  )
}

// Export all components
// Components are already exported above