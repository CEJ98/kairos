import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  beforeSend(event) {
    // Redact potentially sensitive fields
    if (event.user) delete event.user;
    if (event.request) {
      delete (event.request as any).headers;
      delete (event.request as any).cookies;
      delete (event.request as any).data;
    }
    if (event.extra) {
      for (const k of Object.keys(event.extra)) {
        if (/password|token|secret|key|email|cookie/i.test(k)) delete (event.extra as any)[k];
      }
    }
    return event;
  }
});