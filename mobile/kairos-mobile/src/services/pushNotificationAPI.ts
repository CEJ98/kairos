import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

interface PushTokenData {
	token: string;
	deviceId: string;
	platform: 'ios' | 'android';
	userId?: string;
}

interface NotificationPreferences {
	workoutReminders: boolean;
	achievements: boolean;
	socialUpdates: boolean;
	promotions: boolean;
}

class PushNotificationAPI {
	private baseURL: string;

	constructor() {
		this.baseURL = API_BASE_URL || 'http://localhost:3000/api';
	}

	/**
	 * Registra el token de push notification en el servidor
	 */
	async registerPushToken(tokenData: PushTokenData): Promise<boolean> {
		try {
			const authToken = await AsyncStorage.getItem('authToken');
			
			const response = await fetch(`${this.baseURL}/notifications/register-token`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': authToken ? `Bearer ${authToken}` : '',
				},
				body: JSON.stringify(tokenData),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			console.log('✅ Token registrado exitosamente:', result);
			return true;
		} catch (error) {
			console.error('❌ Error registrando token:', error);
			return false;
		}
	}

	/**
	 * Actualiza las preferencias de notificación del usuario
	 */
	async updateNotificationPreferences(preferences: NotificationPreferences): Promise<boolean> {
		try {
			const authToken = await AsyncStorage.getItem('authToken');
			
			const response = await fetch(`${this.baseURL}/notifications/preferences`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': authToken ? `Bearer ${authToken}` : '',
				},
				body: JSON.stringify(preferences),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			console.log('✅ Preferencias actualizadas:', result);
			return true;
		} catch (error) {
			console.error('❌ Error actualizando preferencias:', error);
			return false;
		}
	}

	/**
	 * Obtiene las preferencias de notificación del usuario
	 */
	async getNotificationPreferences(): Promise<NotificationPreferences | null> {
		try {
			const authToken = await AsyncStorage.getItem('authToken');
			
			const response = await fetch(`${this.baseURL}/notifications/preferences`, {
				method: 'GET',
				headers: {
					'Authorization': authToken ? `Bearer ${authToken}` : '',
				},
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const preferences = await response.json();
			return preferences;
		} catch (error) {
			console.error('❌ Error obteniendo preferencias:', error);
			return null;
		}
	}

	/**
	 * Desregistra el token de push notification
	 */
	async unregisterPushToken(deviceId: string): Promise<boolean> {
		try {
			const authToken = await AsyncStorage.getItem('authToken');
			
			const response = await fetch(`${this.baseURL}/notifications/unregister-token`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': authToken ? `Bearer ${authToken}` : '',
				},
				body: JSON.stringify({ deviceId }),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			console.log('✅ Token desregistrado exitosamente');
			return true;
		} catch (error) {
			console.error('❌ Error desregistrando token:', error);
			return false;
		}
	}

	/**
	 * Envía una notificación de prueba
	 */
	async sendTestNotification(): Promise<boolean> {
		try {
			const authToken = await AsyncStorage.getItem('authToken');
			
			const response = await fetch(`${this.baseURL}/notifications/test`, {
				method: 'POST',
				headers: {
					'Authorization': authToken ? `Bearer ${authToken}` : '',
				},
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			console.log('✅ Notificación de prueba enviada');
			return true;
		} catch (error) {
			console.error('❌ Error enviando notificación de prueba:', error);
			return false;
		}
	}
}

// Exportar instancia singleton
export const pushNotificationAPI = new PushNotificationAPI();
export type { PushTokenData, NotificationPreferences };