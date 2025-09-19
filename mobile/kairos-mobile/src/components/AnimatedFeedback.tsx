import React, { useRef, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Animated,
	Easing,
	Dimensions,
	ViewStyle,
	TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';

type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'loading';
type FeedbackPosition = 'top' | 'bottom' | 'center';
type AnimationType = 'slide' | 'fade' | 'bounce' | 'shake';

interface AnimatedFeedbackProps {
	visible: boolean;
	type?: FeedbackType;
	position?: FeedbackPosition;
	animationType?: AnimationType;
	title?: string;
	message?: string;
	duration?: number;
	autoDismiss?: boolean;
	style?: ViewStyle;
	titleStyle?: TextStyle;
	messageStyle?: TextStyle;
	onDismiss?: () => void;
	showIcon?: boolean;
	customIcon?: keyof typeof Ionicons.glyphMap;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const AnimatedFeedback: React.FC<AnimatedFeedbackProps> = ({
	visible,
	type = 'info',
	position = 'top',
	animationType = 'slide',
	title,
	message,
	duration = 3000,
	autoDismiss = true,
	style,
	titleStyle,
	messageStyle,
	onDismiss,
	showIcon = true,
	customIcon,
}) => {
	const { colors } = useTheme();
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const translateYAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(0)).current;
	const shakeAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (visible) {
			startShowAnimation();
			if (autoDismiss && duration > 0) {
				setTimeout(() => {
					startHideAnimation();
				}, duration);
			}
		} else {
			startHideAnimation();
		}
	}, [visible]);

	const startShowAnimation = () => {
		const animations = [];

		switch (animationType) {
			case 'slide':
				const initialTranslateY = position === 'top' ? -100 : position === 'bottom' ? 100 : 0;
				translateYAnim.setValue(initialTranslateY);
				animations.push(
					Animated.parallel([
						Animated.timing(fadeAnim, {
							toValue: 1,
							duration: 300,
							useNativeDriver: true,
							easing: Easing.out(Easing.ease),
						}),
						Animated.spring(translateYAnim, {
							toValue: 0,
							useNativeDriver: true,
							tension: 100,
							friction: 8,
						}),
					])
				);
				break;

			case 'fade':
				animations.push(
					Animated.timing(fadeAnim, {
						toValue: 1,
						duration: 300,
						useNativeDriver: true,
						easing: Easing.out(Easing.ease),
					})
				);
				break;

			case 'bounce':
				scaleAnim.setValue(0);
				animations.push(
					Animated.parallel([
						Animated.timing(fadeAnim, {
							toValue: 1,
							duration: 200,
							useNativeDriver: true,
						}),
						Animated.spring(scaleAnim, {
							toValue: 1,
							useNativeDriver: true,
							tension: 150,
							friction: 3,
						}),
					])
				);
				break;

			case 'shake':
				animations.push(
					Animated.sequence([
						Animated.timing(fadeAnim, {
							toValue: 1,
							duration: 200,
							useNativeDriver: true,
						}),
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
						]),
					])
				);
				break;
		}

		Animated.sequence(animations).start();
	};

	const startHideAnimation = () => {
		const animations = [];

		switch (animationType) {
			case 'slide':
				const finalTranslateY = position === 'top' ? -100 : position === 'bottom' ? 100 : 0;
				animations.push(
					Animated.parallel([
						Animated.timing(fadeAnim, {
							toValue: 0,
							duration: 250,
							useNativeDriver: true,
							easing: Easing.in(Easing.ease),
						}),
						Animated.timing(translateYAnim, {
							toValue: finalTranslateY,
							duration: 250,
							useNativeDriver: true,
							easing: Easing.in(Easing.ease),
						}),
					])
				);
				break;

			case 'fade':
			case 'shake':
				animations.push(
					Animated.timing(fadeAnim, {
						toValue: 0,
						duration: 250,
						useNativeDriver: true,
						easing: Easing.in(Easing.ease),
					})
				);
				break;

			case 'bounce':
				animations.push(
					Animated.parallel([
						Animated.timing(fadeAnim, {
							toValue: 0,
							duration: 200,
							useNativeDriver: true,
						}),
						Animated.spring(scaleAnim, {
							toValue: 0,
							useNativeDriver: true,
							tension: 100,
							friction: 8,
						}),
					])
				);
				break;
		}

		Animated.sequence(animations).start(() => {
			if (onDismiss) {
				onDismiss();
			}
		});
	};

	const getTypeConfig = () => {
		switch (type) {
			case 'success':
				return {
				backgroundColor: colors.success,
				iconName: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
				iconColor: colors.text.inverse,
				textColor: colors.text.inverse,
			};
			case 'error':
				return {
				backgroundColor: colors.error,
				iconName: 'close-circle' as keyof typeof Ionicons.glyphMap,
				iconColor: colors.text.inverse,
				textColor: colors.text.inverse,
			};
			case 'warning':
				return {
				backgroundColor: colors.warning,
				iconName: 'warning' as keyof typeof Ionicons.glyphMap,
				iconColor: colors.text.inverse,
				textColor: colors.text.inverse,
			};
			case 'info':
				return {
				backgroundColor: colors.info,
				iconName: 'information-circle' as keyof typeof Ionicons.glyphMap,
				iconColor: colors.text.inverse,
				textColor: colors.text.inverse,
			};
			case 'loading':
				return {
				backgroundColor: colors.primary,
				iconName: 'hourglass' as keyof typeof Ionicons.glyphMap,
				iconColor: colors.text.inverse,
				textColor: colors.text.inverse,
			};
			default:
				return {
				backgroundColor: colors.primary,
				iconName: 'information-circle' as keyof typeof Ionicons.glyphMap,
				iconColor: colors.text.inverse,
				textColor: colors.text.inverse,
			};
		}
	};

	const getPositionStyle = () => {
		switch (position) {
			case 'top':
				return {
					top: 50,
					left: 20,
					right: 20,
				};
			case 'bottom':
				return {
					bottom: 50,
					left: 20,
					right: 20,
				};
			case 'center':
				return {
					top: screenHeight / 2 - 50,
					left: 20,
					right: 20,
				};
			default:
				return {
					top: 50,
					left: 20,
					right: 20,
				};
		}
	};

	const getAnimatedStyle = () => {
		const transform = [];

		if (animationType === 'slide') {
			transform.push({ translateY: translateYAnim });
		}

		if (animationType === 'bounce') {
			transform.push({ scale: scaleAnim });
		}

		if (animationType === 'shake') {
			transform.push({ translateX: shakeAnim });
		}

		return {
			opacity: fadeAnim,
			transform,
		};
	};

	const typeConfig = getTypeConfig();
	const iconName = customIcon || typeConfig.iconName;

	if (!visible) {
		return null;
	}

	return (
		<Animated.View
			style={[
				styles.container,
				getPositionStyle(),
				getAnimatedStyle(),
				{
					backgroundColor: typeConfig.backgroundColor,
					shadowColor: colors.shadow,
				},
				style,
			]}
			pointerEvents={visible ? 'auto' : 'none'}
		>
			<View style={styles.content}>
				{showIcon && (
					<View style={styles.iconContainer}>
						<Ionicons
							name={iconName}
							size={24}
							color={typeConfig.iconColor}
						/>
					</View>
				)}
				<View style={styles.textContainer}>
					{title && (
						<Text
							style={[
								styles.title,
								{ color: typeConfig.textColor },
								titleStyle,
							]}
						>
							{title}
						</Text>
					)}
					{message && (
						<Text
							style={[
								styles.message,
								{ color: typeConfig.textColor },
								messageStyle,
							]}
						>
							{message}
						</Text>
					)}
				</View>
			</View>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 8,
		zIndex: 1000,
	},
	content: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	iconContainer: {
		marginRight: 12,
	},
	textContainer: {
		flex: 1,
	},
	title: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 2,
	},
	message: {
		fontSize: 14,
		lineHeight: 20,
	},
});

export default AnimatedFeedback;