import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  pages: {
    signIn: '/es/signin',
    error: '/auth/error',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Import dinámico para facilitar mocking en tests
        const { prisma } = await import('@/lib/db')
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            trainerProfile: true,
            clientProfiles: true,
          },
        })

        if (!user) {
          return null
        }

        // Verificar que el usuario tenga password configurado
        if (!user.password) {
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || '',
          image: user.avatar || '',
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Si la URL es relativa, construir URL completa
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      // Si la URL ya contiene el baseUrl, usarla directamente
      if (url.startsWith(baseUrl)) {
        return url
      }
      // Por defecto, redirigir al dashboard localizado
      return `${baseUrl}/es/dashboard`
    },
  },
}

// Función auxiliar para pruebas: replica la lógica de authorize
export async function authorizeCredentialsForTest(credentials: { email?: string; password?: string } | null) {
  if (!credentials?.email || !credentials?.password) {
    return null
  }
  const { prisma } = await import('@/lib/db')
  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
    include: {
      trainerProfile: true,
      clientProfiles: true,
    },
  })

  if (!user) return null
  if (!user.password) return null

  const isPasswordValid = await compare(credentials.password, user.password)
  if (!isPasswordValid) return null

  return {
    id: user.id,
    email: user.email,
    name: user.name || '',
    image: user.avatar || '',
    role: user.role,
  }
}

// Tipos extendidos para NextAuth
declare module 'next-auth' {
  interface User {
    role: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      image: string
      role: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    id: string
  }
}
