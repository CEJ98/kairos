'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
	label: string
	href?: string
	icon?: React.ReactNode
}

interface BreadcrumbsProps {
	items?: BreadcrumbItem[]
	className?: string
	separator?: React.ReactNode
	showHome?: boolean
	maxItems?: number
}

/**
 * Genera breadcrumbs automáticamente basado en la ruta actual
 */
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
	const segments = pathname.split('/').filter(Boolean)
	const breadcrumbs: BreadcrumbItem[] = []

	// Mapeo de rutas a etiquetas legibles
	const routeLabels: Record<string, string> = {
		dashboard: 'Dashboard',
		trainer: 'Entrenador',
		workouts: 'Entrenamientos',
		exercises: 'Ejercicios',
		progress: 'Progreso',
		profile: 'Perfil',
		settings: 'Configuración',
		clients: 'Clientes',
		calendar: 'Calendario',
		analytics: 'Analíticas',
		billing: 'Facturación',
		community: 'Comunidad',
		activities: 'Actividades',
		measurements: 'Mediciones',
		new: 'Nuevo',
		edit: 'Editar',
		view: 'Ver',
		start: 'Iniciar',
		complete: 'Completar',
		live: 'En Vivo',
		admin: 'Administración',
		backup: 'Respaldos',
		'stripe-webhooks': 'Webhooks de Stripe'
	}

	let currentPath = ''
	for (let i = 0; i < segments.length; i++) {
		const segment = segments[i]
		currentPath += `/${segment}`
		
		// Saltar segmentos de locale
		if (i === 0 && (segment === 'es' || segment === 'en')) {
			continue
		}
		
		// Saltar IDs dinámicos (números o UUIDs)
		if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) || /^\d+$/.test(segment)) {
			continue
		}
		
		const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
		
		breadcrumbs.push({
			label,
			href: currentPath
		})
	}

	return breadcrumbs
}

export function Breadcrumbs({
	items,
	className,
	separator = <ChevronRight className="h-4 w-4 text-gray-400" />,
	showHome = true,
	maxItems = 5
}: BreadcrumbsProps) {
	const pathname = usePathname() || ''
	const breadcrumbItems = items || generateBreadcrumbs(pathname)
	
	// Limitar el número de elementos mostrados
	const displayItems = breadcrumbItems.length > maxItems 
		? [
				breadcrumbItems[0],
				{ label: '...', href: undefined },
				...breadcrumbItems.slice(-2)
			]
		: breadcrumbItems

	if (breadcrumbItems.length === 0) return null

	return (
		<nav 
			aria-label="Breadcrumb" 
			className={cn(
				"flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-300",
				className
			)}
		>
			{showHome && (
				<>
					<Link 
						href="/dashboard" 
						className="flex items-center hover:text-primary transition-colors"
						aria-label="Ir al inicio"
					>
						<Home className="h-4 w-4" />
					</Link>
					{breadcrumbItems.length > 0 && (
						<span className="flex items-center">{separator}</span>
					)}
				</>
			)}
			
			{displayItems.map((item, index) => {
				const isLast = index === displayItems.length - 1
				const isEllipsis = item.label === '...'
				
				return (
					<React.Fragment key={`${item.href}-${index}`}>
						{isEllipsis ? (
							<span className="text-gray-400">...</span>
						) : item.href && !isLast ? (
							<Link 
								href={item.href}
								className="hover:text-primary transition-colors flex items-center gap-1"
							>
								{item.icon}
								{item.label}
							</Link>
						) : (
							<span 
								className={cn(
									"flex items-center gap-1",
									isLast && "text-gray-900 dark:text-gray-100 font-medium"
								)}
								aria-current={isLast ? "page" : undefined}
							>
								{item.icon}
								{item.label}
							</span>
						)}
						
						{!isLast && !isEllipsis && (
							<span className="flex items-center">{separator}</span>
						)}
					</React.Fragment>
				)
			})}
		</nav>
	)
}

/**
 * Hook para obtener breadcrumbs personalizados
 */
export function useBreadcrumbs(customItems?: BreadcrumbItem[]) {
	const pathname = usePathname() || ''
	
	return React.useMemo(() => {
		if (customItems) return customItems
		return generateBreadcrumbs(pathname)
	}, [pathname, customItems])
}

export default Breadcrumbs
