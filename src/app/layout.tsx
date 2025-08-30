import './globals.css'
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Providers } from '@/components/providers'
import { seoConfig, generateJSONLD } from '@/lib/seo'
import Script from 'next/script'

import { logger } from '@/lib/logger'
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter'
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono'
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: seoConfig.title,
  description: seoConfig.description,
  keywords: seoConfig.keywords.join(', '),
  authors: [{ name: seoConfig.author }],
  creator: seoConfig.author,
  publisher: seoConfig.author,
  robots: 'index, follow',
  
  openGraph: {
    title: seoConfig.title,
    description: seoConfig.description,
    url: seoConfig.canonical,
    siteName: seoConfig.siteName,
    images: seoConfig.images,
    locale: seoConfig.locale,
    type: 'website'
  },
  
  twitter: {
    card: 'summary_large_image',
    title: seoConfig.title,
    description: seoConfig.description,
    creator: seoConfig.twitter.handle,
    images: seoConfig.images
  },
  
  manifest: '/manifest.json',
  
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'mobile-web-app-capable': 'yes',
    'theme-color': '#10B981',
    'msapplication-TileColor': '#10B981'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable} light`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="dns-prefetch" href="//api.stripe.com" />
        
        {/* Structured Data */}
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateJSONLD('Organization'))
          }}
        />
        <Script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateJSONLD('WebSite'))
          }}
        />
      </head>
      <body className={`${inter.className} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
        
        {/* Performance and Analytics Scripts */}
        <Script
          id="performance-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Preload critical resources
              if (typeof window !== 'undefined') {
                // Resource hints
                const criticalResources = ['/images/hero-bg.jpg'];
                criticalResources.forEach(resource => {
                  const link = document.createElement('link');
                  link.rel = 'preload';
                  link.as = 'image';
                  link.href = resource;
                  document.head.appendChild(link);
                });
                
                // Service Worker registration
                if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
                  navigator.serviceWorker.register('/sw.js').catch(logger.error);
                }
              }
            `
          }}
        />
        
        {/* Google Analytics - Production only */}
        {process.env.NODE_ENV === 'production' && process.env.GOOGLE_ANALYTICS_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.GOOGLE_ANALYTICS_ID}`}
              strategy="afterInteractive"
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.GOOGLE_ANALYTICS_ID}', {
                    page_title: document.title,
                    page_location: window.location.href,
                    custom_map: {
                      custom_parameter_1: 'fitness_app'
                    }
                  });
                `
              }}
            />
          </>
        )}
      </body>
    </html>
  )
}