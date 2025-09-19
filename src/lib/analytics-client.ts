'use client';

// Tipos para eventos de analytics
interface AnalyticsEvent {
	name: string;
	properties?: Record<string, any>;
	timestamp?: number;
	userId?: string;
	sessionId?: string;
}

interface UserProperties {
	userId: string;
	email?: string;
	role?: string;
	plan?: string;
	[key: string]: any;
}

interface PageViewEvent {
	page: string;
	title?: string;
	referrer?: string;
	url?: string;
}

interface WorkoutEvent {
	workoutId: string;
	action: 'start' | 'complete' | 'pause' | 'resume' | 'cancel';
	duration?: number;
	exerciseCount?: number;
	setCount?: number;
}

interface NutritionEvent {
	planId?: string;
	action: 'view' | 'update' | 'complete';
	calories?: number;
	macros?: {
		protein: number;
		carbs: number;
		fat: number;
	};
}

interface CoachStudentEvent {
	studentId: string;
	action: 'assign_routine' | 'view_progress' | 'send_message' | 'create_plan';
	routineId?: string;
	planId?: string;
}

// Clase principal de Analytics
class AnalyticsClient {
	private events: AnalyticsEvent[] = [];
	private sessionId: string;
	private userId?: string;
	private isEnabled: boolean = true;
	private batchSize: number = 10;
	private flushInterval: number = 30000; // 30 segundos
	private flushTimer?: NodeJS.Timeout;

	constructor() {
		this.sessionId = this.generateSessionId();
		this.startAutoFlush();
		
		// Enviar eventos cuando la página se cierra
		if (typeof window !== 'undefined') {
			window.addEventListener('beforeunload', () => {
				this.flush();
			});
			
			// Detectar cuando la página se vuelve visible/invisible
			document.addEventListener('visibilitychange', () => {
				if (document.visibilityState === 'hidden') {
					this.flush();
				}
			});
		}
	}

	// Generar ID de sesión único
	private generateSessionId(): string {
		return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	// Configurar usuario
	setUser(properties: UserProperties) {
		this.userId = properties.userId;
		this.track('user_identified', properties);
	}

	// Habilitar/deshabilitar analytics
	setEnabled(enabled: boolean) {
		this.isEnabled = enabled;
		if (!enabled) {
			this.events = [];
		}
	}

	// Rastrear evento genérico
	track(eventName: string, properties?: Record<string, any>) {
		if (!this.isEnabled) return;

		const event: AnalyticsEvent = {
			name: eventName,
			properties: {
				...properties,
				url: typeof window !== 'undefined' ? window.location.href : undefined,
				userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
				screenResolution: typeof window !== 'undefined' 
					? `${window.screen.width}x${window.screen.height}` 
					: undefined
			},
			timestamp: Date.now(),
			userId: this.userId,
			sessionId: this.sessionId
		};

		this.events.push(event);
		console.log('📊 Analytics Event:', event);

		// Flush automático si alcanzamos el tamaño del batch
		if (this.events.length >= this.batchSize) {
			this.flush();
		}
	}

	// Rastrear vista de página
	page(pageData: PageViewEvent) {
		this.track('page_view', {
			page: pageData.page,
			title: pageData.title || (typeof document !== 'undefined' ? document.title : undefined),
			referrer: pageData.referrer || (typeof document !== 'undefined' ? document.referrer : undefined),
			url: pageData.url || (typeof window !== 'undefined' ? window.location.href : undefined)
		});
	}

	// Eventos específicos de workout
	workout(eventData: WorkoutEvent) {
		this.track(`workout_${eventData.action}`, {
			workoutId: eventData.workoutId,
			duration: eventData.duration,
			exerciseCount: eventData.exerciseCount,
			setCount: eventData.setCount
		});
	}

	// Eventos específicos de nutrición
	nutrition(eventData: NutritionEvent) {
		this.track(`nutrition_${eventData.action}`, {
			planId: eventData.planId,
			calories: eventData.calories,
			macros: eventData.macros
		});
	}

	// Eventos específicos de coach-estudiante
	coachStudent(eventData: CoachStudentEvent) {
		this.track(`coach_${eventData.action}`, {
			studentId: eventData.studentId,
			routineId: eventData.routineId,
			planId: eventData.planId
		});
	}

	// Rastrear errores
	error(error: Error, context?: Record<string, any>) {
		this.track('error_occurred', {
			errorMessage: error.message,
			errorStack: error.stack,
			errorName: error.name,
			context
		});
	}

	// Rastrear rendimiento
	performance(metricName: string, value: number, unit: string = 'ms') {
		this.track('performance_metric', {
			metricName,
			value,
			unit
		});
	}

	// Rastrear conversiones
	conversion(eventName: string, value?: number, currency?: string) {
		this.track('conversion', {
			conversionEvent: eventName,
			value,
			currency
		});
	}

	// Enviar eventos al servidor
	private async flush() {
		if (this.events.length === 0) return;

		const eventsToSend = [...this.events];
		this.events = [];

		try {
			// En desarrollo, solo logear
			if (process.env.NODE_ENV === 'development') {
				console.log('📊 Analytics Batch:', eventsToSend);
				return;
			}

			// En producción, enviar al endpoint
			const response = await fetch('/api/analytics', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ events: eventsToSend })
			});

