import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Tipos para los eventos de analytics
interface AnalyticsEvent {
	name: string;
	properties?: Record<string, any>;
	timestamp?: number;
	userId?: string;
	sessionId?: string;
}

interface AnalyticsPayload {
	events: AnalyticsEvent[];
}

// Validar estructura del evento
function validateEvent(event: any): event is AnalyticsEvent {
	return (
		typeof event === 'object' &&
		typeof event.name === 'string' &&
		event.name.length > 0 &&
		(event.properties === undefined || typeof event.properties === 'object') &&
		(event.timestamp === undefined || typeof event.timestamp === 'number') &&
		(event.userId === undefined || typeof event.userId === 'string') &&
		(event.sessionId === undefined || typeof event.sessionId === 'string')
	);
}

// Procesar eventos de analytics
function processEvents(events: AnalyticsEvent[]) {
	// En desarrollo, solo logear los eventos
	if (process.env.NODE_ENV === 'development') {
		console.log('📊 Analytics Events Received:', {
			count: events.length,
			events: events.map(e => ({
				name: e.name,
				userId: e.userId,
				sessionId: e.sessionId,
				timestamp: new Date(e.timestamp || Date.now()).toISOString()
			}))
		});
		return;
	}

	// En producción, aquí se enviarían a un servicio de analytics
	// como Google Analytics, Mixpanel, Amplitude, etc.
	events.forEach(event => {
		// Ejemplo de integración con diferentes servicios:
		
		// Google Analytics 4
		if (process.env.GA_MEASUREMENT_ID) {
			sendToGoogleAnalytics(event);
		}

		// Mixpanel
		if (process.env.MIXPANEL_TOKEN) {
			sendToMixpanel(event);
		}

		// Base de datos propia
		if (process.env.DATABASE_URL) {
			saveToDatabase(event);
		}

		// Webhook personalizado
		if (process.env.ANALYTICS_WEBHOOK_URL) {
			sendToWebhook(event);
		}
	});
}

