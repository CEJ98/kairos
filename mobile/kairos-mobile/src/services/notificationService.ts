import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

// Configuración de notificaciones
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: true,
		shouldShowBanner: true,
		shouldShowList: true,
	}),
});

export interface NotificationData {
	title: string;
	body: string;
	data?: any;
	scheduledTime?: Date;
}

export interface PushToken {
	token: string;
	type: 'expo' | 'fcm' | 'apns';
}

class NotificationService {
	private expoPushToken: string | null = null;
	private notificationListener: any = null;
	private responseListener: any = null;

	/**
	 * Inicializa el servicio de notificaciones
	 */
	async initialize(): Promise<void> {
		try {
			// Registrar para notificaciones push
			await this.registerForPushNotifications();
			
			// Configurar listeners
			this.setupNotificationListeners();
			
			// Cargar token guardado
			const savedToken = await AsyncStorage.getItem('expoPushToken');
			if (savedToken) {
				this.expoPushToken = savedToken;
			}
		} catch (error) {
			console.error('Error inicializando notificaciones:', error);
		}
	}

	/**
	 * Registra el dispositivo para recibir notificaciones push
	 */
	async registerForPushNotifications(): Promise<string | null> {
		let token = null;

		if (Device.isDevice) {
			const { status: existingStatus } = await Notifications.getPermissionsAsync();
			let finalStatus = existingStatus;

			if (existingStatus !== 'granted') {
				const { status } = await Notifications.requestPermissionsAsync();
				finalStatus = status;
			}

			if (finalStatus !== 'granted') {
				console.warn('Permisos de notificación denegados');
				return null;
			}

			try {
				const tokenData = await Notifications.getExpoPushTokenAsync({
					projectId: 'your-expo-project-id', // Reemplazar con el ID real del proyecto
				});
				token = tokenData.data;
				this.expoPushToken = token;
				
				// Guardar token localmente
				await AsyncStorage.setItem('expoPushToken', token);
				
				// Enviar token al servidor
				await this.sendTokenToServer(token);
			} catch (error) {
				console.error('Error obteniendo token de push:', error);
			}
		} else {
			console.warn('Debe usar un dispositivo físico para notificaciones push');
		}

		// Configuración específica de Android
		if (Platform.OS === 'android') {
			await Notifications.setNotificationChannelAsync('default', {
				name: 'default',
				importance: Notifications.AndroidImportance.MAX,
				vibrationPattern: [0, 250, 250, 250],
				lightColor: '#FF231F7C',
			});
		}

		return token;
	}

	/**
	 * Configura los listeners para notificaciones
	 */
	private setupNotificationListeners(): void {
		// Listener para notificaciones recibidas mientras la app está abierta
		this.notificationListener = Notifications.addNotificationReceivedListener(
			(notification) => {
				console.log('Notificación recibida:', notification);
				// Aquí puedes manejar la notificación recibida
			}
		);

		// Listener para cuando el usuario toca una notificación
		this.responseListener = Notifications.addNotificationResponseReceivedListener(
			(response) => {
				console.log('Respuesta a notificación:', response);
				// Aquí puedes manejar la navegación basada en la notificación
				this.handleNotificationResponse(response);
			}
		);
	}

	/**
	 * Maneja la respuesta del usuario a una notificación
	 */
	private handleNotificationResponse(response: Notifications.NotificationResponse): void {
		const { notification } = response;
		const data = notification.request.content.data;

		// Navegar según el tipo de notificación
		if (data?.screen) {
			// Aquí implementarías la navegación
			console.log('Navegar a:', data.screen);
		}
	}

