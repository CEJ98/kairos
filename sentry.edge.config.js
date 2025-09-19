// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
	dsn: process.env.SENTRY_DSN,

	// Adjust this value in production, or use tracesSampler for greater control
	tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

	// Setting this option to true will print useful information to the console while you're setting up Sentry.
	debug: process.env.NODE_ENV === 'development',

	// Configuración del entorno
	environment: process.env.NODE_ENV || 'development',

	// Release tracking
	release: process.env.npm_package_version || '1.0.0',

	// Configuración específica para edge runtime
	beforeSend(event, hint) {
		// Filtrar errores específicos del edge runtime
		if (event.exception) {
			const error = hint.originalException
			
			if (error && error.message) {
				// Filtrar errores comunes del edge runtime
				if (
					error.message.includes('Dynamic Code Evaluation') ||
					error.message.includes('Edge Runtime') ||
					error.message.includes('WebAssembly')
				) {
					// Log pero no enviar a Sentry para evitar spam
					console.warn('Edge Runtime Error (filtered):', error.message)
					return null
				}
			}
		}

		// Agregar contexto del edge runtime
		event.contexts = {
			...event.contexts,
			edge: {
				runtime: 'edge',
				version: process.env.VERCEL_REGION || 'local',
				region: process.env.VERCEL_REGION || 'local',
			},
		}

		return event
	},

	// Configuración de breadcrumbs para edge
	beforeBreadcrumb(breadcrumb, hint) {
		// Filtrar breadcrumbs sensibles en edge runtime
		if (breadcrumb.category === 'http') {
			if (breadcrumb.data && breadcrumb.data.url) {
				breadcrumb.data.url = breadcrumb.data.url.replace(/([?&])(token|password|key|authorization)=[^&]*/gi, '$1$2=[REDACTED]')
			}
		}

		return breadcrumb
	},

	// Configuración de sampling para edge
	sampleRate: process.env.NODE_ENV === 'production' ? 0.5 : 1.0,

	// Tags específicos para edge
	initialScope: {
		tags: {
			component: 'edge',
			version: process.env.npm_package_version || '1.0.0',
			region: process.env.VERCEL_REGION || 'local',
		},
	},
})