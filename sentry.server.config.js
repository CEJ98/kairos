// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
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

	// Configuración de integración
	integrations: [
		// Captura errores no manejados
		new Sentry.Integrations.OnUncaughtException({
			exitEvenIfOtherHandlersAreRegistered: false,
		}),
		new Sentry.Integrations.OnUnhandledRejection({
			mode: 'warn',
		}),
	],

	// Configuración de contexto por defecto
	beforeSend(event, hint) {
		// Filtrar errores conocidos o no críticos
		if (event.exception) {
			const error = hint.originalException
			
			// Filtrar errores de red comunes
			if (error && error.message) {
				if (
					error.message.includes('Network Error') ||
					error.message.includes('fetch') ||
					error.message.includes('AbortError')
				) {
					return null // No enviar estos errores
				}
			}
		}

		// Agregar contexto del servidor
		event.contexts = {
			...event.contexts,
			server: {
				node_version: process.version,
				platform: process.platform,
				arch: process.arch,
				memory_usage: process.memoryUsage(),
				uptime: process.uptime(),
			},
		}

		return event
	},

	// Configuración de breadcrumbs
	beforeBreadcrumb(breadcrumb, hint) {
		// Filtrar breadcrumbs sensibles
		if (breadcrumb.category === 'http') {
			// Remover información sensible de URLs
			if (breadcrumb.data && breadcrumb.data.url) {
				breadcrumb.data.url = breadcrumb.data.url.replace(/([?&])(token|password|key)=[^&]*/gi, '$1$2=[REDACTED]')
			}
		}

		return breadcrumb
	},

	// Configuración de sampling de errores
	sampleRate: process.env.NODE_ENV === 'production' ? 0.8 : 1.0,

	// Configuración de tags por defecto
	initialScope: {
		tags: {
			component: 'server',
			version: process.env.npm_package_version || '1.0.0',
		},
	},
})