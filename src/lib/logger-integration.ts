/**
 * Logger Integration
 * Integra el logger existente con Pino y Sentry de manera transparente
 * Permite migración gradual del sistema de logging
 */

import { logger as existingLogger } from './logger'
import { 
	logger as pinoLogger, 
	logError as pinoLogError, 
	logWarning as pinoLogWarning, 
	logInfo as pinoLogInfo, 
	logDebug as pinoLogDebug 
} from './logger-pino'

// Configuración para determinar qué logger usar
const USE_PINO = process.env.USE_PINO_LOGGER === 'true' || process.env.NODE_ENV === 'production'

// Logger unificado que puede usar cualquiera de los dos sistemas
class UnifiedLogger {
	private activeLogger: typeof existingLogger | typeof pinoLogger

	constructor() {
		this.activeLogger = USE_PINO ? pinoLogger : existingLogger
	}

	// Métodos principales de logging
	error(message: string, error?: any, context?: string) {
		if (USE_PINO) {
			pinoLogger.error(message, error, context)
		} else {
			existingLogger.error(message, error, context)
		}
	}

	warn(message: string, data?: any, context?: string) {
		if (USE_PINO) {
			pinoLogger.warn(message, data, context)
		} else {
			existingLogger.warn(message, data, context)
		}
	}

	info(message: string, data?: any, context?: string) {
		if (USE_PINO) {
			pinoLogger.info(message, data, context)
		} else {
			existingLogger.info(message, data, context)
		}
	}

	debug(message: string, data?: any, context?: string) {
		if (USE_PINO) {
			pinoLogger.debug(message, data, context)
		} else {
			existingLogger.debug(message, data, context)
		}
	}

	// Métodos especializados
	security(message: string, data?: any) {
		if (USE_PINO) {
			pinoLogger.security(message, data)
		} else {
			existingLogger.security(message, data)
		}
	}

	performance(message: string, data?: any) {
		if (USE_PINO) {
			pinoLogger.performance(message, data)
		} else {
			existingLogger.performance(message, data)
		}
	}

	api(message: string, data?: any, endpoint?: string) {
		if (USE_PINO) {
			pinoLogger.api(message, data, endpoint)
		} else {
			existingLogger.api(message, data, endpoint)
		}
	}

	db(message: string, data?: any) {
		if (USE_PINO) {
			pinoLogger.db(message, data)
		} else {
			existingLogger.db(message, data)
		}
	}

	auth(message: string, data?: any) {
		if (USE_PINO) {
			pinoLogger.auth(message, data)
		} else {
			existingLogger.auth(message, data)
		}
	}

	// Método para obtener el logger activo (para casos especiales)
	getActiveLogger() {
		return this.activeLogger
	}

	// Método para verificar qué logger está activo
	isUsingPino() {
		return USE_PINO
	}

	// Método para crear child loggers (solo disponible con Pino)
	child(bindings: Record<string, any>) {
		if (USE_PINO && 'child' in pinoLogger) {
			return pinoLogger.child(bindings)
		}
		// Fallback: retornar el mismo logger
		return this
	}

	// Método para logging de requests HTTP (solo disponible con Pino)
	request(req: any, res: any, responseTime?: number) {
		if (USE_PINO && 'request' in pinoLogger) {
			pinoLogger.request(req, res, responseTime)
		} else {
			// Fallback con el logger existente
			const statusCode = res.statusCode || 200
			const method = req.method || 'GET'
			const url = req.url || '/'
			const message = `HTTP ${statusCode} - ${method} ${url}`
			
			if (statusCode >= 400) {
				this.error(message, { method, url, statusCode, responseTime })
			} else {
				this.info(message, { method, url, statusCode, responseTime })
			}
		}
	}
}

// Instancia principal del logger unificado
export const logger = new UnifiedLogger()

// Funciones de conveniencia que mantienen compatibilidad
export const logError = (message: string, error?: any, context?: string) => 
	logger.error(message, error, context)

export const logWarning = (message: string, data?: any, context?: string) => 
	logger.warn(message, data, context)

export const logInfo = (message: string, data?: any, context?: string) => 
	logger.info(message, data, context)

export const logDebug = (message: string, data?: any, context?: string) => 
	logger.debug(message, data, context)

// Funciones específicas para diferentes contextos
export const logApiRequest = (req: any, res: any, responseTime?: number) => 
	logger.request(req, res, responseTime)

export const logSecurityEvent = (message: string, data?: any) => 
	logger.security(message, data)

export const logPerformanceMetric = (message: string, data?: any) => 
	logger.performance(message, data)

export const logDatabaseOperation = (message: string, data?: any) => 
	logger.db(message, data)

export const logAuthEvent = (message: string, data?: any) => 
	logger.auth(message, data)

// Función helper para logging estructurado
export const logWithContext = (level: 'error' | 'warn' | 'info' | 'debug', message: string, data?: any, context?: string) => {
	switch (level) {
		case 'error':
			logger.error(message, data, context)
			break
		case 'warn':
			logger.warn(message, data, context)
			break
		case 'info':
			logger.info(message, data, context)
			break
		case 'debug':
			logger.debug(message, data, context)
			break
	}
}

// Middleware para Express/Next.js API routes
export const loggingMiddleware = (req: any, res: any, next: any) => {
	const start = Date.now()
	
	// Log de la request entrante
	logger.info(`Incoming ${req.method} ${req.url}`, {
		method: req.method,
		url: req.url,
		userAgent: req.headers['user-agent'],
		ip: req.ip || req.connection?.remoteAddress
	}, 'HTTP')

	// Interceptar el final de la response
	const originalSend = res.send
	res.send = function(data: any) {
		const responseTime = Date.now() - start
		logger.request(req, res, responseTime)
		return originalSend.call(this, data)
	}

	if (next) next()
}

// Función para configurar el logger en runtime
export const configureLogger = (options: {
	usePino?: boolean
	logLevel?: string
	environment?: string
}) => {
	if (options.usePino !== undefined) {
		process.env.USE_PINO_LOGGER = options.usePino.toString()
	}
	if (options.logLevel) {
		process.env.LOG_LEVEL = options.logLevel
	}
	// Note: NODE_ENV is read-only, so we don't modify it here
	
	logger.info('Logger configuration updated', options, 'LoggerIntegration')
}

// Exportar también los loggers individuales para casos específicos
export { existingLogger, pinoLogger }
export { USE_PINO }

// Tipos para TypeScript
export interface LoggerConfig {
	usePino?: boolean
	logLevel?: 'error' | 'warn' | 'info' | 'debug'
	environment?: 'development' | 'production' | 'test'
}

export interface RequestLogData {
	method: string
	url: string
	statusCode: number
	responseTime?: number
	userAgent?: string
	ip?: string
}