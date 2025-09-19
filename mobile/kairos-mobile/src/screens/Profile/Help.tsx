import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import useTheme from '../../hooks/useTheme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import type { ProfileStackParamList } from '../../navigation/types';

type HelpNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'Help'>;

interface FAQItem {
	id: string;
	question: string;
	answer: string;
}

export default function HelpScreen() {
	const navigation = useNavigation<HelpNavigationProp>();
	const { colors } = useTheme();

	const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
	const [contactSubject, setContactSubject] = useState('');
	const [contactMessage, setContactMessage] = useState('');

	// Mock FAQ data
	const faqItems: FAQItem[] = [
		{
			id: '1',
			question: '¿Cómo creo mi primera rutina?',
			answer: 'Ve a la sección "Rutinas" y toca el botón "+" para crear una nueva rutina. Puedes elegir ejercicios de nuestra base de datos o crear ejercicios personalizados. Configura series, repeticiones y descansos según tus objetivos.',
		},
		{
			id: '2',
			question: '¿Cómo registro mi progreso?',
			answer: 'En la sección "Progreso" puedes registrar tu peso, medidas corporales y tomar fotos de progreso. También puedes ver gráficos de tu evolución a lo largo del tiempo.',
		},
		{
			id: '3',
			question: '¿Puedo usar la app sin conexión a internet?',
			answer: 'Sí, una vez que hayas descargado tus rutinas, puedes ejecutarlas sin conexión. El progreso se sincronizará automáticamente cuando vuelvas a tener conexión.',
		},
		{
			id: '4',
			question: '¿Cómo cancelo mi suscripción?',
			answer: 'Puedes cancelar tu suscripción en cualquier momento desde la sección "Mi Suscripción" en tu perfil. La cancelación será efectiva al final del período de facturación actual.',
		},
		{
			id: '5',
			question: '¿La app se integra con Apple Health o Google Fit?',
			answer: 'Sí, con una suscripción Premium o Pro puedes sincronizar automáticamente tus entrenamientos y métricas de salud con Apple Health (iOS) o Google Fit (Android).',
		},
		{
			id: '6',
			question: '¿Cómo contacto con soporte técnico?',
			answer: 'Puedes contactarnos a través del formulario de contacto en esta pantalla, por email a soporte@kairos.com, o a través del chat en vivo disponible para usuarios Premium y Pro.',
		},
	];

	const toggleFAQ = (id: string) => {
		setExpandedFAQ(expandedFAQ === id ? null : id);
	};

	const handleSendMessage = async () => {
		if (!contactSubject.trim() || !contactMessage.trim()) {
			Alert.alert('Error', 'Por favor completa todos los campos.');
			return;
		}

		try {
			// TODO: Implementar envío real
			const contactData = {
				subject: contactSubject.trim(),
				message: contactMessage.trim(),
				timestamp: new Date().toISOString(),
			};

			console.log('Sending contact message:', contactData);

			Alert.alert(
				'Mensaje Enviado',
				'Tu mensaje ha sido enviado correctamente. Te responderemos en las próximas 24 horas.',
				[
					{
						text: 'OK',
						onPress: () => {
							setContactSubject('');
							setContactMessage('');
						},
					},
				]
			);
		} catch (error) {
			console.error('Error sending message:', error);
			Alert.alert(
				'Error',
				'No se pudo enviar el mensaje. Inténtalo de nuevo.',
				[{ text: 'OK' }]
			);
		}
	};

	const handleOpenEmail = () => {
		Linking.openURL('mailto:soporte@kairos.com?subject=Consulta desde la app');
	};

	const handleOpenWebsite = () => {
		Linking.openURL('https://kairos.com/ayuda');
	};

	const renderFAQItem = (item: FAQItem) => (
		<Card key={item.id} style={styles.faqCard}>
			<TouchableOpacity
				onPress={() => toggleFAQ(item.id)}
				style={styles.faqHeader}
				activeOpacity={0.7}
			>
				<Text style={[styles.faqQuestion, { color: colors.text.primary }]}>
					{item.question}
				</Text>
				<Text style={[styles.faqIcon, { color: colors.primary }]}>
					{expandedFAQ === item.id ? '−' : '+'}
				</Text>
			</TouchableOpacity>
			{expandedFAQ === item.id && (
				<View style={styles.faqAnswer}>
					<Text style={[styles.faqAnswerText, { color: colors.text.secondary }]}>
						{item.answer}
					</Text>
				</View>
			)}
		</Card>
	);

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
				{/* Header */}
				<View style={styles.header}>
					<Text style={[styles.title, { color: colors.text.primary }]}>
						Centro de Ayuda
					</Text>
					<Text style={[styles.subtitle, { color: colors.text.secondary }]}>
						Encuentra respuestas a las preguntas más frecuentes
					</Text>
				</View>

				{/* Quick Actions */}
				<Card style={styles.quickActionsCard}>
					<Text style={[styles.cardTitle, { color: colors.text.primary }]}>
						Acciones Rápidas
					</Text>
					<View style={styles.quickActions}>
						<Button
							title="Enviar Email"
							onPress={handleOpenEmail}
							variant="secondary"
							style={styles.quickActionButton}
						/>
						<Button
							title="Web de Ayuda"
							onPress={handleOpenWebsite}
							variant="secondary"
							style={styles.quickActionButton}
						/>
					</View>
				</Card>

				{/* FAQ Section */}
				<View style={styles.section}>
					<Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
						Preguntas Frecuentes
					</Text>
					{faqItems.map(renderFAQItem)}
				</View>

				{/* Contact Form */}
				<Card style={styles.contactCard}>
					<Text style={[styles.cardTitle, { color: colors.text.primary }]}>
						Contactar Soporte
					</Text>
					<Text style={[styles.contactDescription, { color: colors.text.secondary }]}>
						¿No encuentras la respuesta que buscas? Envíanos un mensaje y te ayudaremos.
					</Text>
					
					<Input
						label="Asunto"
						value={contactSubject}
						onChangeText={setContactSubject}
						placeholder="Describe brevemente tu consulta"
					/>
					
					<Input
						label="Mensaje"
						value={contactMessage}
						onChangeText={setContactMessage}
						placeholder="Describe tu problema o consulta en detalle..."
						multiline
						numberOfLines={6}
					/>
					
					<Button
						title="Enviar Mensaje"
						onPress={handleSendMessage}
						variant="primary"
						style={styles.sendButton}
					/>
				</Card>

				{/* App Info */}
				<Card style={styles.appInfoCard}>
					<Text style={[styles.cardTitle, { color: colors.text.primary }]}>
						Información de la App
					</Text>
					<View style={styles.appInfoRow}>
						<Text style={[styles.appInfoLabel, { color: colors.text.secondary }]}>Versión:</Text>
						<Text style={[styles.appInfoValue, { color: colors.text.primary }]}>1.0.0</Text>
					</View>
					<View style={styles.appInfoRow}>
						<Text style={[styles.appInfoLabel, { color: colors.text.secondary }]}>Build:</Text>
						<Text style={[styles.appInfoValue, { color: colors.text.primary }]}>2024.01.15</Text>
					</View>
					<View style={styles.appInfoRow}>
						<Text style={[styles.appInfoLabel, { color: colors.text.secondary }]}>Soporte:</Text>
						<Text style={[styles.appInfoValue, { color: colors.primary }]}>soporte@kairos.com</Text>
					</View>
				</Card>
			</ScrollView>
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
	quickActionsCard: {
		marginHorizontal: 20,
		marginBottom: 16,
		padding: 20,
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 16,
	},
	quickActions: {
		flexDirection: 'row',
		gap: 12,
	},
	quickActionButton: {
		flex: 1,
	},
	section: {
		marginBottom: 16,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginHorizontal: 20,
		marginBottom: 12,
	},
	faqCard: {
		marginHorizontal: 20,
		marginBottom: 8,
		padding: 0,
		overflow: 'hidden',
	},
	faqHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
	},
	faqQuestion: {
		fontSize: 16,
		fontWeight: '500',
		flex: 1,
		marginRight: 12,
	},
	faqIcon: {
		fontSize: 20,
		fontWeight: 'bold',
	},
	faqAnswer: {
		paddingHorizontal: 16,
		paddingBottom: 16,
		borderTopWidth: 1,
		borderTopColor: 'rgba(0,0,0,0.1)',
	},
	faqAnswerText: {
		fontSize: 14,
		lineHeight: 20,
		marginTop: 8,
	},
	contactCard: {
		marginHorizontal: 20,
		marginBottom: 16,
		padding: 20,
	},
	contactDescription: {
		fontSize: 14,
		lineHeight: 20,
		marginBottom: 20,
	},
	sendButton: {
		marginTop: 8,
	},
	appInfoCard: {
		marginHorizontal: 20,
		marginBottom: 20,
		padding: 20,
	},
	appInfoRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	appInfoLabel: {
		fontSize: 14,
	},
	appInfoValue: {
		fontSize: 14,
		fontWeight: '500',
	},
});