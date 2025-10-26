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