import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuración de notificaciones
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: false,
		shouldShowBanner: true,
		shouldShowList: true,
	}),
});

export interface NotificationPermissions {
	granted: boolean;
	canAskAgain: boolean;
	status: string;
}

export interface PushNotificationHook {
	expoPushToken: string | null;
	permissions: NotificationPermissions | null;
	notification: Notifications.Notification | null;
	requestPermissions: () => Promise<boolean>;
	scheduleNotification: (title: string, body: string, seconds?: number) => Promise<string | null>;
	cancelNotification: (identifier: string) => Promise<void>;
	cancelAllNotifications: () => Promise<void>;
	isLoading: boolean;
}

export function useNotifications(): PushNotificationHook {
	const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
	const [permissions, setPermissions] = useState<NotificationPermissions | null>(null);
	const [notification, setNotification] = useState<Notifications.Notification | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const notificationListener = useRef<Notifications.Subscription>();
	const responseListener = useRef<Notifications.Subscription>();

	useEffect(() => {
		initializeNotifications();

		// Configurar listeners
		notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
			setNotification(notification);
		});

		responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
			console.log('Notification response:', response);
			// Aquí puedes manejar la navegación
		});

		return () => {
			if (notificationListener.current) {
				Notifications.removeNotificationSubscription(notificationListener.current);
			}
			if (responseListener.current) {
				Notifications.removeNotificationSubscription(responseListener.current);
			}
		};
	}, []);

	const initializeNotifications = async () => {
		try {
			setIsLoading(true);
			
			// Verificar permisos actuales
			const { status, canAskAgain } = await Notifications.getPermissionsAsync();
			setPermissions({
				granted: status === 'granted',
				canAskAgain,
				status
			});

			// Configurar canal de Android
			if (Platform.OS === 'android') {
				await Notifications.setNotificationChannelAsync('default', {
					name: 'default',
					importance: Notifications.AndroidImportance.MAX,
					vibrationPattern: [0, 250, 250, 250],
					lightColor: '#FF231F7C',
				});
			}

			// Obtener token si hay permisos
			if (status === 'granted') {
				await getExpoPushToken();
			}
		} catch (error) {
			console.error('Error inicializando notificaciones:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const getExpoPushToken = async () => {
		if (!Device.isDevice) {
			console.warn('Debe usar un dispositivo físico para notificaciones push');
			return;
		}

		try {
			// Verificar si ya tenemos un token guardado
			const savedToken = await AsyncStorage.getItem('expoPushToken');
			if (savedToken) {
				setExpoPushToken(savedToken);
				return;
			}

			// Obtener nuevo token
			const token = await Notifications.getExpoPushTokenAsync({
				projectId: 'your-project-id', // Reemplazar con el ID real
			});

			if (token.data) {
				setExpoPushToken(token.data);
				await AsyncStorage.setItem('expoPushToken', token.data);
				console.log('Push token obtenido:', token.data);
			}
		} catch (error) {
			console.error('Error obteniendo push token:', error);
		}
	};

	const requestPermissions = async (): Promise<boolean> => {
		try {
			const { status } = await Notifications.requestPermissionsAsync();
			const granted = status === 'granted';
			
			setPermissions(prev => ({
				granted,
				canAskAgain: prev?.canAskAgain ?? true,
				status
			}));

			if (granted) {
				await getExpoPushToken();
			}

			return granted;
		} catch (error) {
			console.error('Error solicitando permisos:', error);
			return false;
		}
	};

	const scheduleNotification = async (
		title: string,
		body: string,
		seconds: number = 0
	): Promise<string | null> => {
		try {
			const identifier = await Notifications.scheduleNotificationAsync({
				content: {
					title,
					body,
					sound: 'default',
				},
				trigger: seconds > 0 ? { seconds } : undefined,
			});

			return identifier;
		} catch (error) {
			console.error('Error programando notificación:', error);
			return null;
		}
	};

	const cancelNotification = async (identifier: string): Promise<void> => {
		try {
			await Notifications.cancelScheduledNotificationAsync(identifier);
		} catch (error) {
			console.error('Error cancelando notificación:', error);
		}
	};

	const cancelAllNotifications = async (): Promise<void> => {
		try {
			await Notifications.cancelAllScheduledNotificationsAsync();
		} catch (error) {
			console.error('Error cancelando todas las notificaciones:', error);
		}
	};

	return {
		expoPushToken,
		permissions,
		notification,
		requestPermissions,
		scheduleNotification,
		cancelNotification,
		cancelAllNotifications,
		isLoading
	};
}

export default useNotifications;