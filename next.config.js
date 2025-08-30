/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  serverExternalPackages: ['@prisma/client'],
  experimental: {
    optimizeCss: true,
    forceSwcTransforms: true,
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    reactRemoveProperties: process.env.NODE_ENV === 'production',
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
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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

module.exports = nextConfig