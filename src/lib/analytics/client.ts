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
    if (typeof window !== 'undefined') {
      type Umami = { track: (event: string) => void };
      const w = window as Window & { umami?: Umami };
      if (w.umami && typeof w.umami.track === 'function') {
        w.umami.track(event);
        return;
      }
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