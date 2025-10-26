import '../../sentry.client.config';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Script from 'next/script';
import { Inter, Poppins } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { SessionProvider } from '@/components/providers/session-provider';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { CookieBanner } from '@/components/ui/cookie-banner';
import { PwaProvider } from '@/components/providers/pwa-provider';
import '@/app/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600']
});

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['600', '700']
});

export const metadata: Metadata = {
  applicationName: 'Kairos Fitness',
  title: 'Kairos Fitness',
  description:
    'Entrenamiento inteligente con planes periodizados, seguimiento de progreso y analíticas accionables.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/icons/apple-icon-180.png', sizes: '180x180', type: 'image/png' }
    ]
  },
  appleWebApp: {
    capable: true,
    title: 'Kairos Fitness',
    statusBarStyle: 'black-translucent'
  },
  formatDetection: {
    telephone: false
  },
  other: {
    'msapplication-TileColor': '#0E1726'
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0E1726' }
  ]
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? process.env.UMAMI_WEBSITE_ID;
  const umamiSrc = process.env.NEXT_PUBLIC_UMAMI_SRC ?? process.env.UMAMI_SRC;
  const showCookieBanner = (process.env.NEXT_PUBLIC_ENABLE_COOKIE_BANNER ?? process.env.ENABLE_COOKIE_BANNER) === 'true';
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} font-sans bg-background`}>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            {children}
            <Toaster />
            <SonnerToaster position="top-right" richColors />
          </ThemeProvider>
        </SessionProvider>
        <PwaProvider />
        {showCookieBanner ? <CookieBanner /> : null}
        {umamiWebsiteId && umamiSrc ? (
          <Script
            src={umamiSrc}
            data-website-id={umamiWebsiteId}
            data-do-not-track="true"
            strategy="lazyOnload"
          />
        ) : null}
      </body>
    </html>
  );
}
