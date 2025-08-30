'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

import { logger } from '@/lib/logger'
interface PreloadConfig {
	routes?: string[]
	components?: (() => Promise<any>)[]
	delay?: number
	idle?: boolean
	onHover?: boolean
	onVisible?: boolean
}

interface SmartPreloaderOptions {
	// Rutas críticas que se precargan inmediatamente
	criticalRoutes?: string[]
	// Rutas que se precargan cuando el usuario está inactivo
	idleRoutes?: string[]
	// Componentes pesados para precargar
	heavyComponents?: (() => Promise<any>)[]
	// Tiempo de inactividad antes de precargar (ms)
	idleDelay?: number
	// Habilitar precarga en hover
	enableHoverPreload?: boolean
	// Habilitar precarga por visibilidad
	enableVisibilityPreload?: boolean
}

export const useSmartPreloader = (options: SmartPreloaderOptions = {}) => {
	const {
		criticalRoutes = [],
		idleRoutes = [],
		heavyComponents = [],
		idleDelay = 2000,
		enableHoverPreload = true,
		enableVisibilityPreload = true
	} = options

	const router = useRouter()
	const idleTimerRef = useRef<NodeJS.Timeout>()
	const preloadedRef = useRef<Set<string>>(new Set())
	const isIdleRef = useRef(false)

	// Función para precargar una ruta
	const preloadRoute = useCallback((route: string) => {
		if (preloadedRef.current.has(route)) return
		
		try {
			router.prefetch(route)
			preloadedRef.current.add(route)
			logger.debug(`Precargando ruta: ${route}`, { route }, 'PRELOADER')
		} catch (error) {
			logger.warn(`Error precargando ruta ${route}`, error, 'PRELOADER')
		}
	}, [router])

	// Función para precargar componentes
	const preloadComponent = useCallback(async (componentLoader: () => Promise<any>) => {
		try {
			await componentLoader()
			logger.debug('Componente precargado exitosamente', {}, 'PRELOADER')
		} catch (error) {
			logger.warn('Error precargando componente', error, 'PRELOADER')
		}
	}, [])

	// Precargar rutas críticas inmediatamente
	useEffect(() => {
		if (criticalRoutes.length > 0) {
			criticalRoutes.forEach(route => {
				preloadRoute(route)
			})
		}
	}, [criticalRoutes, preloadRoute])

	// Detectar inactividad del usuario
	useEffect(() => {
		const resetIdleTimer = () => {
			isIdleRef.current = false
			if (idleTimerRef.current) {
				clearTimeout(idleTimerRef.current)
			}

			idleTimerRef.current = setTimeout(() => {
				isIdleRef.current = true
				// Precargar rutas cuando el usuario está inactivo
				idleRoutes.forEach(route => {
					preloadRoute(route)
				})
				// Precargar componentes pesados
				heavyComponents.forEach(component => {
					preloadComponent(component)
				})
			}, idleDelay)
		}

		const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
		events.forEach(event => {
			document.addEventListener(event, resetIdleTimer, { passive: true })
		})

		// Iniciar el timer
		resetIdleTimer()

		return () => {
			events.forEach(event => {
				document.removeEventListener(event, resetIdleTimer)
			})
			if (idleTimerRef.current) {
				clearTimeout(idleTimerRef.current)
			}
		}
	}, [idleRoutes, heavyComponents, idleDelay, preloadRoute, preloadComponent])

	// Hook para precargar en hover
	const useHoverPreload = useCallback((route: string) => {
		if (!enableHoverPreload) return {}

		return {
			onMouseEnter: () => {
				preloadRoute(route)
			}
		}
	}, [enableHoverPreload, preloadRoute])

	// Hook para precargar por visibilidad
	const useVisibilityPreload = useCallback((route: string) => {
		const elementRef = useRef<HTMLElement>(null)
		const preloadEnabled = enableVisibilityPreload

		useEffect(() => {
			if (!preloadEnabled || !elementRef.current) return

			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach(entry => {
						if (entry.isIntersecting) {
							preloadRoute(route)
							observer.unobserve(entry.target)
						}
					})
				},
				{ rootMargin: '100px' }
			)

			observer.observe(elementRef.current)

			return () => {
				observer.disconnect()
			}
		}, [route, preloadEnabled, preloadRoute])

		return elementRef
	}, [enableVisibilityPreload, preloadRoute])

	// Funciones para precargar manualmente
	const manualPreload = {
		route: preloadRoute,
		component: preloadComponent,
		multiple: useCallback((items: { routes?: string[]; components?: (() => Promise<any>)[] }) => {
			items.routes?.forEach(preloadRoute)
			items.components?.forEach(preloadComponent)
		}, [preloadRoute, preloadComponent])
	}

	// Estado del preloader
	const getPreloaderState = useCallback(() => ({
		isIdle: isIdleRef.current,
		preloadedRoutes: Array.from(preloadedRef.current),
		preloadedCount: preloadedRef.current.size
	}), [])

	return {
		useHoverPreload,
		useVisibilityPreload,
		manualPreload,
		getPreloaderState,
		isIdle: () => isIdleRef.current
	}
}

// Hook específico para el dashboard
export const useDashboardPreloader = () => {
	return useSmartPreloader({
		criticalRoutes: [
			'/dashboard/workouts',
			'/dashboard/exercises',
			'/dashboard/progress'
		],
		idleRoutes: [
			'/dashboard/calendar',
			'/dashboard/profile',
			'/dashboard/settings',
			'/dashboard/trainer'
		],
		heavyComponents: [
			() => import('@/components/analytics/advanced-analytics'),
			() => import('@/components/dashboard/progress-chart'),
			() => import('@/components/trainer/revenue-chart')
		],
		idleDelay: 1500,
		enableHoverPreload: true,
		enableVisibilityPreload: true
	})
}

// Hook específico para entrenadores
export const useTrainerPreloader = () => {
	return useSmartPreloader({
		criticalRoutes: [
			'/dashboard/trainer/clients',
			'/dashboard/trainer/workouts'
		],
		idleRoutes: [
			'/dashboard/trainer/calendar',
			'/dashboard/trainer/billing',
			'/dashboard/analytics'
		],
		heavyComponents: [
			() => import('@/components/trainer/clients-list'),
			() => import('@/components/trainer/revenue-chart'),
			() => import('@/components/analytics/advanced-analytics')
		],
		idleDelay: 2000
	})
}

export default useSmartPreloader