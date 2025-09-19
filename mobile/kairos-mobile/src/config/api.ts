// Configuración de la API
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Configuración para desarrollo
export const DEV_CONFIG = {
	baseURL: 'http://localhost:3000/api',
	timeout: 10000,
};

// Configuración para producción
export const PROD_CONFIG = {
	baseURL: 'https://api.kairosfitness.com/api',
	timeout: 15000,
};

// Configuración actual basada en el entorno
export const API_CONFIG = __DEV__ ? DEV_CONFIG : PROD_CONFIG;

// Headers comunes
export const DEFAULT_HEADERS = {
	'Content-Type': 'application/json',
	'Accept': 'application/json',
};

// Endpoints de la API
export const API_ENDPOINTS = {
	// Autenticación
	auth: {
		login: '/auth/login',
		register: '/auth/register',
		refresh: '/auth/refresh',
		logout: '/auth/logout',
	},
	// Usuarios
	users: {
		profile: '/users/profile',
		update: '/users/update',
		delete: '/users/delete',
	},
	// Entrenamientos
	workouts: {
		list: '/workouts',
		create: '/workouts',
		update: '/workouts',
		delete: '/workouts',
	},
	// Notificaciones
	notifications: {
		registerToken: '/notifications/register-token',
		unregisterToken: '/notifications/unregister-token',
		preferences: '/notifications/preferences',
		test: '/notifications/test',
	},
	// Progreso
	progress: {
		list: '/progress',
		create: '/progress',
		stats: '/progress/stats',
	},
};