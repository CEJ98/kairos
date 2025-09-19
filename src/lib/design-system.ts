/**
 * Sistema de Diseño Unificado de Kairos Fitness
 * Este archivo centraliza todos los tokens de diseño para mantener consistencia
 * entre la aplicación web y móvil
 */

// Paleta de colores principal
export const colorTokens = {
	// Colores de marca principales
	primary: {
		50: '#eff6ff',
		100: '#dbeafe',
		200: '#bfdbfe',
		300: '#93c5fd',
		400: '#60a5fa',
		500: '#3b82f6', // Color principal
		600: '#2563eb',
		700: '#1d4ed8',
		800: '#1e40af',
		900: '#1e3a8a',
		DEFAULT: '#3b82f6'
	},
	
	accent: {
		50: '#f0fdf4',
		100: '#dcfce7',
		200: '#bbf7d0',
		300: '#86efac',
		400: '#4ade80',
		500: '#22c55e', // Verde accent
		600: '#16a34a',
		700: '#15803d',
		800: '#166534',
		900: '#14532d',
		DEFAULT: '#22c55e'
	},
	
	// Estados semánticos
	success: {
		50: '#f0fdf4',
		100: '#dcfce7',
		500: '#22c55e',
		600: '#16a34a',
		DEFAULT: '#22c55e'
	},
	
	warning: {
		50: '#fffbeb',
		100: '#fef3c7',
		500: '#f59e0b',
		600: '#d97706',
		DEFAULT: '#f59e0b'
	},
	
	error: {
		50: '#fef2f2',
		100: '#fee2e2',
		500: '#ef4444',
		600: '#dc2626',
		DEFAULT: '#ef4444'
	},
	
	info: {
		50: '#eff6ff',
		100: '#dbeafe',
		500: '#3b82f6',
		600: '#2563eb',
		DEFAULT: '#3b82f6'
	},
	
	// Colores neutros
	gray: {
		50: '#f9fafb',
		100: '#f3f4f6',
		200: '#e5e7eb',
		300: '#d1d5db',
		400: '#9ca3af',
		500: '#6b7280',
		600: '#4b5563',
		700: '#374151',
		800: '#1f2937',
		900: '#111827'
	},
	
	// Colores específicos para fitness
	workout: {
		easy: '#22c55e',
		medium: '#f59e0b',
		hard: '#ef4444',
		intense: '#dc2626'
	},
	
	health: {
		heartRate: '#ef4444',
		calories: '#f59e0b',
		steps: '#3b82f6',
		sleep: '#8b5cf6',
		water: '#06b6d4'
	}
}

// Espaciado consistente
export const spacing = {
	xs: '0.25rem', // 4px
	sm: '0.5rem',  // 8px
	md: '1rem',    // 16px
	lg: '1.5rem',  // 24px
	xl: '2rem',    // 32px
	'2xl': '3rem', // 48px
	'3xl': '4rem', // 64px
	'4xl': '6rem', // 96px
	'5xl': '8rem'  // 128px
}

// Tipografía
export const typography = {
	fontFamily: {
		sans: ['Inter', 'system-ui', 'sans-serif'],
		display: ['Cal Sans', 'Inter', 'system-ui', 'sans-serif'],
		mono: ['JetBrains Mono', 'Fira Code', 'monospace']
	},
	
	fontSize: {
		xs: ['0.75rem', { lineHeight: '1rem' }],
		sm: ['0.875rem', { lineHeight: '1.25rem' }],
		base: ['1rem', { lineHeight: '1.5rem' }],
		lg: ['1.125rem', { lineHeight: '1.75rem' }],
		xl: ['1.25rem', { lineHeight: '1.75rem' }],
		'2xl': ['1.5rem', { lineHeight: '2rem' }],
		'3xl': ['1.875rem', { lineHeight: '2.25rem' }],
		'4xl': ['2.25rem', { lineHeight: '2.5rem' }],
		'5xl': ['3rem', { lineHeight: '1.1' }]
	},
	
	fontWeight: {
		normal: '400',
		medium: '500',
		semibold: '600',
		bold: '700'
	}
}

// Bordes y radios
export const borderRadius = {
	none: '0',
	sm: '0.125rem',   // 2px
	base: '0.25rem',  // 4px
	md: '0.375rem',   // 6px
	lg: '0.5rem',     // 8px
	xl: '0.75rem',    // 12px
	'2xl': '1rem',    // 16px
	'3xl': '1.5rem',  // 24px
	full: '9999px'
}

// Sombras
export const boxShadow = {
	sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
	base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
	md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
	lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
	xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
	'2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
	inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
}

// Breakpoints responsivos
export const breakpoints = {
	xs: '475px',
	sm: '640px',
	md: '768px',
	lg: '1024px',
	xl: '1280px',
	'2xl': '1536px'
}

// Animaciones y transiciones
export const animation = {
	duration: {
		fast: '150ms',
		base: '300ms',
		slow: '500ms'
	},
	
	easing: {
		ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
		easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
		easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
		easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
	}
}