	/**
	 * Envía el token al servidor backend
	 */
	private async sendTokenToServer(token: string): Promise<void> {
		try {
			// Obtener el token de autenticación del usuario
			const authToken = await AsyncStorage.getItem('authToken');
			if (!authToken) {
				console.log('No hay token de autenticación, guardando token localmente');
				await AsyncStorage.setItem('pendingPushToken', token);
				return;
			}

			// Enviar token al servidor web
			const response = await fetch(`${API_CONFIG.baseURL}/api/notifications/subscribe`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${authToken}`,
				},
				body: JSON.stringify({
					subscription: {
						endpoint: `expo:${token}`,
						keys: {
							p256dh: 'mobile-app',
							auth: 'mobile-app'
						}
					},
					platform: Platform.OS,
					deviceId: Constants.deviceId || 'unknown'
				})
			});

			if (response.ok) {
				console.log('Token registrado exitosamente en el servidor');
				// Limpiar token pendiente si existe
				await AsyncStorage.removeItem('pendingPushToken');
			} else {
				console.error('Error registrando token:', response.status);
			}
		} catch (error) {
			console.error('Error enviando token al servidor:', error);
			// Guardar token para reintento posterior
			await AsyncStorage.setItem('pendingPushToken', token);
		}
	}

	/**
	 * Programa una notificación local
	 */
	async scheduleLocalNotification(notificationData: NotificationData): Promise<string> {
		const { title, body, data, scheduledTime } = notificationData;

		const notificationRequest: Notifications.NotificationRequestInput = {
			content: {
				title,
				body,
				data: data || {},
				sound: 'default',
			},
			trigger: scheduledTime ? { date: scheduledTime } as Notifications.DateTriggerInput : null,
		};

		const identifier = await Notifications.scheduleNotificationAsync(notificationRequest);

		return identifier;
	}

	/**
	 * Cancela una notificación programada
	 */
	async cancelNotification(identifier: string): Promise<void> {
		await Notifications.cancelScheduledNotificationAsync(identifier);
	}

	/**
	 * Cancela todas las notificaciones programadas
	 */
	async cancelAllNotifications(): Promise<void> {
		await Notifications.cancelAllScheduledNotificationsAsync();
	}

	/**
	 * Obtiene todas las notificaciones programadas
	 */
	async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
		return await Notifications.getAllScheduledNotificationsAsync();
	}

	/**
	 * Obtiene el token de push actual
	 */
	getPushToken(): string | null {
		return this.expoPushToken;
	}

	/**
	 * Verifica si las notificaciones están habilitadas
	 */
	async areNotificationsEnabled(): Promise<boolean> {
		const { status } = await Notifications.getPermissionsAsync();
		return status === 'granted';
	}

	/**
	 * Programa notificaciones de recordatorio de entrenamiento
	 */
	async scheduleWorkoutReminder(workoutTime: Date, workoutName: string): Promise<string> {
		// Programar 30 minutos antes del entrenamiento
		const reminderTime = new Date(workoutTime.getTime() - 30 * 60 * 1000);

		return await this.scheduleLocalNotification({
			title: '🏋️ Recordatorio de Entrenamiento',
			body: `Tu entrenamiento "${workoutName}" comienza en 30 minutos`,
			data: {
				type: 'workout_reminder',
				workoutName,
				screen: 'WorkoutDetail'
			},
			scheduledTime: reminderTime
		});
	}

	/**
	 * Programa notificación de logro
	 */
	async scheduleAchievementNotification(achievement: string): Promise<string> {
		return await this.scheduleLocalNotification({
			title: '🎉 ¡Nuevo Logro Desbloqueado!',
			body: achievement,
			data: {
				type: 'achievement',
				screen: 'Achievements'
			}
		});
	}

	/**
	 * Limpia los listeners al destruir el servicio
	 */
	/**
	 * Sincroniza tokens pendientes después de autenticación
	 */
	async syncPendingToken(): Promise<void> {
		try {
			const pendingToken = await AsyncStorage.getItem('pendingPushToken');
			if (pendingToken) {
				await this.sendTokenToServer(pendingToken);
			}
		} catch (error) {
			console.error('Error sincronizando token pendiente:', error);
		}
	}

	/**
	 * Desregistra el token del servidor
	 */
	async unregisterFromServer(): Promise<void> {
		try {
			const authToken = await AsyncStorage.getItem('authToken');
			if (!authToken || !this.expoPushToken) return;

			await fetch(`${API_CONFIG.baseURL}/api/notifications/unsubscribe`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${authToken}`,
				},
				body: JSON.stringify({
					subscription: {
						endpoint: `expo:${this.expoPushToken}`
					}
				})
			});

			console.log('Token desregistrado del servidor');
		} catch (error) {
			console.error('Error desregistrando token:', error);
		}
	}

	cleanup(): void {
		if (this.notificationListener) {
			Notifications.removeNotificationSubscription(this.notificationListener);
		}
		if (this.responseListener) {
			Notifications.removeNotificationSubscription(this.responseListener);
		}
	}
}

// Instancia singleton del servicio
export const notificationService = new NotificationService();
export default notificationService;