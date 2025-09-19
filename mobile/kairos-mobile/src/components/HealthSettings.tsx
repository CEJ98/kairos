import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Switch, ScrollView } from 'react-native';
import useTheme from '../hooks/useTheme';
import useHealth from '../hooks/useHealth';
import Card from './Card';
import Button from './Button';
import type { HealthPreferences } from '../services/HealthService';

interface HealthSettingsProps {
	onHealthToggle?: (enabled: boolean) => void;
}

export default function HealthSettings({ onHealthToggle }: HealthSettingsProps) {
	const { colors } = useTheme();
	const {
		isInitialized,
		isAvailable,
		todayData,
		platformInfo,
		preferences,
		permissions,
		isLoading,
		error,
		initializeHealth,
		refreshData,
		updatePreferences,
		performAutoSync,
		disconnect,
		clearError
	} = useHealth();

	const [isInitializing, setIsInitializing] = useState(false);

	const handleHealthToggle = async (enabled: boolean) => {
		if (enabled && !isInitialized) {
			setIsInitializing(true);
			try {
				const success = await initializeHealth();
				if (success) {
					onHealthToggle?.(true);
					Alert.alert(
						'Integración activada',
						`Integración con ${platformInfo.platform} activada correctamente. Ahora puedes sincronizar tus datos de salud.`
					);
				} else {
					Alert.alert(
						'Error',
						'No se pudo activar la integración con el servicio de salud. Verifica los permisos.'
					);
				}
			} catch (error) {
				console.error('Error initializing health service:', error);
				Alert.alert(
					'Error',
					'Ocurrió un error al inicializar el servicio de salud.'
				);
			} finally {
				setIsInitializing(false);
			}
		} else if (!enabled && isInitialized) {
			try {
				await disconnect();
				onHealthToggle?.(false);
				Alert.alert(
					'Integración desactivada',
					'La integración con el servicio de salud ha sido desactivada.'
				);
			} catch (error) {
				console.error('Error disconnecting health service:', error);
			}
		}
	};

	const handleRefreshData = async () => {
		if (!isAvailable) return;

		try {
			await refreshData();
			Alert.alert('Datos actualizados', 'Los datos de salud se han actualizado correctamente.');
		} catch (error) {
			console.error('Error refreshing health data:', error);
			Alert.alert('Error', 'No se pudieron actualizar los datos de salud.');
		}
	};

	const handlePreferenceChange = async (key: keyof HealthPreferences, value: boolean) => {
		try {
			await updatePreferences({ [key]: value });
		} catch (error) {
			console.error('Error updating preference:', error);
			Alert.alert('Error', 'No se pudo actualizar la preferencia.');
		}
	};

	const handleAutoSync = async () => {
		try {
			const success = await performAutoSync();
			if (success) {
				Alert.alert('Sincronización completa', 'Los datos se han sincronizado correctamente.');
			} else {
				Alert.alert('Error', 'No se pudo completar la sincronización.');
			}
		} catch (error) {
			console.error('Error performing auto sync:', error);
			Alert.alert('Error', 'Ocurrió un error durante la sincronización.');
		}
	};

	return (
		<ScrollView style={styles.container}>
			{/* Estado de conexión */}
			<Card style={[styles.card, { backgroundColor: colors.surface }]}>
				<View style={styles.header}>
					<View style={styles.titleContainer}>
						<Text style={[styles.title, { color: colors.text.primary }]}>
							Integración con {platformInfo.platform}
						</Text>
						<Text style={[styles.subtitle, { color: colors.text.secondary }]}>
							{platformInfo.available
								? 'Sincroniza automáticamente tus datos de salud y fitness'
								: `${platformInfo.platform} no está disponible en este dispositivo`
							}
						</Text>
					</View>
					<Switch
						value={isInitialized}
						onValueChange={handleHealthToggle}
						disabled={!platformInfo.available || isInitializing || isLoading}
						trackColor={{ false: colors.border, true: colors.primary }}
						thumbColor={isInitialized ? colors.background : colors.text.secondary}
					/>
				</View>

				{(isInitializing || isLoading) && (
					<View style={styles.loadingContainer}>
						<Text style={[styles.loadingText, { color: colors.text.secondary }]}>
							{isInitializing ? 'Inicializando integración...' : 'Cargando...'}
						</Text>
					</View>
				)}

				{error && (
					<View style={styles.errorContainer}>
						<Text style={[styles.errorText, { color: colors.error }]}>
							{error}
						</Text>
						<Button
							title="Limpiar error"
							onPress={clearError}
							style={styles.errorButton}
							variant="outline"
						/>
					</View>
				)}
			</Card>

			{/* Permisos */}
			{isInitialized && (
				<Card style={[styles.card, { backgroundColor: colors.surface }]}>
					<Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Permisos</Text>
					<View style={styles.permissionItem}>
						<Text style={[styles.permissionLabel, { color: colors.text.primary }]}>Lectura</Text>
						<Text style={[styles.permissionStatus, { color: permissions.read ? colors.success : colors.error }]}>
							{permissions.read ? 'Concedido' : 'Denegado'}
						</Text>
					</View>
					<View style={styles.permissionItem}>
						<Text style={[styles.permissionLabel, { color: colors.text.primary }]}>Escritura</Text>
						<Text style={[styles.permissionStatus, { color: permissions.write ? colors.success : colors.error }]}>
							{permissions.write ? 'Concedido' : 'Denegado'}
						</Text>
					</View>
				</Card>
			)}

			{/* Preferencias */}
			{isInitialized && (
				<Card style={[styles.card, { backgroundColor: colors.surface }]}>
					<Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Configuración</Text>
					
					<View style={styles.preferenceItem}>
						<View style={styles.preferenceContent}>
						<Text style={[styles.preferenceLabel, { color: colors.text.primary }]}>Auto-sincronización</Text>
						<Text style={[styles.preferenceDescription, { color: colors.text.secondary }]}>Sincronizar datos automáticamente</Text>
					</View>
						<Switch
							value={preferences.autoSync}
							onValueChange={(value) => handlePreferenceChange('autoSync', value)}
							trackColor={{ false: colors.border, true: colors.primary }}
						/>
					</View>

					<View style={styles.preferenceItem}>
						<View style={styles.preferenceContent}>
						<Text style={[styles.preferenceLabel, { color: colors.text.primary }]}>Sincronizar entrenamientos</Text>
						<Text style={[styles.preferenceDescription, { color: colors.text.secondary }]}>Guardar entrenamientos en el servicio de salud</Text>
					</View>
						<Switch
							value={preferences.syncWorkouts}
							onValueChange={(value) => handlePreferenceChange('syncWorkouts', value)}
							trackColor={{ false: colors.border, true: colors.primary }}
						/>
					</View>

					<View style={styles.preferenceItem}>
						<View style={styles.preferenceContent}>
						<Text style={[styles.preferenceLabel, { color: colors.text.primary }]}>Sincronizar nutrición</Text>
						<Text style={[styles.preferenceDescription, { color: colors.text.secondary }]}>Sincronizar datos de nutrición</Text>
					</View>
						<Switch
							value={preferences.syncNutrition}
							onValueChange={(value) => handlePreferenceChange('syncNutrition', value)}
							trackColor={{ false: colors.border, true: colors.primary }}
						/>
					</View>

					<View style={styles.preferenceItem}>
						<View style={styles.preferenceContent}>
						<Text style={[styles.preferenceLabel, { color: colors.text.primary }]}>Sincronización en segundo plano</Text>
						<Text style={[styles.preferenceDescription, { color: colors.text.secondary }]}>Permitir sincronización cuando la app está cerrada</Text>
						</View>
						<Switch
							value={preferences.backgroundSync}
							onValueChange={(value) => handlePreferenceChange('backgroundSync', value)}
							trackColor={{ false: colors.border, true: colors.primary }}
						/>
					</View>

					<View style={styles.preferenceItem}>
						<View style={styles.preferenceContent}>
						<Text style={[styles.preferenceLabel, { color: colors.text.primary }]}>Notificaciones</Text>
						<Text style={[styles.preferenceDescription, { color: colors.text.secondary }]}>Recibir notificaciones sobre sincronización</Text>
					</View>
						<Switch
							value={preferences.notifications}
							onValueChange={(value) => handlePreferenceChange('notifications', value)}
							trackColor={{ false: colors.border, true: colors.primary }}
						/>
					</View>
				</Card>
			)}

			{/* Datos de salud */}
			{isAvailable && todayData && (
				<Card style={[styles.card, { backgroundColor: colors.surface }]}>
					<Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Datos de hoy</Text>
					<View style={styles.dataGrid}>
						<View style={[styles.dataItem, { backgroundColor: colors.background }]}>
							<Text style={[styles.dataValue, { color: colors.primary }]}>
								{todayData.steps?.toLocaleString() || '0'}
							</Text>
							<Text style={[styles.dataLabel, { color: colors.text.secondary }]}>
							Pasos
						</Text>
						</View>
						<View style={[styles.dataItem, { backgroundColor: colors.background }]}>
							<Text style={[styles.dataValue, { color: colors.primary }]}>
								{todayData.calories?.toFixed(0) || '0'}
							</Text>
							<Text style={[styles.dataLabel, { color: colors.text.secondary }]}>
							Calorías
						</Text>
						</View>
						<View style={[styles.dataItem, { backgroundColor: colors.background }]}>
							<Text style={[styles.dataValue, { color: colors.primary }]}>
								{todayData.distance?.toFixed(2) || '0.00'}
							</Text>
							<Text style={[styles.dataLabel, { color: colors.text.secondary }]}>
							Km recorridos
						</Text>
						</View>
						<View style={[styles.dataItem, { backgroundColor: colors.background }]}>
							<Text style={[styles.dataValue, { color: colors.primary }]}>
								{todayData.heartRate?.toFixed(0) || '--'}
							</Text>
							<Text style={[styles.dataLabel, { color: colors.text.secondary }]}>
							Frec. cardíaca
						</Text>
						</View>
					</View>
					<View style={styles.buttonRow}>
						<Button
							title="Actualizar datos"
							onPress={handleRefreshData}
							style={styles.actionButton}
							variant="outline"
						/>
						<Button
							title="Sincronizar ahora"
							onPress={handleAutoSync}
							style={styles.actionButton}
							variant="primary"
						/>
					</View>
				</Card>
			)}

			{isAvailable && !todayData && !isLoading && (
				<Card style={[styles.card, { backgroundColor: colors.surface }]}>
					<View style={styles.noDataContainer}>
						<Text style={[styles.noDataText, { color: colors.text.secondary }]}>
							No hay datos disponibles. Asegúrate de que la app tenga permisos para acceder a tus datos de salud.
						</Text>
						<Button
							title="Reintentar"
							onPress={handleRefreshData}
							style={styles.retryButton}
							variant="outline"
						/>
					</View>
				</Card>
			)}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	card: {
		padding: 20,
		marginBottom: 16,
		borderRadius: 12,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 16,
	},
	titleContainer: {
		flex: 1,
		marginRight: 16,
	},
	title: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 14,
		lineHeight: 20,
	},
	loadingContainer: {
		paddingVertical: 16,
		alignItems: 'center',
	},
	loadingText: {
		fontSize: 14,
		fontStyle: 'italic',
	},
	errorContainer: {
		paddingVertical: 16,
		alignItems: 'center',
	},
	errorText: {
		fontSize: 14,
		textAlign: 'center',
		marginBottom: 12,
	},
	errorButton: {
		marginTop: 8,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 16,
	},
	permissionItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 8,
	},
	permissionLabel: {
		fontSize: 14,
		fontWeight: '500',
	},
	permissionStatus: {
		fontSize: 14,
		fontWeight: '600',
	},
	preferenceItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(0,0,0,0.1)',
	},
	preferenceContent: {
		flex: 1,
		marginRight: 16,
	},
	preferenceLabel: {
		fontSize: 14,
		fontWeight: '500',
		marginBottom: 2,
	},
	preferenceDescription: {
		fontSize: 12,
		lineHeight: 16,
	},
	healthDataContainer: {
		marginTop: 16,
	},
	dataTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 12,
	},
	dataGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		marginBottom: 16,
	},
	dataItem: {
		width: '48%',
		alignItems: 'center',
		paddingVertical: 12,
		paddingHorizontal: 8,
		marginBottom: 8,
		borderRadius: 8,
	},
	dataValue: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	dataLabel: {
		fontSize: 12,
		textAlign: 'center',
	},
	buttonRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 16,
	},
	actionButton: {
		flex: 1,
		marginHorizontal: 4,
	},
	refreshButton: {
		marginTop: 8,
	},
	noDataContainer: {
		paddingVertical: 20,
		alignItems: 'center',
	},
	noDataText: {
		fontSize: 14,
		textAlign: 'center',
		marginBottom: 12,
	},
	retryButton: {
		marginTop: 8,
	},
});