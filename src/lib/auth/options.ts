import type { Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/clients/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { z } from 'zod';

// Ensure predictable URL in dev and tests when env is missing
if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = 'http://127.0.0.1:3000';
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET ?? 'dev-secret',
  session: {
    strategy: 'jwt' as const
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Correo', type: 'email' },
        password: { label: 'Contraseña', type: 'password' }
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) {
          return null;
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ''
    })
  ],
  pages: {
    signIn: '/login'
  },
  callbacks: {
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.sub) {
        session.user = {
          ...session.user,
          id: token.sub
        } as typeof session.user & { id: string };
      }
      return session;
    }
  }
};
