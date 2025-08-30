import { Metadata } from 'next'

// Configuración base de SEO
export const seoConfig = {
  title: 'Kairos Fitness - Tu Compañero de Entrenamiento Personal',
  description: 'Transforma tu rutina fitness con Kairos. Entrenamientos personalizados, seguimiento de progreso, nutrición y comunidad. ¡Comienza gratis hoy!',
  keywords: [
    'fitness app',
    'entrenamiento personal',
    'rutinas gym',
    'seguimiento fitness',
    'app ejercicios',
    'entrenador personal',
    'fitness Miami',
    'workout app',
    'gym tracker',
    'fitness community'
  ],
  author: 'Kairos Fitness',
  canonical: 'https://kairosfit.com',
  locale: 'es_US',
  type: 'website',
  siteName: 'Kairos Fitness',
  images: [
    {
      url: '/images/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Kairos Fitness - Tu Compañero de Entrenamiento Personal'
    }
  ],
  twitter: {
    handle: '@kairosfit',
    site: '@kairosfit',
    cardType: 'summary_large_image'
  },
  facebook: {
    appId: process.env.FACEBOOK_APP_ID
  }
}

// Función para generar metadata dinámica
export function generateMetadata({
  title,
  description,
  path = '',
  image,
  noIndex = false,
  keywords = []
}: {
  title?: string
  description?: string
  path?: string
  image?: string
  noIndex?: boolean
  keywords?: string[]
}): Metadata {
  const pageTitle = title 
    ? `${title} | ${seoConfig.title}`
    : seoConfig.title

  const pageDescription = description || seoConfig.description
  
  const canonicalUrl = `${seoConfig.canonical}${path}`
  
  const combinedKeywords = [
    ...seoConfig.keywords,
    ...keywords
  ].join(', ')

  const ogImage = image 
    ? `${seoConfig.canonical}${image}`
    : `${seoConfig.canonical}${seoConfig.images[0].url}`

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: combinedKeywords,
    authors: [{ name: seoConfig.author }],
    robots: noIndex ? 'noindex,nofollow' : 'index,follow',
    // canonical: canonicalUrl,
    
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      siteName: seoConfig.siteName,
      locale: seoConfig.locale,
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: pageTitle
        }
      ]
    },
    
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [ogImage],
      creator: seoConfig.twitter.handle
    },
    
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'es-US': canonicalUrl,
        'en-US': `${canonicalUrl}?lang=en`
      }
    },
    
    other: {
      'fb:app_id': seoConfig.facebook.appId || '',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'black-translucent',
      'mobile-web-app-capable': 'yes',
      'theme-color': '#10B981'
    }
  }
}

// Metadata específica por páginas
export const pageMetadata = {
  home: generateMetadata({
    description: 'Descubre Kairos Fitness: la app completa para entrenamientos personalizados, seguimiento de progreso y comunidad fitness. Gratis para empezar.'
  }),
  
  dashboard: generateMetadata({
    title: 'Dashboard',
    description: 'Tu centro de control fitness. Revisa tu progreso, entrenamientos y estadísticas.',
    noIndex: true
  }),
  
  workouts: generateMetadata({
    title: 'Entrenamientos',
    description: 'Explora nuestra biblioteca de entrenamientos personalizados. HIIT, fuerza, cardio y más.',
    keywords: ['entrenamientos', 'rutinas gym', 'hiit', 'cardio', 'fuerza']
  }),
  
  exercises: generateMetadata({
    title: 'Ejercicios',
    description: 'Biblioteca completa de ejercicios con instrucciones detalladas y videos demostrativos.',
    keywords: ['ejercicios', 'fitness', 'gym', 'instrucciones', 'videos']
  }),
  
  nutrition: generateMetadata({
    title: 'Nutrición',
    description: 'Planes de alimentación personalizados y seguimiento nutricional para alcanzar tus objetivos.',
    keywords: ['nutrición', 'dieta', 'alimentación', 'macros', 'calorías']
  }),
  
  progress: generateMetadata({
    title: 'Progreso',
    description: 'Monitorea tu evolución con estadísticas detalladas, gráficos y análisis de rendimiento.',
    keywords: ['progreso', 'estadísticas', 'análisis', 'rendimiento', 'evolución']
  }),
  
  community: generateMetadata({
    title: 'Comunidad',
    description: 'Conecta con otros atletas, comparte logros y participa en desafíos grupales.',
    keywords: ['comunidad', 'fitness social', 'desafíos', 'motivación', 'atletas']
  }),
  
  pricing: generateMetadata({
    title: 'Planes y Precios',
    description: 'Elige el plan perfecto para ti. Desde entrenamientos básicos hasta coaching personalizado.',
    keywords: ['precios', 'planes', 'suscripción', 'premium', 'entrenador personal']
  }),
  
  auth: {
    login: generateMetadata({
      title: 'Iniciar Sesión',
      description: 'Accede a tu cuenta Kairos Fitness y continúa tu viaje fitness.',
      noIndex: true
    }),
    
    register: generateMetadata({
      title: 'Registro',
      description: 'Únete a la comunidad Kairos Fitness. Regístrate gratis y comienza a entrenar hoy.',
      noIndex: true
    })
  }
}

// JSON-LD para SEO estructurado
export const generateJSONLD = (type: 'Organization' | 'WebSite' | 'Article' | 'Product', data?: any) => {
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': type
  }

  switch (type) {
    case 'Organization':
      return {
        ...baseSchema,
        name: 'Kairos Fitness',
        url: seoConfig.canonical,
        logo: `${seoConfig.canonical}/images/logo.png`,
        description: seoConfig.description,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Miami',
          addressRegion: 'FL',
          addressCountry: 'US'
        },
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+1-305-XXX-XXXX',
          contactType: 'customer service',
          areaServed: 'US',
          availableLanguage: ['English', 'Spanish']
        },
        sameAs: [
          'https://facebook.com/kairosfit',
          'https://instagram.com/kairosfit',
          'https://twitter.com/kairosfit'
        ]
      }

    case 'WebSite':
      return {
        ...baseSchema,
        name: seoConfig.title,
        url: seoConfig.canonical,
        description: seoConfig.description,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${seoConfig.canonical}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        },
        publisher: {
          '@type': 'Organization',
          name: 'Kairos Fitness',
          logo: {
            '@type': 'ImageObject',
            url: `${seoConfig.canonical}/images/logo.png`
          }
        }
      }

    case 'Product':
      return {
        ...baseSchema,
        name: 'Kairos Fitness App',
        description: 'Aplicación completa de fitness con entrenamientos personalizados',
        brand: {
          '@type': 'Brand',
          name: 'Kairos Fitness'
        },
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'USD',
          lowPrice: '0.00',
          highPrice: '99.99',
          offerCount: '4'
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          reviewCount: '1250',
          bestRating: '5',
          worstRating: '1'
        }
      }

    default:
      return baseSchema
  }
}

// Configuración de sitemap
export const sitemapConfig = {
  baseUrl: seoConfig.canonical,
  pages: [
    { url: '', priority: 1.0, changeFreq: 'weekly' },
    { url: '/pricing', priority: 0.8, changeFreq: 'monthly' },
    { url: '/exercises', priority: 0.7, changeFreq: 'weekly' },
    { url: '/workouts', priority: 0.7, changeFreq: 'weekly' },
    { url: '/about', priority: 0.5, changeFreq: 'monthly' },
    { url: '/contact', priority: 0.5, changeFreq: 'monthly' },
    { url: '/terms', priority: 0.3, changeFreq: 'yearly' },
    { url: '/privacy', priority: 0.3, changeFreq: 'yearly' }
  ]
}