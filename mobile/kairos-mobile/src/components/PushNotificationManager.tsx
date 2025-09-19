import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useTheme from '../hooks/useTheme';

interface PushNotificationManagerProps {
	children: React.ReactNode;
	onNotificationReceived?: (notification: Notifications.Notification) => void;
	onNotificationResponse?: (response: Notifications.NotificationResponse) => void;
}

const PushNotificationManager: React.FC<PushNotificationManagerProps> = ({
	children,
	onNotificationReceived,
	onNotificationResponse,
}) => {
	const { colors } = useTheme();
	const [isInitialized, setIsInitialized] = useState(false);
	const [permissionStatus, setPermissionStatus] = useState<string>('unknown');

	useEffect(() => {
		initializeNotifications();
		return () => {
			notificationService.cleanup();
		};
	}, []);

	// Escuchar cambios en el estado de autenticación
	useEffect(() => {
		const checkAuthAndSync = async () => {
			const authToken = await AsyncStorage.getItem('authToken');
			if (authToken && isInitialized) {
				// Sincronizar token pendiente si el usuario se autenticó
				await notificationService.syncPendingToken();
			}
		};

		const interval = setInterval(checkAuthAndSync, 5000); // Verificar cada 5 segundos
		return () => clearInterval(interval);
	}, [isInitialized]);

	const initializeNotifications = async () => {
		try {
			// Inicializar el servicio de notificaciones
			await notificationService.initialize();

			// Registrar para notificaciones push
			const token = await notificationService.registerForPushNotifications();
			if (token) {
				console.log('Push token obtenido:', token);
				setPermissionStatus('granted');
			} else {
				setPermissionStatus('denied');
			}

			// Configurar listeners personalizados si se proporcionan
			if (onNotificationReceived) {
				Notifications.addNotificationReceivedListener(onNotificationReceived);
			}

			if (onNotificationResponse) {
				Notifications.addNotificationResponseReceivedListener(onNotificationResponse);
			}

			setIsInitialized(true);
		} catch (error) {
			console.error('Error inicializando notificaciones:', error);
			Alert.alert(
				'Error de Notificaciones',
				'No se pudieron configurar las notificaciones push. Algunas funciones pueden no estar disponibles.'
			);
		}
	};

	const requestPermissions = async () => {
		try {
			const token = await notificationService.registerForPushNotifications();
			if (token) {
				setPermissionStatus('granted');
				Alert.alert(
					'¡Perfecto!',
					'Las notificaciones push han sido habilitadas. Ahora recibirás actualizaciones importantes.'
				);
			} else {
				setPermissionStatus('denied');
				Alert.alert(
					'Permisos Denegados',
					'Para recibir notificaciones importantes, ve a Configuración y habilita las notificaciones para Kairos.'
				);
			}
		} catch (error) {
			console.error('Error solicitando permisos:', error);
		}
	};

	if (!isInitialized) {
		return (
			<View style={styles.loadingContainer}>
				<Text style={styles.loadingText}>Configurando notificaciones...</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{children}
			{permissionStatus === 'denied' && (
				<View style={styles.permissionBanner}>
					<Text style={styles.permissionText}>
						📱 Habilita las notificaciones para no perderte actualizaciones importantes
					</Text>
					<Text style={styles.permissionAction} onPress={requestPermissions}>
						Habilitar
					</Text>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: colors.background,
	},
	loadingText: {
		fontSize: 16,
		color: colors.text.secondary,
		textAlign: 'center',
	},
	permissionBanner: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: colors.error,
		padding: 16,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	permissionText: {
		color: 'white',
		flex: 1,
		fontSize: 14,
		marginRight: 12,
	},
	permissionAction: {
		color: 'white',
		fontWeight: 'bold',
		fontSize: 14,
		textDecorationLine: 'underline',
	},
});

export default PushNotificationManager;