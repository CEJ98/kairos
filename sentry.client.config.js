// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

	// Adjust this value in production, or use tracesSampler for greater control
	tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

	// Setting this option to true will print useful information to the console while you're setting up Sentry.
	debug: process.env.NODE_ENV === 'development',

	// Configuración del entorno
	environment: process.env.NODE_ENV || 'development',

	// Release tracking
	release: process.env.npm_package_version || '1.0.0',

	// Configuración de integración para el cliente
	integrations: [
		// Captura errores de interfaz de usuario
		new Sentry.BrowserTracing({
			// Set tracing sample rate
			tracePropagationTargets: [
				'localhost',
				/^https:\/\/yourapi\.domain\.com\/api/,
			],
		}),
		// Captura información de replay de sesión (solo en producción)
		...(process.env.NODE_ENV === 'production' ? [
			new Sentry.Replay({
				// Capture 10% of all sessions,
				// plus 100% of sessions with an error
				sessionSampleRate: 0.1,
				errorSampleRate: 1.0,
				maskAllText: true,
				blockAllMedia: true,
			})
		] : []),
	],

	// Configuración de contexto por defecto
	beforeSend(event, hint) {
		// Filtrar errores conocidos del cliente
		if (event.exception) {
			const error = hint.originalException
			
			if (error && error.message) {
				// Filtrar errores comunes del navegador
				if (
					error.message.includes('Non-Error promise rejection') ||
					error.message.includes('ResizeObserver loop limit exceeded') ||
					error.message.includes('Script error') ||
					error.message.includes('Network request failed') ||
					error.message.includes('Loading chunk') ||
					error.message.includes('ChunkLoadError')
				) {
					return null // No enviar estos errores
				}
			}
		}

		// Agregar contexto del cliente
		if (typeof window !== 'undefined') {
			event.contexts = {
				...event.contexts,
				browser: {
					name: navigator.userAgent,
					version: navigator.appVersion,
					language: navigator.language,
					cookieEnabled: navigator.cookieEnabled,
					onLine: navigator.onLine,
				},
				screen: {
					width: screen.width,
					height: screen.height,
					colorDepth: screen.colorDepth,
					pixelDepth: screen.pixelDepth,
				},
				viewport: {
					width: window.innerWidth,
					height: window.innerHeight,
				},
				page: {
					url: window.location.href,
					referrer: document.referrer,
					title: document.title,
				},
			}

			// Agregar información del usuario si está disponible
			const userInfo = localStorage.getItem('user')
			if (userInfo) {
				try {
					const user = JSON.parse(userInfo)
					event.user = {
						id: user.id,
						email: user.email,
						username: user.username || user.name,
					}
				} catch (e) {
					// Ignorar errores de parsing
				}
			}
		}

		return event
	},

	// Configuración de breadcrumbs
	beforeBreadcrumb(breadcrumb, hint) {
		// Filtrar breadcrumbs sensibles
		if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
			// Remover información sensible de URLs
			if (breadcrumb.data && breadcrumb.data.url) {
				breadcrumb.data.url = breadcrumb.data.url.replace(/([?&])(token|password|key|authorization)=[^&]*/gi, '$1$2=[REDACTED]')
			}
			// Remover headers sensibles
			if (breadcrumb.data && breadcrumb.data.request_body_size) {
				delete breadcrumb.data.request_body_size
			}
		}

		// Filtrar clicks en elementos sensibles
		if (breadcrumb.category === 'ui.click') {
			if (breadcrumb.message && (
				breadcrumb.message.includes('password') ||
				breadcrumb.message.includes('token') ||
				breadcrumb.message.includes('secret')
			)) {
				return null
			}
		}

		return breadcrumb
	},

	// Configuración de sampling
	sampleRate: process.env.NODE_ENV === 'production' ? 0.8 : 1.0,

	// Configuración de tags por defecto
	initialScope: {
		tags: {
			component: 'client',
			version: process.env.npm_package_version || '1.0.0',
		},
	},

	// Configuración de performance monitoring
	tracesSampler: (samplingContext) => {
		// No hacer tracing de health checks
		if (samplingContext.request && samplingContext.request.url) {
			if (samplingContext.request.url.includes('/health') || 
				samplingContext.request.url.includes('/ping')) {
				return 0
			}
		}

		// Reducir sampling en producción
		return process.env.NODE_ENV === 'production' ? 0.1 : 1.0
	},
})