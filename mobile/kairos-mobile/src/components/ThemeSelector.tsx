import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';
import Card from './Card';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeOption {
	mode: ThemeMode;
	label: string;
	icon: keyof typeof Ionicons.glyphMap;
	description: string;
}

const themeOptions: ThemeOption[] = [
	{
		mode: 'light',
		label: 'Claro',
		icon: 'sunny',
		description: 'Tema claro siempre activo',
	},
	{
		mode: 'dark',
		label: 'Oscuro',
		icon: 'moon',
		description: 'Tema oscuro siempre activo',
	},
	{
		mode: 'system',
		label: 'Sistema',
		icon: 'phone-portrait',
		description: 'Sigue la configuración del sistema',
	},
];

export default function ThemeSelector() {
	const { mode, colors, setMode } = useTheme();

	const handleThemeChange = (newMode: ThemeMode) => {
		setMode(newMode);
	};

	return (
		<Card style={styles.container}>
			<Text style={[styles.title, { color: colors.text.primary }]}>
				Tema de la aplicación
			</Text>
			<Text style={[styles.subtitle, { color: colors.text.secondary }]}>
				Elige cómo quieres que se vea la aplicación
			</Text>

			<View style={styles.optionsContainer}>
				{themeOptions.map((option) => {
					const isSelected = mode === option.mode;
					return (
						<TouchableOpacity
							key={option.mode}
							style={[
								styles.option,
								{
									borderColor: isSelected ? colors.primary : colors.border,
									backgroundColor: isSelected ? colors.primary + '10' : 'transparent',
								},
							]}
							onPress={() => handleThemeChange(option.mode)}
							activeOpacity={0.7}
						>
							<View style={styles.optionContent}>
								<View style={styles.optionHeader}>
									<Ionicons
										name={option.icon}
										size={24}
										color={isSelected ? colors.primary : colors.text.secondary}
									/>
									<Text
										style={[
											styles.optionLabel,
											{
												color: isSelected ? colors.primary : colors.text.primary,
												fontWeight: isSelected ? '600' : '500',
											},
										]}
									>
										{option.label}
									</Text>
									{isSelected && (
										<Ionicons
											name="checkmark-circle"
											size={20}
											color={colors.primary}
										/>
									)}
								</View>
								<Text
									style={[
										styles.optionDescription,
										{ color: colors.text.secondary },
									]}
								>
									{option.description}
								</Text>
							</View>
						</TouchableOpacity>
					);
				})}
			</View>
		</Card>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 20,
	},
	title: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 14,
		lineHeight: 20,
		marginBottom: 20,
	},
	optionsContainer: {
		gap: 12,
	},
	option: {
		borderWidth: 2,
		borderRadius: 12,
		padding: 16,
	},
	optionContent: {
		gap: 8,
	},
	optionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	optionLabel: {
		flex: 1,
		fontSize: 16,
	},
	optionDescription: {
		fontSize: 14,
		lineHeight: 20,
		marginLeft: 36,
	},
});