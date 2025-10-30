/**
 * Utilidades del Sistema de Diseño de Kairos
 * Componentes y hooks para usar consistentemente el sistema de diseño
 */

import React from 'react'
import { designSystem } from '@/lib/design-system'
import { cn } from '@/lib/utils'

// Tipos para los componentes
type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost'
type CardVariant = 'default' | 'modern' | 'glass'
type ColorVariant = keyof typeof designSystem.colors
type SpacingSize = keyof typeof designSystem.spacing

// Hook para acceder al sistema de diseño
export const useDesignSystem = () => {
	return {
		colors: designSystem.colors,
		spacing: designSystem.spacing,
		typography: designSystem.typography,
		borderRadius: designSystem.borderRadius,
		boxShadow: designSystem.boxShadow,
		breakpoints: designSystem.breakpoints,
		animation: designSystem.animation,
		themes: designSystem.themes,
		components: designSystem.components
	}
}

// Componente Button mejorado con sistema de diseño
interface DesignButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant
	size?: 'sm' | 'md' | 'lg' | 'xl'
	isLoading?: boolean
	leftIcon?: React.ReactNode
	rightIcon?: React.ReactNode
	fullWidth?: boolean
}

export const DesignButton = React.forwardRef<HTMLButtonElement, DesignButtonProps>(
	({ 
		variant = 'primary', 
		size = 'md', 
		isLoading = false,
		leftIcon,
		rightIcon,
		fullWidth = false,
		className, 
		children, 
		disabled,
		...props 
	}, ref) => {
		const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
		
		const variantStyles = {
			primary: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 focus:ring-primary-500 shadow-lg hover:shadow-xl',
			secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
			accent: 'bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:from-accent-600 hover:to-accent-700 focus:ring-accent-500 shadow-lg hover:shadow-xl',
			outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white focus:ring-primary-500',
			ghost: 'text-primary-500 hover:bg-primary-50 focus:ring-primary-500 dark:hover:bg-primary-900/20'
		}
		
		const sizeStyles = {
			sm: 'px-3 py-1.5 text-sm rounded-lg',
			md: 'px-4 py-2 text-base rounded-xl',
			lg: 'px-6 py-3 text-lg rounded-xl',
			xl: 'px-8 py-4 text-xl rounded-2xl'
		}
		
		return (
			<button
				ref={ref}
				className={cn(
					baseStyles,
					variantStyles[variant],
					sizeStyles[size],
					fullWidth && 'w-full',
					isLoading && 'cursor-wait',
					className
				)}
				disabled={disabled || isLoading}
				{...props}
			>
				{isLoading ? (
					<div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
				) : leftIcon}
				{children}
				{!isLoading && rightIcon}
			</button>
		)
	}
)

DesignButton.displayName = 'DesignButton'

// Componente Card mejorado con sistema de diseño
interface DesignCardProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: CardVariant
	padding?: SpacingSize
	hover?: boolean
	clickable?: boolean
}

export const DesignCard = React.forwardRef<HTMLDivElement, DesignCardProps>(
	({ 
		variant = 'default', 
		padding = 'lg',
		hover = false,
		clickable = false,
		className, 
		children, 
		...props 
	}, ref) => {
		const baseStyles = 'transition-all duration-500'
		
		const variantStyles = {
			default: 'bg-white border border-gray-100/30 shadow-lg rounded-2xl',
			modern: 'bg-gradient-to-br from-white to-gray-50 border border-gray-200/50 shadow-xl rounded-3xl',
			glass: 'bg-white/8 backdrop-blur-md border border-white/12 shadow-2xl rounded-2xl'
		}
		
		const paddingStyles = {
			xs: 'p-1',
			sm: 'p-2',
			md: 'p-4',
			lg: 'p-6',
			xl: 'p-8',
			'2xl': 'p-12',
			'3xl': 'p-16',
			'4xl': 'p-24',
			'5xl': 'p-32'
		}
		
		return (
			<div
				ref={ref}
				className={cn(
					baseStyles,
					variantStyles[variant],
					paddingStyles[padding],
					hover && 'hover:shadow-2xl hover:-translate-y-1',
					clickable && 'cursor-pointer hover:shadow-2xl hover:-translate-y-1 active:translate-y-0',
					className
				)}
				{...props}
			>
				{children}
			</div>
		)
	}
)

DesignCard.displayName = 'DesignCard'

// Componente de espaciado consistente
interface SpacerProps {
	size?: SpacingSize
	direction?: 'horizontal' | 'vertical'
}

export const Spacer: React.FC<SpacerProps> = ({ size = 'md', direction = 'vertical' }) => {
	const spacingValue = designSystem.spacing[size]
	
	if (direction === 'horizontal') {
		return <div style={{ width: spacingValue }} className="inline-block" />
	}
	
	return <div style={{ height: spacingValue }} />
}

