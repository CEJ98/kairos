import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Alert,
	Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../hooks/useTheme';
import useOffline from '../../hooks/useOffline';
import Card from '../../components/Card';
import Button from '../../components/Button';
import OfflineIndicator from '../../components/OfflineIndicator';
import { LoadingOverlay } from '../../components/LoadingStates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProfileStackParamList } from '../../navigation/types';

type OfflineSettingsNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'OfflineSettings'>;

interface OfflinePreferences {
	autoSync: boolean;
	syncOnWiFiOnly: boolean;
	keepDataDays: number;
	notifyWhenOffline: boolean;
	maxOfflineWorkouts: number;
}

const DEFAULT_PREFERENCES: OfflinePreferences = {
	autoSync: true,
	syncOnWiFiOnly: true,
	keepDataDays: 30,
	notifyWhenOffline: true,
	maxOfflineWorkouts: 50,
};

export default function OfflineSettingsScreen() {
	const navigation = useNavigation<OfflineSettingsNavigationProp>();
	const { colors } = useTheme();
	const {
		offlineState,
		isLoading,
		syncManually,
		clearAllOfflineData,
		getOfflineWorkouts,
		getOfflineWorkoutSessions,
	} = useOffline();

	const [preferences, setPreferences] = useState<OfflinePreferences>(DEFAULT_PREFERENCES);
	const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
	const [storageSize, setStorageSize] = useState<string>('0 MB');
	const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

	// Cargar preferencias guardadas
	useEffect(() => {
		loadPreferences();
		calculateStorageSize();
		loadLastSyncTime();
	}, []);

	const loadPreferences = async () => {
		try {
			const savedPrefs = await AsyncStorage.getItem('@kairos_offline_preferences');
			if (savedPrefs) {
				setPreferences(JSON.parse(savedPrefs));
			}
		} catch (error) {
			console.error('Error loading offline preferences:', error);
		} finally {
			setIsLoadingPrefs(false);
		}
	};

	const savePreferences = async (newPrefs: OfflinePreferences) => {
		try {
			await AsyncStorage.setItem('@kairos_offline_preferences', JSON.stringify(newPrefs));
			setPreferences(newPrefs);
		} catch (error) {
			console.error('Error saving offline preferences:', error);
			Alert.alert('Error', 'No se pudieron guardar las preferencias');
		}
	};

	const calculateStorageSize = async () => {
		try {
			const [workouts, sessions] = await Promise.all([
				getOfflineWorkouts(),
				getOfflineWorkoutSessions(),
			]);

			// Estimación aproximada del tamaño
			const workoutsSize = JSON.stringify(workouts).length;
			const sessionsSize = JSON.stringify(sessions).length;
			const totalBytes = workoutsSize + sessionsSize;
			const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
			setStorageSize(`${totalMB} MB`);
		} catch (error) {
			console.error('Error calculating storage size:', error);
			setStorageSize('Error');
		}
	};

	const loadLastSyncTime = async () => {
		try {
			const lastSync = await AsyncStorage.getItem('@kairos_last_sync_time');
			if (lastSync) {
				const date = new Date(lastSync);
				setLastSyncTime(date.toLocaleString('es-ES'));
			}
		} catch (error) {
			console.error('Error loading last sync time:', error);
		}
	};

	const handleSync = async () => {
		try {
			await syncManually();
			await AsyncStorage.setItem('@kairos_last_sync_time', new Date().toISOString());
			await loadLastSyncTime();
			Alert.alert('Éxito', 'Sincronización completada');
		} catch (error) {
			Alert.alert('Error', 'No se pudo completar la sincronización');
		}
	};

	const handleClearData = () => {
		Alert.alert(
			'Limpiar datos offline',
			'¿Estás seguro de que quieres eliminar todos los datos offline? Esta acción no se puede deshacer.',
			[
				{ text: 'Cancelar', style: 'cancel' },
				{
					text: 'Eliminar',
					style: 'destructive',
					onPress: async () => {
						try {
							await clearAllOfflineData();
							await calculateStorageSize();
							Alert.alert('Éxito', 'Datos offline eliminados');
						} catch (error) {
							Alert.alert('Error', 'No se pudieron eliminar los datos');
						}
					},
				},
			]
		);
	};

	const updatePreference = <K extends keyof OfflinePreferences>(
		key: K,
		value: OfflinePreferences[K]
	) => {
		const newPrefs = { ...preferences, [key]: value };
		savePreferences(newPrefs);
	};

	const renderSettingItem = (
		title: string,
		description: string,
		value: boolean,
		onChange: (value: boolean) => void,
		icon: string
	) => (
		<View style={styles.settingItem}>
			<View style={styles.settingIcon}>
				<Ionicons name={icon as any} size={24} color={colors.primary} />
			</View>
			<View style={styles.settingContent}>
				<Text style={[styles.settingTitle, { color: colors.text.primary }]}>
					{title}
				</Text>
				<Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
					{description}
				</Text>
			</View>
			<Switch
				value={value}
				onValueChange={onChange}
				trackColor={{ false: colors.border, true: colors.primary + '40' }}
				thumbColor={value ? colors.primary : colors.text.secondary}
			/>
		</View>
	);

	const renderStatItem = (label: string, value: string, icon: string) => (
		<View style={styles.statItem}>
			<Ionicons name={icon as any} size={20} color={colors.primary} />
			<View style={styles.statContent}>
				<Text style={[styles.statLabel, { color: colors.text.secondary }]}>
					{label}
				</Text>
				<Text style={[styles.statValue, { color: colors.text.primary }]}>
					{value}
				</Text>
			</View>
		</View>
	);

	if (isLoadingPrefs) {
		return (
			<LoadingOverlay
				visible={true}
				message="Cargando configuración offline..."
			/>
		);
	}

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
				{/* Estado actual */}
				<Card style={styles.section}>
					<Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
						Estado Actual
					</Text>
					<OfflineIndicator showDetails={true} />
				</Card>

				{/* Estadísticas */}
				<Card style={styles.section}>
					<Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
						Estadísticas de Almacenamiento
					</Text>
					<View style={styles.statsContainer}>
						{renderStatItem(
							'Rutinas guardadas',
							offlineState.workoutsCount.toString(),
							'fitness-outline'
						)}
						{renderStatItem(
							'Sesiones completadas',
							offlineState.sessionsCount.toString(),
							'checkmark-circle-outline'
						)}
						{renderStatItem(
							'Pendientes de sincronizar',
							offlineState.pendingSyncCount.toString(),
							'sync-outline'
						)}
						{renderStatItem(
							'Espacio utilizado',
							storageSize,
							'archive-outline'
						)}
						{lastSyncTime && renderStatItem(
							'Última sincronización',
							lastSyncTime,
							'time-outline'
						)}
					</View>
				</Card>

				{/* Configuración de sincronización */}
				<Card style={styles.section}>
					<Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
						Configuración de Sincronización
					</Text>
					{renderSettingItem(
						'Sincronización automática',
						'Sincronizar automáticamente cuando haya conexión',
						preferences.autoSync,
						(value) => updatePreference('autoSync', value),
						'sync'
					)}
					{renderSettingItem(
						'Solo WiFi',
						'Sincronizar solo cuando esté conectado a WiFi',
						preferences.syncOnWiFiOnly,
						(value) => updatePreference('syncOnWiFiOnly', value),
						'wifi'
					)}
				</Card>

				{/* Configuración de notificaciones */}
				<Card style={styles.section}>
					<Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
						Notificaciones
					</Text>
					{renderSettingItem(
						'Notificar modo offline',
						'Mostrar notificación cuando se pierda la conexión',
						preferences.notifyWhenOffline,
						(value) => updatePreference('notifyWhenOffline', value),
						'notifications'
					)}
				</Card>

				{/* Acciones */}
				<Card style={styles.section}>
					<Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
						Acciones
					</Text>
					<View style={styles.actionsContainer}>
						<Button
							title="Sincronizar ahora"
							onPress={handleSync}
							variant="primary"
							fullWidth
							loading={isLoading}
							disabled={!offlineState.isConnected || offlineState.pendingSyncCount === 0}
							style={styles.actionButton}
						/>
						<Button
							title="Limpiar datos offline"
							onPress={handleClearData}
							variant="outline"
							fullWidth
							style={{
								...styles.actionButton,
								borderColor: colors.error,
							}}
							textStyle={{ color: colors.error }}
						/>
					</View>
				</Card>

				{/* Información adicional */}
				<Card style={{
					...styles.section,
					...styles.infoSection,
				}}>
					<View style={styles.infoHeader}>
						<Ionicons name="information-circle" size={24} color={colors.info} />
						<Text style={[styles.infoTitle, { color: colors.text.primary }]}>
							Acerca del modo offline
						</Text>
					</View>
					<Text style={[styles.infoText, { color: colors.text.secondary }]}>
						El modo offline te permite crear y realizar entrenamientos sin conexión a internet. 
						Todos los datos se guardan localmente y se sincronizan automáticamente cuando 
						se restablece la conexión.
					</Text>
				</Card>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
		padding: 16,
	},
	section: {
		marginBottom: 16,
		padding: 16,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 16,
	},
	statsContainer: {
		gap: 12,
	},
	statItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	statContent: {
		flex: 1,
	},
	statLabel: {
		fontSize: 14,
		marginBottom: 2,
	},
	statValue: {
		fontSize: 16,
		fontWeight: '600',
	},
	settingItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		gap: 12,
	},
	settingIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(0,0,0,0.05)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	settingContent: {
		flex: 1,
	},
	settingTitle: {
		fontSize: 16,
		fontWeight: '500',
		marginBottom: 2,
	},
	settingDescription: {
		fontSize: 14,
	},
	actionsContainer: {
		gap: 12,
	},
	actionButton: {
		marginBottom: 0,
	},
	infoSection: {
		backgroundColor: 'rgba(0,0,0,0.02)',
	},
	infoHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginBottom: 12,
	},
	infoTitle: {
		fontSize: 16,
		fontWeight: '600',
	},
	infoText: {
		fontSize: 14,
		lineHeight: 20,
	},
});