import React, { useState, useRef } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Modal,
	TouchableOpacity,
	PanResponder,
	Animated,
	Vibration,
	Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';
import Card from './Card';
import Button from './Button';
import Input from './Input';

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

interface ExerciseEditorProps {
	exercise: Exercise;
	visible: boolean;
	onClose: () => void;
	onSave: (exercise: Exercise) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export default function ExerciseEditor({ exercise, visible, onClose, onSave }: ExerciseEditorProps) {
	const { colors } = useTheme();
	const [editedExercise, setEditedExercise] = useState<Exercise>(exercise);
	
	// Animaciones para controles deslizantes
	const setsSliderValue = useRef(new Animated.Value(exercise.sets)).current;
	const restSliderValue = useRef(new Animated.Value(exercise.rest)).current;
	const setsPosition = useRef(new Animated.Value(0)).current;
	const restPosition = useRef(new Animated.Value(0)).current;

	// Crear PanResponder para el slider de sets
	const createSetsSlider = () => {
		return PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponder: () => true,
			onPanResponderGrant: () => {
				Vibration.vibrate(30);
			},
			onPanResponderMove: (_, gestureState) => {
				const sliderWidth = screenWidth - 120;
				const newPosition = Math.max(0, Math.min(sliderWidth, gestureState.moveX - 60));
				const percentage = newPosition / sliderWidth;
				const newSets = Math.max(1, Math.min(10, Math.round(1 + percentage * 9)));
				
				setsPosition.setValue(newPosition);
				setsSliderValue.setValue(newSets);
				
				setEditedExercise(prev => ({ ...prev, sets: newSets }));
				
				// Vibración sutil en cada cambio
				if (newSets !== editedExercise.sets) {
					Vibration.vibrate(10);
				}
			},
			onPanResponderRelease: () => {
				Vibration.vibrate(50);
			},
		});
	};

	// Crear PanResponder para el slider de descanso
	const createRestSlider = () => {
		return PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponder: () => true,
			onPanResponderGrant: () => {
				Vibration.vibrate(30);
			},
			onPanResponderMove: (_, gestureState) => {
				const sliderWidth = screenWidth - 120;
				const newPosition = Math.max(0, Math.min(sliderWidth, gestureState.moveX - 60));
				const percentage = newPosition / sliderWidth;
				const newRest = Math.max(30, Math.min(300, Math.round(30 + percentage * 270)));
				
				restPosition.setValue(newPosition);
				restSliderValue.setValue(newRest);
				
				setEditedExercise(prev => ({ ...prev, rest: newRest }));
				
				// Vibración sutil en cada cambio
				if (newRest !== editedExercise.rest) {
					Vibration.vibrate(10);
				}
			},
			onPanResponderRelease: () => {
				Vibration.vibrate(50);
			},
		});
	};

	const setsSlider = createSetsSlider();
	const restSlider = createRestSlider();

	// Inicializar posiciones de sliders
	React.useEffect(() => {
		const sliderWidth = screenWidth - 120;
		const setsPercentage = (exercise.sets - 1) / 9;
		const restPercentage = (exercise.rest - 30) / 270;
		
		setsPosition.setValue(setsPercentage * sliderWidth);
		restPosition.setValue(restPercentage * sliderWidth);
	}, [exercise]);

	const handleSave = () => {
		onSave(editedExercise);
		onClose();
		Vibration.vibrate(100);
	};

	const handleQuickSet = (sets: number) => {
		setEditedExercise(prev => ({ ...prev, sets }));
		Vibration.vibrate(30);
		
		// Actualizar posición del slider
		const sliderWidth = screenWidth - 120;
		const percentage = (sets - 1) / 9;
		Animated.spring(setsPosition, {
			toValue: percentage * sliderWidth,
			useNativeDriver: false,
		}).start();
	};

	const handleQuickRest = (rest: number) => {
		setEditedExercise(prev => ({ ...prev, rest }));
		Vibration.vibrate(30);
		
		// Actualizar posición del slider
		const sliderWidth = screenWidth - 120;
		const percentage = (rest - 30) / 270;
		Animated.spring(restPosition, {
			toValue: percentage * sliderWidth,
			useNativeDriver: false,
		}).start();
	};

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={onClose}
		>
			<View style={[styles.container, { backgroundColor: colors.background }]}>
				{/* Header */}
				<View style={[styles.header, { borderBottomColor: colors.border }]}>
					<TouchableOpacity onPress={onClose} style={styles.closeButton}>
						<Ionicons name="close" size={24} color={colors.text.primary} />
					</TouchableOpacity>
					<Text style={[styles.headerTitle, { color: colors.text.primary }]}>
						Editar Ejercicio
					</Text>
					<TouchableOpacity onPress={handleSave} style={styles.saveButton}>
						<Text style={[styles.saveText, { color: colors.primary }]}>Guardar</Text>
					</TouchableOpacity>
				</View>

				{/* Content */}
				<View style={styles.content}>
					{/* Información básica */}
					<Card style={styles.section}>
						<Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
							{editedExercise.name}
						</Text>
						<Text style={[styles.muscleGroup, { color: colors.text.secondary }]}>
							{editedExercise.muscleGroup}
						</Text>
					</Card>

					{/* Control de Sets con gestos */}
					<Card style={styles.section}>
						<Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
							Sets: {editedExercise.sets}
						</Text>
						<Text style={[styles.hint, { color: colors.text.secondary }]}>
							Desliza para ajustar o toca los botones rápidos
						</Text>
						
						{/* Slider personalizado */}
						<View style={styles.sliderContainer}>
							<View style={[styles.sliderTrack, { backgroundColor: colors.border }]} />
							<Animated.View
								style={[
									styles.sliderThumb,
									{ backgroundColor: colors.primary, left: setsPosition },
								]}
								{...setsSlider.panHandlers}
							/>
						</View>
						
						{/* Botones rápidos */}
						<View style={styles.quickButtons}>
							{[3, 4, 5].map(sets => (
								<TouchableOpacity
									key={sets}
									onPress={() => handleQuickSet(sets)}
									style={[
										styles.quickButton,
										{
											backgroundColor: editedExercise.sets === sets ? colors.primary : colors.card,
											borderColor: colors.border,
										},
									]}
								>
									<Text
										style={[
											styles.quickButtonText,
											{
												color: editedExercise.sets === sets ? colors.text.inverse : colors.text.primary,
											},
										]}
									>
										{sets}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					</Card>

					{/* Control de Descanso con gestos */}
					<Card style={styles.section}>
						<Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
							Descanso: {editedExercise.rest}s
						</Text>
						<Text style={[styles.hint, { color: colors.text.secondary }]}>
							Desliza para ajustar o toca los botones rápidos
						</Text>
						
						{/* Slider personalizado */}
						<View style={styles.sliderContainer}>
							<View style={[styles.sliderTrack, { backgroundColor: colors.border }]} />
							<Animated.View
								style={[
									styles.sliderThumb,
									{ backgroundColor: colors.secondary, left: restPosition },
								]}
								{...restSlider.panHandlers}
							/>
						</View>
						
						{/* Botones rápidos */}
						<View style={styles.quickButtons}>
							{[60, 90, 120, 180].map(rest => (
								<TouchableOpacity
									key={rest}
									onPress={() => handleQuickRest(rest)}
									style={[
										styles.quickButton,
										{
											backgroundColor: editedExercise.rest === rest ? colors.secondary : colors.card,
											borderColor: colors.border,
										},
									]}
								>
									<Text
										style={[
											styles.quickButtonText,
											{
												color: editedExercise.rest === rest ? colors.text.inverse : colors.text.primary,
											},
										]}
									>
										{rest}s
									</Text>
								</TouchableOpacity>
							))}
						</View>
					</Card>

					{/* Repeticiones y Peso */}
					<Card style={styles.section}>
						<Input
							label="Repeticiones"
							value={editedExercise.reps}
							onChangeText={(reps) => setEditedExercise(prev => ({ ...prev, reps }))}
							placeholder="Ej: 8-12, 10, 15"
							style={styles.input}
						/>
						<Input
							label="Peso (opcional)"
							value={editedExercise.weight || ''}
							onChangeText={(weight) => setEditedExercise(prev => ({ ...prev, weight }))}
							placeholder="Ej: 50kg, 20lbs"
							keyboardType="numeric"
							style={styles.input}
						/>
					</Card>

					{/* Notas */}
					<Card style={styles.section}>
						<Input
							label="Notas (opcional)"
							value={editedExercise.notes || ''}
							onChangeText={(notes) => setEditedExercise(prev => ({ ...prev, notes }))}
							placeholder="Técnica, consejos, modificaciones..."
							multiline
							numberOfLines={3}
							style={styles.input}
						/>
					</Card>

					{/* Instrucciones de gestos */}
					<View style={styles.gestureInstructions}>
						<Text style={[styles.instructionsTitle, { color: colors.text.primary }]}>
							💡 Gestos Táctiles
						</Text>
						<Text style={[styles.instructionsText, { color: colors.text.secondary }]}>
							• Desliza los controles para ajustar valores{"\n"}
							• Toca los botones rápidos para valores comunes{"\n"}
							• Siente la vibración táctil como confirmación
						</Text>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
	},
	closeButton: {
		padding: 4,
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: '600',
	},
	saveButton: {
		padding: 4,
	},
	saveText: {
		fontSize: 16,
		fontWeight: '600',
	},
	content: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 20,
	},
	section: {
		marginBottom: 20,
		padding: 16,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 8,
	},
	muscleGroup: {
		fontSize: 14,
	},
	hint: {
		fontSize: 12,
		marginBottom: 16,
		fontStyle: 'italic',
	},
	sliderContainer: {
		height: 40,
		justifyContent: 'center',
		marginBottom: 16,
		position: 'relative',
	},
	sliderTrack: {
		height: 4,
		borderRadius: 2,
		marginHorizontal: 20,
	},
	sliderThumb: {
		width: 24,
		height: 24,
		borderRadius: 12,
		position: 'absolute',
		top: 8,
		shadowColor: colors.shadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
		elevation: 4,
	},
	quickButtons: {
		flexDirection: 'row',
		justifyContent: 'space-around',
	},
	quickButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 8,
		borderWidth: 1,
		minWidth: 50,
		alignItems: 'center',
	},
	quickButtonText: {
		fontSize: 14,
		fontWeight: '500',
	},
	input: {
		marginBottom: 12,
	},
	gestureInstructions: {
		marginTop: 20,
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 8,
		backgroundColor: 'rgba(16, 185, 129, 0.1)',
	},
	instructionsTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 8,
	},
	instructionsText: {
		fontSize: 14,
		lineHeight: 20,
	},
});