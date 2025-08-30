/**
 * Production-ready logging utility
 * Replaces console statements with proper logging levels and conditional output
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: any
  context?: string
}

class Logger {
  private level: LogLevel
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN
  }

  private log(level: LogLevel, message: string, data?: any, context?: string) {
    if (level > this.level) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      context
    }

    // In development, use console for immediate feedback
    if (this.isDevelopment) {
      switch (level) {
        case LogLevel.ERROR:
          console.error(`[ERROR] ${context ? `[${context}] ` : ''}${message}`, data || '')
          break
        case LogLevel.WARN:
          console.warn(`[WARN] ${context ? `[${context}] ` : ''}${message}`, data || '')
          break
        case LogLevel.INFO:
          console.info(`[INFO] ${context ? `[${context}] ` : ''}${message}`, data || '')
          break
        case LogLevel.DEBUG:
          console.log(`[DEBUG] ${context ? `[${context}] ` : ''}${message}`, data || '')
          break
      }
    } else {
      // In production, only log errors and warnings to console
      // Info and debug should go to proper logging service
      if (level <= LogLevel.WARN) {
        const logMessage = `[${LogLevel[level]}] ${context ? `[${context}] ` : ''}${message}`
        if (level === LogLevel.ERROR) {
          console.error(logMessage, data || '')
        } else {
          console.warn(logMessage, data || '')
        }
      }
    }

    // TODO: In production, send to proper logging service (e.g., Sentry, LogRocket, etc.)
    // this.sendToLoggingService(entry)
  }

  error(message: string, data?: any, context?: string) {
    this.log(LogLevel.ERROR, message, data, context)
  }

  warn(message: string, data?: any, context?: string) {
    this.log(LogLevel.WARN, message, data, context)
  }

  info(message: string, data?: any, context?: string) {
    this.log(LogLevel.INFO, message, data, context)
  }

  debug(message: string, data?: any, context?: string) {
    this.log(LogLevel.DEBUG, message, data, context)
  }

  // Specialized methods for common use cases
  security(message: string, data?: any) {
    this.error(message, data, 'SECURITY')
  }

  performance(message: string, data?: any) {
    this.warn(message, data, 'PERFORMANCE')
  }

  api(message: string, data?: any, endpoint?: string) {
    this.error(message, data, endpoint ? `API:${endpoint}` : 'API')
  }

  db(message: string, data?: any) {
    this.warn(message, data, 'DATABASE')
  }

  auth(message: string, data?: any) {
    this.error(message, data, 'AUTH')
  }
}

// Export singleton instance
export const logger = new Logger()

// Convenience exports for common patterns
export const logError = (message: string, error?: any, context?: string) => 
  logger.error(message, error, context)

export const logWarning = (message: string, data?: any, context?: string) => 
  logger.warn(message, data, context)

export const logInfo = (message: string, data?: any, context?: string) => 
  logger.info(message, data, context)

export const logDebug = (message: string, data?: any, context?: string) => 
  logger.debug(message, data, context)