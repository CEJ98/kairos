import React, { useRef } from 'react';
import {
	TouchableOpacity,
	Text,
	StyleSheet,
	ActivityIndicator,
	ViewStyle,
	TextStyle,
	Animated,
	Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';
type AnimationType = 'scale' | 'bounce' | 'pulse' | 'shake' | 'glow';

interface AnimatedButtonProps {
	title: string;
	onPress: () => void;
	variant?: ButtonVariant;
	size?: ButtonSize;
	animationType?: AnimationType;
	disabled?: boolean;
	loading?: boolean;
	style?: ViewStyle;
	textStyle?: TextStyle;
	icon?: keyof typeof Ionicons.glyphMap;
	iconPosition?: 'left' | 'right';
	autoAnimate?: boolean;
	animationDuration?: number;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
	title,
	onPress,
	variant = 'primary',
	size = 'md',
	animationType = 'scale',
	disabled = false,
	loading = false,
	style,
	textStyle,
	icon,
	iconPosition = 'left',
	autoAnimate = false,
	animationDuration = 150,
}) => {
	const { colors, isDark } = useTheme();
	const scaleAnim = useRef(new Animated.Value(1)).current;
	const pulseAnim = useRef(new Animated.Value(1)).current;
	const shakeAnim = useRef(new Animated.Value(0)).current;
	const glowAnim = useRef(new Animated.Value(0)).current;

	// Auto-animate effect
	React.useEffect(() => {
		if (autoAnimate && animationType === 'pulse') {
			startPulseAnimation();
		} else if (autoAnimate && animationType === 'glow') {
			startGlowAnimation();
		}
	}, [autoAnimate, animationType]);

	const startPulseAnimation = () => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(pulseAnim, {
					toValue: 1.05,
					duration: 1000,
					useNativeDriver: true,
					easing: Easing.inOut(Easing.ease),
				}),
				Animated.timing(pulseAnim, {
					toValue: 1,
					duration: 1000,
					useNativeDriver: true,
					easing: Easing.inOut(Easing.ease),
				}),
			])
		).start();
	};

	const startGlowAnimation = () => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(glowAnim, {
					toValue: 1,
					duration: 1500,
					useNativeDriver: false,
					easing: Easing.inOut(Easing.ease),
				}),
				Animated.timing(glowAnim, {
					toValue: 0,
					duration: 1500,
					useNativeDriver: false,
					easing: Easing.inOut(Easing.ease),
				}),
			])
		).start();
	};

	const startShakeAnimation = () => {
		Animated.sequence([
			Animated.timing(shakeAnim, {
				toValue: 10,
				duration: 50,
				useNativeDriver: true,
			}),
			Animated.timing(shakeAnim, {
				toValue: -10,
				duration: 50,
				useNativeDriver: true,
			}),
			Animated.timing(shakeAnim, {
				toValue: 10,
				duration: 50,
				useNativeDriver: true,
			}),
			Animated.timing(shakeAnim, {
				toValue: 0,
				duration: 50,
				useNativeDriver: true,
			}),
		]).start();
	};

	const handlePressIn = () => {
		if (disabled || loading) return;

		switch (animationType) {
			case 'scale':
				Animated.spring(scaleAnim, {
					toValue: 0.95,
					useNativeDriver: true,
					tension: 300,
					friction: 10,
				}).start();
				break;
			case 'bounce':
				Animated.spring(scaleAnim, {
					toValue: 0.9,
					useNativeDriver: true,
					tension: 400,
					friction: 3,
				}).start();
				break;
			case 'shake':
				startShakeAnimation();
				break;
		}
	};

	const handlePressOut = () => {
		if (disabled || loading) return;

		switch (animationType) {
			case 'scale':
				Animated.spring(scaleAnim, {
					toValue: 1,
					useNativeDriver: true,
					tension: 300,
					friction: 10,
				}).start();
				break;
			case 'bounce':
				Animated.spring(scaleAnim, {
					toValue: 1.05,
					useNativeDriver: true,
					tension: 400,
					friction: 3,
				}).start(() => {
					Animated.spring(scaleAnim, {
						toValue: 1,
						useNativeDriver: true,
						tension: 400,
						friction: 8,
					}).start();
				});
				break;
		}
	};

	const getButtonStyle = () => {
		const baseStyle = {
			...styles.button,
			...styles[size],
		};

		switch (variant) {
			case 'primary':
				return {
					...baseStyle,
					backgroundColor: disabled ? colors.disabled : colors.primary,
				};
			case 'secondary':
				return {
					...baseStyle,
					backgroundColor: disabled ? colors.disabled : colors.secondary,
				};
			case 'outline':
				return {
					...baseStyle,
					backgroundColor: 'transparent',
					borderWidth: 1,
					borderColor: disabled ? colors.disabled : colors.primary,
				};
			case 'ghost':
				return {
					...baseStyle,
					backgroundColor: 'transparent',
				};
			case 'destructive':
				return {
					...baseStyle,
					backgroundColor: disabled ? colors.disabled : colors.error,
				};
			default:
				return baseStyle;
		}
	};

	const getTextColor = () => {
		if (disabled) return colors.disabled;

		switch (variant) {
			case 'primary':
			case 'secondary':
			case 'destructive':
				return colors.text.inverse;
			case 'outline':
				return colors.primary;
			case 'ghost':
				return colors.text.primary;
			default:
				return colors.text.inverse;
		}
	};

	const getAnimatedStyle = () => {
		const baseTransform = [];

		switch (animationType) {
			case 'scale':
			case 'bounce':
				baseTransform.push({ scale: scaleAnim });
				break;
			case 'pulse':
				baseTransform.push({ scale: pulseAnim });
				break;
			case 'shake':
				baseTransform.push({ translateX: shakeAnim });
				break;
		}

		const animatedStyle: any = {
			transform: baseTransform,
		};

		if (animationType === 'glow') {
			const glowOpacity = glowAnim.interpolate({
				inputRange: [0, 1],
				outputRange: [0.3, 0.8],
			});

			animatedStyle.shadowOpacity = glowOpacity;
			animatedStyle.shadowRadius = glowAnim.interpolate({
				inputRange: [0, 1],
				outputRange: [0, 10],
			});
			animatedStyle.shadowColor = colors.primary;
			animatedStyle.elevation = glowAnim.interpolate({
				inputRange: [0, 1],
				outputRange: [0, 8],
			});
		}

		return animatedStyle;
	};

	const renderIcon = () => {
		if (!icon) return null;

		return (
			<Ionicons
				name={icon}
				size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20}
				color={getTextColor()}
				style={[
					iconPosition === 'left' ? styles.iconLeft : styles.iconRight,
				]}
			/>
		);
	};

	return (
		<TouchableOpacity
			activeOpacity={0.8}
			onPress={onPress}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			disabled={disabled || loading}
		>
			<Animated.View
				style={[
					getButtonStyle(),
					getAnimatedStyle(),
					style,
				]}
			>
				{loading ? (
					<ActivityIndicator
						size={size === 'sm' ? 'small' : 'small'}
						color={getTextColor()}
					/>
				) : (
					<>
						{iconPosition === 'left' && renderIcon()}
						<Text
							style={[
								styles.text,
								styles[`${size}Text`],
								{ color: getTextColor() },
								textStyle,
							]}
						>
							{title}
						</Text>
						{iconPosition === 'right' && renderIcon()}
					</>
				)}
			</Animated.View>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 8,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	sm: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		minHeight: 32,
	},
	md: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		minHeight: 44,
	},
	lg: {
		paddingHorizontal: 24,
		paddingVertical: 16,
		minHeight: 52,
	},
	text: {
		fontWeight: '600',
		textAlign: 'center',
	},
	smText: {
		fontSize: 14,
	},
	mdText: {
		fontSize: 16,
	},
	lgText: {
		fontSize: 18,
	},
	iconLeft: {
		marginRight: 8,
	},
	iconRight: {
		marginLeft: 8,
	},
});

export default AnimatedButton;