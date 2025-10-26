import 'server-only';
import { headers } from 'next/headers';
import { createHash } from 'crypto';

export function getClientIp(): string | null {
  try {
    const h = headers();
    const xfwd = h.get('x-forwarded-for');
    if (xfwd) {
      const ip = xfwd.split(',')[0].trim();
      return ip || null;
    }
    const real = h.get('x-real-ip');
    if (real) return real;
    const cf = h.get('cf-connecting-ip');
    if (cf) return cf;
    return null;
  } catch {
    return null;
  }
}

export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.IP_HASH_SALT || process.env.NEXT_PUBLIC_IP_HASH_SALT || 'change-me-salt';
  const hash = createHash('sha256');
  hash.update(`${ip}:${salt}`);
  return hash.digest('hex');
}