import React, { useRef, useEffect } from 'react';
import {
	View,
	Animated,
	Easing,
	Dimensions,
	ViewStyle,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

type TransitionType = 'slideLeft' | 'slideRight' | 'slideUp' | 'slideDown' | 'fade' | 'scale' | 'flip';
type TransitionDirection = 'in' | 'out';

interface AnimatedScreenTransitionProps {
	children: React.ReactNode;
	transitionType?: TransitionType;
	duration?: number;
	delay?: number;
	style?: ViewStyle;
	enabled?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const AnimatedScreenTransition: React.FC<AnimatedScreenTransitionProps> = ({
	children,
	transitionType = 'fade',
	duration = 300,
	delay = 0,
	style,
	enabled = true,
}) => {
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const translateXAnim = useRef(new Animated.Value(0)).current;
	const translateYAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(1)).current;
	const rotateAnim = useRef(new Animated.Value(0)).current;

	// Reset animations when screen comes into focus
	useFocusEffect(
		React.useCallback(() => {
			if (!enabled) return;

			// Set initial values based on transition type
			setInitialValues();

			// Start entrance animation
			const timer = setTimeout(() => {
				startEntranceAnimation();
			}, delay);

			return () => {
				clearTimeout(timer);
				// Reset to initial state when leaving
				setInitialValues();
			};
		}, [enabled, transitionType, delay])
	);

	const setInitialValues = () => {
		switch (transitionType) {
			case 'slideLeft':
				fadeAnim.setValue(0);
				translateXAnim.setValue(screenWidth);
				translateYAnim.setValue(0);
				scaleAnim.setValue(1);
				rotateAnim.setValue(0);
				break;
			case 'slideRight':
				fadeAnim.setValue(0);
				translateXAnim.setValue(-screenWidth);
				translateYAnim.setValue(0);
				scaleAnim.setValue(1);
				rotateAnim.setValue(0);
				break;
			case 'slideUp':
				fadeAnim.setValue(0);
				translateXAnim.setValue(0);
				translateYAnim.setValue(screenHeight);
				scaleAnim.setValue(1);
				rotateAnim.setValue(0);
				break;
			case 'slideDown':
				fadeAnim.setValue(0);
				translateXAnim.setValue(0);
				translateYAnim.setValue(-screenHeight);
				scaleAnim.setValue(1);
				rotateAnim.setValue(0);
				break;
			case 'scale':
				fadeAnim.setValue(0);
				translateXAnim.setValue(0);
				translateYAnim.setValue(0);
				scaleAnim.setValue(0.8);
				rotateAnim.setValue(0);
				break;
			case 'flip':
				fadeAnim.setValue(0);
				translateXAnim.setValue(0);
				translateYAnim.setValue(0);
				scaleAnim.setValue(1);
				rotateAnim.setValue(90);
				break;
			case 'fade':
			default:
				fadeAnim.setValue(0);
				translateXAnim.setValue(0);
				translateYAnim.setValue(0);
				scaleAnim.setValue(1);
				rotateAnim.setValue(0);
				break;
		}
	};

	const startEntranceAnimation = () => {
		const animations = [];

		// Always animate opacity
		animations.push(
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration,
				useNativeDriver: true,
				easing: Easing.out(Easing.ease),
			})
		);

		// Add specific animations based on type
		switch (transitionType) {
			case 'slideLeft':
			case 'slideRight':
				animations.push(
					Animated.timing(translateXAnim, {
						toValue: 0,
						duration,
						useNativeDriver: true,
						easing: Easing.out(Easing.ease),
					})
				);
				break;
			case 'slideUp':
			case 'slideDown':
				animations.push(
					Animated.timing(translateYAnim, {
						toValue: 0,
						duration,
						useNativeDriver: true,
						easing: Easing.out(Easing.ease),
					})
				);
				break;
			case 'scale':
				animations.push(
					Animated.spring(scaleAnim, {
						toValue: 1,
						useNativeDriver: true,
						tension: 100,
						friction: 8,
					})
				);
				break;
			case 'flip':
				animations.push(
					Animated.timing(rotateAnim, {
						toValue: 0,
						duration,
						useNativeDriver: true,
						easing: Easing.out(Easing.ease),
					})
				);
				break;
		}

		Animated.parallel(animations).start();
	};

	const getAnimatedStyle = (): ViewStyle => {
		const transform = [];

		// Add transforms based on transition type
		if (transitionType === 'slideLeft' || transitionType === 'slideRight') {
			transform.push({ translateX: translateXAnim });
		}

		if (transitionType === 'slideUp' || transitionType === 'slideDown') {
			transform.push({ translateY: translateYAnim });
		}

		if (transitionType === 'scale') {
			transform.push({ scale: scaleAnim });
		}

		if (transitionType === 'flip') {
			transform.push({
				rotateY: rotateAnim.interpolate({
					inputRange: [0, 90],
					outputRange: ['0deg', '90deg'],
				}),
			});
		}

		return {
			opacity: fadeAnim,
			transform,
		};
	};

	if (!enabled) {
		return <View style={style}>{children}</View>;
	}

	return (
		<Animated.View style={[style, getAnimatedStyle()]}>
			{children}
		</Animated.View>
	);
};

export default AnimatedScreenTransition;