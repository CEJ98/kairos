import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../hooks/useTheme';
import useOffline from '../../hooks/useOffline';
import { useTutorial } from '../../hooks/useTutorial';
import Card from '../../components/Card';
import Button from '../../components/Button';
import WorkoutTutorial from '../../components/WorkoutTutorial';
import HealthService from '../../services/HealthService';
import type { WorkoutsStackParamList } from '../../navigation/types';
import type { OfflineWorkoutSession } from '../../services/OfflineService';

type WorkoutExecutionRouteProp = RouteProp<WorkoutsStackParamList, 'WorkoutExecution'>;
type WorkoutExecutionNavigationProp = NativeStackNavigationProp<WorkoutsStackParamList, 'WorkoutExecution'>;

export default function WorkoutExecutionScreen() {
	const route = useRoute<WorkoutExecutionRouteProp>();
	const navigation = useNavigation<WorkoutExecutionNavigationProp>();
	const { colors } = useTheme();
	const { saveWorkoutSessionOffline } = useOffline();
	const { isTutorialCompleted, markTutorialCompleted } = useTutorial();
	const { workoutId } = route.params;

	const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
	const [currentSet, setCurrentSet] = useState(1);
	const [isResting, setIsResting] = useState(false);
	const [restTimer, setRestTimer] = useState(0);
	const [workoutStartTime] = useState(new Date());
	const [showTutorial, setShowTutorial] = useState(false);
	const [hasStartedWorkout, setHasStartedWorkout] = useState(false);

	// Mock workout data
	const workout = {
		id: workoutId,
		name: 'Entrenamiento Full Body',
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

	const currentExercise = workout.exercises[currentExerciseIndex];
	const isLastExercise = currentExerciseIndex === workout.exercises.length - 1;
	const isLastSet = currentSet === currentExercise.sets;

	// Tutorial effect - mostrar tutorial en el primer workout
	useEffect(() => {
		if (!isTutorialCompleted('first_workout') && !hasStartedWorkout) {
			setShowTutorial(true);
		}
	}, [isTutorialCompleted, hasStartedWorkout]);

	// Rest timer effect
	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (isResting && restTimer > 0) {
			interval = setInterval(() => {
				setRestTimer(prev => {
					if (prev <= 1) {
						setIsResting(false);
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		}
		return () => clearInterval(interval);
	}, [isResting, restTimer]);

	// Tutorial effect - mostrar tutorial en el primer workout
	useEffect(() => {
    if (!isTutorialCompleted('first_workout') && !hasStartedWorkout) {
      setShowTutorial(true);
    }
  }, [isTutorialCompleted, hasStartedWorkout]);

	const handleCompleteSet = () => {
		if (isLastSet) {
			if (isLastExercise) {
				// Workout completed
				handleCompleteWorkout();
			} else {
				// Move to next exercise
				setCurrentExerciseIndex(prev => prev + 1);
				setCurrentSet(1);
				setIsResting(true);
				setRestTimer(currentExercise.rest);
			}
		} else {
			// Move to next set
			setCurrentSet(prev => prev + 1);
			setIsResting(true);
			setRestTimer(currentExercise.rest);
		}
	};

	const handleCompleteWorkout = async () => {
		const workoutEndTime = new Date();
		const workoutDuration = Math.round((workoutEndTime.getTime() - workoutStartTime.getTime()) / 1000 / 60);
		
		try {
			// Crear sesión de entrenamiento offline
			const workoutSession: OfflineWorkoutSession = {
				id: Date.now().toString(),
				workoutId: workout.id,
				workoutName: workout.name,
				startTime: workoutStartTime.toISOString(),
				endTime: workoutEndTime.toISOString(),
				exercises: workout.exercises.map(exercise => ({
					id: exercise.id,
					name: exercise.name,
					completedSets: Array.from({ length: exercise.sets }, (_, index) => ({
						reps: parseInt(exercise.reps.split('-')[0] || '0'),
						weight: 0, // Peso por defecto
						rest: exercise.rest,
						completedAt: new Date(workoutEndTime.getTime() - (exercise.sets - index - 1) * exercise.rest * 1000).toISOString(),
					})),
				})),
				synced: false,
			};

			const estimatedCalories = calculateEstimatedCalories(workout.exercises, workoutDuration);

			// Guardar sesión offline
			await saveWorkoutSessionOffline(workoutSession);

			// Intentar guardar en apps de salud si está disponible
			try {
				const platformInfo = HealthService.getPlatformInfo();
				if (platformInfo.available && platformInfo.initialized) {
					const healthWorkoutData = {
						id: workoutSession.id,
						name: workout.name,
						type: 'strength' as const,
						startTime: workoutStartTime.toISOString(),
						endTime: workoutEndTime.toISOString(),
						duration: workoutDuration,
						caloriesBurned: estimatedCalories,
						exercises: workout.exercises.map(ex => ({
							name: ex.name,
							sets: ex.sets,
							reps: parseInt(ex.reps.split('-')[0] || '0'),
							weight: undefined, // No tenemos peso en este mock
						})),
					};
					await HealthService.saveWorkout(healthWorkoutData);
					console.log('Workout session saved to health app successfully');
				}
			} catch (healthError) {
				console.warn('Could not save to health app:', healthError);
				// No mostramos error al usuario, es opcional
			}

			Alert.alert(
				'¡Rutina Completada!',
				`Has completado "${workout.name}" en ${workoutDuration} minutos. ¡Excelente trabajo!`,
				[
					{
						text: 'Finalizar',
						onPress: () => navigation.navigate('WorkoutsList'),
					},
				]
			);
		} catch (error) {
			console.error('Error saving workout session:', error);
			Alert.alert(
				'Rutina Completada',
				`Has completado "${workout.name}" en ${workoutDuration} minutos, pero hubo un error al guardar los datos.`,
				[
					{
						text: 'Finalizar',
						onPress: () => navigation.navigate('WorkoutsList'),
					},
				]
			);
		}
	};

	// Función auxiliar para calcular calorías estimadas
	const calculateEstimatedCalories = (exercises: any[], duration: number): number => {
		// Estimación básica: 8 calorías por minuto para entrenamiento de fuerza
		const baseCalories = duration * 8;
		// Bonus por número de ejercicios
		const exerciseBonus = exercises.length * 10;
		return Math.round(baseCalories + exerciseBonus);
	};

	const handleSkipRest = () => {
		setIsResting(false);
		setRestTimer(0);
	};

	const handleTutorialComplete = () => {
		setShowTutorial(false);
		setHasStartedWorkout(true);
		markTutorialCompleted('first_workout');
	};

	const handleTutorialSkip = () => {
		setShowTutorial(false);
		setHasStartedWorkout(true);
		markTutorialCompleted('first_workout');
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity
					onPress={() => navigation.goBack()}
					style={styles.backButton}
				>
					<Ionicons name="arrow-back" size={24} color={colors.text.primary} />
				</TouchableOpacity>
				<Text style={[styles.workoutName, { color: colors.text.primary }]}>
					{workout.name}
				</Text>
				<View style={styles.progress}>
					<Text style={[styles.progressText, { color: colors.text.secondary }]}>
						{currentExerciseIndex + 1}/{workout.exercises.length}
					</Text>
				</View>
			</View>

			{/* Current Exercise */}
			<View style={styles.content}>
				<Card style={styles.exerciseCard}>
					<Text style={[styles.exerciseName, { color: colors.text.primary }]}>
						{currentExercise.name}
					</Text>
					<Text style={[styles.muscleGroup, { color: colors.text.secondary }]}>
						{currentExercise.muscleGroup}
					</Text>

					<View style={styles.setInfo}>
						<Text style={[styles.setLabel, { color: colors.text.secondary }]}>Set Actual</Text>
						<Text style={[styles.setNumber, { color: colors.primary }]}>
							{currentSet} / {currentExercise.sets}
						</Text>
					</View>

					<View style={styles.repsInfo}>
						<Text style={[styles.repsLabel, { color: colors.text.secondary }]}>Repeticiones</Text>
						<Text style={[styles.repsNumber, { color: colors.text.primary }]}>
							{currentExercise.reps}
						</Text>
					</View>
				</Card>

				{/* Rest Timer */}
				{isResting && (
					<Card style={styles.restCard}>
						<Text style={[styles.restTitle, { color: colors.primary }]}>Descanso</Text>
						<Text style={[styles.restTimer, { color: colors.primary }]}>
							{formatTime(restTimer)}
						</Text>
						<Button
							title="Saltar Descanso"
							onPress={handleSkipRest}
							variant="secondary"
							style={styles.skipButton}
						/>
					</Card>
				)}
			</View>

			{/* Action Button */}
			<View style={styles.actionContainer}>
				{!isResting && (
					<Button
						title={isLastSet && isLastExercise ? "Finalizar Rutina" : "Completar Set"}
						onPress={handleCompleteSet}
						variant="primary"
						fullWidth
						style={styles.completeButton}
					/>
				)}
			</View>

			{/* Tutorial */}
			{showTutorial && (
				<WorkoutTutorial
					visible={showTutorial}
					tutorialType="first_workout"
					onComplete={handleTutorialComplete}
					onSkip={handleTutorialSkip}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingTop: 60,
		paddingBottom: 20,
	},
	backButton: {
		padding: 8,
		marginRight: 12,
	},
	workoutName: {
		flex: 1,
		fontSize: 20,
		fontWeight: 'bold',
	},
	progress: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		backgroundColor: 'rgba(0,0,0,0.1)',
		borderRadius: 12,
	},
	progressText: {
		fontSize: 14,
		fontWeight: '600',
	},
	content: {
		flex: 1,
		paddingHorizontal: 20,
	},
	exerciseCard: {
		padding: 24,
		alignItems: 'center',
		marginBottom: 20,
	},
	exerciseName: {
		fontSize: 24,
		fontWeight: 'bold',
		textAlign: 'center',
		marginBottom: 8,
	},
	muscleGroup: {
		fontSize: 16,
		marginBottom: 24,
	},
	setInfo: {
		alignItems: 'center',
		marginBottom: 20,
	},
	setLabel: {
		fontSize: 14,
		marginBottom: 4,
	},
	setNumber: {
		fontSize: 32,
		fontWeight: 'bold',
	},
	repsInfo: {
		alignItems: 'center',
	},
	repsLabel: {
		fontSize: 14,
		marginBottom: 4,
	},
	repsNumber: {
		fontSize: 24,
		fontWeight: '600',
	},
	restCard: {
		padding: 24,
		alignItems: 'center',
	},
	restTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 12,
	},
	restTimer: {
		fontSize: 48,
		fontWeight: 'bold',
		marginBottom: 20,
	},
	skipButton: {
		minWidth: 150,
	},
	actionContainer: {
		paddingHorizontal: 20,
		paddingBottom: 40,
	},
	completeButton: {
		paddingVertical: 16,
	},
});