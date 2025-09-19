import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import useTheme from '../../hooks/useTheme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import type { WorkoutsStackParamList } from '../../navigation/types';

type EditWorkoutRouteProp = RouteProp<WorkoutsStackParamList, 'EditWorkout'>;
type EditWorkoutNavigationProp = NativeStackNavigationProp<WorkoutsStackParamList, 'EditWorkout'>;

interface Exercise {
	id: string;
	name: string;
	muscleGroup: string;
	sets: number;
	reps: string;
	weight?: string;
	rest: number;
	notes?: string;
}

export default function EditWorkoutScreen() {
	const route = useRoute<EditWorkoutRouteProp>();
	const navigation = useNavigation<EditWorkoutNavigationProp>();
	const { colors } = useTheme();
	const { workoutId } = route.params;

	// Mock data - en una app real vendría de una API o base de datos
	const [workoutName, setWorkoutName] = useState('Entrenamiento Full Body');
	const [workoutDescription, setWorkoutDescription] = useState('Rutina completa para trabajar todo el cuerpo');
	const [exercises, setExercises] = useState<Exercise[]>([
		{
			id: '1',
			name: 'Press de Banca',
			muscleGroup: 'Pecho',
			sets: 3,
			reps: '8-12',
			rest: 120,
		},
		{
			id: '2',
			name: 'Sentadillas',
			muscleGroup: 'Piernas',
			sets: 4,
			reps: '10-15',
			rest: 180,
		},
		{
			id: '3',
			name: 'Peso Muerto',
			muscleGroup: 'Espalda',
			sets: 3,
			reps: '5-8',
			rest: 180,
		},
	]);

	const handleSaveWorkout = async () => {
		if (!workoutName.trim()) {
			Alert.alert('Error', 'El nombre de la rutina es obligatorio.');
			return;
		}

		if (exercises.length === 0) {
			Alert.alert('Error', 'Debes agregar al menos un ejercicio.');
			return;
		}

		try {
			// TODO: Implementar guardado real
			console.log('Saving workout:', {
				id: workoutId,
				name: workoutName,
				description: workoutDescription,
				exercises,
			});

			Alert.alert(
				'Rutina Actualizada',
				`La rutina "${workoutName}" ha sido actualizada correctamente.`,
				[
					{
						text: 'OK',
						onPress: () => navigation.goBack(),
					},
				]
			);
		} catch (error) {
			console.error('Error updating workout:', error);
			Alert.alert(
				'Error',
				'No se pudo actualizar la rutina. Inténtalo de nuevo.',
				[{ text: 'OK' }]
			);
		}
	};

	const handleDeleteWorkout = () => {
		Alert.alert(
			'Eliminar Rutina',
			'¿Estás seguro de que quieres eliminar esta rutina? Esta acción no se puede deshacer.',
			[
				{
					text: 'Cancelar',
					style: 'cancel',
				},
				{
					text: 'Eliminar',
					style: 'destructive',
					onPress: () => {
						// TODO: Implementar eliminación real
						console.log('Deleting workout:', workoutId);
						navigation.navigate('WorkoutsList');
					},
				},
			]
		);
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
				{/* Header */}
				<View style={styles.header}>
					<Text style={[styles.title, { color: colors.text.primary }]}>
						Editar Rutina
					</Text>
					<Text style={[styles.subtitle, { color: colors.text.secondary }]}>
						Modifica los detalles de tu rutina
					</Text>
				</View>

				{/* Workout Details */}
				<View style={styles.section}>
					<Input
						label="Nombre de la Rutina"
						value={workoutName}
						onChangeText={setWorkoutName}
						placeholder="Ej: Rutina de Fuerza - Lunes"
					/>
				</View>

				<View style={styles.section}>
					<Input
						label="Descripción (Opcional)"
						value={workoutDescription}
						onChangeText={setWorkoutDescription}
						placeholder="Describe tu rutina..."
						multiline
						numberOfLines={3}
					/>
				</View>

				{/* Exercises List */}
				<View style={styles.section}>
					<Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
						Ejercicios ({exercises.length})
					</Text>
					
					{exercises.map((exercise, index) => (
						<Card key={exercise.id} style={styles.exerciseCard}>
							<View style={styles.exerciseHeader}>
								<View style={styles.exerciseNumber}>
									<Text style={[styles.exerciseNumberText, { color: colors.primary }]}>
										{index + 1}
									</Text>
								</View>
								<View style={styles.exerciseInfo}>
									<Text style={[styles.exerciseName, { color: colors.text.primary }]}>
										{exercise.name}
									</Text>
									<Text style={[styles.muscleGroup, { color: colors.text.secondary }]}>
										{exercise.muscleGroup}
									</Text>
								</View>
							</View>
							<View style={styles.exerciseDetails}>
								<View style={styles.detailItem}>
									<Text style={[styles.detailLabel, { color: colors.text.secondary }]}>Sets</Text>
									<Text style={[styles.detailValue, { color: colors.text.primary }]}>{exercise.sets}</Text>
								</View>
								<View style={styles.detailItem}>
									<Text style={[styles.detailLabel, { color: colors.text.secondary }]}>Reps</Text>
									<Text style={[styles.detailValue, { color: colors.text.primary }]}>{exercise.reps}</Text>
								</View>
								<View style={styles.detailItem}>
									<Text style={[styles.detailLabel, { color: colors.text.secondary }]}>Descanso</Text>
									<Text style={[styles.detailValue, { color: colors.text.primary }]}>{exercise.rest}s</Text>
								</View>
							</View>
						</Card>
					))}
				</View>

				{/* Add Exercise Button */}
				<View style={styles.section}>
					<Button
						title="Agregar Ejercicio"
						onPress={() => {/* TODO: Navigate to exercise selector */}}
						variant="secondary"
						fullWidth
					/>
				</View>
			</ScrollView>

			{/* Action Buttons */}
			<View style={styles.actionButtons}>
				<Button
					title="Eliminar"
					onPress={handleDeleteWorkout}
					variant="secondary"
					style={styles.deleteButton}
					textStyle={{ color: colors.error }}
				/>
				<Button
					title="Guardar Cambios"
					onPress={handleSaveWorkout}
					variant="primary"
					style={styles.saveButton}
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
		fontSize: 28,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		lineHeight: 22,
	},
	section: {
		paddingHorizontal: 20,
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: '600',
		marginBottom: 16,
	},
	exerciseCard: {
		padding: 16,
		marginBottom: 12,
	},
	exerciseHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	exerciseNumber: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: 'rgba(0, 122, 255, 0.1)',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	exerciseNumberText: {
		fontSize: 14,
		fontWeight: 'bold',
	},
	exerciseInfo: {
		flex: 1,
	},
	exerciseName: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 2,
	},
	muscleGroup: {
		fontSize: 14,
	},
	exerciseDetails: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: 'rgba(0,0,0,0.1)',
	},
	detailItem: {
		alignItems: 'center',
	},
	detailLabel: {
		fontSize: 12,
		marginBottom: 2,
	},
	detailValue: {
		fontSize: 16,
		fontWeight: '600',
	},
	actionButtons: {
		flexDirection: 'row',
		paddingHorizontal: 20,
		paddingVertical: 16,
		gap: 12,
		borderTopWidth: 1,
		borderTopColor: 'rgba(0,0,0,0.1)',
	},
	deleteButton: {
		flex: 1,
	},
	saveButton: {
		flex: 2,
	},
});