import 'server-only';

export function logRequest(event: string, requestId: string, data?: Record<string, unknown>) {
  try {
    const payload = {
      ts: new Date().toISOString(),
      level: 'info',
      event,
      requestId,
      ...data
    };
    // Structured JSON log; avoid PII
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(payload));
  } catch {
    // noop
  }
}

export const logger = {
  info: (message: string, data?: Record<string, unknown>) => {
    try {
      const payload = {
        ts: new Date().toISOString(),
        level: 'info',
        message,
        ...data
      };
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(payload));
    } catch {
      // noop
    }
  },

  error: (message: string, error?: unknown) => {
    try {
      const payload = {
        ts: new Date().toISOString(),
        level: 'error',
        message,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      };
      // eslint-disable-next-line no-console
      console.error(JSON.stringify(payload));
    } catch {
      // noop
    }
  },

  warn: (message: string, data?: Record<string, unknown>) => {
    try {
      const payload = {
        ts: new Date().toISOString(),
        level: 'warn',
        message,
        ...data
      };
      // eslint-disable-next-line no-console
      console.warn(JSON.stringify(payload));
    } catch {
      // noop
    }
  },

  debug: (message: string, data?: Record<string, unknown>) => {
    try {
      const payload = {
        ts: new Date().toISOString(),
        level: 'debug',
        message,
        ...data
      };
      // eslint-disable-next-line no-console
      console.debug(JSON.stringify(payload));
    } catch {
      // noop
    }
  }
};