/**
 * Client-side logging utility
 * For use in 'use client' components only
 */

export const clientLogger = {
  info: (message: string, data?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[INFO] ${message}`, data);
    }
  },

  error: (message: string, error?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error(`[ERROR] ${message}`, error);
    }
    // In production, you might want to send to error tracking service
    // e.g., Sentry.captureException(error);
  },

  warn: (message: string, data?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(`[WARN] ${message}`, data);
    }
  },

  debug: (message: string, data?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(`[DEBUG] ${message}`, data);
    }
  }
};