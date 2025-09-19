/**
 * Pino Logger Configuration
 * Sistema de logging avanzado con Pino para desarrollo y producción
 */

import pino from 'pino'
import * as Sentry from '@sentry/nextjs'

// Configuración de transporte para desarrollo
const developmentTransport = {
	target: 'pino-pretty',
	options: {
		colorize: true,
		translateTime: 'SYS:standard',
		ignore: 'pid,hostname'
	}
}

// Configuración de transporte para producción
const productionTransport = {
	target: 'pino/file',
	options: {
		destination: process.env.LOG_FILE || '/tmp/app.log'
	}
}

// Configuración base del logger
const pinoConfig = {
	level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
	base: {
		env: process.env.NODE_ENV,
		version: process.env.npm_package_version || '1.0.0'
	},
	timestamp: pino.stdTimeFunctions.isoTime,
	redact: {
		paths: [
			'password',
			'token',
			'authorization',
			'cookie',
			'*.password',
			'*.token',
			'*.authorization'
		],
		censor: '[REDACTED]'
	},
	transport: process.env.NODE_ENV === 'development' ? developmentTransport : productionTransport
}

// Crear instancia del logger
const pinoLogger = pino(pinoConfig)

// Wrapper para integración con Sentry
class PinoSentryLogger {
	private logger: pino.Logger

	constructor(logger: pino.Logger) {
		this.logger = logger
	}

	// Métodos de logging con integración a Sentry
	error(message: string, error?: any, context?: string) {
		const logData = {
			message,
			error: error instanceof Error ? {
				name: error.name,
				message: error.message,
				stack: error.stack
			} : error,
			context
		}

		this.logger.error(logData, message)

		// Enviar a Sentry en producción
		if (process.env.NODE_ENV === 'production') {
			if (error instanceof Error) {
				Sentry.captureException(error, {
					tags: { context },
					extra: { message }
				})
			} else {
				Sentry.captureMessage(message, 'error')
			}
		}
	}

	warn(message: string, data?: any, context?: string) {
		const logData = { message, data, context }
		this.logger.warn(logData, message)

		// Enviar warnings críticos a Sentry
		if (process.env.NODE_ENV === 'production' && context === 'critical') {
			Sentry.captureMessage(message, 'warning')
		}
	}

	info(message: string, data?: any, context?: string) {
		const logData = { message, data, context }
		this.logger.info(logData, message)
	}

	debug(message: string, data?: any, context?: string) {
		const logData = { message, data, context }
		this.logger.debug(logData, message)
	}

	// Métodos especializados
	security(message: string, data?: any) {
		const logData = { message, data, type: 'security' }
		this.logger.warn(logData, `[SECURITY] ${message}`)

		// Siempre enviar eventos de seguridad a Sentry
		Sentry.captureMessage(`[SECURITY] ${message}`, 'warning')
	}

	performance(message: string, data?: any) {
		const logData = { message, data, type: 'performance' }
		this.logger.info(logData, `[PERFORMANCE] ${message}`)
	}

	api(message: string, data?: any, endpoint?: string) {
		const logData = { message, data, endpoint, type: 'api' }
		this.logger.info(logData, `[API] ${message}`)
	}

	db(message: string, data?: any) {
		const logData = { message, data, type: 'database' }
		this.logger.info(logData, `[DB] ${message}`)
	}

	auth(message: string, data?: any) {
		const logData = { message, data, type: 'auth' }
		this.logger.info(logData, `[AUTH] ${message}`)
	}

	// Método para logging de requests HTTP
	request(req: any, res: any, responseTime?: number) {
		const logData = {
			method: req.method,
			url: req.url,
			userAgent: req.headers['user-agent'],
			ip: req.ip || req.connection.remoteAddress,
			statusCode: res.statusCode,
			responseTime: responseTime ? `${responseTime}ms` : undefined
		}

		if (res.statusCode >= 400) {
			this.logger.error(logData, `HTTP ${res.statusCode} - ${req.method} ${req.url}`)
		} else {
			this.logger.info(logData, `HTTP ${res.statusCode} - ${req.method} ${req.url}`)
		}
	}

	// Método para crear child loggers con contexto
	child(bindings: Record<string, any>) {
		return new PinoSentryLogger(this.logger.child(bindings))
	}
}

// Instancia principal del logger
export const logger = new PinoSentryLogger(pinoLogger)

// Funciones de conveniencia para compatibilidad
export const logError = (message: string, error?: any, context?: string) => 
	logger.error(message, error, context)

export const logWarning = (message: string, data?: any, context?: string) => 
	logger.warn(message, data, context)

export const logInfo = (message: string, data?: any, context?: string) => 
	logger.info(message, data, context)

export const logDebug = (message: string, data?: any, context?: string) => 
	logger.debug(message, data, context)

// Exportar también la instancia de Pino para casos avanzados
export { pinoLogger }

// Tipos para TypeScript
export interface LogContext {
	userId?: string
	sessionId?: string
	requestId?: string
	module?: string
	action?: string
}

export interface ErrorLogData {
	error: Error
	context?: LogContext
	additionalData?: Record<string, any>
}

// Función helper para logging estructurado de errores
export const logStructuredError = (data: ErrorLogData) => {
	logger.error(
		`${data.error.name}: ${data.error.message}`,
		{
			stack: data.error.stack,
			...data.additionalData
		},
		data.context?.module
	)
}