// Configuración de tema para modo oscuro/claro
export const themeConfig = {
	light: {
		background: '#ffffff',
		foreground: colorTokens.gray[900],
		card: '#ffffff',
		cardForeground: colorTokens.gray[900],
		popover: '#ffffff',
		popoverForeground: colorTokens.gray[900],
		primary: colorTokens.primary.DEFAULT,
		primaryForeground: '#ffffff',
		secondary: colorTokens.gray[100],
		secondaryForeground: colorTokens.gray[900],
		muted: colorTokens.gray[100],
		mutedForeground: colorTokens.gray[500],
		accent: colorTokens.accent.DEFAULT,
		accentForeground: '#ffffff',
		destructive: colorTokens.error.DEFAULT,
		destructiveForeground: '#ffffff',
		border: colorTokens.gray[200],
		input: colorTokens.gray[200],
		ring: colorTokens.primary.DEFAULT
	},
	
	dark: {
		background: colorTokens.gray[900],
		foreground: colorTokens.gray[50],
		card: colorTokens.gray[900],
		cardForeground: colorTokens.gray[50],
		popover: colorTokens.gray[900],
		popoverForeground: colorTokens.gray[50],
		primary: colorTokens.primary.DEFAULT,
		primaryForeground: colorTokens.gray[900],
		secondary: colorTokens.gray[800],
		secondaryForeground: colorTokens.gray[50],
		muted: colorTokens.gray[800],
		mutedForeground: colorTokens.gray[400],
		accent: colorTokens.accent.DEFAULT,
		accentForeground: colorTokens.gray[50],
		destructive: colorTokens.error.DEFAULT,
		destructiveForeground: colorTokens.gray[50],
		border: colorTokens.gray[800],
		input: colorTokens.gray[800],
		ring: colorTokens.primary.DEFAULT
	}
}

// Utilidades para componentes
export const componentStyles = {
	// Botones
	button: {
		primary: {
			background: `linear-gradient(135deg, ${colorTokens.primary.DEFAULT} 0%, ${colorTokens.primary[600]} 100%)`,
			color: '#ffffff',
			borderRadius: borderRadius.xl,
			padding: `${spacing.md} ${spacing.xl}`,
			fontWeight: typography.fontWeight.semibold,
			boxShadow: `0 4px 14px 0 ${colorTokens.primary.DEFAULT}40`,
			transition: `all ${animation.duration.base} ${animation.easing.ease}`
		},
		
		secondary: {
			background: colorTokens.gray[100],
			color: colorTokens.gray[900],
			borderRadius: borderRadius.xl,
			padding: `${spacing.md} ${spacing.xl}`,
			fontWeight: typography.fontWeight.semibold,
			transition: `all ${animation.duration.base} ${animation.easing.ease}`
		},
		
		accent: {
			background: `linear-gradient(135deg, ${colorTokens.accent.DEFAULT} 0%, ${colorTokens.accent[600]} 100%)`,
			color: '#ffffff',
			borderRadius: borderRadius.xl,
			padding: `${spacing.md} ${spacing.xl}`,
			fontWeight: typography.fontWeight.semibold,
			boxShadow: `0 4px 14px 0 ${colorTokens.accent.DEFAULT}40`,
			transition: `all ${animation.duration.base} ${animation.easing.ease}`
		}
	},
	
	// Tarjetas
	card: {
		default: {
			background: '#ffffff',
			borderRadius: borderRadius['2xl'],
			boxShadow: boxShadow.lg,
			border: `1px solid ${colorTokens.gray[100]}30`,
			transition: `all ${animation.duration.slow} ${animation.easing.ease}`
		},
		
		modern: {
			background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
			borderRadius: borderRadius['3xl'],
			boxShadow: boxShadow.xl,
			border: `1px solid ${colorTokens.gray[200]}50`,
			transition: `all ${animation.duration.slow} ${animation.easing.ease}`
		},
		
		glass: {
			background: 'rgba(255, 255, 255, 0.08)',
			backdropFilter: 'blur(16px)',
			border: '1px solid rgba(255, 255, 255, 0.12)',
			borderRadius: borderRadius['2xl'],
			boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
		}
	},
	
	// Inputs
	input: {
		default: {
			border: `1px solid ${colorTokens.gray[200]}`,
			borderRadius: borderRadius.xl,
			padding: `${spacing.md} ${spacing.lg}`,
			fontSize: typography.fontSize.sm[0],
			transition: `all ${animation.duration.base} ${animation.easing.ease}`,
			boxShadow: boxShadow.sm
		},
		
		modern: {
			border: 'none',
			background: `linear-gradient(135deg, ${colorTokens.gray[50]} 0%, ${colorTokens.gray[100]} 100%)`,
			borderRadius: borderRadius.xl,
			padding: `${spacing.md} ${spacing.lg}`,
			fontSize: typography.fontSize.sm[0],
			transition: `all ${animation.duration.base} ${animation.easing.ease}`,
			boxShadow: boxShadow.sm
		}
	}
}

// Exportar todo como sistema de diseño
export const designSystem = {
	colors: colorTokens,
	spacing,
	typography,
	borderRadius,
	boxShadow,
	breakpoints,
	animation,
	themes: themeConfig,
	components: componentStyles
}

export default designSystem