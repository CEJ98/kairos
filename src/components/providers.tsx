'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'
import { useState } from 'react'
import { ChatLayout } from '@/components/layout/chat-layout'
import { PushNotificationManager } from '@/components/notifications/push-notification-manager'
import { ThemeProvider } from 'next-themes'
import ErrorBoundary from '@/components/ErrorBoundary'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minuto
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <ErrorBoundary>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <ChatLayout>
              {children}
            </ChatLayout>
            <PushNotificationManager />
            <Toaster 
              position="top-right"
              richColors
              closeButton
            />
          </ThemeProvider>
        </QueryClientProvider>
      </SessionProvider>
    </ErrorBoundary>
  )
}