import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useTheme from '../hooks/useTheme';
import Card from './Card';
import { pushNotificationAPI, type NotificationPreferences } from '../services/pushNotificationAPI';

// Configurar el handler de notificaciones
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: false,
		shouldShowBanner: true,
		shouldShowList: true,
	}),
});

interface NotificationSettingsProps {
	onPermissionChange?: (granted: boolean) => void;
}

export default function NotificationSettings({ onPermissionChange }: NotificationSettingsProps) {
	const { colors } = useTheme();
	const [pushEnabled, setPushEnabled] = useState(false);

	const [isLoading, setIsLoading] = useState(false);
	const [pushToken, setPushToken] = useState<string | null>(null);
	const [permissions, setPermissions] = useState<Notifications.NotificationPermissionsStatus>({
		granted: false,
		canAskAgain: true,
		status: Notifications.PermissionStatus.UNDETERMINED,
		expires: 'never',
	});
	const [preferences, setPreferences] = useState<NotificationPreferences>({
		workoutReminders: true,
		achievements: true,
		socialUpdates: false,
		promotions: false,
	});

	React.useEffect(() => {
		checkNotificationStatus();
		loadNotificationPreferences();
	}, []);

	const checkNotificationStatus = async () => {
		try {
			const { status } = await Notifications.getPermissionsAsync();
			setPushEnabled(status === 'granted');
			
			if (status === 'granted') {
				const savedToken = await AsyncStorage.getItem('expoPushToken');
				setPushToken(savedToken);
			}
		} catch (error) {
			console.error('Error verificando estado de notificaciones:', error);
		}
	};

	const requestNotificationPermissions = async () => {
		if (!Device.isDevice) {
			Alert.alert(
				'Dispositivo requerido',
				'Las notificaciones push requieren un dispositivo físico.'
			);
			return;
		}

		setIsLoading(true);
		try {
			const { status } = await Notifications.requestPermissionsAsync();
			const granted = status === 'granted';
			
			setPushEnabled(granted);
			onPermissionChange?.(granted);

			if (granted) {
				// Obtener token de push
				try {
					const tokenData = await Notifications.getExpoPushTokenAsync({
						projectId: 'kairos-fitness-app', // Cambiar por el ID real del proyecto
					});
					
					if (tokenData.data) {
					setPushToken(tokenData.data);
					await AsyncStorage.setItem('expoPushToken', tokenData.data);
					console.log('Push token:', tokenData.data);

					// Registrar token en el servidor
					const deviceId = await AsyncStorage.getItem('deviceId') || Device.deviceName || 'unknown';
					await pushNotificationAPI.registerPushToken({
						token: tokenData.data,
						deviceId,
						platform: Device.osName === 'iOS' ? 'ios' : 'android',
					});
				}
				} catch (tokenError) {
					console.error('Error obteniendo push token:', tokenError);
				}

				Alert.alert(
					'¡Perfecto!',
					'Las notificaciones están habilitadas. Recibirás recordatorios de entrenamientos y alertas de logros.'
				);
			} else {
				Alert.alert(
					'Permisos denegados',
					'Para recibir recordatorios de entrenamientos, habilita las notificaciones en la configuración de tu dispositivo.'
				);
			}
		} catch (error) {
			console.error('Error solicitando permisos:', error);
			Alert.alert('Error', 'No se pudieron configurar las notificaciones.');
		} finally {
			setIsLoading(false);
		}
	};

	// Cargar preferencias de notificación desde el servidor
	const loadNotificationPreferences = async () => {
		try {
			const serverPreferences = await pushNotificationAPI.getNotificationPreferences();
			if (serverPreferences) {
				setPreferences(serverPreferences);
			}
		} catch (error) {
			console.error('Error cargando preferencias:', error);
		}
	};

	// Actualizar preferencias de notificación
	const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
		const updatedPreferences = { ...preferences, ...newPreferences };
		setPreferences(updatedPreferences);
		
		try {
			await pushNotificationAPI.updateNotificationPreferences(updatedPreferences);
			console.log('✅ Preferencias actualizadas');
		} catch (error) {
			console.error('❌ Error actualizando preferencias:', error);
		}
	};

	const testNotification = async () => {
		if (!pushEnabled) {
			Alert.alert(
				'Notificaciones deshabilitadas',
				'Primero habilita las notificaciones para probar esta función.'
			);
			return;
		}

		try {
			await Notifications.scheduleNotificationAsync({
				content: {
					title: '🏋️ Kairos Fitness',
					body: '¡Notificación de prueba! Todo funciona correctamente.',
					data: { test: true },
				},
				trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1, repeats: false },
		});

			// También enviar notificación desde el servidor
			await pushNotificationAPI.sendTestNotification();

			Alert.alert(
				'Notificación enviada',
				'Recibirás una notificación de prueba en unos segundos.'
			);
		} catch (error) {
			console.error('Error enviando notificación de prueba:', error);
			Alert.alert('Error', 'No se pudo enviar la notificación de prueba.');
		}
	};

	const renderSettingRow = (
		icon: keyof typeof Ionicons.glyphMap,
		title: string,
		description: string,
		value: boolean,
		onValueChange: (value: boolean) => void,
		disabled: boolean = false
	) => (
		<View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
			<View style={styles.settingIcon}>
				<Ionicons 
					name={icon} 
					size={24} 
					color={disabled ? colors.text.secondary : colors.primary} 
				/>
			</View>
			<View style={styles.settingContent}>
				<Text style={[styles.settingTitle, { 
					color: disabled ? colors.text.secondary : colors.text.primary 
				}]}>
					{title}
				</Text>
				<Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
					{description}
				</Text>
			</View>
			<Switch
				value={value}
				onValueChange={onValueChange}
				disabled={disabled}
				trackColor={{ false: colors.border, true: colors.primary }}
				thumbColor={colors.card}
			/>
		</View>
	);

	return (
		<Card style={styles.container}>
			<Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
				Notificaciones Push
			</Text>

			{/* Estado principal de notificaciones */}
			<View style={[styles.mainSetting, { backgroundColor: colors.card }]}>
				<View style={styles.mainSettingContent}>
					<Ionicons 
						name={pushEnabled ? 'notifications' : 'notifications-off'} 
						size={32} 
						color={pushEnabled ? colors.primary : colors.text.secondary} 
					/>
					<View style={styles.mainSettingText}>
						<Text style={[styles.mainSettingTitle, { color: colors.text.primary }]}>
							{pushEnabled ? 'Notificaciones Habilitadas' : 'Notificaciones Deshabilitadas'}
						</Text>
						<Text style={[styles.mainSettingDescription, { color: colors.text.secondary }]}>
							{pushEnabled 
								? 'Recibirás recordatorios y alertas importantes'
								: 'Toca para habilitar notificaciones'
							}
						</Text>
					</View>
				</View>
				
				{!pushEnabled && (
					<TouchableOpacity
						style={[styles.enableButton, { backgroundColor: colors.primary }]}
						onPress={requestNotificationPermissions}
						disabled={isLoading}
						activeOpacity={0.7}
					>
						<Text style={styles.enableButtonText}>
							{isLoading ? 'Configurando...' : 'Habilitar'}
						</Text>
					</TouchableOpacity>
				)}
			</View>

			{/* Configuraciones específicas */}
			{renderSettingRow(
				'fitness',
				'Recordatorios de Entrenamiento',
				'Recibe alertas antes de tus entrenamientos programados',
				preferences.workoutReminders,
				(value) => updatePreferences({ workoutReminders: value }),
				!pushEnabled
			)}

			{renderSettingRow(
				'trophy',
				'Alertas de Logros',
				'Notificaciones cuando alcances nuevos objetivos',
				preferences.achievements,
				(value) => updatePreferences({ achievements: value }),
				!pushEnabled
			)}

			{renderSettingRow(
				'people',
				'Actividad Social',
				'Notificaciones de amigos y comunidad',
				preferences.socialUpdates,
				(value) => updatePreferences({ socialUpdates: value }),
				!pushEnabled
			)}

			{renderSettingRow(
				'pricetag',
				'Promociones',
				'Ofertas especiales y contenido premium',
				preferences.promotions,
				(value) => updatePreferences({ promotions: value }),
				!pushEnabled
			)}

			{/* Botón de prueba */}
			{pushEnabled && (
				<TouchableOpacity
					style={[styles.testButton, { borderColor: colors.primary }]}
					onPress={testNotification}
					activeOpacity={0.7}
				>
					<Ionicons name="send" size={20} color={colors.primary} />
					<Text style={[styles.testButtonText, { color: colors.primary }]}>
						Enviar Notificación de Prueba
					</Text>
				</TouchableOpacity>
			)}

			{/* Información del token (solo para desarrollo) */}
			{pushToken && __DEV__ && (
				<View style={[styles.tokenInfo, { backgroundColor: colors.card }]}>
					<Text style={[styles.tokenLabel, { color: colors.text.primary }]}>
					Push Token (Dev):
				</Text>
				<Text style={[styles.tokenText, { color: colors.text.primary }]} numberOfLines={2}>
						{pushToken}
					</Text>
				</View>
			)}
		</Card>
	);
}

