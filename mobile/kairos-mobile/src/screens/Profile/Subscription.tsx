import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import useTheme from '../../hooks/useTheme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import type { ProfileStackParamList } from '../../navigation/types';

type SubscriptionNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'Subscription'>;

interface PlanFeature {
	id: string;
	name: string;
	included: boolean;
}

interface SubscriptionPlan {
	id: string;
	name: string;
	price: string;
	period: string;
	features: PlanFeature[];
	isPopular?: boolean;
	isCurrentPlan?: boolean;
}

export default function SubscriptionScreen() {
	const navigation = useNavigation<SubscriptionNavigationProp>();
	const { colors } = useTheme();
	const styles = getStyles(colors);

	// Mock subscription data
	const subscriptionPlans: SubscriptionPlan[] = [
		{
			id: 'free',
			name: 'Plan Gratuito',
			price: '0€',
			period: '/mes',
			isCurrentPlan: true,
			features: [
				{ id: '1', name: 'Rutinas básicas', included: true },
				{ id: '2', name: 'Seguimiento de progreso básico', included: true },
				{ id: '3', name: 'Hasta 3 rutinas personalizadas', included: true },
				{ id: '4', name: 'Rutinas avanzadas', included: false },
				{ id: '5', name: 'Análisis detallado de progreso', included: false },
				{ id: '6', name: 'Rutinas ilimitadas', included: false },
				{ id: '7', name: 'Soporte prioritario', included: false },
				{ id: '8', name: 'Integración con wearables', included: false },
			],
		},
		{
			id: 'premium',
			name: 'Plan Premium',
			price: '9.99€',
			period: '/mes',
			isPopular: true,
			features: [
				{ id: '1', name: 'Rutinas básicas', included: true },
				{ id: '2', name: 'Seguimiento de progreso básico', included: true },
				{ id: '3', name: 'Rutinas ilimitadas', included: true },
				{ id: '4', name: 'Rutinas avanzadas', included: true },
				{ id: '5', name: 'Análisis detallado de progreso', included: true },
				{ id: '6', name: 'Integración con Apple Health/Google Fit', included: true },
				{ id: '7', name: 'Soporte prioritario', included: false },
				{ id: '8', name: 'Planes de nutrición', included: false },
			],
		},
		{
			id: 'pro',
			name: 'Plan Pro',
			price: '19.99€',
			period: '/mes',
			features: [
				{ id: '1', name: 'Rutinas básicas', included: true },
				{ id: '2', name: 'Seguimiento de progreso básico', included: true },
				{ id: '3', name: 'Rutinas ilimitadas', included: true },
				{ id: '4', name: 'Rutinas avanzadas', included: true },
				{ id: '5', name: 'Análisis detallado de progreso', included: true },
				{ id: '6', name: 'Integración con Apple Health/Google Fit', included: true },
				{ id: '7', name: 'Soporte prioritario', included: true },
				{ id: '8', name: 'Planes de nutrición personalizados', included: true },
			],
		},
	];

	const handleSubscribe = (planId: string) => {
		Alert.alert(
			'Suscripción',
			`¿Deseas suscribirte al ${subscriptionPlans.find(p => p.id === planId)?.name}?`,
			[
				{ text: 'Cancelar', style: 'cancel' },
				{
					text: 'Suscribirse',
					onPress: () => {
						// TODO: Implementar lógica de suscripción
						console.log('Subscribing to plan:', planId);
						Alert.alert('Éxito', 'Suscripción activada correctamente.');
					},
				},
			]
		);
	};

	const handleCancelSubscription = () => {
		Alert.alert(
			'Cancelar Suscripción',
			'¿Estás seguro de que deseas cancelar tu suscripción? Perderás acceso a las funciones premium.',
			[
				{ text: 'No, mantener', style: 'cancel' },
				{
					text: 'Sí, cancelar',
					style: 'destructive',
					onPress: () => {
						// TODO: Implementar cancelación
						console.log('Cancelling subscription');
						Alert.alert('Cancelado', 'Tu suscripción ha sido cancelada.');
					},
				},
			]
		);
	};

	const renderPlan = (plan: SubscriptionPlan) => (
		<Card key={plan.id} style={plan.isPopular ? { ...styles.planCard, ...styles.popularPlan } : styles.planCard}>
			{plan.isPopular && (
				<View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
					<Text style={styles.popularBadgeText}>MÁS POPULAR</Text>
				</View>
			)}
			
			<View style={styles.planHeader}>
				<Text style={[styles.planName, { color: colors.text.primary }]}>
					{plan.name}
				</Text>
				<View style={styles.priceContainer}>
					<Text style={[styles.planPrice, { color: colors.primary }]}>
						{plan.price}
					</Text>
					<Text style={[styles.planPeriod, { color: colors.text.secondary }]}>
						{plan.period}
					</Text>
				</View>
			</View>

			<View style={styles.featuresContainer}>
				{plan.features.map((feature) => (
					<View key={feature.id} style={styles.featureRow}>
						<Text style={[styles.featureIcon, { color: feature.included ? colors.success : colors.disabled }]}>
							{feature.included ? '✓' : '✗'}
						</Text>
						<Text style={[styles.featureText, { 
							color: feature.included ? colors.text.primary : colors.disabled 
						}]}>
							{feature.name}
						</Text>
					</View>
				))}
			</View>

			<View style={styles.planActions}>
				{plan.isCurrentPlan ? (
					<>
						<Text style={[styles.currentPlanText, { color: colors.success }]}>
							Plan Actual
						</Text>
						{plan.id !== 'free' && (
							<Button
								title="Cancelar Suscripción"
								onPress={handleCancelSubscription}
								variant="secondary"
								style={styles.cancelButton}
							/>
						)}
					</>
				) : (
					<Button
						title={plan.isPopular ? 'Elegir Plan' : 'Suscribirse'}
						onPress={() => handleSubscribe(plan.id)}
						variant={plan.isPopular ? 'primary' : 'secondary'}
						style={styles.subscribeButton}
					/>
				)}
			</View>
		</Card>
	);

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
				{/* Header */}
				<View style={styles.header}>
					<Text style={[styles.title, { color: colors.text.primary }]}>
						Mi Suscripción
					</Text>
					<Text style={[styles.subtitle, { color: colors.text.secondary }]}>
						Elige el plan que mejor se adapte a tus necesidades
					</Text>
				</View>

				{/* Subscription Plans */}
				{subscriptionPlans.map(renderPlan)}

				{/* Footer Info */}
				<Card style={styles.footerCard}>
					<Text style={[styles.footerTitle, { color: colors.text.primary }]}>
						Información Importante
					</Text>
					<Text style={[styles.footerText, { color: colors.text.secondary }]}>
						• Puedes cancelar tu suscripción en cualquier momento{"\n"}
						• Los cambios se aplicarán al final del período de facturación actual{"\n"}
						• Todos los precios incluyen IVA{"\n"}
						• Soporte técnico disponible 24/7 para usuarios Premium y Pro
					</Text>
				</Card>
			</ScrollView>
		</View>
	);
}

