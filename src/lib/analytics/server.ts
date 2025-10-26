import 'server-only';

const POSTHOG_KEY = process.env.POSTHOG_KEY;
const POSTHOG_HOST = process.env.POSTHOG_HOST ?? 'https://us.posthog.com';

export async function trackServer(event: string, props?: Record<string, unknown>) {
  try {
    if (!POSTHOG_KEY) return;
    const safeProps = {
      source: 'server',
      ...(props && typeof props === 'object' ? props : {})
    };
    await fetch(`${POSTHOG_HOST}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        distinct_id: 'anonymous-server',
        event,
        properties: safeProps
      })
    });
  } catch {
    // noop
  }
}