'use client';

// Run Sentry client initialization only on the client
// Keep as a side-effect import to avoid SSR/webpack mismatches
import '../../../sentry.client.config';

export function SentryClientInit() {
  return null;
}