const getStyles = (colors: any) => StyleSheet.create({
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
	planCard: {
		marginHorizontal: 20,
		marginBottom: 16,
		padding: 20,
		position: 'relative',
	},
	popularPlan: {
		borderWidth: 2,
		borderColor: colors.primary,
	},
	popularBadge: {
		position: 'absolute',
		top: -8,
		left: 20,
		right: 20,
		paddingVertical: 4,
		paddingHorizontal: 12,
		borderRadius: 12,
		alignItems: 'center',
	},
	popularBadgeText: {
		color: colors.text.inverse,
		fontSize: 12,
		fontWeight: 'bold',
	},
	planHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 20,
		marginTop: 8,
	},
	planName: {
		fontSize: 20,
		fontWeight: 'bold',
	},
	priceContainer: {
		flexDirection: 'row',
		alignItems: 'baseline',
	},
	planPrice: {
		fontSize: 24,
		fontWeight: 'bold',
	},
	planPeriod: {
		fontSize: 16,
		marginLeft: 4,
	},
	featuresContainer: {
		marginBottom: 20,
	},
	featureRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	featureIcon: {
		fontSize: 16,
		fontWeight: 'bold',
		marginRight: 12,
		width: 20,
	},
	featureText: {
		fontSize: 14,
		flex: 1,
	},
	planActions: {
		alignItems: 'center',
	},
	currentPlanText: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	subscribeButton: {
		width: '100%',
	},
	cancelButton: {
		width: '100%',
	},
	footerCard: {
		marginHorizontal: 20,
		marginBottom: 20,
		padding: 20,
	},
	footerTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 12,
	},
	footerText: {
		fontSize: 14,
		lineHeight: 20,
	},
});