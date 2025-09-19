import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import useTheme from '../../hooks/useTheme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import type { ProgressStackParamList } from '../../navigation/types';

type AddProgressNavigationProp = NativeStackNavigationProp<ProgressStackParamList, 'AddProgress'>;

export default function AddProgressScreen() {
	const navigation = useNavigation<AddProgressNavigationProp>();
	const { colors } = useTheme();

	const [weight, setWeight] = useState('');
	const [bodyFat, setBodyFat] = useState('');
	const [muscle, setMuscle] = useState('');
	const [chest, setChest] = useState('');
	const [waist, setWaist] = useState('');
	const [hips, setHips] = useState('');
	const [biceps, setBiceps] = useState('');
	const [thighs, setThighs] = useState('');
	const [notes, setNotes] = useState('');

	const handleSaveProgress = async () => {
		if (!weight.trim()) {
			Alert.alert('Error', 'El peso es obligatorio.');
			return;
		}

		try {
			// TODO: Implementar guardado real
			const progressData = {
				date: new Date().toISOString(),
				weight: parseFloat(weight),
				bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
				muscle: muscle ? parseFloat(muscle) : undefined,
				measurements: {
					chest: chest ? parseInt(chest) : undefined,
					waist: waist ? parseInt(waist) : undefined,
					hips: hips ? parseInt(hips) : undefined,
					biceps: biceps ? parseInt(biceps) : undefined,
					thighs: thighs ? parseInt(thighs) : undefined,
				},
				notes: notes.trim() || undefined,
			};

			console.log('Saving progress:', progressData);

			Alert.alert(
				'Progreso Guardado',
				'Tu progreso ha sido registrado correctamente.',
				[
					{
						text: 'OK',
						onPress: () => navigation.goBack(),
					},
				]
			);
		} catch (error) {
			console.error('Error saving progress:', error);
			Alert.alert(
				'Error',
				'No se pudo guardar el progreso. Inténtalo de nuevo.',
				[{ text: 'OK' }]
			);
		}
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
				{/* Header */}
				<View style={styles.header}>
					<Text style={[styles.title, { color: colors.text.primary }]}>
						Registrar Progreso
					</Text>
					<Text style={[styles.subtitle, { color: colors.text.secondary }]}>
						Registra tus medidas y progreso del día
					</Text>
				</View>

				{/* Body Composition */}
				<Card style={styles.card}>
					<Text style={[styles.cardTitle, { color: colors.text.primary }]}>
						Composición Corporal
					</Text>
					<View style={styles.inputRow}>
						<View style={styles.inputContainer}>
							<Input
								label="Peso (kg) *"
								value={weight}
								onChangeText={setWeight}
								placeholder="75.5"
								keyboardType="numeric"
							/>
						</View>
						<View style={styles.inputContainer}>
							<Input
								label="Grasa Corporal (%)"
								value={bodyFat}
								onChangeText={setBodyFat}
								placeholder="18.2"
								keyboardType="numeric"
							/>
						</View>
					</View>
					<View style={styles.inputContainer}>
						<Input
							label="Masa Muscular (kg)"
							value={muscle}
							onChangeText={setMuscle}
							placeholder="42.8"
							keyboardType="numeric"
						/>
					</View>
				</Card>

				{/* Body Measurements */}
				<Card style={styles.card}>
					<Text style={[styles.cardTitle, { color: colors.text.primary }]}>
						Medidas Corporales (cm)
					</Text>
					<View style={styles.inputRow}>
						<View style={styles.inputContainer}>
							<Input
								label="Pecho"
								value={chest}
								onChangeText={setChest}
								placeholder="98"
								keyboardType="numeric"
							/>
						</View>
						<View style={styles.inputContainer}>
							<Input
								label="Cintura"
								value={waist}
								onChangeText={setWaist}
								placeholder="82"
								keyboardType="numeric"
							/>
						</View>
					</View>
					<View style={styles.inputRow}>
						<View style={styles.inputContainer}>
							<Input
								label="Caderas"
								value={hips}
								onChangeText={setHips}
								placeholder="95"
								keyboardType="numeric"
							/>
						</View>
						<View style={styles.inputContainer}>
							<Input
								label="Bíceps"
								value={biceps}
								onChangeText={setBiceps}
								placeholder="35"
								keyboardType="numeric"
							/>
						</View>
					</View>
					<View style={styles.inputContainer}>
						<Input
							label="Muslos"
							value={thighs}
							onChangeText={setThighs}
							placeholder="58"
							keyboardType="numeric"
						/>
					</View>
				</Card>

				{/* Notes */}
				<Card style={styles.card}>
					<Text style={[styles.cardTitle, { color: colors.text.primary }]}>
						Notas (Opcional)
					</Text>
					<Input
						label="Observaciones"
						value={notes}
						onChangeText={setNotes}
						placeholder="Ej: Me siento más fuerte, mejoré en sentadillas..."
						multiline
						numberOfLines={4}
					/>
				</Card>
			</ScrollView>

			{/* Action Buttons */}
			<View style={styles.actionButtons}>
				<Button
					title="Cancelar"
					onPress={() => navigation.goBack()}
					variant="secondary"
					style={styles.cancelButton}
				/>
				<Button
					title="Guardar Progreso"
					onPress={handleSaveProgress}
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
	inputRow: {
		flexDirection: 'row',
		gap: 12,
	},
	inputContainer: {
		flex: 1,
		marginBottom: 16,
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
});