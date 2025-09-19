'use client'

/**
 * Error Boundary Component
 * Captura errores de React y los maneja de forma elegante
 * Integrado con Sentry y sistema de logging
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import * as Sentry from '@sentry/react'
import { logger } from '@/lib/logger-pino'

interface Props {
	children: ReactNode
	fallback?: ReactNode
	onError?: (error: Error, errorInfo: ErrorInfo) => void
	showDetails?: boolean
}

interface State {
	hasError: boolean
	error?: Error
	errorInfo?: ErrorInfo
}

class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props)
		this.state = { hasError: false }
	}

	static getDerivedStateFromError(error: Error): State {
		// Actualiza el state para mostrar la UI de error
		return {
			hasError: true,
			error
		}
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		// Log del error con contexto completo
		logger.error(
			'React Error Boundary caught an error',
			{
				error: {
					name: error.name,
					message: error.message,
					stack: error.stack
				},
				errorInfo: {
					componentStack: errorInfo.componentStack
				},
				userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
				url: typeof window !== 'undefined' ? window.location.href : 'SSR',
				timestamp: new Date().toISOString()
			},
			'ErrorBoundary'
		)

		// Enviar a Sentry con contexto adicional
		Sentry.withScope((scope) => {
			scope.setTag('errorBoundary', true)
			scope.setContext('errorInfo', {
				componentStack: errorInfo.componentStack
			})
			scope.setLevel('error')
			Sentry.captureException(error)
		})

		// Actualizar state con información del error
		this.setState({
			error,
			errorInfo
		})

		// Callback personalizado si se proporciona
		if (this.props.onError) {
			this.props.onError(error, errorInfo)
		}
	}

	handleRetry = () => {
		this.setState({ hasError: false, error: undefined, errorInfo: undefined })
		logger.info('User attempted to recover from error boundary', {}, 'ErrorBoundary')
	}

	handleReload = () => {
		logger.info('User reloaded page from error boundary', {}, 'ErrorBoundary')
		if (typeof window !== 'undefined') {
			window.location.reload()
		}
	}

	render() {
		if (this.state.hasError) {
			// Si se proporciona un fallback personalizado, usarlo
			if (this.props.fallback) {
				return this.props.fallback
			}

			// UI de error por defecto
			return (
				<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
					<div className="max-w-md w-full space-y-8">
						<div className="text-center">
							<div className="mx-auto h-12 w-12 text-red-500">
								<svg
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
									/>
								</svg>
							</div>
							<h2 className="mt-6 text-3xl font-extrabold text-gray-900">
								Algo salió mal
							</h2>
							<p className="mt-2 text-sm text-gray-600">
								Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
							</p>
							{this.props.showDetails && this.state.error && (
								<details className="mt-4 text-left">
									<summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
										Mostrar detalles técnicos
									</summary>
									<pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto max-h-32">
										{this.state.error.message}
										{this.state.error.stack && (
											<>
												<br /><br />
												{this.state.error.stack}
											</>
										)}
									</pre>
								</details>
							)}
						</div>

						<div className="space-y-3">
							<button
								onClick={this.handleRetry}
								className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
							>
								Intentar de nuevo
							</button>

							<button
								onClick={this.handleReload}
								className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
							>
								Recargar página
							</button>
						</div>

						<div className="text-center">
							<p className="text-xs text-gray-400">
								Si el problema persiste, contacta al soporte técnico.
							</p>
						</div>
					</div>
				</div>
			)
		}

		return this.props.children
	}
}

// HOC para envolver componentes fácilmente
export const withErrorBoundary = <P extends object>(
	WrappedComponent: React.ComponentType<P>,
	errorBoundaryProps?: Omit<Props, 'children'>
) => {
	const WrappedWithErrorBoundary = React.forwardRef<any, P>((props, ref) => (
		<ErrorBoundary {...errorBoundaryProps}>
			<WrappedComponent {...(props as P)} ref={ref} />
		</ErrorBoundary>
	))
	
	WrappedWithErrorBoundary.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`
	
	return WrappedWithErrorBoundary
}

// Hook para reportar errores manualmente
export const useErrorHandler = () => {
	return React.useCallback((error: Error, errorInfo?: { [key: string]: any }) => {
		logger.error(
			'Manual error report',
			{
				error: {
					name: error.name,
					message: error.message,
					stack: error.stack
				},
				additionalInfo: errorInfo,
				url: typeof window !== 'undefined' ? window.location.href : 'SSR'
			},
			'useErrorHandler'
		)

		Sentry.withScope((scope) => {
			scope.setTag('manualReport', true)
			if (errorInfo) {
				scope.setContext('additionalInfo', errorInfo)
			}
			Sentry.captureException(error)
		})
	}, [])
}

export default ErrorBoundary