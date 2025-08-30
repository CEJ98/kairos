import { PrismaClient } from '@prisma/client'
import { createPerformanceMiddleware, dbMonitor } from './db-monitor'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Optimize connection pool for production
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

  // Add performance monitoring middleware
  if (process.env.NODE_ENV !== 'test') {
    prisma.$use(createPerformanceMiddleware(dbMonitor))
  }

  return prisma
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Export performance monitoring utilities
export { dbMonitor } from './db-monitor'
export { cacheManager } from './cache-manager'