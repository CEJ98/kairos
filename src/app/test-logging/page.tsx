'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
	AlertTriangle, 
	Info, 
	CheckCircle, 
	XCircle,
	Bug,
	Zap
} from 'lucide-react'
import { UnifiedLogger } from '@/lib/logger-integration'

// Instancia del logger unificado
const unifiedLogger = new UnifiedLogger()
import { useErrorHandler } from '@/components/ErrorBoundary'

/**
 * Página de prueba para el sistema de logging y manejo de errores
 * Demuestra la integración de Pino, Sentry y ErrorBoundary
 */
export default function TestLoggingPage() {
	const [logs, setLogs] = useState<string[]>([])
	const errorHandler = useErrorHandler()

	const addLog = (message: string) => {
		setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`])
	}

	const testInfo = () => {
		unifiedLogger.info('Test info message', { 
			user: 'test-user',
			action: 'button-click',
			page: 'test-logging'
		})
		addLog('✅ Info log enviado')
	}

	const testWarning = () => {
		unifiedLogger.warn('Test warning message', {
			warningType: 'performance',
			loadTime: 2500,
			threshold: 2000
		})
		addLog('⚠️ Warning log enviado')
	}

	const testError = () => {
		unifiedLogger.error('Test error message', {
			errorType: 'validation',
			field: 'email',
			value: 'invalid-email'
		})
		addLog('❌ Error log enviado')
	}

	const testDebug = () => {
		unifiedLogger.debug('Test debug message', {
			debugInfo: {
				component: 'TestLoggingPage',
				state: { logsCount: logs.length },
				props: { testMode: true }
			}
		})
		addLog('🐛 Debug log enviado')
	}

	const testReactError = () => {
		try {
			// Simular un error de React
			throw new Error('Simulated React component error')
		} catch (error) {
			errorHandler(error as Error, {
				component: 'TestLoggingPage',
				action: 'testReactError',
				userAgent: navigator.userAgent
			})
			addLog('💥 Error de React reportado manualmente')
		}
	}

	const TestErrorComponent = () => {
		throw new Error('Error boundary test - this component always throws')
	}

	const [showErrorComponent, setShowErrorComponent] = useState(false)

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="max-w-4xl mx-auto space-y-6">
				{/* Header */}
				<div className="text-center">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Sistema de Logging y Error Handling
					</h1>
					<p className="text-gray-600">
						Prueba la integración de Pino, Sentry y ErrorBoundary
					</p>
				</div>

				{/* Test Controls */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Zap className="h-5 w-5" />
							Controles de Prueba
						</CardTitle>
						<CardDescription>
							Prueba diferentes tipos de logs y manejo de errores
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
							<Button 
								onClick={testInfo}
								variant="outline"
								className="flex items-center gap-2"
							>
								<Info className="h-4 w-4" />
								Info Log
							</Button>

							<Button 
								onClick={testWarning}
								variant="outline"
								className="flex items-center gap-2"
							>
								<AlertTriangle className="h-4 w-4" />
								Warning Log
							</Button>

							<Button 
								onClick={testError}
								variant="outline"
								className="flex items-center gap-2"
							>
								<XCircle className="h-4 w-4" />
								Error Log
							</Button>

							<Button 
								onClick={testDebug}
								variant="outline"
								className="flex items-center gap-2"
							>
								<Bug className="h-4 w-4" />
								Debug Log
							</Button>

							<Button 
								onClick={testReactError}
								variant="destructive"
								className="flex items-center gap-2"
							>
								<AlertTriangle className="h-4 w-4" />
								Error Manual
							</Button>

							<Button 
								onClick={() => setShowErrorComponent(true)}
								variant="destructive"
								className="flex items-center gap-2"
							>
								<XCircle className="h-4 w-4" />
								Error Boundary
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Error Component Test */}
				{showErrorComponent && <TestErrorComponent />}

				{/* Log Output */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<CheckCircle className="h-5 w-5" />
							Registro de Actividad
						</CardTitle>
						<CardDescription>
							Últimos logs enviados (también visibles en consola del navegador)
						</CardDescription>
					</CardHeader>
					<CardContent>
						{logs.length === 0 ? (
							<p className="text-gray-500 text-center py-4">
								No hay logs aún. Haz clic en los botones de arriba para generar logs.
							</p>
						) : (
							<div className="space-y-2">
								{logs.map((log, index) => (
									<div 
										key={index}
										className="p-2 bg-gray-50 rounded text-sm font-mono"
									>
										{log}
									</div>
								))}
							</div>
						)}
						
						{logs.length > 0 && (
							<Button 
								onClick={() => setLogs([])}
								variant="outline"
								size="sm"
								className="mt-4"
							>
								Limpiar logs
							</Button>
						)}
					</CardContent>
				</Card>

				{/* Information */}
				<Alert>
					<Info className="h-4 w-4" />
					<AlertDescription>
						<strong>Información:</strong> Los logs se envían tanto a la consola del navegador (Pino) 
						como a Sentry para monitoreo. Abre las herramientas de desarrollador para ver 
						los logs detallados con formato JSON.
					</AlertDescription>
				</Alert>

				{/* Status */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-gray-600">Pino Logger</p>
									<p className="text-2xl font-bold text-green-600">✓ Activo</p>
								</div>
								<CheckCircle className="h-8 w-8 text-green-600" />
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-gray-600">Sentry</p>
									<p className="text-2xl font-bold text-green-600">✓ Activo</p>
								</div>
								<CheckCircle className="h-8 w-8 text-green-600" />
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-gray-600">Error Boundary</p>
									<p className="text-2xl font-bold text-green-600">✓ Activo</p>
								</div>
								<CheckCircle className="h-8 w-8 text-green-600" />
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}