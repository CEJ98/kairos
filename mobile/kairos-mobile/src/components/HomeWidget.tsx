import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { widgetService, WidgetData } from '../services/widgetService';
import useTheme from '../hooks/useTheme';

interface HomeWidgetProps {
	onPress?: () => void;
	compact?: boolean;
}

const HomeWidget: React.FC<HomeWidgetProps> = ({ onPress, compact = false }) => {
	const [widgetData, setWidgetData] = useState<WidgetData | null>(null);
	const [loading, setLoading] = useState(true);
	const { colors } = useTheme();

	useEffect(() => {
		loadWidgetData();
		// Actualizar cada 5 minutos
		const interval = setInterval(loadWidgetData, 5 * 60 * 1000);
		return () => clearInterval(interval);
	}, []);

	const loadWidgetData = async () => {
		try {
			setLoading(true);
			const data = await widgetService.getWidgetData();
			setWidgetData(data);
		} catch (error) {
			console.error('Error loading widget data:', error);
		} finally {
			setLoading(false);
		}
	};

	const refreshData = async () => {
		await widgetService.forceUpdate();
		await loadWidgetData();
	};

	if (loading) {
		return (
			<View style={[styles.container, { backgroundColor: colors.surface }, compact && styles.compact]}>
				<View style={styles.loadingContainer}>
					<Ionicons name="refresh" size={24} color={colors.primary} />
					<Text style={[styles.loadingText, { color: colors.text.primary }]}>Cargando...</Text>
				</View>
			</View>
		);
	}

	if (!widgetData) {
		return (
			<TouchableOpacity 
				style={[styles.container, { backgroundColor: colors.surface }, compact && styles.compact]}
				onPress={refreshData}
			>
				<View style={styles.errorContainer}>
					<Ionicons name="alert-circle" size={24} color={colors.error} />
					<Text style={[styles.errorText, { color: colors.text.primary }]}>Error al cargar datos</Text>
					<Text style={[styles.tapToRefresh, { color: colors.text.secondary }]}>Toca para actualizar</Text>
				</View>
			</TouchableOpacity>
		);
	}

	return (
		<TouchableOpacity 
			style={[styles.container, { backgroundColor: colors.surface }, compact && styles.compact]}
			onPress={onPress || refreshData}
			activeOpacity={0.8}
		>
			{/* Header */}
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<Ionicons name="fitness" size={20} color={colors.primary} />
					<Text style={[styles.title, { color: colors.text.primary }]}>Kairos</Text>
				</View>
				<TouchableOpacity onPress={refreshData}>
					<Ionicons name="refresh" size={16} color={colors.text.secondary} />
				</TouchableOpacity>
			</View>

			{/* Next Workout */}
			{widgetData.nextWorkout && (
				<View style={styles.nextWorkoutSection}>
					<Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>Próximo Workout</Text>
					<Text style={[styles.workoutName, { color: colors.text.primary }]}>{widgetData.nextWorkout.name}</Text>
					<Text style={[styles.workoutTime, { color: colors.text.secondary }]}>{widgetData.nextWorkout.time}</Text>
				</View>
			)}

			{/* Stats */}
			<View style={styles.statsContainer}>
				<View style={styles.statItem}>
					<Text style={[styles.statLabel, { color: colors.text.secondary }]}>Racha</Text>
					<Text style={[styles.statValue, { color: colors.text.primary }]}>{widgetData.currentStreak} días</Text>
				</View>
				
				<View style={styles.statItem}>
					<Text style={[styles.statLabel, { color: colors.text.secondary }]}>Esta semana</Text>
					<Text style={[styles.statValue, { color: colors.text.primary }]}>{widgetData.todayWorkouts}/6</Text>
				</View>
				
				<View style={styles.statItem}>
					<Text style={[styles.statLabel, { color: colors.text.secondary }]}>Progreso</Text>
					<Text style={[styles.statValue, { color: colors.text.primary }]}>{Math.round(widgetData.weeklyProgress)}%</Text>
				</View>
			</View>

			{/* Last Update */}
			<Text style={[styles.lastUpdate, { color: colors.text.secondary }]}>
				Última actualización: {new Date(widgetData.lastUpdate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
			</Text>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: {
		padding: 16,
		borderRadius: 12,
		margin: 8,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	compact: {
		padding: 12,
		margin: 4,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
	},
	headerLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	nextWorkoutSection: {
		marginBottom: 16,
	},
	sectionLabel: {
		fontSize: 12,
		marginBottom: 4,
	},
	workoutName: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 2,
	},
	workoutTime: {
		fontSize: 14,
	},
	statsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 12,
	},
	statItem: {
		flex: 1,
		alignItems: 'center',
	},
	statLabel: {
		fontSize: 10,
		marginBottom: 2,
	},
	statValue: {
		fontSize: 12,
		fontWeight: '600',
	},
	lastUpdate: {
		fontSize: 10,
		textAlign: 'center',
	},
	loadingContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20,
		gap: 8,
	},
	loadingText: {
		fontSize: 14,
	},
	errorContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20,
		gap: 4,
	},
	errorText: {
		fontSize: 14,
		fontWeight: '500',
	},
	tapToRefresh: {
		fontSize: 12,
	},
});

export default HomeWidget;