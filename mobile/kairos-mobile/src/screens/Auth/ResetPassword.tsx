import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import useTheme from '../../hooks/useTheme';
import SecureInput from '../../components/SecureInput';
import Button from '../../components/Button';
import { resetPasswordSchema, ResetPasswordFormData } from '../../lib/validation';

interface ResetPasswordRouteParams {
	token?: string;
	email?: string;
}

export default function ResetPasswordScreen() {
	const { colors } = useTheme();
	const navigation = useNavigation();
	const route = useRoute();
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	const params = route.params as ResetPasswordRouteParams;
	const token = params?.token || '';
	const email = params?.email || '';

	const { control, handleSubmit, formState: { errors }, watch } = useForm<ResetPasswordFormData>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: {
			token,
			password: '',
			confirmPassword: '',
		},
	});

	const password = watch('password');

	const onSubmit = async (data: ResetPasswordFormData) => {
		setIsLoading(true);
		try {
			// Aquí iría la lógica de restablecimiento de contraseña real
			console.log('Reset password data:', data);
			
			// Simular llamada a la API
			await new Promise(resolve => setTimeout(resolve, 2000));
			
			// Mostrar éxito
			setIsSuccess(true);
		} catch (error) {
			console.error('Error al restablecer contraseña:', error);
			Alert.alert(
				'Error',
				'No pudimos restablecer tu contraseña. Por favor, intenta nuevamente o solicita un nuevo enlace.',
				[{ text: 'OK' }]
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleBackToLogin = () => {
		navigation.navigate('Login' as never);
	};

	if (isSuccess) {
		return (
			<View style={[styles.container, { backgroundColor: colors.background }]}>
				<View style={styles.successContainer}>
					<View style={[styles.successIcon, { backgroundColor: colors.success + '20' }]}>
						<Text style={[styles.successIconText, { color: colors.success }]}>✓</Text>
					</View>
					
					<Text style={[styles.successTitle, { color: colors.text.primary }]}>
						¡Contraseña Restablecida!
					</Text>
					
					<Text style={[styles.successText, { color: colors.text.secondary }]}>
						Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
					</Text>
					
					<Button
						title="Ir a Iniciar Sesión"
						onPress={handleBackToLogin}
						variant="primary"
						size="lg"
						fullWidth
						style={styles.successButton}
					/>
				</View>
			</View>
		);
	}

	return (
		<KeyboardAvoidingView
			style={[styles.container, { backgroundColor: colors.background }]}
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
		>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<TouchableOpacity 
					style={styles.backButton}
					onPress={() => navigation.goBack()}
				>
					<Text style={[styles.backButtonText, { color: colors.primary }]}>
						← Volver
					</Text>
				</TouchableOpacity>
				
				<Text style={[styles.title, { color: colors.text.primary }]}>
					Nueva Contraseña
				</Text>
				
				<Text style={[styles.subtitle, { color: colors.text.secondary }]}>
					{email ? `Restableciendo contraseña para ${email}` : 'Ingresa tu nueva contraseña'}
				</Text>
				
				<View style={styles.form}>
					<Controller
						control={control}
						name="password"
						render={({ field: { onChange, onBlur, value } }) => (
							<SecureInput
								label="Nueva Contraseña"
								placeholder="Ingresa tu nueva contraseña"
								secureTextEntry
								value={value}
								onChangeText={onChange}
								onBlur={onBlur}
								error={errors.password?.message}
								containerStyle={styles.inputContainer}
								leftIcon="lock-closed"
								required
								showPasswordStrength
								helperText="Debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y símbolos"
							/>
						)}
					/>
					
					<Controller
						control={control}
						name="confirmPassword"
						render={({ field: { onChange, onBlur, value } }) => (
							<SecureInput
								label="Confirmar Nueva Contraseña"
								placeholder="Confirma tu nueva contraseña"
								secureTextEntry
								value={value}
								onChangeText={onChange}
								onBlur={onBlur}
								error={errors.confirmPassword?.message}
								containerStyle={styles.inputContainer}
								leftIcon="lock-closed"
								required
								helperText="Debe coincidir con la contraseña anterior"
							/>
						)}
					/>
					
					<Button
						title="Restablecer Contraseña"
						onPress={handleSubmit(onSubmit)}
						variant="primary"
						size="lg"
						loading={isLoading}
						disabled={isLoading || !password}
						fullWidth
						style={styles.submitButton}
					/>
				</View>
				
				<View style={styles.securityNote}>
					<Text style={[styles.securityText, { color: colors.text.secondary }]}>
						🔒 Tu nueva contraseña será encriptada y almacenada de forma segura
					</Text>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		padding: 20,
	},
	backButton: {
		alignSelf: 'flex-start',
		marginTop: 20,
		marginBottom: 20,
	},
	backButtonText: {
		fontSize: 16,
		fontWeight: '500',
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
		marginBottom: 16,
	},
	subtitle: {
		fontSize: 16,
		marginBottom: 32,
	},
	form: {
		width: '100%',
	},
	inputContainer: {
		marginBottom: 24,
	},
	submitButton: {
		marginTop: 8,
		marginBottom: 24,
	},
	securityNote: {
		marginTop: 16,
		padding: 16,
		borderRadius: 8,
		backgroundColor: 'rgba(0, 0, 0, 0.05)',
	},
	securityText: {
		fontSize: 14,
		textAlign: 'center',
		fontStyle: 'italic',
	},
	successContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	successIcon: {
		width: 80,
		height: 80,
		borderRadius: 40,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 24,
	},
	successIconText: {
		fontSize: 32,
		fontWeight: 'bold',
	},
	successTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 16,
		textAlign: 'center',
	},
	successText: {
		fontSize: 16,
		textAlign: 'center',
		marginBottom: 32,
		lineHeight: 24,
	},
	successButton: {
		marginTop: 16,
	},
});