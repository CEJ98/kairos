import React, { useState, useRef, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Animated,
	Dimensions,
	Vibration,
	Alert,
	GestureResponderEvent,
	PanResponderGestureState,
} from 'react-native';
import EnhancedGestureHandler, { GesturePresets } from '../../components/EnhancedGestureHandler';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../hooks/useTheme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import ExerciseEditor from '../../components/ExerciseEditor';
import OfflineIndicator from '../../components/OfflineIndicator';
import useOffline from '../../hooks/useOffline';
import useHealth from '../../hooks/useHealth';
import HealthService from '../../services/HealthService';
import type { WorkoutsStackParamList } from '../../navigation/types';
import type { OfflineWorkout } from '../../services/OfflineService';
import type { WorkoutData } from '../../services/HealthService';

type WorkoutBuilderNavigationProp = NativeStackNavigationProp<WorkoutsStackParamList, 'CreateWorkout'>;

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

interface ExerciseTemplate {
	id: string;
	name: string;
	muscleGroup: string;
	defaultSets: number;
	defaultReps: string;
	defaultRest: number;
}

const exerciseTemplates: ExerciseTemplate[] = [
	{
		id: '1',
		name: 'Press de Banca',
		muscleGroup: 'Pecho',
		defaultSets: 3,
		defaultReps: '8-12',
		defaultRest: 120,
	},
	{
		id: '2',
		name: 'Sentadillas',
		muscleGroup: 'Piernas',
		defaultSets: 4,
		defaultReps: '10-15',
		defaultRest: 180,
	},
	{
		id: '3',
		name: 'Peso Muerto',
		muscleGroup: 'Espalda',
		defaultSets: 3,
		defaultReps: '5-8',
		defaultRest: 180,
	},
	{
		id: '4',
		name: 'Press Militar',
		muscleGroup: 'Hombros',
		defaultSets: 3,
		defaultReps: '8-10',
		defaultRest: 120,
	},
	{
		id: '5',
		name: 'Dominadas',
		muscleGroup: 'Espalda',
		defaultSets: 3,
		defaultReps: '6-10',
		defaultRest: 120,
	},
	{
		id: '6',
		name: 'Curl de Bíceps',
		muscleGroup: 'Brazos',
		defaultSets: 3,
		defaultReps: '10-12',
		defaultRest: 90,
	},
];

const { width: screenWidth } = Dimensions.get('window');

