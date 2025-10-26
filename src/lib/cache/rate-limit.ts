import { Ratelimit } from '@upstash/ratelimit';
import { getRedisClient } from '@/lib/clients/redis';

let ipLimiter: Ratelimit;
let authLimiter: Ratelimit;
let actionLimiter: Ratelimit;

try {
  const redis = getRedisClient();
  ipLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '10 m'),
    analytics: true
  });

  authLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    analytics: true
  });

  actionLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '10 m'),
    analytics: true
  });
} catch {
  const noop = {
    limit: async () => ({ success: true, remaining: 999, reset: 0 })
  } as unknown as Ratelimit;
  ipLimiter = noop;
  authLimiter = noop;
  actionLimiter = noop;
}

export { ipLimiter, authLimiter, actionLimiter };
