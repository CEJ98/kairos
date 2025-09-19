const createNextIntlPlugin = require('next-intl/plugin')
const { withSentryConfig } = require('@sentry/nextjs')
// Nota: en App Router puro no usamos el plugin para evitar dependencias del pages-manifest.
// Si necesitas el plugin, vuelve a habilitarlo cuando exista un directorio pages real.

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Allow production builds to succeed even if there are ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Performance optimizations
  serverExternalPackages: ['@prisma/client'],
  experimental: {
    optimizeCss: true,
    forceSwcTransforms: true,
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    optimizePackageImports: [
      'react',
      'react-dom',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      'lucide-react',
      'date-fns',
      'recharts',
      'framer-motion',
      '@tanstack/react-query',
    ],
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB'],
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
    reactRemoveProperties: process.env.NODE_ENV === 'production',
    styledComponents: true,
  },
  
  // Image optimization
  images: {
    domains: [
      'res.cloudinary.com',
      'images.unsplash.com',
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 3600, // 1 hour cache
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    loader: 'default',
    loaderFile: '',
    unoptimized: false,
  },
  
  // Output and build optimizations
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Bundle analyzer (enable in development only)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      
      if (!dev) {
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: isServer ? '../analyze/server.html' : './analyze/client.html',
            openAnalyzer: false,
          })
        )
      }
      
      // Advanced performance optimizations
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            // Framework chunks (React, Next.js)
            framework: {
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              name: 'framework',
              chunks: 'all',
              priority: 40,
              enforce: true,
            },
            // UI Library chunks (Radix, Lucide)
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|@headlessui|framer-motion)[\\/]/,
              name: 'ui-lib',
              chunks: 'all',
              priority: 30,
              reuseExistingChunk: true,
            },
            // Data/API chunks (Prisma, Tanstack Query, Supabase)
            data: {
              test: /[\\/]node_modules[\\/](@prisma|@tanstack|@supabase|axios)[\\/]/,
              name: 'data-lib',
              chunks: 'all',
              priority: 25,
              reuseExistingChunk: true,
            },
            // Chart/Analytics chunks
            charts: {
              test: /[\\/]node_modules[\\/](recharts|chart\.js|d3)[\\/]/,
              name: 'charts-lib',
              chunks: 'all',
              priority: 20,
              reuseExistingChunk: true,
            },
            // Other vendor libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
            },
            // Dashboard components
            dashboard: {
              test: /[\\/]src[\\/]components[\\/](dashboard|trainer|analytics)[\\/]/,
              name: 'dashboard-components',
              chunks: 'all',
              priority: 15,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            // Common application code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      }
      
      return config
    },
  }),
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development'
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
    const defaultOrigins = isDevelopment 
      ? ['http://localhost:3000', 'http://127.0.0.1:3000']
      : [process.env.NEXTAUTH_URL || 'https://kairosfit.com']
    
    const origins = [...defaultOrigins, ...allowedOrigins].filter(Boolean).join(',')
    
    const headerConfigs = [
      {
        // Security headers for all routes
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'Content-Security-Policy', value: [
            "default-src 'self'",
            "base-uri 'self'",
            "frame-ancestors 'none'",
            // Allow inline scripts for existing JSON-LD/gtag; consider switching to nonces later
            isDevelopment 
              ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com"
              : "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: https:",
            "font-src 'self' https://fonts.gstatic.com",
            "connect-src 'self' https://api.stripe.com https://*.supabase.co https://*.vercel.app ws: wss:",
            "frame-src https://js.stripe.com https://hooks.stripe.com",
          ].join('; ') },
        ],
      },
      {
        source: '/api/auth/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: origins },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: origins },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token, X-Api-Version' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
      {
        // Aggressive caching for Next static assets
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Cache Next Image responses reasonably
        source: '/_next/image',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
    ]

    // Add HTTPS headers only in production
    if (!isDevelopment) {
      headerConfigs.push({
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      })
    }

    return headerConfigs
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
}

// Si no existe directorio pages, evitar envolver con el plugin para prevenir lecturas del pages-manifest.
// Configuración de Sentry
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Transpiles SDK to be compatible with IE11 (increases bundle size)
  transpileClientSDK: false,

  // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors.
  automaticVercelMonitors: true,
}

// Envolver la configuración con Sentry solo si está habilitado
module.exports = process.env.SENTRY_DSN 
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig
