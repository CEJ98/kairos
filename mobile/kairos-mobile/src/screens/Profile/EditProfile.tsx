import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import useTheme from '../../hooks/useTheme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import SecureInput from '../../components/SecureInput';
import { userProfileSchema, UserProfileFormData } from '../../lib/validation';
import type { ProfileStackParamList } from '../../navigation/types';

type EditProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'EditProfile'>;

export default function EditProfileScreen() {
	const navigation = useNavigation<EditProfileNavigationProp>();
	const { colors } = useTheme();
	const [isLoading, setIsLoading] = useState(false);

	// Configurar react-hook-form con validación
	const { control, handleSubmit, formState: { errors } } = useForm<UserProfileFormData>({
		resolver: zodResolver(userProfileSchema),
		defaultValues: {
			name: 'Juan Pérez',
			email: 'juan.perez@email.com',
			phone: '+34 612 345 678',
			bio: 'Apasionado del fitness y la vida saludable',
			gender: 'prefer_not_to_say'
		}
	});

	const onSubmit = async (data: UserProfileFormData) => {
		setIsLoading(true);
		try {
			// TODO: Implementar guardado real
			console.log('Saving profile:', data);

			// Simular delay de guardado
			await new Promise(resolve => setTimeout(resolve, 1000));

			Alert.alert(
				'Perfil Actualizado',
				'Tu perfil ha sido actualizado correctamente.',
				[
					{
						text: 'OK',
						onPress: () => navigation.goBack(),
					},
				]
			);
		} catch (error) {
			console.error('Error saving profile:', error);
			Alert.alert(
				'Error',
				'No se pudo actualizar el perfil. Inténtalo de nuevo.',
				[{ text: 'OK' }]
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
				{/* Personal Information */}
				<Card style={styles.card}>
					<Text style={[styles.cardTitle, { color: colors.text.primary }]}>
						Información Personal
					</Text>
					<Controller
						control={control}
						name="name"
						render={({ field: { onChange, onBlur, value } }) => (
							<SecureInput
								label="Nombre Completo *"
								value={value}
								onChangeText={onChange}
								onBlur={onBlur}
								placeholder="Juan Pérez"
								error={errors.name?.message}
								containerStyle={styles.inputContainer}
								leftIcon="person"
								required
								autoCapitalize="words"
							/>
						)}
					/>
					<Controller
						control={control}
						name="email"
						render={({ field: { onChange, onBlur, value } }) => (
							<SecureInput
								label="Email *"
								value={value}
								onChangeText={onChange}
								onBlur={onBlur}
								placeholder="juan.perez@email.com"
								keyboardType="email-address"
								autoCapitalize="none"
								error={errors.email?.message}
								containerStyle={styles.inputContainer}
								leftIcon="mail"
								required
							/>
						)}
					/>
					<Controller
						control={control}
						name="phone"
						render={({ field: { onChange, onBlur, value } }) => (
							<SecureInput
								label="Teléfono"
								value={value || ''}
								onChangeText={onChange}
								onBlur={onBlur}
								placeholder="+34 612 345 678"
								keyboardType="phone-pad"
								error={errors.phone?.message}
								containerStyle={styles.inputContainer}
								leftIcon="call"
							/>
						)}
					/>
				</Card>

				{/* Additional Information */}
				<Card style={styles.card}>
					<Text style={[styles.cardTitle, { color: colors.text.primary }]}>
						Información Adicional
					</Text>
					<Controller
						control={control}
						name="bio"
						render={({ field: { onChange, onBlur, value } }) => (
							<SecureInput
								label="Biografía"
								value={value || ''}
								onChangeText={onChange}
								onBlur={onBlur}
								placeholder="Cuéntanos sobre ti..."
								multiline
								numberOfLines={4}
								error={errors.bio?.message}
								containerStyle={styles.inputContainer}
								leftIcon="document-text"
								helperText="Máximo 500 caracteres"
							/>
						)}
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
					title="Guardar Cambios"
					onPress={handleSubmit(onSubmit)}
					variant="primary"
					style={styles.saveButton}
					loading={isLoading}
					disabled={isLoading}
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