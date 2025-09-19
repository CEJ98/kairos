import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import useTheme from '../../hooks/useTheme';
import ThemeSelector from '../../components/ThemeSelector';
import type { ProfileStackParamList } from '../../navigation/types';

type ThemeSettingsNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'Settings'>;

export default function ThemeSettingsScreen() {
	const navigation = useNavigation<ThemeSettingsNavigationProp>();
	const { colors } = useTheme();

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<ScrollView 
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<ThemeSelector />
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