'use client'

import { Suspense, lazy, ComponentType, ReactNode } from 'react'
import { LoadingSpinner } from './lazy-loader'
import { ErrorBoundary } from 'react-error-boundary'

interface LazyRouteProps {
	importFn: () => Promise<{ default: ComponentType<any> }>
	loadingMessage?: string
	loadingSize?: 'sm' | 'md' | 'lg'
	errorFallback?: ComponentType<{ error: Error; resetErrorBoundary: () => void }>
	children?: ReactNode
	preload?: boolean
}

interface RouteErrorFallbackProps {
	error: Error
	resetErrorBoundary: () => void
}

const DefaultRouteErrorFallback = ({ error, resetErrorBoundary }: RouteErrorFallbackProps) => (
	<div className="min-h-screen flex items-center justify-center p-8">
		<div className="text-center max-w-md">
			<div className="rounded-lg bg-destructive/10 p-6 border border-destructive/20">
				<div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg className="w-8 h-8 text-destructive" fill="currentColor" viewBox="0 0 20 20">
						<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
					</svg>
				</div>
				<h2 className="text-xl font-semibold text-destructive mb-2">Error al cargar la página</h2>
				<p className="text-sm text-muted-foreground mb-4">
					Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.
				</p>
				<details className="text-left mb-4">
					<summary className="text-sm font-medium cursor-pointer hover:text-destructive transition-colors">
						Detalles del error
					</summary>
					<pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
						{error.message}
					</pre>
				</details>
				<div className="flex gap-2 justify-center">
					<button
						onClick={resetErrorBoundary}
						className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
					>
						Reintentar
					</button>
					<button
						onClick={() => window.location.href = '/dashboard'}
						className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors text-sm font-medium"
					>
						Ir al Dashboard
					</button>
				</div>
			</div>
		</div>
	</div>
)

const RouteLoadingFallback = ({ message, size }: { message?: string; size?: 'sm' | 'md' | 'lg' }) => (
	<div className="min-h-screen flex items-center justify-center">
		<LoadingSpinner 
			size={size || 'lg'} 
			message={message || 'Cargando página...'}
			className="p-8"
		/>
	</div>
)

export const LazyRoute = ({
	importFn,
	loadingMessage,
	loadingSize = 'lg',
	errorFallback: ErrorFallback = DefaultRouteErrorFallback,
	children,
	preload = false
}: LazyRouteProps) => {
	// Precargar el componente si se especifica
	if (preload && typeof window !== 'undefined') {
		importFn().catch(console.error)
	}

	const LazyComponent = lazy(importFn)

	return (
		<ErrorBoundary FallbackComponent={ErrorFallback}>
			<Suspense fallback={<RouteLoadingFallback message={loadingMessage} size={loadingSize} />}>
				<LazyComponent>{children}</LazyComponent>
			</Suspense>
		</ErrorBoundary>
	)
}

// Configuración de rutas lazy predefinidas
export const lazyRoutes = {
	// Dashboard routes
	dashboard: () => import('@/app/(dashboard)/dashboard/page'),
	workouts: () => import('@/app/(dashboard)/dashboard/workouts/page'),
	exercises: () => import('@/app/(dashboard)/dashboard/exercises/page'),
	progress: () => import('@/app/(dashboard)/dashboard/progress/page'),
	calendar: () => import('@/app/(dashboard)/dashboard/calendar/page'),
	profile: () => import('@/app/(dashboard)/dashboard/profile/page'),
	settings: () => import('@/app/(dashboard)/dashboard/settings/page'),
	
	// Trainer routes
	trainerDashboard: () => import('@/app/(dashboard)/dashboard/trainer/page'),
	trainerClients: () => import('@/app/(dashboard)/dashboard/trainer/clients/page'),
	trainerWorkouts: () => import('@/app/(dashboard)/dashboard/trainer/workouts/page'),
	trainerCalendar: () => import('@/app/(dashboard)/dashboard/trainer/calendar/page'),
	trainerBilling: () => import('@/app/(dashboard)/dashboard/trainer/billing/page'),
	
	// Analytics routes
	analytics: () => import('@/components/analytics/advanced-analytics'),
	
	// Heavy components (commented until components are created)
	// workoutBuilder: () => import('@/components/workouts/workout-builder'),
	// progressCharts: () => import('@/components/progress/progress-charts'),
	// exerciseLibrary: () => import('@/components/exercises/exercise-library')
}

// Hook para precargar rutas
export const useRoutePreloader = () => {
	const preloadRoute = (routeKey: keyof typeof lazyRoutes) => {
		if (typeof window !== 'undefined') {
			lazyRoutes[routeKey]().catch(console.error)
		}
	}

	const preloadRoutes = (routeKeys: (keyof typeof lazyRoutes)[]) => {
		if (typeof window !== 'undefined') {
			routeKeys.forEach(key => {
				lazyRoutes[key]().catch(console.error)
			})
		}
	}

	// Precargar rutas críticas después de la carga inicial
	const preloadCriticalRoutes = () => {
		if (typeof window !== 'undefined') {
			// Usar requestIdleCallback para no bloquear la UI
			const preload = () => {
				preloadRoutes(['workouts', 'exercises', 'progress'])
			}

			if ('requestIdleCallback' in window) {
				window.requestIdleCallback(preload)
			} else {
				setTimeout(preload, 2000)
			}
		}
	}

	return { preloadRoute, preloadRoutes, preloadCriticalRoutes }
}

// Componente para rutas específicas con configuración predefinida
export const DashboardRoute = ({ children }: { children?: ReactNode }) => (
	<LazyRoute 
		importFn={lazyRoutes.dashboard}
		loadingMessage="Cargando dashboard..."
		preload
	>
		{children}
	</LazyRoute>
)

export const WorkoutsRoute = ({ children }: { children?: ReactNode }) => (
	<LazyRoute 
		importFn={lazyRoutes.workouts}
		loadingMessage="Cargando rutinas..."
	>
		{children}
	</LazyRoute>
)

export const AnalyticsRoute = ({ children }: { children?: ReactNode }) => (
	<LazyRoute 
		importFn={lazyRoutes.analytics}
		loadingMessage="Cargando analytics..."
		loadingSize="md"
	>
		{children}
	</LazyRoute>
)

export default LazyRoute