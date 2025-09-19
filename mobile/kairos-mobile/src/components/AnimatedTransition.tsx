import React, { useRef, useEffect } from 'react';
import {
	View,
	StyleSheet,
	Animated,
	Easing,
	Dimensions,
	ViewStyle,
} from 'react-native';

type TransitionType = 'fade' | 'slide' | 'scale' | 'flip' | 'push' | 'modal';
type Direction = 'left' | 'right' | 'up' | 'down';

interface AnimatedTransitionProps {
	children: React.ReactNode;
	visible: boolean;
	transitionType?: TransitionType;
	direction?: Direction;
	duration?: number;
	delay?: number;
	style?: ViewStyle;
	onTransitionComplete?: () => void;
	onTransitionStart?: () => void;
	easing?: any;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const AnimatedTransition: React.FC<AnimatedTransitionProps> = ({
	children,
	visible,
	transitionType = 'fade',
	direction = 'right',
	duration = 300,
	delay = 0,
	style,
	onTransitionComplete,
	onTransitionStart,
	easing = Easing.out(Easing.ease),
}) => {
	const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;
	const translateXAnim = useRef(new Animated.Value(0)).current;
	const translateYAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;
	const rotateAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (delay > 0) {
			setTimeout(() => {
				startTransition();
			}, delay);
		} else {
			startTransition();
		}
	}, [visible]);

	const startTransition = () => {
		if (onTransitionStart) {
			onTransitionStart();
		}

		const animations = getAnimations();

		Animated.parallel(animations).start(() => {
			if (onTransitionComplete) {
				onTransitionComplete();
			}
		});
	};

	const getAnimations = () => {
		const animations = [];

		switch (transitionType) {
			case 'fade':
				animations.push(
					Animated.timing(fadeAnim, {
						toValue: visible ? 1 : 0,
						duration,
						useNativeDriver: true,
						easing,
					})
				);
				break;

			case 'slide':
				const slideValue = getSlideValue();
				if (direction === 'left' || direction === 'right') {
					if (!visible) {
						translateXAnim.setValue(slideValue);
					}
					animations.push(
						Animated.timing(translateXAnim, {
							toValue: visible ? 0 : slideValue,
							duration,
							useNativeDriver: true,
							easing,
						})
					);
				} else {
					if (!visible) {
						translateYAnim.setValue(slideValue);
					}
					animations.push(
						Animated.timing(translateYAnim, {
							toValue: visible ? 0 : slideValue,
							duration,
							useNativeDriver: true,
							easing,
						})
					);
				}
				animations.push(
					Animated.timing(fadeAnim, {
						toValue: visible ? 1 : 0,
						duration,
						useNativeDriver: true,
						easing,
					})
				);
				break;

			case 'scale':
				if (!visible) {
					scaleAnim.setValue(0);
				}
				animations.push(
					Animated.spring(scaleAnim, {
						toValue: visible ? 1 : 0,
						useNativeDriver: true,
						tension: 100,
						friction: 8,
					})
				);
				animations.push(
					Animated.timing(fadeAnim, {
						toValue: visible ? 1 : 0,
						duration: duration * 0.8,
						useNativeDriver: true,
						easing,
					})
				);
				break;

			case 'flip':
				animations.push(
					Animated.timing(rotateAnim, {
						toValue: visible ? 0 : 1,
						duration,
						useNativeDriver: true,
						easing,
					})
				);
				animations.push(
					Animated.timing(fadeAnim, {
						toValue: visible ? 1 : 0,
						duration: duration * 0.6,
						useNativeDriver: true,
						easing,
					})
				);
				break;

			case 'push':
				const pushValue = getPushValue();
				if (direction === 'left' || direction === 'right') {
					if (!visible) {
						translateXAnim.setValue(pushValue);
					}
					animations.push(
						Animated.timing(translateXAnim, {
							toValue: visible ? 0 : pushValue,
							duration,
							useNativeDriver: true,
							easing: Easing.out(Easing.back(1.2)),
						})
					);
				} else {
					if (!visible) {
						translateYAnim.setValue(pushValue);
					}
					animations.push(
						Animated.timing(translateYAnim, {
							toValue: visible ? 0 : pushValue,
							duration,
							useNativeDriver: true,
							easing: Easing.out(Easing.back(1.2)),
						})
					);
				}
				break;

			case 'modal':
				if (!visible) {
					translateYAnim.setValue(screenHeight);
					scaleAnim.setValue(0.9);
				}
				animations.push(
					Animated.parallel([
						Animated.spring(translateYAnim, {
							toValue: visible ? 0 : screenHeight,
							useNativeDriver: true,
							tension: 100,
							friction: 8,
						}),
						Animated.spring(scaleAnim, {
							toValue: visible ? 1 : 0.9,
							useNativeDriver: true,
							tension: 100,
							friction: 8,
						}),
						Animated.timing(fadeAnim, {
							toValue: visible ? 1 : 0,
							duration: duration * 0.8,
							useNativeDriver: true,
							easing,
						}),
					])
				);
				break;

			default:
				animations.push(
					Animated.timing(fadeAnim, {
						toValue: visible ? 1 : 0,
						duration,
						useNativeDriver: true,
						easing,
					})
				);
		}

		return animations;
	};

	const getSlideValue = () => {
		switch (direction) {
			case 'left':
				return -screenWidth;
			case 'right':
				return screenWidth;
			case 'up':
				return -screenHeight;
			case 'down':
				return screenHeight;
			default:
				return screenWidth;
		}
	};

	const getPushValue = () => {
		switch (direction) {
			case 'left':
				return -screenWidth * 0.3;
			case 'right':
				return screenWidth * 0.3;
			case 'up':
				return -screenHeight * 0.3;
			case 'down':
				return screenHeight * 0.3;
			default:
				return screenWidth * 0.3;
		}
	};

	const getAnimatedStyle = () => {
		const transform = [];

		// Add transforms based on transition type
		if (transitionType === 'slide' || transitionType === 'push') {
			transform.push({ translateX: translateXAnim });
			transform.push({ translateY: translateYAnim });
		}

		if (transitionType === 'scale' || transitionType === 'modal') {
			transform.push({ scale: scaleAnim });
		}

		if (transitionType === 'modal') {
			transform.push({ translateY: translateYAnim });
		}

		if (transitionType === 'flip') {
			const rotateY = rotateAnim.interpolate({
				inputRange: [0, 1],
				outputRange: ['0deg', '180deg'],
			});
			transform.push({ rotateY });
		}

		return {
			opacity: fadeAnim,
			transform,
		};
	};

	if (!visible && transitionType !== 'modal') {
		return null;
	}

	return (
		<Animated.View
			style={[
				styles.container,
				getAnimatedStyle(),
				style,
			]}
			pointerEvents={visible ? 'auto' : 'none'}
		>
			{children}
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});

export default AnimatedTransition;