			if (!response.ok) {
				throw new Error(`Analytics API error: ${response.status}`);
			}
		} catch (error) {
			console.error('Error enviando eventos de analytics:', error);
			// Reintroducir eventos si falló el envío
			this.events.unshift(...eventsToSend);
		}
	}

	// Iniciar flush automático
	private startAutoFlush() {
		this.flushTimer = setInterval(() => {
			this.flush();
		}, this.flushInterval);
	}

	// Detener flush automático
	stopAutoFlush() {
		if (this.flushTimer) {
			clearInterval(this.flushTimer);
		}
	}

	// Obtener estadísticas de la sesión
	getSessionStats() {
		return {
			sessionId: this.sessionId,
			userId: this.userId,
			pendingEvents: this.events.length,
			isEnabled: this.isEnabled
		};
	}
}

// Instancia singleton
const analytics = new AnalyticsClient();

// Hook para usar analytics en componentes React
export function useAnalytics() {
	return {
		track: analytics.track.bind(analytics),
		page: analytics.page.bind(analytics),
		workout: analytics.workout.bind(analytics),
		nutrition: analytics.nutrition.bind(analytics),
		coachStudent: analytics.coachStudent.bind(analytics),
		error: analytics.error.bind(analytics),
		performance: analytics.performance.bind(analytics),
		conversion: analytics.conversion.bind(analytics),
		setUser: analytics.setUser.bind(analytics),
		setEnabled: analytics.setEnabled.bind(analytics),
		getSessionStats: analytics.getSessionStats.bind(analytics)
	};
}

// Hook para rastrear automáticamente vistas de página
export function usePageTracking() {
	const { page } = useAnalytics();

	// Este hook se usaría en el layout principal o en cada página
	// para rastrear automáticamente las vistas
	return { trackPage: page };
}

// Hook para rastrear rendimiento de componentes
export function usePerformanceTracking(componentName: string) {
	const { performance } = useAnalytics();

	const trackRender = (renderTime: number) => {
		performance(`${componentName}_render_time`, renderTime);
	};

	const trackInteraction = (interactionName: string, duration: number) => {
		performance(`${componentName}_${interactionName}`, duration);
	};

	return { trackRender, trackInteraction };
}

// Funciones de utilidad para métricas comunes
export const analyticsUtils = {
	// Rastrear tiempo en página
	trackTimeOnPage: (pageName: string) => {
		const startTime = Date.now();
		return () => {
			const duration = Date.now() - startTime;
			analytics.performance(`time_on_page_${pageName}`, duration);
		};
	},

	// Rastrear clics en elementos
	trackClick: (elementName: string, properties?: Record<string, any>) => {
		analytics.track('element_clicked', {
			elementName,
			...properties
		});
	},

	// Rastrear formularios
	trackFormSubmission: (formName: string, success: boolean, errors?: string[]) => {
		analytics.track('form_submitted', {
			formName,
			success,
			errors
		});
	},

	// Rastrear búsquedas
	trackSearch: (query: string, results: number, filters?: Record<string, any>) => {
		analytics.track('search_performed', {
			query,
			results,
			filters
		});
	}
};

export default analytics;
export type {
	AnalyticsEvent,
	UserProperties,
	PageViewEvent,
	WorkoutEvent,
	NutritionEvent,
	CoachStudentEvent
};