const styles = StyleSheet.create({
	container: {
		margin: 16,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 16,
	},
	mainSetting: {
		padding: 16,
		borderRadius: 12,
		marginBottom: 16,
	},
	mainSettingContent: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	mainSettingText: {
		flex: 1,
		marginLeft: 16,
	},
	mainSettingTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 4,
	},
	mainSettingDescription: {
		fontSize: 14,
	},
	enableButton: {
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8,
		alignItems: 'center',
	},
	enableButtonText: {
		color: '#FFFFFF',
		fontWeight: '600',
		fontSize: 16,
	},
	settingRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 16,
		borderBottomWidth: 1,
	},
	settingIcon: {
		width: 40,
		alignItems: 'center',
	},
	settingContent: {
		flex: 1,
		marginLeft: 12,
	},
	settingTitle: {
		fontSize: 16,
		fontWeight: '500',
		marginBottom: 4,
	},
	settingDescription: {
		fontSize: 14,
	},
	testButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		borderWidth: 1,
		marginTop: 16,
	},
	testButtonText: {
		marginLeft: 8,
		fontWeight: '500',
	},
	tokenInfo: {
		padding: 12,
		borderRadius: 8,
		marginTop: 16,
	},
	tokenLabel: {
		fontSize: 12,
		fontWeight: '500',
		marginBottom: 4,
	},
	tokenText: {
		fontSize: 10,
		fontFamily: 'monospace',
	},
});