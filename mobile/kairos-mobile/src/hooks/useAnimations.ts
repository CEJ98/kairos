import { useRef, useCallback } from 'react';
import { Animated, Easing } from 'react-native';

type AnimationConfig = {
	duration?: number;
	delay?: number;
	easing?: any;
	useNativeDriver?: boolean;
};

type SpringConfig = {
	tension?: number;
	friction?: number;
	useNativeDriver?: boolean;
};

export const useAnimations = () => {
	// Animation values
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(1)).current;
	const translateXAnim = useRef(new Animated.Value(0)).current;
	const translateYAnim = useRef(new Animated.Value(0)).current;
	const rotateAnim = useRef(new Animated.Value(0)).current;
	const opacityAnim = useRef(new Animated.Value(1)).current;

	// Fade animations
	const fadeIn = useCallback(
		(config: AnimationConfig = {}) => {
			const {
				duration = 300,
				delay = 0,
				easing = Easing.out(Easing.ease),
				useNativeDriver = true,
			} = config;

			return Animated.timing(fadeAnim, {
				toValue: 1,
				duration,
				delay,
				easing,
				useNativeDriver,
			});
		},
		[fadeAnim]
	);

	const fadeOut = useCallback(
		(config: AnimationConfig = {}) => {
			const {
				duration = 300,
				delay = 0,
				easing = Easing.in(Easing.ease),
				useNativeDriver = true,
			} = config;

			return Animated.timing(fadeAnim, {
				toValue: 0,
				duration,
				delay,
				easing,
				useNativeDriver,
			});
		},
		[fadeAnim]
	);

	// Scale animations
	const scaleIn = useCallback(
		(config: SpringConfig = {}) => {
			const {
				tension = 100,
				friction = 8,
				useNativeDriver = true,
			} = config;

			scaleAnim.setValue(0);
			return Animated.spring(scaleAnim, {
				toValue: 1,
				tension,
				friction,
				useNativeDriver,
			});
		},
		[scaleAnim]
	);

	const scaleOut = useCallback(
		(config: SpringConfig = {}) => {
			const {
				tension = 100,
				friction = 8,
				useNativeDriver = true,
			} = config;

			return Animated.spring(scaleAnim, {
				toValue: 0,
				tension,
				friction,
				useNativeDriver,
			});
		},
		[scaleAnim]
	);

	const pulse = useCallback(
		(config: AnimationConfig = {}) => {
			const {
				duration = 1000,
				useNativeDriver = true,
			} = config;

			return Animated.loop(
				Animated.sequence([
					Animated.timing(scaleAnim, {
						toValue: 1.1,
						duration: duration / 2,
						useNativeDriver,
						easing: Easing.inOut(Easing.ease),
					}),
					Animated.timing(scaleAnim, {
						toValue: 1,
						duration: duration / 2,
						useNativeDriver,
						easing: Easing.inOut(Easing.ease),
					}),
				])
			);
		},
		[scaleAnim]
	);

	// Slide animations
	const slideInFromLeft = useCallback(
		(distance: number = 100, config: AnimationConfig = {}) => {
			const {
				duration = 300,
				delay = 0,
				easing = Easing.out(Easing.ease),
				useNativeDriver = true,
			} = config;

			translateXAnim.setValue(-distance);
			return Animated.timing(translateXAnim, {
				toValue: 0,
				duration,
				delay,
				easing,
				useNativeDriver,
			});
		},
		[translateXAnim]
	);

	const slideInFromRight = useCallback(
		(distance: number = 100, config: AnimationConfig = {}) => {
			const {
				duration = 300,
				delay = 0,
				easing = Easing.out(Easing.ease),
				useNativeDriver = true,
			} = config;

			translateXAnim.setValue(distance);
			return Animated.timing(translateXAnim, {
				toValue: 0,
				duration,
				delay,
				easing,
				useNativeDriver,
			});
		},
		[translateXAnim]
	);

	const slideInFromTop = useCallback(
		(distance: number = 100, config: AnimationConfig = {}) => {
			const {
				duration = 300,
				delay = 0,
				easing = Easing.out(Easing.ease),
				useNativeDriver = true,
			} = config;

			translateYAnim.setValue(-distance);
			return Animated.timing(translateYAnim, {
				toValue: 0,
				duration,
				delay,
				easing,
				useNativeDriver,
			});
		},
		[translateYAnim]
	);

	const slideInFromBottom = useCallback(
		(distance: number = 100, config: AnimationConfig = {}) => {
			const {
				duration = 300,
				delay = 0,
				easing = Easing.out(Easing.ease),
				useNativeDriver = true,
			} = config;

			translateYAnim.setValue(distance);
			return Animated.timing(translateYAnim, {
				toValue: 0,
				duration,
				delay,
				easing,
				useNativeDriver,
			});
		},
		[translateYAnim]
	);

	// Rotation animations
	const rotate = useCallback(
		(degrees: number = 360, config: AnimationConfig = {}) => {
			const {
				duration = 1000,
				delay = 0,
				easing = Easing.linear,
				useNativeDriver = true,
			} = config;

			return Animated.timing(rotateAnim, {
				toValue: degrees / 360,
				duration,
				delay,
				easing,
				useNativeDriver,
			});
		},
		[rotateAnim]
	);

	const spin = useCallback(
		(config: AnimationConfig = {}) => {
			const {
				duration = 1000,
				useNativeDriver = true,
			} = config;

			return Animated.loop(
				Animated.timing(rotateAnim, {
					toValue: 1,
					duration,
					useNativeDriver,
					easing: Easing.linear,
				})
			);
		},
		[rotateAnim]
	);

	// Shake animation
	const shake = useCallback(
		(intensity: number = 10, config: AnimationConfig = {}) => {
			const {
				duration = 50,
				useNativeDriver = true,
			} = config;

			return Animated.sequence([
				Animated.timing(translateXAnim, {
					toValue: intensity,
					duration,
					useNativeDriver,
				}),
				Animated.timing(translateXAnim, {
					toValue: -intensity,
					duration,
					useNativeDriver,
				}),
				Animated.timing(translateXAnim, {
					toValue: intensity,
					duration,
					useNativeDriver,
				}),
				Animated.timing(translateXAnim, {
					toValue: 0,
					duration,
					useNativeDriver,
				}),
			]);
		},
		[translateXAnim]
	);

	// Bounce animation
	const bounce = useCallback(
		(height: number = 20, config: SpringConfig = {}) => {
			const {
				tension = 200,
				friction = 3,
				useNativeDriver = true,
			} = config;

			return Animated.sequence([
				Animated.spring(translateYAnim, {
					toValue: -height,
					tension,
					friction,
					useNativeDriver,
				}),
				Animated.spring(translateYAnim, {
					toValue: 0,
					tension,
					friction,
					useNativeDriver,
				}),
			]);
		},
		[translateYAnim]
	);

	// Combined animations
	const fadeInScale = useCallback(
		(config: AnimationConfig = {}) => {
			const {
				duration = 300,
				delay = 0,
				useNativeDriver = true,
			} = config;

			fadeAnim.setValue(0);
			scaleAnim.setValue(0.8);

			return Animated.parallel([
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration,
					delay,
					useNativeDriver,
					easing: Easing.out(Easing.ease),
				}),
				Animated.spring(scaleAnim, {
					toValue: 1,
					useNativeDriver,
					tension: 100,
					friction: 8,
				}),
			]);
		},
		[fadeAnim, scaleAnim]
	);

	const slideInFade = useCallback(
		(direction: 'left' | 'right' | 'top' | 'bottom' = 'right', distance: number = 100, config: AnimationConfig = {}) => {
			const {
				duration = 300,
				delay = 0,
				useNativeDriver = true,
			} = config;

			fadeAnim.setValue(0);

			let slideAnimation;
			switch (direction) {
				case 'left':
					translateXAnim.setValue(-distance);
					slideAnimation = Animated.timing(translateXAnim, {
						toValue: 0,
						duration,
						delay,
						useNativeDriver,
						easing: Easing.out(Easing.ease),
					});
					break;
				case 'right':
					translateXAnim.setValue(distance);
					slideAnimation = Animated.timing(translateXAnim, {
						toValue: 0,
						duration,
						delay,
						useNativeDriver,
						easing: Easing.out(Easing.ease),
					});
					break;
				case 'top':
					translateYAnim.setValue(-distance);
					slideAnimation = Animated.timing(translateYAnim, {
						toValue: 0,
						duration,
						delay,
						useNativeDriver,
						easing: Easing.out(Easing.ease),
					});
					break;
				case 'bottom':
					translateYAnim.setValue(distance);
					slideAnimation = Animated.timing(translateYAnim, {
						toValue: 0,
						duration,
						delay,
						useNativeDriver,
						easing: Easing.out(Easing.ease),
					});
					break;
			}

			return Animated.parallel([
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration,
					delay,
					useNativeDriver,
					easing: Easing.out(Easing.ease),
				}),
				slideAnimation,
			]);
		},
		[fadeAnim, translateXAnim, translateYAnim]
	);

	// Reset all animations
	const resetAll = useCallback(() => {
		fadeAnim.setValue(0);
		scaleAnim.setValue(1);
		translateXAnim.setValue(0);
		translateYAnim.setValue(0);
		rotateAnim.setValue(0);
		opacityAnim.setValue(1);
	}, [fadeAnim, scaleAnim, translateXAnim, translateYAnim, rotateAnim, opacityAnim]);

	// Get interpolated values
	const getRotateInterpolation = useCallback(
		(inputRange: number[] = [0, 1], outputRange: string[] = ['0deg', '360deg']) => {
			return rotateAnim.interpolate({
				inputRange,
				outputRange,
			});
		},
		[rotateAnim]
	);

	const getScaleInterpolation = useCallback(
		(inputRange: number[] = [0, 1], outputRange: number[] = [0, 1]) => {
			return scaleAnim.interpolate({
				inputRange,
				outputRange,
			});
		},
		[scaleAnim]
	);

	return {
		// Animation values
		fadeAnim,
		scaleAnim,
		translateXAnim,
		translateYAnim,
		rotateAnim,
		opacityAnim,

		// Fade animations
		fadeIn,
		fadeOut,

		// Scale animations
		scaleIn,
		scaleOut,
		pulse,

		// Slide animations
		slideInFromLeft,
		slideInFromRight,
		slideInFromTop,
		slideInFromBottom,

		// Rotation animations
		rotate,
		spin,

		// Special animations
		shake,
		bounce,

		// Combined animations
		fadeInScale,
		slideInFade,

		// Utilities
		resetAll,
		getRotateInterpolation,
		getScaleInterpolation,
	};
};

export default useAnimations;