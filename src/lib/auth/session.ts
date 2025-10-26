import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import type { Session } from 'next-auth';

type ExtendedSession = Session & {
  user?: Session['user'] & { id: string };
};

export function authSession(): Promise<ExtendedSession | null> {
  return getServerSession(authOptions) as Promise<ExtendedSession | null>;
}
