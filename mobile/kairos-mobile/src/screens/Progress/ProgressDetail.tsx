import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import useTheme from '../../hooks/useTheme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import type { ProgressStackParamList } from '../../navigation/types';

type ProgressDetailRouteProp = RouteProp<ProgressStackParamList, 'ProgressDetail'>;
type ProgressDetailNavigationProp = NativeStackNavigationProp<ProgressStackParamList, 'ProgressDetail'>;

export default function ProgressDetailScreen() {
	const route = useRoute<ProgressDetailRouteProp>();
	const navigation = useNavigation<ProgressDetailNavigationProp>();
	const { colors } = useTheme();
	const { metricId } = route.params;

	// Mock data - en una app real vendría de una API o base de datos
	const progressData = {
		id: metricId,
		date: '2023-07-15',
		weight: 75.5,
		bodyFat: 18.2,
		muscle: 42.8,
		notes: 'Progreso constante en fuerza y resistencia',
		measurements: {
			chest: 98,
			waist: 82,
			hips: 95,
			biceps: 35,
			thighs: 58,
		},
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
				{/* Header */}
				<View style={styles.header}>
					<Text style={[styles.title, { color: colors.text.primary }]}>
						Progreso del {new Date(progressData.date).toLocaleDateString('es-ES')}
					</Text>
				</View>

				{/* Body Composition */}
				<Card style={styles.card}>
					<Text style={[styles.cardTitle, { color: colors.text.primary }]}>
						Composición Corporal
					</Text>
					<View style={styles.statsContainer}>
						<View style={styles.stat}>
							<Text style={[styles.statValue, { color: colors.text.primary }]}>
								{progressData.weight}kg
							</Text>
							<Text style={[styles.statLabel, { color: colors.text.secondary }]}>
								Peso
							</Text>
						</View>
						<View style={styles.stat}>
							<Text style={[styles.statValue, { color: colors.text.primary }]}>
								{progressData.bodyFat}%
							</Text>
							<Text style={[styles.statLabel, { color: colors.text.secondary }]}>
								Grasa Corporal
							</Text>
						</View>
						<View style={styles.stat}>
							<Text style={[styles.statValue, { color: colors.text.primary }]}>
								{progressData.muscle}kg
							</Text>
							<Text style={[styles.statLabel, { color: colors.text.secondary }]}>
								Masa Muscular
							</Text>
						</View>
					</View>
				</Card>

				{/* Measurements */}
				<Card style={styles.card}>
					<Text style={[styles.cardTitle, { color: colors.text.primary }]}>
						Medidas Corporales
					</Text>
					<View style={styles.measurementsGrid}>
						<View style={styles.measurementItem}>
							<Text style={[styles.measurementLabel, { color: colors.text.secondary }]}>Pecho</Text>
							<Text style={[styles.measurementValue, { color: colors.text.primary }]}>{progressData.measurements.chest}cm</Text>
						</View>
						<View style={styles.measurementItem}>
							<Text style={[styles.measurementLabel, { color: colors.text.secondary }]}>Cintura</Text>
							<Text style={[styles.measurementValue, { color: colors.text.primary }]}>{progressData.measurements.waist}cm</Text>
						</View>
						<View style={styles.measurementItem}>
							<Text style={[styles.measurementLabel, { color: colors.text.secondary }]}>Caderas</Text>
							<Text style={[styles.measurementValue, { color: colors.text.primary }]}>{progressData.measurements.hips}cm</Text>
						</View>
						<View style={styles.measurementItem}>
							<Text style={[styles.measurementLabel, { color: colors.text.secondary }]}>Bíceps</Text>
							<Text style={[styles.measurementValue, { color: colors.text.primary }]}>{progressData.measurements.biceps}cm</Text>
						</View>
						<View style={styles.measurementItem}>
							<Text style={[styles.measurementLabel, { color: colors.text.secondary }]}>Muslos</Text>
							<Text style={[styles.measurementValue, { color: colors.text.primary }]}>{progressData.measurements.thighs}cm</Text>
						</View>
					</View>
				</Card>

				{/* Notes */}
				{progressData.notes && (
					<Card style={styles.card}>
						<Text style={[styles.cardTitle, { color: colors.text.primary }]}>
							Notas
						</Text>
						<Text style={[styles.notesText, { color: colors.text.secondary }]}>
							{progressData.notes}
						</Text>
					</Card>
				)}
			</ScrollView>

			{/* Action Buttons */}
			<View style={styles.actionButtons}>
				<Button
					title="Editar"
					onPress={() => {/* TODO: Navigate to edit */}}
					variant="secondary"
					style={styles.editButton}
				/>
				<Button
					title="Eliminar"
					onPress={() => {/* TODO: Implement delete */}}
					variant="secondary"
					style={styles.deleteButton}
					textStyle={{ color: colors.error }}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
	},
	header: {
		paddingHorizontal: 20,
		paddingTop: 20,
		paddingBottom: 16,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
	},
	card: {
		marginHorizontal: 20,
		marginBottom: 16,
		padding: 20,
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 16,
	},
	statsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
	},
	stat: {
		alignItems: 'center',
	},
	statValue: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	statLabel: {
		fontSize: 14,
	},
	measurementsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
	},
	measurementItem: {
		width: '48%',
		marginBottom: 16,
		padding: 12,
		backgroundColor: 'rgba(0,0,0,0.05)',
		borderRadius: 8,
		alignItems: 'center',
	},
	measurementLabel: {
		fontSize: 12,
		marginBottom: 4,
	},
	measurementValue: {
		fontSize: 18,
		fontWeight: '600',
	},
	notesText: {
		fontSize: 16,
		lineHeight: 22,
	},
	actionButtons: {
		flexDirection: 'row',
		paddingHorizontal: 20,
		paddingVertical: 16,
		gap: 12,
		borderTopWidth: 1,
		borderTopColor: 'rgba(0,0,0,0.1)',
	},
	editButton: {
		flex: 1,
	},
	deleteButton: {
		flex: 1,
	},
});