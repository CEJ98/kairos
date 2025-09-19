import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../hooks/useTheme';
import Card from '../../components/Card';
import AnimatedButton from '../../components/AnimatedButton';
import type { WorkoutsStackParamList } from '../../navigation/types';

type WorkoutDetailRouteProp = RouteProp<WorkoutsStackParamList, 'WorkoutDetail'>;
type WorkoutDetailNavigationProp = NativeStackNavigationProp<WorkoutsStackParamList, 'WorkoutDetail'>;

export default function WorkoutDetailScreen() {
	const route = useRoute<WorkoutDetailRouteProp>();
	const navigation = useNavigation<WorkoutDetailNavigationProp>();
	const { colors } = useTheme();
	const { workoutId } = route.params;

	// Mock data - en una app real vendría de una API o base de datos
	const workout = {
		id: workoutId,
		name: 'Entrenamiento Full Body',
		description: 'Rutina completa para trabajar todo el cuerpo',
		duration: 45,
		difficulty: 'medium' as const,
		category: 'Fuerza',
		exercises: [
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
		],
	};

	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty) {
			case 'easy': return colors.workout.easy;
			case 'medium': return colors.workout.medium;
			case 'hard': return colors.workout.hard;
			default: return colors.text.secondary;
		}
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
				{/* Header */}
				<View style={styles.header}>
					<Text style={[styles.title, { color: colors.text.primary }]}>
						{workout.name}
					</Text>
					<Text style={[styles.description, { color: colors.text.secondary }]}>
						{workout.description}
					</Text>
				</View>

				{/* Stats */}
				<Card style={styles.statsCard}>
					<View style={styles.statsContainer}>
						<View style={styles.stat}>
							<Text style={[styles.statValue, { color: colors.text.primary }]}>
								{workout.duration}min
							</Text>
							<Text style={[styles.statLabel, { color: colors.text.secondary }]}>
								Duración
							</Text>
						</View>
						<View style={styles.stat}>
							<Text style={[styles.statValue, { color: colors.text.primary }]}>
								{workout.exercises.length}
							</Text>
							<Text style={[styles.statLabel, { color: colors.text.secondary }]}>
								Ejercicios
							</Text>
						</View>
						<View style={styles.stat}>
							<View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(workout.difficulty) + '20' }]}>
								<Text style={[styles.difficultyText, { color: getDifficultyColor(workout.difficulty) }]}>
									{workout.difficulty}
								</Text>
							</View>
						</View>
					</View>
				</Card>

				{/* Exercises */}
				<View style={styles.section}>
					<Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
						Ejercicios
					</Text>
					{workout.exercises.map((exercise, index) => (
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
			</ScrollView>

			{/* Action Buttons */}
			<View style={styles.actionButtons}>
				<AnimatedButton
					title="Editar"
					onPress={() => {/* TODO: Navigate to edit */}}
					variant="outline"
					animationType="scale"
					icon="create-outline"
					style={styles.editButton}
				/>
				<AnimatedButton
					title="Comenzar Rutina"
					onPress={() => {/* TODO: Navigate to execution */}}
					variant="primary"
					animationType="bounce"
					icon="play-circle"
					autoAnimate={true}
					style={styles.startButton}
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
	description: {
		fontSize: 16,
		lineHeight: 22,
	},
	statsCard: {
		marginHorizontal: 20,
		marginBottom: 24,
		padding: 20,
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
	difficultyBadge: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
	},
	difficultyText: {
		fontSize: 12,
		fontWeight: '600',
		textTransform: 'capitalize',
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
	editButton: {
		flex: 1,
	},
	startButton: {
		flex: 2,
	},
});