// Componente de texto con tipografía consistente
interface DesignTextProps extends React.HTMLAttributes<HTMLElement> {
	as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'
	size?: keyof typeof designSystem.typography.fontSize
	weight?: keyof typeof designSystem.typography.fontWeight
	color?: string
	gradient?: boolean
}

export const DesignText = React.forwardRef<HTMLElement, DesignTextProps>(
	({ 
		as: Component = 'p', 
		size = 'base', 
		weight = 'normal',
		color,
		gradient = false,
		className, 
		children, 
		...props 
	}, ref) => {
		const sizeClasses = {
			xs: 'text-xs',
			sm: 'text-sm',
			base: 'text-base',
			lg: 'text-lg',
			xl: 'text-xl',
			'2xl': 'text-2xl',
			'3xl': 'text-3xl',
			'4xl': 'text-4xl',
			'5xl': 'text-5xl'
		}
		
		const weightClasses = {
			normal: 'font-normal',
			medium: 'font-medium',
			semibold: 'font-semibold',
			bold: 'font-bold'
		}
		
		return (
			<Component
				ref={ref as any}
				className={cn(
					sizeClasses[size],
					weightClasses[weight],
					gradient && 'bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent',
					className
				)}
				style={{ color: color && !gradient ? color : undefined }}
				{...props}
			>
				{children}
			</Component>
		)
	}
)

DesignText.displayName = 'DesignText'

// Componente de contenedor con breakpoints consistentes
interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
	maxWidth?: keyof typeof designSystem.breakpoints | 'full'
	centered?: boolean
	padding?: SpacingSize
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
	({ 
		maxWidth = 'xl', 
		centered = true,
		padding = 'md',
		className, 
		children, 
		...props 
	}, ref) => {
		const maxWidthClasses = {
			xs: 'max-w-xs',
			sm: 'max-w-sm',
			md: 'max-w-md',
			lg: 'max-w-lg',
			xl: 'max-w-xl',
			'2xl': 'max-w-2xl',
			full: 'max-w-full'
		}
		
		const paddingClasses = {
			xs: 'px-1',
			sm: 'px-2',
			md: 'px-4',
			lg: 'px-6',
			xl: 'px-8',
			'2xl': 'px-12',
			'3xl': 'px-16',
			'4xl': 'px-24',
			'5xl': 'px-32'
		}
		
		return (
			<div
				ref={ref}
				className={cn(
					maxWidthClasses[maxWidth],
					paddingClasses[padding],
					centered && 'mx-auto',
					className
				)}
				{...props}
			>
				{children}
			</div>
		)
	}
)

Container.displayName = 'Container'

// Utilidades de color
export const getColorValue = (colorPath: string) => {
	const keys = colorPath.split('.')
	let value: any = designSystem.colors
	
	for (const key of keys) {
		value = value?.[key]
	}
	
	return value || colorPath
}

// Utilidades de espaciado
export const getSpacingValue = (size: SpacingSize) => {
	return designSystem.spacing[size]
}

// Utilidades de tipografía
export const getTypographyValue = (type: 'fontSize' | 'fontWeight', key: string) => {
	return designSystem.typography[type][key as keyof typeof designSystem.typography[typeof type]]
}

// Hook para tema responsivo
export const useResponsiveValue = <T,>(values: Partial<Record<keyof typeof designSystem.breakpoints, T>>) => {
	const [currentValue, setCurrentValue] = React.useState<T | undefined>()
	
	React.useEffect(() => {
		const updateValue = () => {
			const width = window.innerWidth
			
			if (width >= parseInt(designSystem.breakpoints['2xl'])) {
				setCurrentValue(values['2xl'] || values.xl || values.lg || values.md || values.sm || values.xs)
			} else if (width >= parseInt(designSystem.breakpoints.xl)) {
				setCurrentValue(values.xl || values.lg || values.md || values.sm || values.xs)
			} else if (width >= parseInt(designSystem.breakpoints.lg)) {
				setCurrentValue(values.lg || values.md || values.sm || values.xs)
			} else if (width >= parseInt(designSystem.breakpoints.md)) {
				setCurrentValue(values.md || values.sm || values.xs)
			} else if (width >= parseInt(designSystem.breakpoints.sm)) {
				setCurrentValue(values.sm || values.xs)
			} else {
				setCurrentValue(values.xs)
			}
		}
		
		updateValue()
		window.addEventListener('resize', updateValue)
		
		return () => window.removeEventListener('resize', updateValue)
	}, [values])
	
	return currentValue
}

// Exportar todo
export {
	designSystem,
	type ButtonVariant,
	type CardVariant,
	type ColorVariant,
	type SpacingSize
}