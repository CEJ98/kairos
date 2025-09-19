import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import useTheme from '../hooks/useTheme';
import { useHealth } from '../hooks/useHealth';
import { HealthData } from '../services/HealthService';

interface HealthMetricCardProps {
	title: string;
	value: string | number;
	unit: string;
	icon: string;
	color: string;
}

const HealthMetricCard: React.FC<HealthMetricCardProps> = ({ title, value, unit, icon, color }) => {
	const { colors } = useTheme();

	return (
		<View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
			<View style={styles.metricHeader}>
				<Text style={styles.metricIcon}>{icon}</Text>
				<Text style={[styles.metricTitle, { color: colors.text.secondary }]}>{title}</Text>
			</View>
			<View style={styles.metricContent}>
				<Text style={[styles.metricValue, { color }]}>{value}</Text>
				<Text style={[styles.metricUnit, { color: colors.text.secondary }]}>{unit}</Text>
			</View>
		</View>
	);
};

interface WeeklyChartProps {
	weekData: HealthData[];
	metric: keyof HealthData;
	title: string;
	color: string;
}

const WeeklyChart: React.FC<WeeklyChartProps> = ({ weekData, metric, title, color }) => {
	const { colors } = useTheme();

	if (!weekData.length) {
		return null;
	}

	const maxValue = Math.max(...weekData.map(data => Number(data[metric]) || 0));

	return (
		<View style={[styles.chartContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
			<Text style={[styles.chartTitle, { color: colors.text.primary }]}>{title}</Text>
			<View style={styles.chart}>
				{weekData.map((data, index) => {
					const value = Number(data[metric]) || 0;
					const height = maxValue > 0 ? (value / maxValue) * 80 : 0;
					const date = new Date(data.date);
					const dayName = date.toLocaleDateString('es', { weekday: 'short' });

					return (
						<View key={index} style={styles.chartBar}>
							<View style={styles.barContainer}>
								<View 
									style={[
										styles.bar, 
										{ 
											height: `${height}%`, 
											backgroundColor: color 
										}
									]}
								/>
							</View>
							<Text style={[styles.barLabel, { color: colors.text.secondary }]}>
								{dayName}
							</Text>
						</View>
					);
				})}
			</View>
		</View>
	);
};

export const HealthDashboard: React.FC = () => {
	const { colors } = useTheme();
	const { 
		isAvailable, 
		todayData, 
		weekData, 
		platformInfo, 
		isLoading, 
		error, 
		refreshData, 
		clearError 
	} = useHealth();

	if (!isAvailable) {
		return (
			<View style={[styles.container, { backgroundColor: colors.background }]}>
				<View style={[styles.unavailableContainer, { backgroundColor: colors.card }]}>
					<Text style={styles.unavailableIcon}>⚕️</Text>
					<Text style={[styles.unavailableTitle, { color: colors.text.primary }]}>
						Servicio de Salud No Disponible
					</Text>
					<Text style={[styles.unavailableText, { color: colors.text.secondary }]}>
						{platformInfo.platform} no está disponible en este dispositivo o no se han otorgado los permisos necesarios.
					</Text>
				</View>
			</View>
		);
	}

	if (error) {
		return (
			<View style={[styles.container, { backgroundColor: colors.background }]}>
				<View style={[styles.errorContainer, { backgroundColor: colors.card }]}>
					<Text style={styles.errorIcon}>⚠️</Text>
					<Text style={[styles.errorTitle, { color: colors.error }]}>Error</Text>
					<Text style={[styles.errorText, { color: colors.text.secondary }]}>{error}</Text>
					<TouchableOpacity 
						style={[styles.retryButton, { backgroundColor: colors.primary }]} 
						onPress={() => {
							clearError();
							refreshData();
						}}
					>
						<Text style={[styles.retryButtonText, { color: colors.text.inverse }]}>Reintentar</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	if (isLoading && !todayData) {
		return (
			<View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={[styles.loadingText, { color: colors.text.secondary }]}>Cargando datos de salud...</Text>
			</View>
		);
	}

	return (
		<ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
			{/* Header */}
			<View style={styles.header}>
				<Text style={[styles.headerTitle, { color: colors.text.primary }]}>Datos de Salud</Text>
				<Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
					{platformInfo.platform}
				</Text>
				<TouchableOpacity 
					style={[styles.refreshButton, { backgroundColor: colors.primary }]} 
					onPress={refreshData}
					disabled={isLoading}
				>
					{isLoading ? (
						<ActivityIndicator size="small" color={colors.text.inverse} />
					) : (
						<Text style={[styles.refreshButtonText, { color: colors.text.inverse }]}>🔄</Text>
					)}
				</TouchableOpacity>
			</View>

			{/* Métricas de Hoy */}
			{todayData && (
				<>
					<Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Hoy</Text>
					<View style={styles.metricsGrid}>
						<HealthMetricCard
							title="Pasos"
							value={todayData.steps.toLocaleString()}
							unit="pasos"
							icon="👟"
							color={colors.primary}
						/>
						<HealthMetricCard
							title="Calorías"
							value={todayData.calories.toLocaleString()}
							unit="kcal"
							icon="🔥"
							color={colors.secondary}
						/>
						<HealthMetricCard
							title="Distancia"
							value={(todayData.distance / 1000).toFixed(1)}
							unit="km"
							icon="📏"
							color={colors.accent}
						/>
						{todayData.heartRate && (
							<HealthMetricCard
								title="Frecuencia Cardíaca"
								value={Math.round(todayData.heartRate)}
								unit="bpm"
								icon="❤️"
								color={colors.error}
							/>
						)}
					</View>
				</>
			)}

			{/* Gráficos Semanales */}
			{weekData.length > 0 && (
				<>
					<Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Última Semana</Text>
					<WeeklyChart
						weekData={weekData}
						metric="steps"
						title="Pasos Diarios"
						color={colors.primary}
					/>
					<WeeklyChart
						weekData={weekData}
						metric="calories"
						title="Calorías Diarias"
						color={colors.secondary}
					/>
				</>
			)}
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 24,
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		flex: 1,
	},
	headerSubtitle: {
		fontSize: 14,
		marginTop: 4,
	},
	refreshButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
	refreshButtonText: {
		fontSize: 16,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 16,
		marginTop: 8,
	},
	metricsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		marginBottom: 24,
	},
	metricCard: {
		width: '48%',
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		marginBottom: 12,
	},
	metricHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	metricIcon: {
		fontSize: 20,
		marginRight: 8,
	},
	metricTitle: {
		fontSize: 12,
		fontWeight: '500',
		flex: 1,
	},
	metricContent: {
		flexDirection: 'row',
		alignItems: 'baseline',
	},
	metricValue: {
		fontSize: 20,
		fontWeight: 'bold',
		marginRight: 4,
	},
	metricUnit: {
		fontSize: 12,
	},
	chartContainer: {
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		marginBottom: 16,
	},
	chartTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 16,
	},
	chart: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-end',
		height: 100,
	},
	chartBar: {
		flex: 1,
		alignItems: 'center',
	},
	barContainer: {
		height: 80,
		width: 20,
		justifyContent: 'flex-end',
		marginBottom: 8,
	},
	bar: {
		width: '100%',
		borderRadius: 4,
		minHeight: 2,
	},
	barLabel: {
		fontSize: 10,
		textAlign: 'center',
	},
	unavailableContainer: {
		padding: 32,
		borderRadius: 12,
		alignItems: 'center',
		margin: 16,
	},
	unavailableIcon: {
		fontSize: 48,
		marginBottom: 16,
	},
	unavailableTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 8,
		textAlign: 'center',
	},
	unavailableText: {
		fontSize: 14,
		textAlign: 'center',
		lineHeight: 20,
	},
	errorContainer: {
		padding: 32,
		borderRadius: 12,
		alignItems: 'center',
		margin: 16,
	},
	errorIcon: {
		fontSize: 48,
		marginBottom: 16,
	},
	errorTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	errorText: {
		fontSize: 14,
		textAlign: 'center',
		marginBottom: 16,
	},
	retryButton: {
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 8,
	},
	retryButtonText: {
		fontSize: 14,
		fontWeight: '600',
	},
	loadingContainer: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
	},
});

export default HealthDashboard;