export default function WorkoutBuilderScreen() {
	const navigation = useNavigation<WorkoutBuilderNavigationProp>();
	const { colors } = useTheme();
	const { offlineState, saveWorkoutOffline } = useOffline();
	const { isAvailable: healthAvailable, saveWorkout: saveHealthWorkout } = useHealth();
	const [workoutName, setWorkoutName] = useState('');
	const [exercises, setExercises] = useState<Exercise[]>([]);
	const [draggedExercise, setDraggedExercise] = useState<Exercise | null>(null);
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [showTemplates, setShowTemplates] = useState(true);
	const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
	const [showEditor, setShowEditor] = useState(false);
	const [lastTap, setLastTap] = useState<number>(0);
	const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
	const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

	// Animaciones para drag & drop y gestos mejorados
	const dragY = useRef(new Animated.Value(0)).current;
	const dragOpacity = useRef(new Animated.Value(1)).current;
	const scaleAnim = useRef(new Animated.Value(1)).current;
	const shakeAnim = useRef(new Animated.Value(0)).current;
	const pulseAnim = useRef(new Animated.Value(1)).current;

	// Configuración de gestos mejorados para cada ejercicio
	const createGestureConfig = (exercise: Exercise, index: number) => {
		return {
			...GesturePresets.workoutBuilder,
			// Drag & Drop
			onDragStart: () => {
				setDraggedExercise(exercise);
				setDraggedIndex(index);
				
				// Animación de escala
				Animated.spring(scaleAnim, {
					toValue: 1.05,
					useNativeDriver: true,
				}).start();
				
				// Reducir opacidad
				Animated.timing(dragOpacity, {
					toValue: 0.8,
					duration: 150,
					useNativeDriver: true,
				}).start();
			},
			onDragMove: (gestureState: PanResponderGestureState) => {
				// Actualizar posición Y
				dragY.setValue(gestureState.dy);
			},
			onDragEnd: (gestureState: PanResponderGestureState) => {
				const moveThreshold = 60;
				
				// Reordenar ejercicios (mover arriba/abajo)
				if (Math.abs(gestureState.dy) > moveThreshold) {
					const direction = gestureState.dy > 0 ? 1 : -1;
					handleReorderExercise(index, direction);
				}
				
				// Resetear animaciones
				resetAnimations();
				setDraggedExercise(null);
				setDraggedIndex(null);
			},
			// Swipe gestures
			onSwipeRight: () => {
				// Eliminar ejercicio con swipe hacia la derecha
				handleDeleteExercise(index);
			},
			onSwipeLeft: () => {
				// Duplicar ejercicio con swipe hacia la izquierda
				handleDuplicateExercise(exercise);
			},
			// Tap gestures
			onTap: () => {
				if (isMultiSelectMode) {
					toggleExerciseSelection(exercise.id);
				}
			},
			onDoubleTap: () => {
				if (!isMultiSelectMode) {
					handleEditExercise(exercise);
				}
			},
			onLongPress: () => {
				if (!isMultiSelectMode) {
					setIsMultiSelectMode(true);
					toggleExerciseSelection(exercise.id);
					startPulseAnimation();
				}
			},
		};
	};

	const resetAnimations = () => {
		Animated.parallel([
			Animated.spring(dragY, {
				toValue: 0,
				useNativeDriver: true,
			}),
			Animated.timing(dragOpacity, {
				toValue: 1,
				duration: 150,
				useNativeDriver: true,
			}),
			Animated.spring(scaleAnim, {
				toValue: 1,
				useNativeDriver: true,
			}),
		]).start();
	};

	const handleAddExercise = (template: ExerciseTemplate) => {
		const newExercise: Exercise = {
			id: Date.now().toString(),
			name: template.name,
			muscleGroup: template.muscleGroup,
			sets: template.defaultSets,
			reps: template.defaultReps,
			rest: template.defaultRest,
		};
		
		setExercises(prev => [...prev, newExercise]);
		Vibration.vibrate(30); // Feedback táctil
	};

	const handleDeleteExercise = (index: number) => {
		Vibration.vibrate([50, 50, 50]); // Patrón de vibración para eliminación
		
		Alert.alert(
			'Eliminar Ejercicio',
			'¿Estás seguro de que quieres eliminar este ejercicio?',
			[
				{ text: 'Cancelar', style: 'cancel' },
				{
					text: 'Eliminar',
					style: 'destructive',
					onPress: () => {
						setExercises(prev => prev.filter((_, i) => i !== index));
					},
				},
			]
		);
	};

	const handleReorderExercise = (fromIndex: number, direction: number) => {
		const toIndex = fromIndex + direction;
		
		if (toIndex < 0 || toIndex >= exercises.length) return;
		
		const newExercises = [...exercises];
		const [movedExercise] = newExercises.splice(fromIndex, 1);
		newExercises.splice(toIndex, 0, movedExercise);
		
		setExercises(newExercises);
		Vibration.vibrate(30); // Feedback táctil
	};

	const handleEditExercise = (exercise: Exercise) => {
		setEditingExercise(exercise);
		setShowEditor(true);
		Vibration.vibrate(30);
	};

	const handleSaveExercise = (updatedExercise: Exercise) => {
		setExercises(prev => 
			prev.map(ex => ex.id === updatedExercise.id ? updatedExercise : ex)
		);
		setEditingExercise(null);
	};

	const handleDuplicateExercise = (exercise: Exercise) => {
		const duplicatedExercise: Exercise = {
			...exercise,
			id: Date.now().toString(),
			name: `${exercise.name} (Copia)`,
		};
		setExercises(prev => [...prev, duplicatedExercise]);
		Vibration.vibrate([30, 50]); // Patrón de vibración para duplicar
	};

	// Gestos táctiles mejorados
	const handleDoubleTap = useCallback((exercise: Exercise) => {
		const now = Date.now();
		const DOUBLE_TAP_DELAY = 300;
		
		if (now - lastTap < DOUBLE_TAP_DELAY) {
			// Doble toque detectado - edición rápida
			Vibration.vibrate([30, 50, 30]);
			handleEditExercise(exercise);
			return true;
		}
		
		setLastTap(now);
		return false;
	}, [lastTap]);

	const handleLongPress = useCallback((exercise: Exercise) => {
		// Activar modo multi-selección
		Vibration.vibrate([50, 100, 50]);
		setIsMultiSelectMode(true);
		setSelectedExercises(new Set([exercise.id]));
		
		// Animación de shake para indicar modo multi-selección
		Animated.sequence([
			Animated.timing(shakeAnim, {
				toValue: 10,
				duration: 50,
				useNativeDriver: true,
			}),
			Animated.timing(shakeAnim, {
				toValue: -10,
				duration: 50,
				useNativeDriver: true,
			}),
			Animated.timing(shakeAnim, {
				toValue: 0,
				duration: 50,
				useNativeDriver: true,
			}),
		]).start();
	}, [shakeAnim]);

	const toggleExerciseSelection = useCallback((exerciseId: string) => {
		setSelectedExercises(prev => {
			const newSet = new Set(prev);
			if (newSet.has(exerciseId)) {
				newSet.delete(exerciseId);
			} else {
				newSet.add(exerciseId);
			}
			
			// Si no hay ejercicios seleccionados, salir del modo multi-selección
			if (newSet.size === 0) {
				setIsMultiSelectMode(false);
			}
			
			Vibration.vibrate(20);
			return newSet;
		});
	}, []);

	const handleBulkDelete = useCallback(() => {
		if (selectedExercises.size === 0) return;
		
		Vibration.vibrate([100, 50, 100]);
		
		Alert.alert(
			'Eliminar Ejercicios',
			`¿Estás seguro de que quieres eliminar ${selectedExercises.size} ejercicio(s)?`,
			[
				{ text: 'Cancelar', style: 'cancel' },
				{
					text: 'Eliminar',
					style: 'destructive',
					onPress: () => {
						setExercises(prev => prev.filter(ex => !selectedExercises.has(ex.id)));
						setSelectedExercises(new Set());
						setIsMultiSelectMode(false);
					},
				},
			]
		);
	}, [selectedExercises]);

	const exitMultiSelectMode = useCallback(() => {
		setIsMultiSelectMode(false);
		setSelectedExercises(new Set());
		Vibration.vibrate(30);
	}, []);

	// Animación de pulso para feedback visual
	const startPulseAnimation = useCallback(() => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(pulseAnim, {
					toValue: 1.1,
					duration: 500,
					useNativeDriver: true,
				}),
				Animated.timing(pulseAnim, {
					toValue: 1,
					duration: 500,
					useNativeDriver: true,
				}),
			]),
			{ iterations: 3 }
		).start();
	}, [pulseAnim]);

	const handleSaveWorkout = async () => {
		if (!workoutName.trim()) {
			Alert.alert('Error', 'Por favor ingresa un nombre para la rutina');
			return;
		}
		
		if (exercises.length === 0) {
			Alert.alert('Error', 'Agrega al menos un ejercicio a la rutina');
			return;
		}
		
		try {
			const workoutId = `workout_${Date.now()}`;
			const now = new Date();
			const startTime = now.toISOString();
			
			// Calcular duración estimada basada en ejercicios y descansos
			const estimatedDuration = exercises.reduce((total, ex) => {
				return total + (ex.sets * 2) + (ex.rest * ex.sets / 60); // 2 min por serie + descansos
			}, 0);
			
			const endTime = new Date(now.getTime() + estimatedDuration * 60000).toISOString();
			
			// Crear objeto de rutina offline
			const offlineWorkout: OfflineWorkout = {
				id: workoutId,
				name: workoutName.trim(),
				exercises: exercises.map(ex => ({
					id: ex.id,
					name: ex.name,
					sets: ex.sets,
					reps: parseInt(ex.reps.split('-')[0]) || 0,
					weight: ex.weight ? parseFloat(ex.weight) : 0,
					rest: ex.rest,
					notes: ex.notes,
				})),
				createdAt: startTime,
				updatedAt: startTime,
				synced: offlineState.isConnected,
			};

			// Guardar rutina offline
			await saveWorkoutOffline(offlineWorkout);

			// Intentar guardar en Apple Health / Google Fit si está disponible
			let healthSaved = false;
			if (healthAvailable) {
				try {
					const platformInfo = HealthService.getPlatformInfo();
					if (platformInfo.available && platformInfo.initialized) {
						const healthWorkout: WorkoutData = {
							id: workoutId,
							type: 'strength', // Tipo por defecto, se puede mejorar basado en ejercicios
							name: workoutName.trim(),
							startTime,
							endTime,
							duration: Math.round(estimatedDuration),
							caloriesBurned: calculateEstimatedCalories(exercises),
							exercises: exercises.map(ex => ({
								name: ex.name,
								sets: ex.sets,
								reps: parseInt(ex.reps.split('-')[0]) || 0,
								weight: ex.weight ? parseFloat(ex.weight) : undefined,
							})),
						};
						
						healthSaved = await saveHealthWorkout(healthWorkout);
						console.log('Workout saved to health app successfully');
					}
				} catch (healthError) {
					console.warn('Could not save to health app:', healthError);
					// No mostramos error al usuario, es opcional
				}
			}

			let message = offlineState.isConnected 
				? `La rutina "${workoutName}" ha sido guardada y sincronizada.`
				: `La rutina "${workoutName}" ha sido guardada offline. Se sincronizará cuando haya conexión.`;
			
			if (healthAvailable && healthSaved) {
				message += '\n\n✅ También guardada en tu app de salud.';
			} else if (healthAvailable && !healthSaved) {
				message += '\n\n⚠️ No se pudo guardar en tu app de salud.';
			}

			Alert.alert(
				'Rutina Guardada',
				message,
				[
					{
						text: 'OK',
						onPress: () => navigation.goBack(),
					},
				]
			);
		} catch (error) {
			console.error('Error saving workout:', error);
			Alert.alert(
				'Error',
				'No se pudo guardar la rutina. Inténtalo de nuevo.',
				[{ text: 'OK' }]
			);
		}
	};

	// Función auxiliar para calcular calorías estimadas
	const calculateEstimatedCalories = (exercises: Exercise[]): number => {
		// Estimación básica: 5 calorías por serie
		return exercises.reduce((total, exercise) => {
			return total + (exercise.sets * 5);
		}, 0);
	};

	const renderExerciseCard = (exercise: Exercise, index: number) => {
		const gestureConfig = createGestureConfig(exercise, index);
		const isDragged = draggedIndex === index;
		const isSelected = selectedExercises.has(exercise.id);
		
		return (
			<EnhancedGestureHandler
				key={exercise.id}
				config={gestureConfig}
				style={[
					styles.exerciseCard,
					{
						transform: [
							{ translateY: isDragged ? dragY : 0 },
							{ translateX: isMultiSelectMode ? shakeAnim : 0 },
							{ scale: isDragged ? scaleAnim : (isSelected ? pulseAnim : 1) },
						],
						opacity: isDragged ? dragOpacity : 1,
						zIndex: isDragged ? 1000 : 1,
						elevation: isDragged ? 8 : 2,
					},
				]}
			>
				<View>
					<Card style={StyleSheet.flatten([
						styles.exerciseCardInner,
						isSelected && {
							backgroundColor: colors.primary + '20',
							borderWidth: 2,
							borderColor: colors.primary
						}
					])}>
					<View style={styles.exerciseHeader}>
						<View style={styles.dragHandle}>
							<Ionicons name="reorder-three" size={20} color={colors.text.secondary} />
						</View>
						<View style={styles.exerciseInfo}>
							<Text style={[styles.exerciseName, { color: colors.text.primary }]}>
								{exercise.name}
							</Text>
							<Text style={[styles.muscleGroup, { color: colors.text.secondary }]}>
								{exercise.muscleGroup}
							</Text>
						</View>
						<View style={styles.exerciseActions}>
							<TouchableOpacity
								onPress={() => handleEditExercise(exercise)}
								style={styles.editButton}
							>
								<Ionicons name="create-outline" size={18} color={colors.primary} />
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() => handleDeleteExercise(index)}
								style={styles.deleteButton}
							>
								<Ionicons name="trash-outline" size={18} color={colors.error} />
							</TouchableOpacity>
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
					
					<View style={styles.gestureHints}>
						<Text style={[styles.hintText, { color: colors.text.secondary }]}>
							{isMultiSelectMode 
								? '✓ Toca para seleccionar • Mantén presionado para más opciones'
								: '↕️ Arrastra para reordenar • ➡️ Desliza para eliminar • ✏️ Doble toque para editar • Mantén presionado para seleccionar'
							}
						</Text>
					</View>
					</Card>
				</View>
			</EnhancedGestureHandler>
		);
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			{/* Indicador de estado offline */}
			<View style={styles.offlineIndicatorContainer}>
				<OfflineIndicator showDetails={true} />
			</View>

			<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
				{/* Header */}
				<View style={styles.header}>
					<Text style={[styles.title, { color: colors.text.primary }]}>
						Constructor de Rutinas
					</Text>
					<Text style={[styles.subtitle, { color: colors.text.secondary }]}>
						Usa gestos táctiles para crear tu rutina perfecta
					</Text>
				</View>

				{/* Nombre de la rutina */}
				<View style={styles.section}>
					<Input
						label="Nombre de la Rutina"
						value={workoutName}
						onChangeText={setWorkoutName}
						placeholder="Ej: Rutina de Fuerza - Lunes"
					/>
				</View>

				{/* Toggle para mostrar plantillas */}
				<View style={styles.section}>
					<TouchableOpacity
						onPress={() => setShowTemplates(!showTemplates)}
						style={styles.toggleButton}
					>
						<Text style={[styles.toggleText, { color: colors.text.primary }]}>
							Plantillas de Ejercicios
						</Text>
						<Ionicons
							name={showTemplates ? 'chevron-up' : 'chevron-down'}
							size={20}
							color={colors.text.primary}
						/>
					</TouchableOpacity>
				</View>

				{/* Plantillas de ejercicios */}
				{showTemplates && (
					<View style={styles.section}>
						<ScrollView horizontal showsHorizontalScrollIndicator={false}>
							<View style={styles.templatesContainer}>
								{exerciseTemplates.map((template) => (
									<TouchableOpacity
										key={template.id}
										onPress={() => handleAddExercise(template)}
										style={[styles.templateCard, { backgroundColor: colors.card }]}
									>
										<Text style={[styles.templateName, { color: colors.text.primary }]}>
											{template.name}
										</Text>
										<Text style={[styles.templateMuscle, { color: colors.text.secondary }]}>
											{template.muscleGroup}
										</Text>
										<View style={styles.templateStats}>
											<Text style={[styles.templateStat, { color: colors.text.secondary }]}>
												{template.defaultSets} sets • {template.defaultReps} reps
											</Text>
										</View>
										<Ionicons name="add-circle" size={24} color={colors.primary} />
									</TouchableOpacity>
								))}
							</View>
						</ScrollView>
					</View>
				)}

				{/* Lista de ejercicios */}
				<View style={styles.section}>
					<Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
						Ejercicios ({exercises.length})
					</Text>
					
					{exercises.length === 0 ? (
						<View style={styles.emptyState}>
							<Ionicons name="fitness" size={48} color={colors.text.secondary} />
							<Text style={[styles.emptyText, { color: colors.text.secondary }]}>
								Agrega ejercicios desde las plantillas
							</Text>
						</View>
					) : (
						<View style={styles.exercisesList}>
							{exercises.map((exercise, index) => renderExerciseCard(exercise, index))}
						</View>
					)}
				</View>
			</ScrollView>

			{/* Multi-Select Action Buttons */}
			{isMultiSelectMode && (
				<View style={[styles.multiSelectActions, { backgroundColor: colors.background }]}>
					<TouchableOpacity
						style={[styles.multiSelectButton, { backgroundColor: colors.error }]}
						onPress={handleBulkDelete}
						disabled={selectedExercises.size === 0}
					>
						<Text style={[styles.multiSelectButtonText, { color: 'white' }]}>
							🗑️ Eliminar ({selectedExercises.size})
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.multiSelectButton, { backgroundColor: colors.text.secondary }]}
						onPress={exitMultiSelectMode}
					>
						<Text style={[styles.multiSelectButtonText, { color: 'white' }]}>
							❌ Cancelar
						</Text>
					</TouchableOpacity>
				</View>
			)}

			{/* Botones de acción */}
			<View style={[styles.actionButtons, { backgroundColor: colors.background }]}>
				<Button
					title="Cancelar"
					onPress={() => navigation.goBack()}
					variant="outline"
					style={styles.cancelButton}
				/>
				<Button
					title="Guardar Rutina"
					onPress={handleSaveWorkout}
					variant="primary"
					style={styles.saveButton}
				/>
			</View>

			{/* Editor de ejercicios */}
			{editingExercise && (
				<ExerciseEditor
					exercise={editingExercise}
					visible={showEditor}
					onClose={() => {
						setShowEditor(false);
						setEditingExercise(null);
					}}
					onSave={handleSaveExercise}
				/>
			)}
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
	toggleButton: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 12,
	},
	toggleText: {
		fontSize: 18,
		fontWeight: '600',
	},
	templatesContainer: {
		flexDirection: 'row',
		paddingRight: 20,
	},
	templateCard: {
		width: 160,
		padding: 16,
		marginRight: 12,
		borderRadius: 12,
		alignItems: 'center',
		elevation: 2,
		shadowColor: '#000000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	templateName: {
		fontSize: 14,
		fontWeight: '600',
		textAlign: 'center',
		marginBottom: 4,
	},
	templateMuscle: {
		fontSize: 12,
		marginBottom: 8,
	},
	templateStats: {
		marginBottom: 8,
	},
	templateStat: {
		fontSize: 10,
		textAlign: 'center',
	},
	exercisesList: {
		gap: 12,
	},
	exerciseCard: {
		marginBottom: 4,
	},
	exerciseCardInner: {
		padding: 16,
		borderRadius: 12,
	},
	exerciseHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	dragHandle: {
		marginRight: 12,
		padding: 4,
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
	exerciseActions: {
		flexDirection: 'row',
		gap: 8,
	},
	editButton: {
		padding: 8,
	},
	deleteButton: {
		padding: 8,
	},
	exerciseDetails: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginBottom: 12,
		paddingVertical: 8,
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
	gestureHints: {
		alignItems: 'center',
	},
	hintText: {
		fontSize: 11,
		fontStyle: 'italic',
	},
	emptyState: {
		alignItems: 'center',
		paddingVertical: 40,
	},
	emptyText: {
		fontSize: 16,
		marginTop: 12,
		textAlign: 'center',
	},
	actionButtons: {
		flexDirection: 'row',
		paddingHorizontal: 20,
		paddingVertical: 16,
		gap: 12,
		borderTopWidth: 1,
		borderTopColor: 'rgba(0,0,0,0.1)',
	},
	cancelButton: {
		flex: 1,
	},
	saveButton: {
		flex: 2,
	},
	offlineIndicatorContainer: {
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	multiSelectActions: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		paddingHorizontal: 20,
		paddingVertical: 15,
		borderTopWidth: 1,
		borderTopColor: 'rgba(0,0,0,0.1)',
	},
	multiSelectButton: {
		flex: 1,
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 8,
		marginHorizontal: 5,
		alignItems: 'center',
	},
	multiSelectButtonText: {
		fontSize: 16,
		fontWeight: '600',
	},
});