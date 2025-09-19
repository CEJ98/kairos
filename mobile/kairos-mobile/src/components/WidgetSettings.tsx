import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	Switch,
	TouchableOpacity,
	Alert,
	StyleSheet,
	ActivityIndicator,
} from 'react-native';
import { widgetService, WidgetData } from '../services/widgetService';

interface WidgetSettingsProps {
	theme: 'light' | 'dark';
}

export const WidgetSettings: React.FC<WidgetSettingsProps> = ({ theme }) => {
	const [isEnabled, setIsEnabled] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [widgetData, setWidgetData] = useState<WidgetData | null>(null);
	const [lastUpdate, setLastUpdate] = useState<string>('');

	useEffect(() => {
		loadWidgetSettings();
	}, []);

	const loadWidgetSettings = async () => {
		try {
			setIsLoading(true);
			
			// Verificar si el background fetch está disponible
			const isAvailable = await widgetService.isBackgroundFetchAvailable();
			setIsEnabled(isAvailable);
			
			// Cargar datos actuales del widget
			const data = await widgetService.getWidgetData();
			setWidgetData(data);
			
			if (data?.lastUpdate) {
				const updateDate = new Date(data.lastUpdate);
				setLastUpdate(updateDate.toLocaleString('es-ES'));
			}
		} catch (error) {
			console.error('Error cargando configuración del widget:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const toggleWidget = async (enabled: boolean) => {
		try {
			setIsLoading(true);
			
			if (enabled) {
				// Registrar background fetch
				const success = await widgetService.registerBackgroundFetch();
				if (success) {
					// Actualizar datos inmediatamente
					await widgetService.forceUpdate();
					setIsEnabled(true);
					Alert.alert(
						'Widget Activado',
						'El widget de pantalla de inicio se ha activado correctamente.'
					);
				} else {
					Alert.alert(
						'Error',
						'No se pudo activar el widget. Verifica los permisos de la aplicación.'
					);
				}
			} else {
				// Desregistrar background fetch
				await widgetService.unregisterBackgroundFetch();
				setIsEnabled(false);
				Alert.alert(
					'Widget Desactivado',
					'El widget de pantalla de inicio se ha desactivado.'
				);
			}
			
			// Recargar configuración
			await loadWidgetSettings();
		} catch (error) {
			console.error('Error configurando widget:', error);
			Alert.alert(
				'Error',
				'Ocurrió un error al configurar el widget. Inténtalo de nuevo.'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const forceUpdate = async () => {
		try {
			setIsLoading(true);
			const success = await widgetService.forceUpdate();
			
			if (success) {
				Alert.alert(
					'Actualizado',
					'Los datos del widget se han actualizado correctamente.'
				);
				await loadWidgetSettings();
			} else {
				Alert.alert(
					'Error',
					'No se pudieron actualizar los datos del widget.'
				);
			}
		} catch (error) {
			console.error('Error actualizando widget:', error);
			Alert.alert(
				'Error',
				'Ocurrió un error al actualizar el widget.'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const styles = getStyles(theme);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Widget de Pantalla de Inicio</Text>
			<Text style={styles.description}>
				Muestra tu progreso de entrenamientos directamente en la pantalla de inicio
			</Text>

			{/* Toggle principal */}
			<View style={styles.settingRow}>
				<View style={styles.settingInfo}>
					<Text style={styles.settingTitle}>Activar Widget</Text>
					<Text style={styles.settingSubtitle}>
						Permite actualizaciones automáticas en segundo plano
					</Text>
				</View>
				<Switch
					value={isEnabled}
					onValueChange={toggleWidget}
					disabled={isLoading}
					trackColor={{ false: '#767577', true: '#4CAF50' }}
					thumbColor={isEnabled ? '#ffffff' : '#f4f3f4'}
				/>
			</View>

			{/* Información del widget */}
			{widgetData && (
				<View style={styles.widgetInfo}>
					<Text style={styles.infoTitle}>Estado Actual del Widget</Text>
					
					<View style={styles.statRow}>
						<Text style={styles.statLabel}>Entrenamientos hoy:</Text>
						<Text style={styles.statValue}>{widgetData.todayWorkouts}</Text>
					</View>
					
					<View style={styles.statRow}>
						<Text style={styles.statLabel}>Progreso semanal:</Text>
						<Text style={styles.statValue}>{widgetData.weeklyProgress}%</Text>
					</View>
					
					<View style={styles.statRow}>
						<Text style={styles.statLabel}>Racha actual:</Text>
						<Text style={styles.statValue}>{widgetData.currentStreak} días</Text>
					</View>
					
					{widgetData.nextWorkout && (
						<View style={styles.statRow}>
							<Text style={styles.statLabel}>Próximo entrenamiento:</Text>
							<Text style={styles.statValue}>
								{widgetData.nextWorkout.name} - {widgetData.nextWorkout.time}
							</Text>
						</View>
					)}
					
					{lastUpdate && (
						<Text style={styles.lastUpdate}>
							Última actualización: {lastUpdate}
						</Text>
					)}
				</View>
			)}

			{/* Botón de actualización manual */}
			{isEnabled && (
				<TouchableOpacity
					style={styles.updateButton}
					onPress={forceUpdate}
					disabled={isLoading}
				>
					{isLoading ? (
						<ActivityIndicator size="small" color="#ffffff" />
					) : (
						<Text style={styles.updateButtonText}>Actualizar Ahora</Text>
					)}
				</TouchableOpacity>
			)}

			{/* Información adicional */}
			<View style={styles.infoBox}>
				<Text style={styles.infoText}>
					💡 El widget se actualiza automáticamente cada 15 minutos cuando está activado.
					Puedes agregarlo a tu pantalla de inicio desde la biblioteca de widgets.
				</Text>
			</View>
		</View>
	);
};

const getStyles = (theme: 'light' | 'dark') => StyleSheet.create({
	container: {
		padding: 20,
		backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
		color: theme === 'dark' ? '#ffffff' : '#000000',
		marginBottom: 8,
	},
	description: {
		fontSize: 14,
		color: theme === 'dark' ? '#cccccc' : '#666666',
		marginBottom: 24,
		lineHeight: 20,
	},
	settingRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: theme === 'dark' ? '#333333' : '#eeeeee',
	},
	settingInfo: {
		flex: 1,
		marginRight: 16,
	},
	settingTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: theme === 'dark' ? '#ffffff' : '#000000',
		marginBottom: 4,
	},
	settingSubtitle: {
		fontSize: 12,
		color: theme === 'dark' ? '#cccccc' : '#666666',
	},
	widgetInfo: {
		marginTop: 24,
		padding: 16,
		backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f8f9fa',
		borderRadius: 12,
	},
	infoTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: theme === 'dark' ? '#ffffff' : '#000000',
		marginBottom: 12,
	},
	statRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 8,
	},
	statLabel: {
		fontSize: 14,
		color: theme === 'dark' ? '#cccccc' : '#666666',
	},
	statValue: {
		fontSize: 14,
		fontWeight: '600',
		color: theme === 'dark' ? '#ffffff' : '#000000',
	},
	lastUpdate: {
		fontSize: 12,
		color: theme === 'dark' ? '#999999' : '#888888',
		marginTop: 8,
		textAlign: 'center',
		fontStyle: 'italic',
	},
	updateButton: {
		marginTop: 16,
		backgroundColor: '#4CAF50',
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8,
		alignItems: 'center',
	},
	updateButtonText: {
		color: '#ffffff',
		fontSize: 16,
		fontWeight: '600',
	},
	infoBox: {
		marginTop: 24,
		padding: 16,
		backgroundColor: theme === 'dark' ? '#2a2a2a' : '#e3f2fd',
		borderRadius: 8,
		borderLeftWidth: 4,
		borderLeftColor: '#2196F3',
	},
	infoText: {
		fontSize: 14,
		color: theme === 'dark' ? '#cccccc' : '#666666',
		lineHeight: 20,
	},
});