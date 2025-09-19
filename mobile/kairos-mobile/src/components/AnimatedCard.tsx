import React, { useRef, useEffect } from 'react';
import {
	View,
	StyleSheet,
	Animated,
	Easing,
	ViewStyle,
} from 'react-native';
import {
	PanGestureHandler,
	State,
	PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import useTheme from '../hooks/useTheme';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled';
type AnimationType = 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'flip';
type HoverEffect = 'lift' | 'glow' | 'scale' | 'none';

interface AnimatedCardProps {
	children: React.ReactNode;
	variant?: CardVariant;
	animationType?: AnimationType;
	hoverEffect?: HoverEffect;
	style?: ViewStyle;
	delay?: number;
	duration?: number;
	onPress?: () => void;
	onLongPress?: () => void;
	onSwipeLeft?: () => void;
	onSwipeRight?: () => void;
	swipeThreshold?: number;
	enableSwipe?: boolean;
	autoAnimate?: boolean;
	animateOnMount?: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
	children,
	variant = 'default',
	animationType = 'fadeIn',
	hoverEffect = 'lift',
	style,
	delay = 0,
	duration = 300,
	onPress,
	onLongPress,
	onSwipeLeft,
	onSwipeRight,
	swipeThreshold = 100,
	enableSwipe = false,
	autoAnimate = false,
	animateOnMount = true,
}) => {
	const { colors, isDark } = useTheme();
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const translateXAnim = useRef(new Animated.Value(0)).current;
	const translateYAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(1)).current;
	const rotateAnim = useRef(new Animated.Value(0)).current;
	const hoverAnim = useRef(new Animated.Value(0)).current;
	const glowAnim = useRef(new Animated.Value(0)).current;

	// Mount animation
	useEffect(() => {
		if (animateOnMount) {
			setTimeout(() => {
				startMountAnimation();
			}, delay);
		}
	}, [animateOnMount, delay]);

	// Auto animation effect
	useEffect(() => {
		if (autoAnimate && hoverEffect === 'glow') {
			startGlowAnimation();
		}
	}, [autoAnimate, hoverEffect]);

	const startMountAnimation = () => {
		const animations = [];

		switch (animationType) {
			case 'fadeIn':
				animations.push(
					Animated.timing(fadeAnim, {
						toValue: 1,
						duration,
						useNativeDriver: true,
						easing: Easing.out(Easing.ease),
					})
				);
				break;
			case 'slideUp':
				translateYAnim.setValue(50);
				animations.push(
					Animated.parallel([
						Animated.timing(fadeAnim, {
							toValue: 1,
							duration,
							useNativeDriver: true,
						}),
						Animated.timing(translateYAnim, {
							toValue: 0,
							duration,
							useNativeDriver: true,
							easing: Easing.out(Easing.back(1.2)),
						}),
					])
				);
				break;
			case 'slideDown':
				translateYAnim.setValue(-50);
				animations.push(
					Animated.parallel([
						Animated.timing(fadeAnim, {
							toValue: 1,
							duration,
							useNativeDriver: true,
						}),
						Animated.timing(translateYAnim, {
							toValue: 0,
							duration,
							useNativeDriver: true,
							easing: Easing.out(Easing.back(1.2)),
						}),
					])
				);
				break;
			case 'slideLeft':
				translateXAnim.setValue(50);
				animations.push(
					Animated.parallel([
						Animated.timing(fadeAnim, {
							toValue: 1,
							duration,
							useNativeDriver: true,
						}),
						Animated.timing(translateXAnim, {
							toValue: 0,
							duration,
							useNativeDriver: true,
							easing: Easing.out(Easing.ease),
						}),
					])
				);
				break;
			case 'slideRight':
				translateXAnim.setValue(-50);
				animations.push(
					Animated.parallel([
						Animated.timing(fadeAnim, {
							toValue: 1,
							duration,
							useNativeDriver: true,
						}),
						Animated.timing(translateXAnim, {
							toValue: 0,
							duration,
							useNativeDriver: true,
							easing: Easing.out(Easing.ease),
						}),
					])
				);
				break;
			case 'scale':
				scaleAnim.setValue(0.8);
				animations.push(
					Animated.parallel([
						Animated.timing(fadeAnim, {
							toValue: 1,
							duration,
							useNativeDriver: true,
						}),
						Animated.spring(scaleAnim, {
							toValue: 1,
							useNativeDriver: true,
							tension: 100,
							friction: 8,
						}),
					])
				);
				break;
			case 'flip':
				rotateAnim.setValue(0);
				animations.push(
					Animated.parallel([
						Animated.timing(fadeAnim, {
							toValue: 1,
							duration,
							useNativeDriver: true,
						}),
						Animated.timing(rotateAnim, {
							toValue: 1,
							duration,
							useNativeDriver: true,
							easing: Easing.out(Easing.back(1.2)),
						}),
					])
				);
				break;
		}

		Animated.sequence(animations).start();
	};

	const startGlowAnimation = () => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(glowAnim, {
					toValue: 1,
					duration: 2000,
					useNativeDriver: false,
					easing: Easing.inOut(Easing.ease),
				}),
				Animated.timing(glowAnim, {
					toValue: 0,
					duration: 2000,
					useNativeDriver: false,
					easing: Easing.inOut(Easing.ease),
				}),
			])
		).start();
	};

	const handlePressIn = () => {
		switch (hoverEffect) {
			case 'lift':
				Animated.parallel([
					Animated.timing(hoverAnim, {
						toValue: 1,
						duration: 150,
						useNativeDriver: false,
					}),
					Animated.timing(scaleAnim, {
						toValue: 0.98,
						duration: 150,
						useNativeDriver: true,
					}),
				]).start();
				break;
			case 'scale':
				Animated.spring(scaleAnim, {
					toValue: 0.95,
					useNativeDriver: true,
					tension: 300,
					friction: 10,
				}).start();
				break;
		}
	};

	const handlePressOut = () => {
		switch (hoverEffect) {
			case 'lift':
				Animated.parallel([
					Animated.timing(hoverAnim, {
						toValue: 0,
						duration: 150,
						useNativeDriver: false,
					}),
					Animated.timing(scaleAnim, {
						toValue: 1,
						duration: 150,
						useNativeDriver: true,
					}),
				]).start();
				break;
			case 'scale':
				Animated.spring(scaleAnim, {
					toValue: 1,
					useNativeDriver: true,
					tension: 300,
					friction: 10,
				}).start();
				break;
		}
	};

	const handleGestureEvent = (event: PanGestureHandlerGestureEvent) => {
		const { translationX } = event.nativeEvent;
		translateXAnim.setValue(translationX);
	};

	const handleGestureStateChange = (event: any) => {
		const { translationX, state } = event.nativeEvent;

		if (state === State.END) {
			if (translationX > swipeThreshold && onSwipeRight) {
				onSwipeRight();
			} else if (translationX < -swipeThreshold && onSwipeLeft) {
				onSwipeLeft();
			}

			// Reset position
			Animated.spring(translateXAnim, {
				toValue: 0,
				useNativeDriver: true,
				tension: 100,
				friction: 8,
			}).start();
		}
	};

	const getCardStyle = () => {
		const baseStyle = {
			...styles.card,
			backgroundColor: colors.background,
		};

		switch (variant) {
			case 'elevated':
				return {
					...baseStyle,
					...styles.elevated,
				};
			case 'outlined':
				return {
					...baseStyle,
					borderWidth: 1,
					borderColor: colors.border,
					backgroundColor: 'transparent',
				};
			case 'filled':
				return {
					...baseStyle,
					backgroundColor: colors.primary + '10',
				};
			default:
				return baseStyle;
		}
	};

	const getAnimatedStyle = () => {
		const transform = [];

		// Base transforms
		transform.push({ translateX: translateXAnim });
		transform.push({ translateY: translateYAnim });
		transform.push({ scale: scaleAnim });

		// Rotation for flip animation
		if (animationType === 'flip') {
			const rotateY = rotateAnim.interpolate({
				inputRange: [0, 1],
				outputRange: ['180deg', '0deg'],
			});
			transform.push({ rotateY });
		}

		const animatedStyle: any = {
			opacity: fadeAnim,
			transform,
		};

		// Hover effects
		if (hoverEffect === 'lift') {
			animatedStyle.shadowOpacity = hoverAnim.interpolate({
				inputRange: [0, 1],
				outputRange: [0.1, 0.3],
			});
			animatedStyle.shadowRadius = hoverAnim.interpolate({
				inputRange: [0, 1],
				outputRange: [4, 12],
			});
			animatedStyle.elevation = hoverAnim.interpolate({
				inputRange: [0, 1],
				outputRange: [2, 8],
			});
		} else if (hoverEffect === 'glow') {
			animatedStyle.shadowOpacity = glowAnim.interpolate({
				inputRange: [0, 1],
				outputRange: [0.1, 0.4],
			});
			animatedStyle.shadowRadius = glowAnim.interpolate({
				inputRange: [0, 1],
				outputRange: [4, 16],
			});
			animatedStyle.shadowColor = colors.primary;
			animatedStyle.elevation = glowAnim.interpolate({
				inputRange: [0, 1],
				outputRange: [2, 12],
			});
		}

		return animatedStyle;
	};

	const CardContent = (
		<Animated.View
			style={[
				getCardStyle(),
				getAnimatedStyle(),
				style,
			]}
			onTouchStart={handlePressIn}
			onTouchEnd={handlePressOut}
		>
			{children}
		</Animated.View>
	);

	if (enableSwipe) {
		return (
			<PanGestureHandler
				onGestureEvent={handleGestureEvent}
				onHandlerStateChange={handleGestureStateChange}
			>
				{CardContent}
			</PanGestureHandler>
		);
	}

	return CardContent;
};

const styles = StyleSheet.create({
	card: {
		borderRadius: 12,
		padding: 16,
		marginVertical: 4,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	elevated: {
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 4,
	},
});

export default AnimatedCard;