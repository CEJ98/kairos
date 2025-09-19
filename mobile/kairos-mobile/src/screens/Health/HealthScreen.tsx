import React from 'react';
import { View, StyleSheet } from 'react-native';
import useTheme from '../../hooks/useTheme';
import HealthDashboard from '../../components/HealthDashboard';

export const HealthScreen: React.FC = () => {
	const { colors } = useTheme();

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<HealthDashboard />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});

export default HealthScreen;