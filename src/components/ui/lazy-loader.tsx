'use client'

import { Suspense, lazy, ComponentType } from 'react'
import { Loader2 } from 'lucide-react'

// Componente de loading personalizable
interface LoadingSpinnerProps {
	size?: 'sm' | 'md' | 'lg'
	message?: string
	className?: string
}

const LoadingSpinner = ({ size = 'md', message, className = '' }: LoadingSpinnerProps) => {
	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-8 w-8',
		lg: 'h-12 w-12'
	}

	return (
		<div className={`flex flex-col items-center justify-center p-8 ${className}`}>
			<Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
			{message && (
				<p className="mt-2 text-sm text-muted-foreground">{message}</p>
			)}
		</div>
	)
}

// HOC para lazy loading con error boundary
interface LazyWrapperProps {
	loadingMessage?: string
	loadingSize?: 'sm' | 'md' | 'lg'
	errorFallback?: ComponentType<{ error: Error; retry: () => void }>
}

const DefaultErrorFallback = ({ error, retry }: { error: Error; retry: () => void }) => (
	<div className="flex flex-col items-center justify-center p-8 text-center">
		<div className="rounded-lg bg-destructive/10 p-4">
			<h3 className="font-semibold text-destructive">Error al cargar el componente</h3>
			<p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
			<button
				onClick={retry}
				className="mt-3 rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90"
			>
				Reintentar
			</button>
		</div>
	</div>
)

// Función simplificada para lazy loading sin imports dinámicos variables
export function withLazyLoading<T = any>(
	Component: ComponentType<T>,
	options: LazyWrapperProps = {}
) {
	const {
		loadingMessage = 'Cargando...',
		loadingSize = 'md',
		errorFallback: ErrorFallback = DefaultErrorFallback
	} = options

	return function LazyWrapper(props: T) {
		return (
			<Suspense
				fallback={
					<LoadingSpinner
						size={loadingSize}
						message={loadingMessage}
					/>
				}
			>
				<Component {...(props as any)} />
			</Suspense>
		)
	}
}

// Ejemplo de uso para componentes lazy
// export const LazyWorkoutBuilder = withLazyLoading(
//   () => import('@/components/workouts/workout-builder'),
//   { loadingMessage: 'Cargando constructor de rutinas...', loadingSize: 'lg' }
// )

// Función helper removida para evitar warnings de dependencia crítica
// Para crear componentes lazy, usar directamente withLazyLoading con imports estáticos

// Hook para precargar componentes removido para evitar warnings de dependencia crítica
// Para precargar componentes, usar directamente el import en el useEffect del componente

export { LoadingSpinner }