'use client';

import posthog from 'posthog-js';

let initialized = false;

function initPosthog() {
  if (initialized) return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? process.env.POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? process.env.POSTHOG_HOST ?? 'https://us.posthog.com';
  if (key) {
    try {
      posthog.init(key, {
        api_host: host,
        capture_pageview: false,
        disable_session_recording: true,
        autocapture: false
      });
      initialized = true;
    } catch {
      // noop
    }
  }
}

export function trackClient(event: string) {
  try {
    // Prefer Umami if available, otherwise use PostHog
    if (typeof window !== 'undefined' && (window as any).umami && typeof (window as any).umami.track === 'function') {
      (window as any).umami.track(event);
      return;
    }
    initPosthog();
    if (initialized) {
      // Do not attach properties to avoid PII; only event names
      posthog.capture(event);
    }
  } catch {
    // noop
  }
}