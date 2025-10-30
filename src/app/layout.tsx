import { SentryClientInit } from '@/components/providers/sentry-init';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Script from 'next/script';
import { Inter, Poppins } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { SessionProvider } from '@/components/providers/session-provider';
import { Toaster } from '@/components/ui/toaster';
// import { Toaster as SonnerToaster } from 'sonner';
import dynamic from 'next/dynamic';
// import { PwaProvider } from '@/components/providers/pwa-provider';
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
  const showCookieBanner = process.env.NEXT_PUBLIC_ENABLE_COOKIE_BANNER === 'true';
  // const CookieBannerNoSSR = showCookieBanner
  //   ? dynamic(() => import('@/components/ui/cookie-banner'), { ssr: false })
  //   : null;
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} font-sans bg-background`}>
        {/* Dev-only: fuerza desregistro de Service Workers para evitar chunks desactualizados */}
        {process.env.NODE_ENV !== 'production' ? (
          <Script id="sw-unregister" strategy="beforeInteractive">
            {`
              (function(){
                if (typeof window === 'undefined') return;
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(regs){
                    regs.forEach(function(r){ r.unregister(); });
                  }).catch(function(){ });
                }
                if ('caches' in window) {
                  caches.keys().then(function(keys){
                    keys.forEach(function(key){ caches.delete(key).catch(function(){ }); });
                  }).catch(function(){ });
                }
              })();
            `}
          </Script>
        ) : null}
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            {children}
            <Toaster />
            {/* <SonnerToaster position="top-right" richColors /> */}
          </ThemeProvider>
        </SessionProvider>
        {/* <SentryClientInit /> */}
        {/* <PwaProvider /> */}
        {/* {CookieBannerNoSSR ? <CookieBannerNoSSR /> : null} */}
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
