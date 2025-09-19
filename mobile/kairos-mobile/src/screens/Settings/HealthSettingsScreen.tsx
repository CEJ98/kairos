import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import useTheme from '../../hooks/useTheme';
import HealthSettings from '../../components/HealthSettings';
import type { ProfileStackParamList } from '../../navigation/types';

type HealthSettingsNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'Settings'>;

export default function HealthSettingsScreen() {
	const navigation = useNavigation<HealthSettingsNavigationProp>();
	const { colors } = useTheme();

	const handleHealthToggle = (enabled: boolean) => {
		console.log('Health integration toggled:', enabled);
		// Aquí se puede agregar lógica adicional si es necesario
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<ScrollView 
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<HealthSettings onHealthToggle={handleHealthToggle} />
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
	scrollContent: {
		padding: 20,
		paddingBottom: 40,
	},
});