// Enviar a Google Analytics 4
async function sendToGoogleAnalytics(event: AnalyticsEvent) {
	try {
		const measurementId = process.env.GA_MEASUREMENT_ID;
		const apiSecret = process.env.GA_API_SECRET;

		if (!measurementId || !apiSecret) return;

		const response = await fetch(
			`https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					client_id: event.sessionId || 'anonymous',
					user_id: event.userId,
					events: [{
						name: event.name.replace(/[^a-zA-Z0-9_]/g, '_'),
						parameters: {
							...event.properties,
							custom_timestamp: event.timestamp
						}
					}]
				})
			}
		);

		if (!response.ok) {
			console.error('Error enviando a Google Analytics:', response.status);
		}
	} catch (error) {
		console.error('Error en Google Analytics:', error);
	}
}

// Enviar a Mixpanel
async function sendToMixpanel(event: AnalyticsEvent) {
	try {
		const token = process.env.MIXPANEL_TOKEN;
		if (!token) return;

		const payload = {
			event: event.name,
			properties: {
				token,
				distinct_id: event.userId || event.sessionId,
				time: event.timestamp || Date.now(),
				...event.properties
			}
		};

		const response = await fetch('https://api.mixpanel.com/track', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify([payload])
		});

		if (!response.ok) {
			console.error('Error enviando a Mixpanel:', response.status);
		}
	} catch (error) {
		console.error('Error en Mixpanel:', error);
	}
}

// Guardar en base de datos propia
async function saveToDatabase(event: AnalyticsEvent) {
	try {
		// Aquí se implementaría la lógica para guardar en tu base de datos
		// Por ejemplo, usando Prisma, Drizzle, o cualquier ORM
		
		// Ejemplo con Prisma:
		// await prisma.analyticsEvent.create({
		//   data: {
		//     name: event.name,
		//     properties: event.properties,
		//     timestamp: new Date(event.timestamp || Date.now()),
		//     userId: event.userId,
		//     sessionId: event.sessionId
		//   }
		// });

		console.log('Guardando en BD:', event.name);
	} catch (error) {
		console.error('Error guardando en BD:', error);
	}
}

// Enviar a webhook personalizado
async function sendToWebhook(event: AnalyticsEvent) {
	try {
		const webhookUrl = process.env.ANALYTICS_WEBHOOK_URL;
		if (!webhookUrl) return;

		const response = await fetch(webhookUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': 'Kairos-Analytics/1.0'
			},
			body: JSON.stringify({
				event,
				metadata: {
					app: 'kairos',
					version: '1.0.0',
					environment: process.env.NODE_ENV
				}
			})
		});

		if (!response.ok) {
			console.error('Error enviando a webhook:', response.status);
		}
	} catch (error) {
		console.error('Error en webhook:', error);
	}
}

// Obtener información del cliente
function getClientInfo(request: NextRequest) {
	return {
		ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
		userAgent: request.headers.get('user-agent') || 'unknown',
		referrer: request.headers.get('referer') || 'direct',
		origin: request.headers.get('origin') || 'unknown'
	};
}

// Validar origen de la petición
function validateOrigin(request: NextRequest): boolean {
	const origin = request.headers.get('origin');
	const allowedOrigins = [
		process.env.NEXT_PUBLIC_APP_URL,
		'http://localhost:3000',
		'http://localhost:3001',
		'https://kairos.app'
	].filter(Boolean);

	return !origin || allowedOrigins.includes(origin);
}

// Rate limiting simple (en memoria)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests por minuto

function checkRateLimit(clientId: string): boolean {
	const now = Date.now();
	const clientData = rateLimitMap.get(clientId);

	if (!clientData || now > clientData.resetTime) {
		rateLimitMap.set(clientId, {
			count: 1,
			resetTime: now + RATE_LIMIT_WINDOW
		});
		return true;
	}

	if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
		return false;
	}

	clientData.count++;
	return true;
}

// Handler POST para recibir eventos
export async function POST(request: NextRequest) {
	try {
		// Validar origen
		if (!validateOrigin(request)) {
			return NextResponse.json(
				{ error: 'Origin not allowed' },
				{ status: 403 }
			);
		}

		// Obtener información del cliente
		const clientInfo = getClientInfo(request);
		const clientId = clientInfo.ip;

		// Rate limiting
		if (!checkRateLimit(clientId)) {
			return NextResponse.json(
				{ error: 'Rate limit exceeded' },
				{ status: 429 }
			);
		}

		// Parsear body
		const body: AnalyticsPayload = await request.json();

		// Validar estructura
		if (!body.events || !Array.isArray(body.events)) {
			return NextResponse.json(
				{ error: 'Invalid payload: events array required' },
				{ status: 400 }
			);
		}

		// Validar cada evento
		const validEvents = body.events.filter(validateEvent);
		if (validEvents.length === 0) {
			return NextResponse.json(
				{ error: 'No valid events found' },
				{ status: 400 }
			);
		}

		// Enriquecer eventos con información del cliente
		const enrichedEvents = validEvents.map(event => ({
			...event,
			properties: {
				...event.properties,
				clientIp: clientInfo.ip,
				clientUserAgent: clientInfo.userAgent,
				clientReferrer: clientInfo.referrer,
				clientOrigin: clientInfo.origin,
				serverTimestamp: Date.now()
			}
		}));

		// Procesar eventos
		processEvents(enrichedEvents);

		// Respuesta exitosa
		return NextResponse.json({
			success: true,
			processed: enrichedEvents.length,
			skipped: body.events.length - enrichedEvents.length
		});

	} catch (error) {
		console.error('Error en analytics API:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// Handler GET para obtener estadísticas (opcional)
export async function GET(request: NextRequest) {
	try {
		// Validar autenticación (implementar según tu sistema)
		// const isAuthenticated = await validateAuth(request);
		// if (!isAuthenticated) {
		//   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		// }

		// Obtener estadísticas básicas
		const stats = {
			service: 'analytics-api',
			status: 'healthy',
			version: '1.0.0',
			uptime: process.uptime(),
			timestamp: new Date().toISOString(),
			rateLimitStatus: {
				activeClients: rateLimitMap.size,
				windowMs: RATE_LIMIT_WINDOW,
				maxRequests: RATE_LIMIT_MAX_REQUESTS
			}
		};

		return NextResponse.json(stats);
	} catch (error) {
		console.error('Error en analytics API GET:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// Handler OPTIONS para CORS
export async function OPTIONS(request: NextRequest) {
	return new NextResponse(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			'Access-Control-Max-Age': '86400'
		}
	});
}